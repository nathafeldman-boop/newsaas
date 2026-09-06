"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { markReferralGrantedAction } from "@/app/onboarding/actions";
import { ChipMultiSelectWithCustom } from "@/components/ui/ChipMultiSelectWithCustom";
import { Highlight } from "@/components/ui/Highlight";
import type { ContractType, Profile } from "@/types/database";
import {
  SECTORS,
  SKILLS,
  TOP_CITIES,
  TARGET_JOBS,
  MOBILITY_OPTIONS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
} from "@/lib/onboarding/options";
import { STEP_IDS, STEP_LABELS, type StepId } from "@/lib/onboarding/steps";

// Onboarding "sans clavier" : tout se fait au tap (tuiles/chips), avec un
// échappatoire texte optionnel là où une liste ne peut pas tout couvrir
// (ville, compétences...). bio/formation/date de naissance restent éditables
// plus tard depuis le profil — pas assez tap-friendly (texte libre) pour
// rester ici.
//
// L'étape "profile" (métiers visés, mobilité, niveau d'études, expérience,
// disponibilité) avait été retirée un temps car jugée facultative -- mais
// mobilité en particulier pèse lourd dans computeMatchScore (pénalité de
// localisation), et un profil qui ne la renseigne jamais se fait pénaliser
// par défaut comme s'il n'était mobile pour rien, même quand ce n'est pas
// vrai. Toute donnée qui sert réellement le matching (ou les lettres de
// motivation générées) est désormais redemandée ici et rendue obligatoire,
// plutôt que de laisser un compte fonctionner avec des colonnes vides que
// l'algorithme interprète par défaut de la pire des façons.
const PROGRESS_STEPS: StepId[] = STEP_IDS.filter((s) => s !== "intro" && s !== "outro");
const SKIPPABLE: StepId[] = ["cv"];

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 28, margin: 0, lineHeight: 1.15 }}>{title}</h1>
      {subtitle && (
        <p
          style={{
            fontSize: 14,
            color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
            margin: "8px 0 0",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TileOption({
  label,
  icon,
  active,
  onClick,
  size = "sm",
}: {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "lg";
}) {
  const isLg = size === "lg";
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center"
      style={{
        textAlign: "center",
        width: "100%",
        padding: isLg ? "26px 22px" : "14px 10px",
        borderRadius: isLg ? "var(--radius-lg)" : "var(--radius-md)",
        border: `2px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
        background: active ? "var(--color-accent)" : "var(--color-surface)",
        fontFamily: "var(--font-heading)",
        fontWeight: isLg ? 800 : 700,
        fontSize: isLg ? 18 : 12.5,
        lineHeight: 1.25,
        color: active ? "var(--color-bg)" : "var(--color-text)",
        transition: "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
      }}
    >
      {icon && (
        <span aria-hidden style={{ fontSize: isLg ? 30 : 22, marginBottom: isLg ? 10 : 6 }}>
          {icon}
        </span>
      )}
      {label}
    </motion.button>
  );
}

// Funnel onboarding (dashboard admin, "Vus / Terminés / Abandon" par écran) :
// un événement par étape vue/terminée, écrit dans user_events (déjà
// accessible en écriture à l'utilisateur pour ses propres lignes via RLS).
// /onboarding exige déjà une session (voir proxy.ts) : pas de bruit robot à
// filtrer côté client, contrairement au tracking de visites site entier.
async function logOnboardingEvent(
  userId: string,
  type: "onboarding_step_viewed" | "onboarding_step_completed",
  step: StepId,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_events")
    .insert({ user_id: userId, event_type: type, metadata: { step } });
  if (error) {
    console.error("onboarding funnel event failed", error, { type, step });
  }
}

export function OnboardingWizard({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Profile | null;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepId = STEP_IDS[stepIndex];

  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);
  const [sectors, setSectors] = useState<string[]>(initialProfile?.sectors ?? []);

  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [cityCustomOpen, setCityCustomOpen] = useState(false);
  // Aucune présélection par défaut : les deux tuiles pré-cochées piégeaient
  // les nouveaux comptes (initialProfile null) qui tapaient sur celle
  // qu'ils voulaient, la désélectionnant sans le savoir puisqu'elle était
  // déjà active -- taper les deux vidait la sélection et bloquait l'étape
  // avec une erreur sans qu'on comprenne pourquoi. Un profil existant garde
  // sa vraie valeur.
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    initialProfile?.looking_for ?? [],
  );

  const [targetJobs, setTargetJobs] = useState<string[]>(initialProfile?.target_jobs ?? []);
  const [mobility, setMobility] = useState(initialProfile?.mobility ?? "");
  const [educationLevel, setEducationLevel] = useState(initialProfile?.education_level ?? "");
  const [experienceLevel, setExperienceLevel] = useState(initialProfile?.experience_level ?? "");
  // On retient le libellé de la tuile tapée (pas directement une date) : une
  // des options ("Je ne sais pas encore") ne correspond à aucune date réelle
  // -- stocker le libellé permet de distinguer "rien tapé" de "a tapé cette
  // option-là", et de recalculer la date au moment d'enregistrer. Pas de
  // pré-remplissage depuis un availability_date existant : cette étape n'est
  // vue qu'avant la fin de l'onboarding, où ce champ n'a normalement encore
  // jamais été renseigné.
  const [availabilityLabel, setAvailabilityLabel] = useState<string | null>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    void logOnboardingEvent(userId, "onboarding_step_viewed", stepId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  function toggleLookingFor(type: ContractType) {
    setLookingFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function validateCurrentStep(): string | null {
    if (stepId === "looking_for" && lookingFor.length === 0) {
      return "Sélectionne alternance et/ou stage.";
    }
    if (stepId === "search" && !city.trim()) {
      return "Indique au moins ta ville.";
    }
    if (stepId === "search" && sectors.length === 0) {
      return "Sélectionne au moins un secteur.";
    }
    if (stepId === "search" && skills.length === 0) {
      return "Sélectionne au moins une compétence.";
    }
    if (stepId === "profile" && targetJobs.length === 0) {
      return "Sélectionne au moins un métier visé.";
    }
    if (stepId === "profile" && !mobility) {
      return "Indique ta mobilité.";
    }
    if (stepId === "profile" && !educationLevel) {
      return "Indique ton niveau d'études.";
    }
    if (stepId === "profile" && !experienceLevel) {
      return "Indique ton niveau d'expérience.";
    }
    if (stepId === "profile" && !availabilityLabel) {
      return "Indique ta disponibilité.";
    }
    return null;
  }

  function goNext() {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    void logOnboardingEvent(userId, "onboarding_step_completed", stepId);
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  }

  function goBack() {
    setError(null);
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function finish() {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    let cvPath = initialProfile?.cv_path ?? null;
    let cvUploadedAt = initialProfile?.cv_uploaded_at ?? null;

    if (cvFile) {
      const ext = cvFile.name.split(".").pop();
      const path = `${userId}/cv-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(path, cvFile, { upsert: true });

      if (uploadError) {
        setSaving(false);
        setError("Le CV n'a pas pu être envoyé : " + uploadError.message);
        return;
      }
      cvPath = path;
      cvUploadedAt = new Date().toISOString();
    }

    const availabilityOption = AVAILABILITY_OPTIONS.find((o) => o.label === availabilityLabel);
    let availabilityDate: string | null = null;
    if (availabilityOption && availabilityOption.daysFromNow !== null) {
      const date = new Date();
      date.setDate(date.getDate() + availabilityOption.daysFromNow);
      availabilityDate = date.toISOString().slice(0, 10);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        skills,
        sectors,
        target_jobs: targetJobs,
        city: city.trim(),
        mobility: mobility || null,
        looking_for: lookingFor,
        education_level: educationLevel || null,
        experience_level: experienceLevel || null,
        availability_date: availabilityDate,
        cv_path: cvPath,
        cv_uploaded_at: cvUploadedAt,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    void logOnboardingEvent(userId, "onboarding_step_completed", "outro");

    // Skip l'aller-retour réseau pour l'immense majorité des comptes qui
    // n'ont pas de parrain -- seul ce cas a besoin d'être attendu (un
    // window.location juste après pourrait sinon annuler la requête en
    // vol). Navigation complète, pas router.push -- voir LoginForm pour le
    // symptôme (cache client resservant l'état pré-connexion/pré-onboarding).
    if (initialProfile?.referred_by) {
      await markReferralGrantedAction(userId);
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/swipe";
  }

  const progressIndex = PROGRESS_STEPS.indexOf(stepId);
  const showChrome = stepId !== "intro" && stepId !== "outro";
  const skippable = SKIPPABLE.includes(stepId);

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ minHeight: "min(720px, 92dvh)", position: "relative" }}
    >
      {showChrome && (
        <div style={{ padding: "4px 4px 0" }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="btn btn-icon"
              aria-label="Retour"
              style={{ borderRadius: 12, background: "var(--color-surface)", border: "none" }}
            >
              ←
            </button>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: "var(--color-surface)",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${((progressIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
          <p
            style={{
              fontSize: 11,
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--color-accent-2)",
              margin: "14px 0 0",
            }}
          >
            Étape {progressIndex + 1} sur {PROGRESS_STEPS.length} · {STEP_LABELS[stepId]}
          </p>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden", marginTop: showChrome ? 20 : 0 }}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={stepId}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.26, ease: "easeInOut" }}
            style={{ display: "flex", flexDirection: "column", flex: 1 }}
          >
            {stepId === "intro" && (
              <div className="flex flex-1 flex-col px-2" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent-2) 25%, transparent), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", marginTop: 24 }}>
                  <h1 style={{ fontSize: 30, margin: 0, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
                    Bienvenue sur Stageio
                  </h1>
                  <p
                    style={{
                      fontSize: 15,
                      marginTop: 10,
                      lineHeight: 1.55,
                      color: "color-mix(in srgb, var(--color-text) 68%, transparent)",
                      maxWidth: "34ch",
                    }}
                  >
                    En <Highlight delay={0.4}>2 minutes</Highlight>, dis-nous ce que tu cherches. Zéro
                    lettre de motivation à rédiger — juste des tuiles à taper.
                  </p>
                </div>
                <div className="flex flex-col gap-3.5" style={{ position: "relative", marginTop: 28 }}>
                  {[
                    ["👆", "Swipe les offres qui te correspondent"],
                    ["⚡", "Postule en un geste, sans paperasse"],
                    ["📬", "Suis les réponses des recruteurs au même endroit"],
                  ].map(([icon, text]) => (
                    <div
                      key={text}
                      className="flex items-center gap-3.5"
                      style={{
                        background: "var(--color-surface)",
                        borderRadius: 18,
                        padding: 16,
                        fontSize: 14.5,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        textAlign: "left",
                      }}
                    >
                      <span aria-hidden style={{ fontSize: 22, flexShrink: 0 }}>
                        {icon}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
                <div className="flex-1" style={{ minHeight: 20 }} />
                <button type="button" onClick={goNext} className="btn btn-primary btn-block">
                  Commencer
                </button>
              </div>
            )}

            {stepId === "looking_for" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Tu cherches quoi ?" subtitle="Tu peux sélectionner les deux." />
                <div className="flex flex-col gap-3.5">
                  {(["alternance", "stage"] as ContractType[]).map((type) => (
                    <TileOption
                      key={type}
                      size="lg"
                      label={type === "alternance" ? "Alternance" : "Stage"}
                      icon={type === "alternance" ? "🎯" : "🌱"}
                      active={lookingFor.includes(type)}
                      onClick={() => toggleLookingFor(type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "search" && (
              <div className="flex flex-col gap-7">
                <StepHeader title="Ta recherche" subtitle="Dernière ligne droite, et tes offres sont prêtes." />

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Ta ville <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TOP_CITIES.map((c) => (
                      <motion.button
                        key={c}
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.04 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        onClick={() => {
                          setCity(c);
                          setCityCustomOpen(false);
                        }}
                        className={city === c ? "tag" : "tag tag-neutral"}
                        style={{
                          padding: "7px 14px",
                          fontSize: 13,
                          ...(city === c ? { background: "var(--color-accent)", color: "var(--color-bg)" } : {}),
                        }}
                      >
                        {c}
                      </motion.button>
                    ))}
                  </div>
                  {cityCustomOpen || (city && !TOP_CITIES.includes(city)) ? (
                    <input
                      autoFocus
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ta ville"
                      className="input"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCityCustomOpen(true)}
                      className="tag tag-outline"
                      style={{ padding: "7px 14px", fontSize: 13, alignSelf: "flex-start" }}
                    >
                      + Autre ville
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Secteurs recherchés <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <ChipMultiSelectWithCustom
                    options={SECTORS}
                    value={sectors}
                    onChange={setSectors}
                    searchable
                    searchPlaceholder="Rechercher un secteur..."
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Compétences <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <ChipMultiSelectWithCustom options={SKILLS} value={skills} onChange={setSkills} />
                </div>
              </div>
            )}

            {stepId === "profile" && (
              <div className="flex flex-col gap-7">
                <StepHeader
                  title="Précise ton profil"
                  subtitle="Ça change vraiment le calcul de compatibilité de chaque offre."
                />

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Métiers visés <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <ChipMultiSelectWithCustom options={TARGET_JOBS} value={targetJobs} onChange={setTargetJobs} />
                </div>

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Mobilité <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {MOBILITY_OPTIONS.map((opt) => (
                      <TileOption
                        key={opt.value}
                        label={opt.value}
                        icon={opt.icon}
                        active={mobility === opt.value}
                        onClick={() => setMobility(opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Niveau d&apos;études <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EDUCATION_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEducationLevel(level)}
                        className={educationLevel === level ? "tag" : "tag tag-neutral"}
                        style={{
                          padding: "7px 14px",
                          fontSize: 13,
                          ...(educationLevel === level
                            ? { background: "var(--color-accent)", color: "var(--color-bg)" }
                            : {}),
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Expérience <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {EXPERIENCE_LEVELS.map((opt) => (
                      <TileOption
                        key={opt.value}
                        label={opt.value}
                        icon={opt.icon}
                        active={experienceLevel === opt.value}
                        onClick={() => setExperienceLevel(opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Disponibilité <span style={{ color: "var(--color-accent-700)" }}>(obligatoire)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <TileOption
                        key={opt.label}
                        label={opt.label}
                        icon={opt.icon}
                        active={availabilityLabel === opt.label}
                        onClick={() => setAvailabilityLabel(opt.label)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stepId === "cv" && (
              <div className="flex flex-1 flex-col gap-5">
                <StepHeader title="Ajoute ton CV" subtitle="Améliore tes recommandations. Modifiable plus tard depuis ton profil." />
                <label
                  className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center cursor-pointer"
                  style={{
                    border: `2.5px dashed ${cvFile ? "var(--color-accent)" : "var(--color-divider)"}`,
                    borderRadius: "var(--radius-lg)",
                    background: cvFile ? "var(--color-accent-100)" : "var(--color-surface)",
                    padding: "30px 20px",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  />
                  <span aria-hidden style={{ fontSize: 34 }}>
                    {cvFile ? "✅" : "📄"}
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700 }}>
                    {cvFile ? cvFile.name : "Clique pour choisir ton CV"}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                    PDF, DOC ou DOCX
                  </span>
                </label>
              </div>
            )}

            {stepId === "outro" && (
              <div className="flex flex-1 flex-col px-2" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -40,
                    left: -40,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", textAlign: "center", marginTop: 24 }}>
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    style={{ fontSize: 52 }}
                    aria-hidden
                  >
                    🎉
                  </motion.div>
                  <h1 style={{ fontSize: 26, margin: "12px 0 0" }}>Tout est prêt !</h1>
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      marginTop: 8,
                      color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
                    }}
                  >
                    On a tout ce qu&apos;il faut pour te montrer les{" "}
                    <Highlight delay={0.35}>meilleures offres</Highlight>.
                  </p>
                </div>

                <div
                  className="flex flex-col gap-3.5"
                  style={{
                    position: "relative",
                    marginTop: 20,
                    background: "var(--color-surface)",
                    borderRadius: 22,
                    padding: 18,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
                        margin: "0 0 8px",
                      }}
                    >
                      Type de contrat
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lookingFor.map((t) => (
                        <span key={t} className="tag tag-accent">
                          {t === "alternance" ? "🎯 Alternance" : "🌱 Stage"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
                        margin: "0 0 8px",
                      }}
                    >
                      Ville
                    </p>
                    <span className="tag tag-neutral">{city || "—"}</span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
                        margin: "0 0 8px",
                      }}
                    >
                      Secteurs
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sectors.slice(0, 6).map((s) => (
                        <span key={s} className="tag tag-neutral">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1" style={{ minHeight: 20 }} />

                {error && (
                  <p className="text-sm" style={{ color: "var(--color-accent-700)", textAlign: "center" }}>
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={finish}
                  className="btn btn-primary btn-block"
                  style={{ position: "relative" }}
                >
                  {saving ? "Enregistrement..." : "Voir mes offres"}
                </button>
              </div>
            )}

            {showChrome && (
              <>
                {error && (
                  <p className="mt-4 text-sm" style={{ color: "var(--color-accent-700)" }}>
                    {error}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                  {skippable ? (
                    <button type="button" onClick={goNext} className="btn btn-ghost">
                      Passer
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" onClick={goNext} className="btn btn-primary">
                    Continuer
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
