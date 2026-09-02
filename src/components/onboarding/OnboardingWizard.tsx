"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ChipMultiSelectWithCustom } from "@/components/ui/ChipMultiSelectWithCustom";
import type { ContractType, Profile } from "@/types/database";
import {
  SECTORS,
  SKILLS,
  TARGET_JOBS,
  TOP_CITIES,
  MOBILITY_OPTIONS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
} from "@/lib/onboarding/options";

// Onboarding "sans clavier" : tout se fait au tap (tuiles/chips), avec un
// échappatoire texte optionnel là où une liste ne peut pas tout couvrir
// (ville, compétences...). bio/formation/date de naissance restent éditables
// plus tard depuis le profil — pas assez tap-friendly pour rester ici.
const STEP_IDS = [
  "intro",
  "looking_for",
  "sectors",
  "how_it_works",
  "skills",
  "target_jobs",
  "city",
  "mobility",
  "education",
  "experience",
  "value_props",
  "availability",
  "cv",
  "outro",
] as const;
type StepId = (typeof STEP_IDS)[number];

const PROGRESS_STEPS: StepId[] = STEP_IDS.filter((s) => s !== "intro" && s !== "outro");
const SKIPPABLE: StepId[] = [
  "sectors",
  "skills",
  "target_jobs",
  "mobility",
  "education",
  "experience",
  "availability",
  "cv",
];

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
}: {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-3"
      style={{
        textAlign: "left",
        width: "100%",
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        border: `2px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
        background: active ? "var(--color-accent-100)" : "var(--color-surface)",
        fontFamily: "var(--font-heading)",
        fontSize: 15,
        color: active ? "var(--color-accent-800)" : "var(--color-text)",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
    >
      {icon && (
        <span aria-hidden style={{ fontSize: 20 }}>
          {icon}
        </span>
      )}
      {label}
    </motion.button>
  );
}

export function OnboardingWizard({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Profile | null;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepId = STEP_IDS[stepIndex];

  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);
  const [sectors, setSectors] = useState<string[]>(initialProfile?.sectors ?? []);
  const [targetJobs, setTargetJobs] = useState<string[]>(initialProfile?.target_jobs ?? []);

  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [cityCustomOpen, setCityCustomOpen] = useState(false);
  const [mobility, setMobility] = useState(initialProfile?.mobility ?? "");
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    initialProfile?.looking_for ?? ["alternance", "stage"],
  );

  const [educationLevel, setEducationLevel] = useState(initialProfile?.education_level ?? "");
  const [experienceLevel, setExperienceLevel] = useState(initialProfile?.experience_level ?? "");
  const [availabilityLabel, setAvailabilityLabel] = useState<string | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<string | null>(
    initialProfile?.availability_date ?? null,
  );

  const [cvFile, setCvFile] = useState<File | null>(null);

  function toggleLookingFor(type: ContractType) {
    setLookingFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function pickAvailability(opt: (typeof AVAILABILITY_OPTIONS)[number]) {
    setAvailabilityLabel(opt.label);
    if (opt.daysFromNow === null) {
      setAvailabilityDate(null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + opt.daysFromNow);
    setAvailabilityDate(d.toISOString().slice(0, 10));
  }

  function validateCurrentStep(): string | null {
    if (stepId === "looking_for" && lookingFor.length === 0) {
      return "Sélectionne alternance et/ou stage.";
    }
    if (stepId === "city" && !city.trim()) {
      return "Indique au moins ta ville.";
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

    router.push("/swipe");
    router.refresh();
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
              className="btn btn-icon btn-secondary"
              aria-label="Retour"
            >
              ←
            </button>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: "var(--color-neutral-200)",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${((progressIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ height: "100%", background: "var(--color-accent)", borderRadius: 999 }}
              />
            </div>
          </div>
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
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 px-2">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                  style={{ fontSize: 56 }}
                  aria-hidden
                >
                  🚀
                </motion.div>
                <div>
                  <h1 style={{ fontSize: 30, margin: 0, lineHeight: 1.15 }}>
                    Bienvenue sur Stageio
                  </h1>
                  <p
                    style={{
                      fontSize: 15,
                      marginTop: 10,
                      color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                      maxWidth: "32ch",
                      marginInline: "auto",
                    }}
                  >
                    En 2 minutes, dis-nous ce que tu cherches. Zéro lettre de
                    motivation à rédiger — juste des tuiles à taper.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 w-full" style={{ maxWidth: 300 }}>
                  {[
                    ["👆", "Swipe les offres qui te correspondent"],
                    ["⚡", "Postule en un geste, sans paperasse"],
                    ["📬", "Suis les réponses des recruteurs au même endroit"],
                  ].map(([icon, text]) => (
                    <div
                      key={text}
                      className="flex items-center gap-3"
                      style={{
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 14px",
                        fontSize: 13,
                        textAlign: "left",
                      }}
                    >
                      <span aria-hidden style={{ fontSize: 18 }}>
                        {icon}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={goNext} className="btn btn-primary btn-block" style={{ maxWidth: 300 }}>
                  Commencer
                </button>
              </div>
            )}

            {stepId === "looking_for" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Tu cherches quoi ?" subtitle="Tu peux sélectionner les deux." />
                <div className="grid grid-cols-2 gap-3">
                  {(["alternance", "stage"] as ContractType[]).map((type) => (
                    <TileOption
                      key={type}
                      label={type === "alternance" ? "Alternance" : "Stage"}
                      icon={type === "alternance" ? "🎯" : "🌱"}
                      active={lookingFor.includes(type)}
                      onClick={() => toggleLookingFor(type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "sectors" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Quels secteurs t'intéressent ?" subtitle="Sélectionne-en un ou plusieurs." />
                <ChipMultiSelectWithCustom options={SECTORS} value={sectors} onChange={setSectors} />
              </div>
            )}

            {stepId === "how_it_works" && (
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 px-2">
                <h1 style={{ fontSize: 26, margin: 0 }}>Comment ça marche</h1>
                <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 320 }}>
                  {[
                    ["👆", "Swipe", "Découvre des offres triées selon ton profil"],
                    ["⚡", "Postule", "Un geste suffit, ton CV part automatiquement"],
                    ["📬", "Sois recontacté", "Suis chaque réponse recruteur en direct"],
                  ].map(([icon, title, text]) => (
                    <div
                      key={title}
                      className="flex items-center gap-3"
                      style={{
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px 16px",
                        textAlign: "left",
                      }}
                    >
                      <span aria-hidden style={{ fontSize: 24 }}>
                        {icon}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 14 }}>{title}</p>
                        <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepId === "skills" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Tes compétences" subtitle="Celles qui te représentent le mieux." />
                <ChipMultiSelectWithCustom options={SKILLS} value={skills} onChange={setSkills} />
              </div>
            )}

            {stepId === "target_jobs" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Des métiers en tête ?" subtitle="Optionnel — ça affine encore plus tes offres." />
                <ChipMultiSelectWithCustom options={TARGET_JOBS} value={targetJobs} onChange={setTargetJobs} />
              </div>
            )}

            {stepId === "city" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Où es-tu ?" subtitle="On te propose des offres proches ou compatibles." />
                <div className="flex flex-wrap gap-2">
                  {TOP_CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
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
                    </button>
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
            )}

            {stepId === "mobility" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Tu es prêt·e à bouger ?" subtitle="Optionnel." />
                <div className="flex flex-col gap-2.5">
                  {MOBILITY_OPTIONS.map((opt) => (
                    <TileOption
                      key={opt.value}
                      label={opt.value}
                      icon={opt.icon}
                      active={mobility === opt.value}
                      onClick={() => setMobility(mobility === opt.value ? "" : opt.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "education" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Ton niveau d'études" subtitle="Optionnel." />
                <div className="flex flex-col gap-2.5">
                  {EDUCATION_LEVELS.map((level) => (
                    <TileOption
                      key={level}
                      label={level}
                      icon="🎓"
                      active={educationLevel === level}
                      onClick={() => setEducationLevel(educationLevel === level ? "" : level)}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "experience" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Ton expérience" subtitle="Optionnel." />
                <div className="flex flex-col gap-2.5">
                  {EXPERIENCE_LEVELS.map((opt) => (
                    <TileOption
                      key={opt.value}
                      label={opt.value}
                      icon={opt.icon}
                      active={experienceLevel === opt.value}
                      onClick={() => setExperienceLevel(experienceLevel === opt.value ? "" : opt.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "value_props" && (
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 px-2">
                <h1 style={{ fontSize: 26, margin: 0 }}>Ce que tu gagnes avec Stageio</h1>
                <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 320 }}>
                  {[
                    ["🎯", "Offres triées par compatibilité avec ton profil"],
                    ["⚡", "Candidature en un geste, pas de lettre à réécrire"],
                    ["🔔", "Toutes tes réponses recruteurs au même endroit"],
                  ].map(([icon, text]) => (
                    <div
                      key={text}
                      className="flex items-center gap-3"
                      style={{
                        background: "var(--color-accent-100)",
                        color: "var(--color-accent-800)",
                        borderRadius: "var(--radius-md)",
                        padding: "12px 16px",
                        fontSize: 13,
                        textAlign: "left",
                      }}
                    >
                      <span aria-hidden style={{ fontSize: 20 }}>
                        {icon}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepId === "availability" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Tu es dispo à partir de quand ?" subtitle="Optionnel." />
                <div className="flex flex-col gap-2.5">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <TileOption
                      key={opt.label}
                      label={opt.label}
                      icon={opt.icon}
                      active={availabilityLabel === opt.label}
                      onClick={() => pickAvailability(opt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "cv" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Ajoute ton CV" subtitle="Améliore tes recommandations. Modifiable plus tard depuis ton profil." />
                <label
                  className="flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  style={{
                    border: "2px dashed var(--color-divider)",
                    borderRadius: "var(--radius-lg)",
                    padding: "40px 16px",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  />
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>
                    {cvFile ? cvFile.name : "Clique pour choisir ton CV"}
                  </span>
                  <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                    PDF, DOC ou DOCX
                  </span>
                </label>
              </div>
            )}

            {stepId === "outro" && (
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-6 px-2">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  style={{ fontSize: 52 }}
                  aria-hidden
                >
                  🎉
                </motion.div>
                <div>
                  <h1 style={{ fontSize: 28, margin: 0 }}>Tout est prêt !</h1>
                  <p
                    style={{
                      fontSize: 14,
                      marginTop: 8,
                      color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                    }}
                  >
                    On a tout ce qu&apos;il faut pour te montrer les meilleures offres.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 320 }}>
                  {lookingFor.map((t) => (
                    <span key={t} className="tag tag-accent">
                      {t === "alternance" ? "Alternance" : "Stage"}
                    </span>
                  ))}
                  {city && <span className="tag tag-neutral">📍 {city}</span>}
                  {sectors.slice(0, 3).map((s) => (
                    <span key={s} className="tag tag-accent-2">
                      {s}
                    </span>
                  ))}
                </div>
                {error && (
                  <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={finish}
                  className="btn btn-primary btn-block"
                  style={{ maxWidth: 300 }}
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
