"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { markReferralGrantedAction } from "@/app/onboarding/actions";
import { ChipMultiSelectWithCustom } from "@/components/ui/ChipMultiSelectWithCustom";
import { LocationSearchSelect } from "@/components/ui/LocationSearchSelect";
import { Highlight } from "@/components/ui/Highlight";
import type { ContractType, Profile } from "@/types/database";
import {
  SECTORS,
  SKILLS,
  LOCATION_OPTIONS,
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
// Une question par écran (ville / secteurs / compétences / métiers /
// mobilité / niveau / dispo) plutôt que deux mega-étapes : plus facile à
// compléter au tap, et permet à la jauge "Matching précis à X%" de bouger à
// chaque réponse. Mobilité en particulier pèse lourd dans computeMatchScore
// (pénalité de localisation) : un profil qui ne la renseigne jamais se fait
// pénaliser par défaut comme s'il n'était mobile pour rien, même quand ce
// n'est pas vrai — d'où son caractère obligatoire comme les autres.
const PROGRESS_STEPS: StepId[] = STEP_IDS.filter(
  (s) => s !== "intro" && s !== "outro" && s !== "trust",
);
const SKIPPABLE: StepId[] = ["cv"];

// Écran de réassurance sociale juste après le choix stage/alternance/les
// deux -- traité comme "intro"/"outro" (pas de chrome, pas de progression
// dans la barre) puisqu'il ne demande aucune donnée, juste une transition.
function trustContractLabel(lookingFor: ContractType[]): string {
  const hasAlternance = lookingFor.includes("alternance");
  const hasStage = lookingFor.includes("stage");
  if (hasAlternance && !hasStage) return "leur alternance";
  if (hasStage && !hasAlternance) return "leur stage";
  return "leur alternance ou leur stage";
}

function AnimatedCount({ target, durationMs }: { target: number; durationMs: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return <>{value.toLocaleString("fr-FR")}</>;
}

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
  trustCount,
}: {
  userId: string;
  initialProfile: Profile | null;
  trustCount: number;
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
    if (stepId === "city" && !city.trim()) {
      return "Indique au moins ta ville.";
    }
    if (stepId === "sectors" && sectors.length === 0) {
      return "Sélectionne au moins un secteur.";
    }
    if (stepId === "skills" && skills.length === 0) {
      return "Sélectionne au moins une compétence.";
    }
    if (stepId === "jobs" && targetJobs.length === 0) {
      return "Sélectionne au moins un métier visé.";
    }
    if (stepId === "mobility" && !mobility) {
      return "Indique ta mobilité.";
    }
    if (stepId === "level" && !educationLevel) {
      return "Indique ton niveau d'études.";
    }
    if (stepId === "level" && !experienceLevel) {
      return "Indique ton niveau d'expérience.";
    }
    if (stepId === "dispo" && !availabilityLabel) {
      return "Indique ta disponibilité.";
    }
    return null;
  }

  function goToStep(id: StepId) {
    setError(null);
    setDirection(-1);
    setStepIndex(STEP_IDS.indexOf(id));
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
  const showChrome = stepId !== "intro" && stepId !== "outro" && stepId !== "trust";
  const skippable = SKIPPABLE.includes(stepId);
  const currentStepValid = validateCurrentStep() === null;

  // Jauge "Matching précis à X%" : reflète en direct à quel point le profil
  // en cours de remplissage réduit l'incertitude du score de compatibilité
  // (computeMatchScore) -- purement indicatif côté UI, ne modifie aucun
  // score réel.
  const precision =
    10 +
    (lookingFor.length ? 10 : 0) +
    (city.trim() ? 15 : 0) +
    (sectors.length ? 15 : 0) +
    (skills.length ? Math.min(15, skills.length * 5) : 0) +
    (targetJobs.length ? 10 : 0) +
    (mobility ? 8 : 0) +
    (educationLevel ? 5 : 0) +
    (experienceLevel ? 4 : 0) +
    (availabilityLabel ? 3 : 0) +
    (cvFile || initialProfile?.cv_path ? 5 : 0);

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
            <div style={{ flex: 1, display: "flex", gap: 4 }}>
              {PROGRESS_STEPS.map((s, i) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--color-surface)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{
                      width:
                        i < progressIndex ? "100%" : i === progressIndex ? (currentStepValid ? "100%" : "40%") : "0%",
                    }}
                    transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
                      borderRadius: 999,
                    }}
                  />
                </div>
              ))}
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

            {stepId === "trust" && (
              <div className="flex flex-1 flex-col px-2" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -50,
                    left: -50,
                    width: 170,
                    height: 170,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 25%, transparent), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: -60,
                    right: -60,
                    width: 190,
                    height: 190,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent-2) 22%, transparent), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="flex flex-1 flex-col items-center justify-center text-center"
                  style={{ position: "relative" }}
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    style={{ fontSize: 46 }}
                    aria-hidden
                  >
                    🤝
                  </motion.div>
                  <p
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 40,
                      fontWeight: 800,
                      margin: "16px 0 0",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    +<AnimatedCount target={trustCount} durationMs={1400} />
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.4, maxWidth: "28ch" }}>
                    personnes nous ont fait confiance pour trouver {trustContractLabel(lookingFor)}
                  </p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      margin: "18px 0 0",
                      padding: "8px 16px",
                      borderRadius: 999,
                      background: "var(--color-accent-100)",
                      color: "var(--color-accent-700)",
                    }}
                  >
                    ✨ Tu as fait le bon choix
                  </motion.p>
                </div>
                <button type="button" onClick={goNext} className="btn btn-primary btn-block">
                  Continuer
                </button>
              </div>
            )}

            {stepId === "city" && (
              <div className="flex flex-col gap-4">
                <StepHeader
                  title="Tu veux travailler où ?"
                  subtitle="Une ville précise, ou tout un département si tu es mobile plus large."
                />
                <LocationSearchSelect
                  options={LOCATION_OPTIONS}
                  value={city}
                  onChange={(c) => {
                    setCity(c);
                    setCityCustomOpen(false);
                  }}
                  placeholder="Rechercher une ville ou un département..."
                />
                {cityCustomOpen || (city && !LOCATION_OPTIONS.includes(city)) ? (
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
            )}

            {stepId === "sectors" && (
              <div className="flex flex-col gap-4">
                <StepHeader title="Quels secteurs te font envie ?" subtitle="Choisis-en autant que tu veux." />
                <ChipMultiSelectWithCustom
                  options={SECTORS}
                  value={sectors}
                  onChange={setSectors}
                  searchable
                  searchPlaceholder="Rechercher un secteur..."
                />
              </div>
            )}

            {stepId === "skills" && (
              <div className="flex flex-col gap-4">
                <StepHeader title="Tu es bon·ne en quoi ?" subtitle="Outils, langues, soft skills : tout compte." />
                <ChipMultiSelectWithCustom options={SKILLS} value={skills} onChange={setSkills} />
              </div>
            )}

            {stepId === "jobs" && (
              <div className="flex flex-col gap-4">
                <StepHeader
                  title="Quel métier tu vises ?"
                  subtitle="Ça change vraiment le calcul de compatibilité."
                />
                <ChipMultiSelectWithCustom options={TARGET_JOBS} value={targetJobs} onChange={setTargetJobs} />
              </div>
            )}

            {stepId === "mobility" && (
              <div className="flex flex-col gap-5">
                <StepHeader
                  title="Tu peux bouger jusqu'où ?"
                  subtitle="Pour ne pas te pénaliser sur des offres un peu plus loin."
                />
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
            )}

            {stepId === "level" && (
              <div className="flex flex-col gap-7">
                <StepHeader title="Où en es-tu dans ton parcours ?" subtitle="Niveau d'études et expérience." />

                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>
                    Niveau d&apos;études
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
                  <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: 0 }}>Expérience</p>
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
              </div>
            )}

            {stepId === "dispo" && (
              <div className="flex flex-col gap-5">
                <StepHeader
                  title="Tu peux commencer quand ?"
                  subtitle="On met en avant les offres qui démarrent au bon moment."
                />
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
            )}

            {stepId === "cv" && (
              <div className="flex flex-1 flex-col gap-5">
                <StepHeader
                  title="Ajoute ton CV"
                  subtitle="Facultatif — améliore tes recommandations. Modifiable plus tard."
                />
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
                  {[
                    {
                      icon: "🎯",
                      label: "Type de contrat",
                      value: lookingFor.length
                        ? lookingFor.map((t) => (t === "alternance" ? "Alternance" : "Stage")).join(" + ")
                        : "—",
                      onEdit: () => goToStep("looking_for"),
                    },
                    {
                      icon: "📍",
                      label: "Ville · mobilité",
                      value: (city || "—") + (mobility ? " · " + mobility : ""),
                      onEdit: () => goToStep("city"),
                    },
                    {
                      icon: "🗂️",
                      label: "Secteurs",
                      value: sectors.length
                        ? sectors.slice(0, 3).join(", ") + (sectors.length > 3 ? ` +${sectors.length - 3}` : "")
                        : "—",
                      onEdit: () => goToStep("sectors"),
                    },
                    {
                      icon: "💼",
                      label: "Métiers visés",
                      value: targetJobs.length
                        ? targetJobs.slice(0, 2).join(", ") +
                          (targetJobs.length > 2 ? ` +${targetJobs.length - 2}` : "")
                        : "—",
                      onEdit: () => goToStep("jobs"),
                    },
                    {
                      icon: "🎓",
                      label: "Niveau",
                      value: [educationLevel, experienceLevel, availabilityLabel].filter(Boolean).join(" · ") || "—",
                      onEdit: () => goToStep("level"),
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: "var(--color-accent-100)",
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        {row.icon}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
                            margin: 0,
                          }}
                        >
                          {row.label}
                        </p>
                        <p style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, margin: "2px 0 0" }}>
                          {row.value}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={row.onEdit}
                        aria-label={`Modifier : ${row.label}`}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                          padding: 4,
                          fontSize: 15,
                          lineHeight: 1,
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  ))}
                </div>

                {/* Contexte marché (chiffre réel DARES/Insee, voir la LP pour
                    la même donnée) + rappel de l'offre rentrée -- juste avant
                    le bouton final, pour que l'urgence soit la dernière chose
                    lue avant de basculer sur /swipe puis /premium. */}
                <div
                  className="flex flex-col gap-2"
                  style={{
                    marginTop: 16,
                    background: "var(--color-accent-2-100)",
                    border: "1px solid var(--color-accent-2-300)",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span aria-hidden style={{ fontSize: 16, lineHeight: 1.3 }}>
                      📉
                    </span>
                    <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--color-accent-2-800)", margin: 0 }}>
                      <strong>846 700 contrats d&apos;alternance signés en France en 2025</strong>, soit 5% de
                      moins qu&apos;en 2024 (source DARES/Insee) — le marché se resserre, se démarquer compte
                      plus que jamais.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span aria-hidden style={{ fontSize: 16, lineHeight: 1.3 }}>
                      🎒
                    </span>
                    <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--color-accent-2-800)", margin: 0 }}>
                      <strong>Offre spéciale rentrée</strong> — tarifs actuels garantis encore un temps
                      limité, augmentation prévue ensuite.
                    </p>
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
                <div className="mt-auto flex items-center gap-2.5 pt-8">
                  <span aria-hidden style={{ fontSize: 15 }}>
                    🎯
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                    Matching précis à {precision}%
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 999,
                      background: "var(--color-surface)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      animate={{ width: `${precision}%` }}
                      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                      style={{ height: "100%", background: "var(--color-accent)", borderRadius: 999 }}
                    />
                  </div>
                </div>
                {error && (
                  <p className="mt-3 text-sm" style={{ color: "var(--color-accent-700)" }}>
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3" style={{ marginTop: error ? 12 : 14 }}>
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
