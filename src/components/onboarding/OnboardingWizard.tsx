"use client";

import { useEffect, useRef, useState } from "react";
import { requestNow } from "@/lib/applications/status";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { markReferralGrantedAction, saveSchoolStageOnboardingAction } from "@/app/onboarding/actions";
import { SCHOOL_STAGE_IDS, ageOn } from "@/lib/schoolStage/levels";
import { ChipMultiSelectWithCustom } from "@/components/ui/ChipMultiSelectWithCustom";
import { LocationSearchSelect } from "@/components/ui/LocationSearchSelect";
import { Highlight } from "@/components/ui/Highlight";
import type { ContractType, Profile } from "@/types/database";
import { ALL_CONTRACT_TYPES, CONTRACT_ICON, CONTRACT_LABEL, CONTRACT_SUB, contractNouns } from "@/lib/offers/contractLabels";
import {
  SECTORS,
  SKILLS,
  LOCATION_OPTIONS,
  TARGET_JOBS,
  MOBILITY_OPTIONS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
  HEARD_FROM_FORMATS,
  HEARD_FROM_OPTIONS,
  type HeardFromFormat,
} from "@/lib/onboarding/options";
import { NO_CHROME_STEPS, STEPS_A, STEPS_B, STEP_LABELS, type StepId } from "@/lib/onboarding/steps";
import { PledgeDone, ProofCompare, ProofDemo, ProofOffers, ProofReviews, ProofWeek, type ProofData } from "@/components/onboarding/ProofScreens";
import { PledgeSign } from "@/components/pledge/PledgeSign";
import { UrgencyScreen } from "@/components/onboarding/UrgencyScreen";
import { forgetSignupCity, readSignupCity } from "@/lib/signup/intentStorage";
import { useDemo } from "@/lib/demo/demoMode";

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
const SKIPPABLE: StepId[] = ["cv"];

// Écran de réassurance sociale juste après le choix stage/alternance/les
// deux -- traité comme "intro"/"outro" (pas de chrome, pas de progression
// dans la barre) puisqu'il ne demande aucune donnée, juste une transition.
function trustContractLabel(lookingFor: ContractType[]): string {
  return contractNouns(lookingFor, "leur");
}

// « ton alternance », « ton CDI », « ton alternance ou ton stage » (contrat).
function myContractLabel(lookingFor: ContractType[]): string {
  return contractNouns(lookingFor, "ton");
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

// Sous-textes des tuiles de mobilité (voir design) -- gardés ici plutôt que
// dans lib/onboarding/options.ts pour ne pas ajouter un champ que
// ProfileForm.tsx (qui réutilise MOBILITY_OPTIONS) n'a pas demandé.
// Textes des tuiles « Tu cherches quoi ? » (19/11, Nathan : « trop vague ») :
// propres à l'onboarding, les libellés du reste du site ne changent pas.
const ONBOARDING_TYPE_TEXT: Partial<Record<ContractType, { label: string; sub: string }>> = {
  cdi: { label: "CDI", sub: "Un emploi stable, sans date de fin. Ouvert aux débutants." },
  cdd: { label: "CDD", sub: "Un emploi de quelques semaines ou quelques mois. Ouvert aux débutants." },
  alternance: { label: "Alternance", sub: "Tu prépares un diplôme (du CAP au master) et tu travailles en entreprise, avec un salaire." },
  stage: { label: "Stage étudiant", sub: "BTS, BUT, licence, master, école : un stage de quelques mois pendant tes études." },
};

const SCHOOL_CLASS_LABEL: Record<string, string> = {
  "3e": "3e (collège)",
  seconde: "Seconde",
  premiere: "Première",
  bac_pro: "Bac pro (PFMP)",
};

const MOBILITY_SUBTEXT: Record<string, string> = {
  "Sur place uniquement": "Seulement dans ta ville",
  "Mobile dans la région": "Jusqu'à ~50 km",
  "Mobile en France": "Prêt·e à déménager",
  "Full remote": "100% à distance",
};

// Messages affichés en boucle pendant la sauvegarde finale (étape "outro") --
// purement cosmétique (aucun ne décrit une étape technique distincte), sert
// juste à faire sentir que l'app travaille pendant les ~1.8s d'animation.
// Rayon de la version B, rangé dans la même colonne que la mobilité.
const QUICK_RADIUS = [
  { value: "Sur place uniquement", label: "📍 Ma ville" },
  { value: "Mobile dans la région", label: "🚗 Ma région" },
  { value: "Mobile en France", label: "🇫🇷 Toute la France" },
] as const;

const OUTRO_LOAD_MESSAGES = [
  "On analyse les offres actives…",
  "On calcule tes scores de compatibilité…",
  "On trie ton deck du jour…",
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
  sub,
  active,
  onClick,
  size = "sm",
}: {
  label: string;
  icon?: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "lg";
}) {
  const isLg = size === "lg";
  const iconBox = isLg ? 48 : 38;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-start"
      style={{
        position: "relative",
        textAlign: "left",
        width: "100%",
        gap: 10,
        padding: isLg ? "22px 20px" : "14px",
        borderRadius: isLg ? "var(--radius-lg)" : "var(--radius-md)",
        border: `2px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
        background: active ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" : "var(--color-surface)",
        boxShadow: active ? "0 10px 24px color-mix(in srgb, var(--color-accent) 28%, transparent)" : "0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent)",
        color: active ? "var(--color-bg)" : "var(--color-text)",
        transition: "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {active && (
        <span
          aria-hidden
          className="flex items-center justify-center"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--color-bg)",
            color: "var(--color-accent)",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          ✓
        </span>
      )}
      {icon && (
        <span
          aria-hidden
          className="flex items-center justify-center"
          style={{
            width: iconBox,
            height: iconBox,
            borderRadius: 13,
            flexShrink: 0,
            background: active ? "color-mix(in srgb, var(--color-bg) 20%, transparent)" : "var(--color-accent-100)",
            color: active ? "var(--color-bg)" : "var(--color-accent)",
            fontSize: isLg ? 24 : 18,
          }}
        >
          {icon}
        </span>
      )}
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: isLg ? 800 : 700,
          fontSize: isLg ? 18 : 13.5,
          lineHeight: 1.25,
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          style={{
            marginTop: -6,
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.4,
            opacity: 0.85,
          }}
        >
          {sub}
        </span>
      )}
    </motion.button>
  );
}

// Funnel onboarding (dashboard admin, "Vus / Terminés / Abandon" par écran) :
// un événement par étape vue/terminée, écrit dans user_events (déjà
// accessible en écriture à l'utilisateur pour ses propres lignes via RLS).
// /onboarding exige déjà une session (voir proxy.ts) : pas de bruit robot à
// filtrer côté client, contrairement au tracking de visites site entier.
// Résout à null si la promesse ne répond pas à temps (réseau mobile, base
// lente) : l'onboarding ne reste jamais bloqué sur un chargement.
function withDeadline<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

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

// Réponse à « Tu nous as connus comment ? » : notée dès le tap (pas à la fin
// de l'onboarding) pour compter aussi ceux qui s'arrêtent après. Un
// changement d'avis ajoute une ligne ; l'admin garde la plus récente.
async function logHeardFrom(userId: string, source: string, format: string | null = null) {
  const { error } = await createClient()
    .from("user_events")
    .insert({ user_id: userId, event_type: "heard_from", metadata: format ? { source, format } : { source } });
  if (error) {
    console.error("onboarding heard_from event failed", error, { source, format });
  }
}

export function OnboardingWizard({
  userId,
  initialProfile,
  trustCount,
  proof,
  variant = "a",
  fromOffer = null,
}: {
  userId: string;
  initialProfile: Profile | null;
  trustCount: number;
  proof: ProofData;
  /** Test A/B d'onboarding (lib/onboarding/steps.ts). */
  variant?: "a" | "b";
  /** Arrivé depuis une fiche offre (20/11) : contrat et ville de l'offre. */
  fromOffer?: { contract: ContractType; city: string | null; title?: string | null; company?: string | null } | null;
}) {
  // Version A : écrans « contrat » et « ville » sautés quand l'offre les donne
  // (modifiables depuis le récap). Version B : écran critères pré-rempli.
  // Un lien « modifier » du récap vers un écran sauté le remet dans le parcours.
  const [showSkipped, setShowSkipped] = useState(false);
  const STEP_IDS =
    variant === "b"
      ? STEPS_B
      : showSkipped || !fromOffer
        ? STEPS_A
        : STEPS_A.filter((s) => s !== "looking_for" && !(s === "city" && fromOffer.city));
  const PROGRESS_STEPS: StepId[] = STEP_IDS.filter((s) => !NO_CHROME_STEPS.includes(s));
  const demo = useDemo();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const stepId = STEP_IDS[stepIndex];

  // Séquence de l'étape "outro" (voir design mobile) : sauvegarde réelle du
  // profil en tâche de fond pendant une petite animation de chargement,
  // plutôt qu'un bouton "Enregistrement..." -- fait sentir que l'app
  // travaille, et la carte de récap ne s'affiche qu'une fois les vraies
  // données confirmées en base.
  const [outroPhase, setOutroPhase] = useState<"loading" | "error" | "done">("loading");
  const [loadMsgIndex, setLoadMsgIndex] = useState(0);
  // Jamais une formule fictive (cf. CLAUDE.md, jamais de stat inventée) :
  // vrai décompte des offres actives dans les secteurs choisis, requêté
  // juste après l'enregistrement du profil.
  const [foundCount, setFoundCount] = useState<number | null>(0);
  // CV choisi mais pas envoyé (réseau, fichier refusé) : le profil est
  // quand même enregistré, on le signale sur l'écran final.
  const [cvFailed, setCvFailed] = useState(false);

  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);
  const [sectors, setSectors] = useState<string[]>(initialProfile?.sectors ?? []);

  const [city, setCity] = useState(initialProfile?.city || fromOffer?.city || "");
  const [cityCustomOpen, setCityCustomOpen] = useState(false);
  // Ville de la page d'où vient l'inscription (« Alternance commercial à
  // Lyon ») : pré-remplie seulement si le profil n'en a pas encore. Lue
  // après le montage (localStorage n'existe pas au rendu serveur), et
  // modifiable comme n'importe quelle valeur à l'étape « ville ».
  useEffect(() => {
    if (initialProfile?.city) return;
    const remembered = readSignupCity();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (remembered) setCity((current) => current || remembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Aucune présélection par défaut : les deux tuiles pré-cochées piégeaient
  // les nouveaux comptes (initialProfile null) qui tapaient sur celle
  // qu'ils voulaient, la désélectionnant sans le savoir puisqu'elle était
  // déjà active -- taper les deux vidait la sélection et bloquait l'étape
  // avec une erreur sans qu'on comprenne pourquoi. Un profil existant garde
  // sa vraie valeur.
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    // Le contrat de l'offre passe avant la valeur par défaut du compte (alternance + stage).
    fromOffer ? [fromOffer.contract] : (initialProfile?.looking_for ?? []),
  );

  // Stages scolaires (18/11) : classe et date de naissance. Le reste de
  // l'onboarding est le même pour tout le monde ; sous 15 ans, une case
  // « c'est un parent qui paie » au paywall, rien d'autre.
  const [schoolLevel, setSchoolLevel] = useState<string>(initialProfile?.school_stage ?? "");
  const [birthDate, setBirthDate] = useState<string>(initialProfile?.birth_date ?? "");
  const schoolMode = lookingFor.includes("stage_scolaire");
  const schoolAge = ageOn(birthDate);
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
  const [heardFrom, setHeardFrom] = useState<string | null>(null);
  // Réseau choisi : format vu (commentaire, vidéo, carrousel…), 2e question.
  const [heardFormat, setHeardFormat] = useState<HeardFromFormat | null>(null);
  const heardOption = HEARD_FROM_OPTIONS.find((o) => o.value === heardFrom);

  const [cvFile, setCvFile] = useState<File | null>(null);

  // Brouillon (20/11) : sur mobile, ouvrir le sélecteur de fichier (CV) ou
  // changer d'appli recharge souvent la page, et l'onboarding repartait de
  // l'écran 1 (vu dans les événements : intro > … > cv > intro). L'étape et
  // les réponses sont gardées dans le navigateur 24 h et reprises au retour.
  const draftKey = `stageio_onb_${userId}`;
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    if (demo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem(draftKey);
      const d = raw ? JSON.parse(raw) : null;
      if (d && d.v === 1 && d.variant === variant && requestNow() - d.at < 86_400_000) {
        if (d.showSkipped) setShowSkipped(true);
        if (Array.isArray(d.skills)) setSkills(d.skills);
        if (Array.isArray(d.sectors)) setSectors(d.sectors);
        if (typeof d.city === "string" && d.city) setCity(d.city);
        if (Array.isArray(d.lookingFor) && d.lookingFor.length) setLookingFor(d.lookingFor);
        if (typeof d.schoolLevel === "string") setSchoolLevel(d.schoolLevel);
        if (typeof d.birthDate === "string") setBirthDate(d.birthDate);
        if (Array.isArray(d.targetJobs)) setTargetJobs(d.targetJobs);
        if (typeof d.mobility === "string") setMobility(d.mobility);
        if (typeof d.educationLevel === "string") setEducationLevel(d.educationLevel);
        if (typeof d.experienceLevel === "string") setExperienceLevel(d.experienceLevel);
        if (d.availabilityLabel !== undefined) setAvailabilityLabel(d.availabilityLabel);
        if (d.heardFrom !== undefined) setHeardFrom(d.heardFrom);
        if (d.heardFormat !== undefined) setHeardFormat(d.heardFormat);
        const steps = variant === "a" && d.showSkipped ? STEPS_A : STEP_IDS;
        const outro = steps.indexOf("outro");
        const idx = typeof d.step === "string" ? steps.indexOf(d.step) : -1;
        if (idx > 0) setStepIndex(outro >= 0 ? Math.min(idx, outro) : idx);
      }
    } catch {
      // Stockage indisponible ou brouillon illisible : on repart du début.
    }
    setDraftReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!draftReady || demo) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          v: 1, at: requestNow(), variant, step: stepId, showSkipped, skills, sectors, city, lookingFor, schoolLevel, birthDate,
          targetJobs, mobility, educationLevel, experienceLevel, availabilityLabel, heardFrom, heardFormat,
        }),
      );
    } catch {
      // idem
    }
  }, [draftReady, demo, draftKey, variant, stepId, showSkipped, skills, sectors, city, lookingFor, schoolLevel, birthDate, targetJobs, mobility, educationLevel, experienceLevel, availabilityLabel, heardFrom, heardFormat]);

  useEffect(() => {
    void logOnboardingEvent(userId, "onboarding_step_viewed", stepId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  function toggleLookingFor(type: ContractType) {
    // Stage scolaire : un parcours à part, pas mélangé avec alternance/CDI.
    setLookingFor((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : type === "stage_scolaire"
          ? ["stage_scolaire"]
          : [...prev.filter((t) => t !== "stage_scolaire"), type],
    );
  }

  function validateCurrentStep(): string | null {
    if (stepId === "quick_job" && targetJobs.length === 0) return "Indique au moins un métier.";
    if (stepId === "quick_criteria") {
      if (lookingFor.length === 0) return "Choisis au moins un type de contrat.";
      if (schoolMode) {
        if (!schoolLevel) return "Choisis ta classe.";
        if (schoolAge === null || schoolAge < 10 || schoolAge > 25) return "Indique ta date de naissance.";
      } else if (!experienceLevel) return "Sélectionne ton niveau d'expérience.";
      if (!city.trim()) return "Indique ta ville.";
      if (!mobility) return "Choisis ton rayon.";
    }
    if (stepId === "looking_for" && lookingFor.length === 0) {
      return "Sélectionne au moins un type de contrat.";
    }
    if (stepId === "looking_for" && schoolMode) {
      if (!schoolLevel) return "Choisis ta classe.";
      if (schoolAge === null || schoolAge < 10 || schoolAge > 25) return "Indique ta date de naissance.";
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
    if (stepId === "source" && !heardFrom) {
      return "Dis-nous comment tu nous as connus.";
    }
    if (stepId === "source" && heardOption?.formats && !heardFormat) {
      return `Dis-nous ce que tu as vu sur ${heardFrom}.`;
    }
    return null;
  }

  // Garde-fou pour advanceStep ci-dessous : un second tap sur une autre
  // tuile de la même étape avant l'écoulement du délai, ou un "Continuer"
  // manuel tapé entre-temps, ne doit jamais déclencher DEUX avances
  // (sauterait carrément l'étape suivante -- sans state, deux setStepIndex
  // fonctionnels programmés s'additionneraient l'un après l'autre).
  const pendingAdvanceRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (pendingAdvanceRef.current) window.clearTimeout(pendingAdvanceRef.current);
    };
  }, []);
  function cancelPendingAdvance() {
    if (pendingAdvanceRef.current) {
      window.clearTimeout(pendingAdvanceRef.current);
      pendingAdvanceRef.current = null;
    }
  }

  function goToStep(id: StepId) {
    // Pas de cancelPendingAdvance() ici : goToStep ne sert qu'aux liens
    // "modifier" du récap (étape "outro"), bien après qu'un éventuel délai
    // d'auto-avance (320ms, voir advanceStep) d'une étape à choix unique
    // soit de toute façon déjà écoulé -- l'ajouter ferait lire la ref
    // depuis ce tableau de closures construit pendant le rendu (voir
    // react-hooks/refs), pour un cas qui ne peut pas se produire ici.
    // Version B : les écrans « modifier » du récap pointent sur ses 2 écrans.
    const inB: Partial<Record<StepId, StepId>> = { looking_for: "quick_criteria", city: "quick_criteria", level: "quick_criteria", jobs: "quick_job", sectors: "quick_job" };
    let index = STEP_IDS.indexOf(id);
    if (index < 0 && inB[id]) index = STEP_IDS.indexOf(inB[id]);
    if (index < 0 && variant === "a" && STEPS_A.includes(id)) {
      setShowSkipped(true);
      index = STEPS_A.indexOf(id);
    }
    if (index < 0) return;
    setError(null);
    setDirection(-1);
    setStepIndex(index);
  }

  function goNext() {
    cancelPendingAdvance();
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    void logOnboardingEvent(userId, "onboarding_step_completed", stepId);
    setDirection(1);
    setStepIndex((i) => nextIndex(i, 1));
  }

  function goBack() {
    cancelPendingAdvance();
    setError(null);
    setDirection(-1);
    setStepIndex((i) => nextIndex(i, -1));
  }

  // Élève de collège ou lycée (19/11, Nathan : « les questions sont trop
  // vagues ») : l'étape « niveau d'études et expérience » (Bac+2, 1-2 ans…)
  // ne le concerne pas, on la saute.
  function nextIndex(i: number, dir: 1 | -1): number {
    let j = Math.min(Math.max(i + dir, 0), STEP_IDS.length - 1);
    if (schoolMode && STEP_IDS[j] === "level") j = Math.min(Math.max(j + dir, 0), STEP_IDS.length - 1);
    return j;
  }

  // Avance sans repasser par validateCurrentStep() (qui lirait l'ancienne
  // valeur du state React -- setMobility()/etc. n'a pas encore été
  // appliqué au moment où ce callback est programmé) : utilisé uniquement
  // juste après avoir tapé une tuile à choix unique (mobilité, dispo,
  // niveau), où on sait déjà avec certitude que l'étape vient de devenir
  // valide grâce à la valeur tout juste posée. Délai court pour laisser le
  // temps de voir la tuile passer à l'état "actif" avant que l'écran ne
  // change -- sans ça la sélection est invisible, la transition mange tout.
  function advanceStep(completedStepId: StepId) {
    cancelPendingAdvance();
    pendingAdvanceRef.current = window.setTimeout(() => {
      pendingAdvanceRef.current = null;
      setError(null);
      void logOnboardingEvent(userId, "onboarding_step_completed", completedStepId);
      setDirection(1);
      setStepIndex((i) => nextIndex(i, 1));
    }, 320);
  }

  async function persistProfile(): Promise<
    { ok: true; foundCount: number | null; cvFailed: boolean } | { ok: false; error: string }
  > {
    const supabase = createClient();

    if (schoolMode) {
      const school = await saveSchoolStageOnboardingAction({ level: schoolLevel, birthDate });
      if (!school.ok) return { ok: false, error: school.error };
    }

    let cvPath = initialProfile?.cv_path ?? null;
    let cvUploadedAt = initialProfile?.cv_uploaded_at ?? null;

    // Le CV est facultatif : un envoi qui échoue (réseau mobile, fichier
    // refusé) ne bloque plus l'enregistrement du profil. Avant, l'écran
    // final restait sur « Un problème est survenu » et « Réessayer » refaisait
    // le même envoi : 24 % des personnes arrivées au récap n'avaient jamais
    // de profil enregistré (dashboard, 10/10). Le CV s'ajoute ensuite depuis
    // /profil.
    let cvFailed = false;
    if (cvFile) {
      const ext = cvFile.name.split(".").pop();
      const path = `${userId}/cv-${Date.now()}.${ext}`;
      const upload = await withDeadline(supabase.storage.from("cvs").upload(path, cvFile, { upsert: true }), 25_000);
      if (!upload || upload.error) {
        console.error("onboarding: CV upload failed", upload?.error ?? "timeout");
        cvFailed = true;
      } else {
        cvPath = path;
        cvUploadedAt = new Date().toISOString();
      }
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

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    void logOnboardingEvent(userId, "onboarding_step_completed", "outro");
    forgetSignupCity();

    if (initialProfile?.referred_by) {
      await markReferralGrantedAction(userId);
    }

    // Décompte affiché sur l'écran final : borné à 6 s. Au-delà (base lente),
    // on n'affiche pas de chiffre plutôt qu'un faux « 0 offre ».
    let count: number | null = 0;
    if (sectors.length > 0) {
      const counted = await withDeadline(
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true).eq("seo_only", false).in("sector", sectors),
        6_000,
      );
      count = counted && !counted.error ? (counted.count ?? null) : null;
    } else if (lookingFor.length > 0) {
      // Version B (pas d'écran secteurs) : offres des contrats choisis dans la ville.
      const place = city.trim().split(" (")[0]?.replace(/[%_,()*\\]/g, " ").trim() ?? "";
      let query = supabase.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true).eq("seo_only", false).in("contract_type", lookingFor);
      if (place.length >= 2 && mobility === "Sur place uniquement") query = query.ilike("location", `%${place}%`);
      const counted = await withDeadline(query, 6_000);
      count = counted && !counted.error ? (counted.count ?? null) : null;
    }

    return { ok: true, foundCount: count, cvFailed };
  }

  async function runOutroSequence() {
    setOutroPhase("loading");
    setError(null);
    setLoadMsgIndex(0);
    const messageInterval = setInterval(() => {
      setLoadMsgIndex((i) => (i + 1) % OUTRO_LOAD_MESSAGES.length);
    }, 800);

    // Durée mini pour laisser l'animation le temps de se voir (le vrai
    // enregistrement est souvent plus rapide que ça) -- même principe que le
    // prototype de design (~2.5s), pas une vraie latence réseau.
    // Au-delà de 45 s (base qui ne répond plus), écran d'erreur avec
    // « Réessayer » plutôt qu'un chargement sans fin.
    const [saved] = await Promise.all([
      withDeadline(persistProfile(), 45_000),
      new Promise((resolve) => setTimeout(resolve, 1800)),
    ]);
    clearInterval(messageInterval);
    const result = saved ?? { ok: false as const, error: "La connexion est très lente. Vérifie ton réseau et réessaie." };

    if (!result.ok) {
      setError(result.error);
      setOutroPhase("error");
      return;
    }
    setFoundCount(result.foundCount);
    setCvFailed(result.cvFailed);
    setOutroPhase("done");
  }

  // Revenir sur "outro" après avoir édité une étape via le récap doit
  // rejouer l'animation et resauvegarder -- outroPhase doit donc pouvoir
  // repasser à "loading" de façon synchrone à chaque arrivée sur l'étape,
  // pas seulement au premier montage.
  useEffect(() => {
    if (stepId === "outro") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void runOutroSequence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  const progressIndex = PROGRESS_STEPS.indexOf(stepId);
  const showChrome = !NO_CHROME_STEPS.includes(stepId);


  const schoolFields = (
                    <div className="card flex flex-col gap-3" style={{ padding: 14 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Tu es en quelle classe ?</p>
                      <div className="flex flex-wrap gap-2">
                        {SCHOOL_STAGE_IDS.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSchoolLevel(id)}
                            className="card"
                            style={{
                              padding: "8px 12px",
                              borderRadius: 999,
                              fontSize: 14,
                              cursor: "pointer",
                              border: `1.5px solid ${schoolLevel === id ? "var(--color-accent)" : "var(--color-divider)"}`,
                              background: schoolLevel === id ? "color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))" : "var(--color-surface)",
                              fontWeight: schoolLevel === id ? 700 : 500,
                            }}
                          >
                            {SCHOOL_CLASS_LABEL[id]}
                          </button>
                        ))}
                      </div>
                      <label style={{ fontSize: 14, fontWeight: 700 }}>
                        Ta date de naissance
                        <span style={{ display: "block", fontWeight: 400, fontSize: 12.5, marginTop: 2, opacity: 0.7 }}>
                          Juste pour savoir si tu as plus ou moins de 15 ans.
                        </span>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="input"
                          style={{ width: "100%", marginTop: 6, fontWeight: 400 }}
                        />
                      </label>
                    </div>
  );
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
            {stepIndex === 0 && fromOffer?.title && (
              <div
                className="card"
                style={{ margin: "0 0 14px", padding: "12px 14px", borderColor: "var(--color-accent-300)", background: "var(--color-accent-100)" }}
              >
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "var(--color-accent-800)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  📌 Ton offre t&apos;attend
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 15.5, fontWeight: 800, lineHeight: 1.3 }}>
                  {fromOffer.title.replace(/\s*\((?:H\/F|F\/H)\)\s*$/i, "")}
                  {fromOffer.company && !/non communiqu/i.test(fromOffer.company) ? ` · ${fromOffer.company}` : ""}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
                  Quelques questions pour préparer ta candidature, puis elle s&apos;affiche en premier.
                </p>
              </div>
            )}

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
                <div
                  aria-hidden
                  style={{
                    position: "relative",
                    height: 190,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="lp-spin"
                    style={{
                      position: "absolute",
                      width: 150,
                      height: 150,
                      borderRadius: "50%",
                      border: "1px dashed color-mix(in srgb, var(--color-accent) 40%, transparent)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 128,
                      borderRadius: 18,
                      background: "var(--color-surface)",
                      transform: "rotate(-11deg) translateX(-28px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 128,
                      borderRadius: 18,
                      background: "var(--color-surface)",
                      boxShadow: "var(--shadow-sm)",
                      transform: "rotate(8deg) translateX(28px)",
                    }}
                  />
                  <div
                    className="lp-float"
                    style={{
                      position: "relative",
                      width: 108,
                      height: 134,
                      borderRadius: 20,
                      background: "var(--color-surface)",
                      boxShadow: "var(--shadow-lg)",
                      overflow: "hidden",
                      ["--r" as string]: "-2deg",
                    }}
                  >
                    <div style={{ height: 42, background: "linear-gradient(125deg, var(--color-accent), var(--color-accent-2))" }} />
                    <div style={{ padding: 8 }}>
                      <div style={{ height: 6, width: "85%", borderRadius: 3, background: "var(--color-text)" }} />
                      <div style={{ height: 6, width: "55%", borderRadius: 3, background: "var(--color-text)", marginTop: 4 }} />
                      <div className="flex gap-1" style={{ marginTop: 8 }}>
                        <div style={{ flex: 1, height: 18, borderRadius: 5, background: "var(--color-bg)" }} />
                        <div style={{ flex: 1, height: 18, borderRadius: 5, background: "var(--color-bg)" }} />
                        <div style={{ flex: 1, height: 18, borderRadius: 5, background: "var(--color-bg)" }} />
                      </div>
                    </div>
                  </div>
                  <div
                    className="lp-float"
                    style={{
                      position: "absolute",
                      right: 4,
                      top: 18,
                      border: "2.5px solid var(--color-accent)",
                      color: "var(--color-accent)",
                      background: "var(--color-accent-100)",
                      borderRadius: 8,
                      padding: "1px 8px",
                      fontSize: 13,
                      fontWeight: 800,
                      ["--r" as string]: "9deg",
                    }}
                  >
                    LIKE
                  </div>
                  <div
                    className="lp-float"
                    style={{
                      position: "absolute",
                      left: 6,
                      bottom: 22,
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 18px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                      ["--r" as string]: "-7deg",
                      animationDelay: "0.6s",
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 16 }}>❤️</span>
                  </div>
                  <div
                    className="lp-float"
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "var(--color-neutral-900)",
                      color: "var(--color-bg)",
                      padding: "4px 9px",
                      borderRadius: 999,
                      fontSize: 10.5,
                      fontWeight: 700,
                      ["--r" as string]: "3deg",
                      animationDelay: "0.3s",
                    }}
                  >
                    ⚡ 2 minutes
                  </div>
                </div>
                <div style={{ position: "relative", marginTop: 8 }}>
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
                <StepHeader title="Tu cherches quoi ?" subtitle="Choisis ce qui te correspond (plusieurs choix possibles, sauf pour un stage de collège ou lycée)." />
                <div className="flex flex-col gap-3.5">
                  {ALL_CONTRACT_TYPES.map((type) => (
                    <TileOption
                      key={type}
                      size="lg"
                      label={ONBOARDING_TYPE_TEXT[type]?.label ?? CONTRACT_LABEL[type]}
                      icon={CONTRACT_ICON[type]}
                      sub={ONBOARDING_TYPE_TEXT[type]?.sub ?? CONTRACT_SUB[type]}
                      active={lookingFor.includes(type)}
                      onClick={() => toggleLookingFor(type)}
                    />
                  ))}
                  {/* Stages scolaires (18/11) : même onboarding, paquet de stages scolaires. */}
                  <TileOption
                    size="lg"
                    label="Stage de collège ou de lycée"
                    icon="🎒"
                    sub="Stage de 3e, de seconde, de 1re ou de bac pro (PFMP)"
                    active={schoolMode}
                    onClick={() => toggleLookingFor("stage_scolaire")}
                  />
                  {schoolMode && schoolFields}
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex"
                    aria-hidden
                  >
                    {["L", "T", "I"].map((letter, i) => (
                      <span
                        key={letter}
                        className="flex items-center justify-center"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          background: i === 0 ? "var(--color-accent)" : i === 1 ? "var(--color-accent-2)" : "var(--color-neutral-700)",
                          color: "var(--color-bg)",
                          border: "4px solid var(--color-bg)",
                          marginLeft: i === 0 ? 0 : -14,
                          fontSize: 17,
                          fontWeight: 800,
                        }}
                      >
                        {letter}
                      </span>
                    ))}
                    <span
                      className="flex items-center justify-center"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "var(--color-accent-200)",
                        color: "var(--color-accent-800)",
                        border: "4px solid var(--color-bg)",
                        marginLeft: -14,
                        fontSize: 18,
                        fontWeight: 800,
                      }}
                    >
                      +
                    </span>
                  </motion.div>
                  <p
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 40,
                      fontWeight: 800,
                      margin: "22px 0 0",
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

            {stepId === "proof_offers" && <ProofOffers data={proof} lookingFor={lookingFor} onNext={goNext} />}
            {stepId === "proof_week" && <ProofWeek data={proof} onNext={goNext} />}

            {/* Version B du test A/B (19/11) : parcours Wapply, au style Stageio. */}
            {stepId === "quick_job" && (
              <div className="flex flex-col gap-4">
                <StepHeader title="Tu cherches quoi comme job ?" subtitle="Indique le poste qui t'intéresse. Jusqu'à 3 métiers." />
                <p className="card" style={{ margin: 0, padding: "10px 14px", fontSize: 13.5, textAlign: "center" }}>
                  💡 Contrat et ville à l&apos;étape suivante.
                </p>
                <ChipMultiSelectWithCustom
                  options={TARGET_JOBS}
                  value={targetJobs}
                  onChange={(next) => setTargetJobs(next.slice(0, 3))}
                  searchable
                  searchPlaceholder="Ex. vendeur, serveur, assistant RH…"
                />
                <label className="btn" style={{ alignSelf: "center", cursor: "pointer", border: "1.5px solid var(--color-divider)", background: "var(--color-surface)", fontSize: 14 }}>
                  <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
                  {cvFile ? `✅ CV ajouté : ${cvFile.name.length > 24 ? `${cvFile.name.slice(0, 21)}…` : cvFile.name}` : "📄 Ajouter mon CV (facultatif)"}
                </label>
              </div>
            )}

            {stepId === "quick_criteria" && (
              <div className="flex flex-col gap-5">
                <StepHeader title="Tes critères de recherche" subtitle={targetJobs.length > 0 ? `Pour : ${targetJobs.join(", ")}` : undefined} />
                <div className="flex flex-col gap-2">
                  <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Type de contrat</p>
                  <div className="flex flex-wrap gap-2">
                    {[...ALL_CONTRACT_TYPES, "stage_scolaire" as ContractType].map((type) => {
                      const on = lookingFor.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleLookingFor(type)}
                          className={on ? "tag" : "tag tag-neutral"}
                          style={{ padding: "8px 14px", fontSize: 14, fontWeight: 700, ...(on ? { background: "var(--color-accent)", color: "var(--color-bg)" } : {}) }}
                        >
                          {on ? "✓ " : ""}
                          {type === "stage_scolaire" ? "Stage collège / lycée" : CONTRACT_LABEL[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {schoolMode ? (
                  schoolFields
                ) : (
                  <div className="flex flex-col gap-2">
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Niveau d&apos;expérience</p>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_LEVELS.map((opt) => {
                        const on = experienceLevel === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setExperienceLevel(opt.value)}
                            className={on ? "tag" : "tag tag-neutral"}
                            style={{ padding: "8px 14px", fontSize: 14, fontWeight: 700, ...(on ? { background: "var(--color-accent)", color: "var(--color-bg)" } : {}) }}
                          >
                            {opt.icon} {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Tu cherches où ?</p>
                  <LocationSearchSelect options={LOCATION_OPTIONS} value={city} onChange={setCity} placeholder="Ta ville ou ton département…" />
                  <p style={{ fontSize: 14, fontWeight: 800, margin: "6px 0 0" }}>Jusqu&apos;où ?</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_RADIUS.filter((r) => !(schoolMode && r.value === "Mobile en France")).map((r) => {
                      const on = mobility === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setMobility(r.value)}
                          className={on ? "tag" : "tag tag-neutral"}
                          style={{ padding: "8px 14px", fontSize: 14, fontWeight: 700, ...(on ? { background: "var(--color-accent)", color: "var(--color-bg)" } : {}) }}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {stepId === "proof_compare" && <ProofCompare onNext={goNext} />}
            {stepId === "proof_reviews" && <ProofReviews data={proof} onNext={goNext} />}
            {stepId === "proof_demo" && <ProofDemo data={proof} onNext={goNext} />}
            {stepId === "urgency" && <UrgencyScreen lookingFor={lookingFor} onNext={goNext} />}
            {stepId === "pledge" && (
              <div className="flex flex-1 flex-col px-1">
                <PledgeSign userId={userId} contractLabel={myContractLabel(lookingFor)} onSigned={goNext} />
              </div>
            )}
            {stepId === "pledge_done" && (
              <PledgeDone
                contractLabel={myContractLabel(lookingFor)}
                onNext={() => {
                  void logOnboardingEvent(userId, "onboarding_step_completed", "pledge_done");
                  if (demo) {
                    demo.onFinishOnboarding();
                    return;
                  }
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/swipe";
                }}
              />
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
                <StepHeader
                  title={schoolMode ? "Quels domaines aimerais-tu découvrir ?" : "Quels secteurs te font envie ?"}
                  subtitle={schoolMode ? "Choisis-en autant que tu veux : on te montre des stages dans ces domaines." : "Choisis-en autant que tu veux."}
                />
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
                <StepHeader
                  title={schoolMode ? "Qu'est-ce que tu sais bien faire ?" : "Tu es bon·ne en quoi ?"}
                  subtitle={schoolMode ? "Ex. parler aux gens, travailler en équipe, l'informatique, une langue… Ça sert pour ta lettre de stage." : "Outils, langues, soft skills : tout compte."}
                />
                <ChipMultiSelectWithCustom options={SKILLS} value={skills} onChange={setSkills} />
              </div>
            )}

            {stepId === "jobs" && (
              <div className="flex flex-col gap-4">
                <StepHeader
                  title={schoolMode ? "Quel métier aimerais-tu voir de près ?" : "Quel métier tu vises ?"}
                  subtitle={schoolMode ? "Même si tu n'es pas sûr(e) : c'est fait pour découvrir." : "Ça change vraiment le calcul de compatibilité."}
                />
                <ChipMultiSelectWithCustom options={TARGET_JOBS} value={targetJobs} onChange={setTargetJobs} />
              </div>
            )}

            {stepId === "mobility" && (
              <div className="flex flex-col gap-5">
                <StepHeader
                  title={schoolMode ? "Jusqu'où peux-tu aller pour ton stage ?" : "Tu peux bouger jusqu'où ?"}
                  subtitle={schoolMode ? "Pense au trajet de chaque jour depuis chez toi." : "Pour ne pas te pénaliser sur des offres un peu plus loin."}
                />
                <div className="grid grid-cols-2 gap-3">
                  {MOBILITY_OPTIONS.filter((opt) => !(schoolMode && opt.value === "Full remote")).map((opt) => (
                    <TileOption
                      key={opt.value}
                      label={opt.value}
                      icon={opt.icon}
                      sub={MOBILITY_SUBTEXT[opt.value]}
                      active={mobility === opt.value}
                      onClick={() => {
                        setMobility(opt.value);
                        advanceStep("mobility");
                      }}
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
                        onClick={() => {
                          setEducationLevel(level);
                          // L'autre champ de cette même étape (voir plus bas)
                          // -- s'il est déjà rempli, ce tap complète la paire
                          // et l'étape devient valide ; sinon on attend
                          // encore le niveau d'expérience.
                          if (experienceLevel) advanceStep("level");
                        }}
                        className={educationLevel === level ? "tag flex items-center gap-1.5" : "tag tag-neutral flex items-center gap-1.5"}
                        style={{
                          padding: "7px 14px",
                          fontSize: 13,
                          ...(educationLevel === level
                            ? { background: "var(--color-accent)", color: "var(--color-bg)" }
                            : {}),
                        }}
                      >
                        <span aria-hidden>{educationLevel === level ? "✓" : "🎓"}</span>
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
                        onClick={() => {
                          setExperienceLevel(opt.value);
                          if (educationLevel) advanceStep("level");
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stepId === "dispo" && (
              <div className="flex flex-col gap-5">
                <StepHeader
                  title={schoolMode ? "Ton stage commence quand ?" : "Tu peux commencer quand ?"}
                  subtitle={schoolMode ? "Regarde les dates données par ton collège ou ton lycée." : "On met en avant les offres qui démarrent au bon moment."}
                />
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <TileOption
                      key={opt.label}
                      label={opt.label}
                      icon={opt.icon}
                      active={availabilityLabel === opt.label}
                      onClick={() => {
                        setAvailabilityLabel(opt.label);
                        advanceStep("dispo");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {stepId === "source" && (
              <div className="flex flex-col gap-5">
                {heardOption?.formats ? (
                  <>
                    <StepHeader title={`Sur ${heardOption.value}, c'était quoi ?`} subtitle="Ça nous dit ce qui t'a vraiment donné envie de venir." />
                    <div className="grid grid-cols-2 gap-3">
                      {heardOption.formats.map((format) => (
                        <TileOption
                          key={format}
                          label={HEARD_FROM_FORMATS[format].label}
                          icon={HEARD_FROM_FORMATS[format].icon}
                          sub={HEARD_FROM_FORMATS[format].sub}
                          active={heardFormat === format}
                          onClick={() => {
                            setHeardFormat(format);
                            void logHeardFrom(userId, heardOption.value, format);
                            advanceStep("source");
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHeardFrom(null);
                        setHeardFormat(null);
                      }}
                      style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: "var(--color-accent-700)", cursor: "pointer" }}
                    >
                      ← Ce n&apos;était pas {heardOption.value}
                    </button>
                  </>
                ) : (
                  <>
                    <StepHeader title="Tu nous as connus comment ?" subtitle="Ça nous aide à savoir où parler de Stageio." />
                    <div className="grid grid-cols-2 gap-3">
                      {HEARD_FROM_OPTIONS.map((opt) => (
                        <TileOption
                          key={opt.value}
                          label={opt.value}
                          icon={opt.icon}
                          sub={opt.sub}
                          active={heardFrom === opt.value}
                          onClick={() => {
                            setHeardFrom(opt.value);
                            setHeardFormat(null);
                            // Réseau : la 2e question (format) note la réponse complète.
                            if (opt.formats) return;
                            void logHeardFrom(userId, opt.value);
                            advanceStep("source");
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {stepId === "cv" && (
              <div className="flex flex-col gap-5">
                <StepHeader
                  title="Ajoute ton CV"
                  subtitle="Facultatif — améliore tes recommandations. Modifiable plus tard."
                />
                <label
                  className="flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer"
                  style={{
                    border: `2.5px dashed ${cvFile ? "var(--color-accent)" : "var(--color-divider)"}`,
                    borderRadius: "var(--radius-lg)",
                    background: cvFile ? "var(--color-accent-100)" : "var(--color-surface)",
                    padding: "34px 20px",
                  }}
                >
                  {/* .doc (ancien format binaire Word) retiré : extractText.ts
                      ne sait extraire que PDF et DOCX -- voir CvUploadPanel.tsx
                      pour le même correctif côté /profil (bug trouvé à
                      l'audit du 2026-09-25, un .doc uploadé ici échouait
                      ensuite indéfiniment à chaque tentative d'analyse). */}
                  <input
                    type="file"
                    accept=".pdf,.docx"
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
                    PDF ou DOCX
                  </span>
                </label>
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-2" style={{ margin: 0, fontSize: 13, color: "color-mix(in srgb, var(--color-text) 82%, transparent)" }}>
                    <span aria-hidden style={{ color: "var(--color-accent)", fontSize: 16 }}>✓</span>
                    Matching affiné sur le contenu de ton CV
                  </p>
                  <p className="flex items-center gap-2" style={{ margin: 0, fontSize: 13, color: "color-mix(in srgb, var(--color-text) 82%, transparent)" }}>
                    <span aria-hidden style={{ color: "var(--color-accent)", fontSize: 16 }}>✓</span>
                    Audit noté sur 100 avec conseils
                  </p>
                  <p className="flex items-center gap-2" style={{ margin: 0, fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                    <span aria-hidden style={{ fontSize: 16 }}>🔒</span>
                    Jamais partagé sans ton accord
                  </p>
                </div>
              </div>
            )}

            {stepId === "outro" && (
              <div className="flex flex-1 flex-col px-2" style={{ position: "relative", overflow: "hidden" }}>
                {outroPhase === "loading" && (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div style={{ position: "relative", width: 104, height: 104 }} aria-hidden>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "6px solid var(--color-surface)",
                          borderTopColor: "var(--color-accent)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 16,
                          borderRadius: "50%",
                          background: "var(--color-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <span style={{ fontSize: 30 }}>🎯</span>
                      </div>
                    </div>
                    <p style={{ margin: "24px 0 0", fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>
                      On prépare ton deck…
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadMsgIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          margin: "8px 0 0",
                          fontSize: 14,
                          color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
                        }}
                      >
                        {OUTRO_LOAD_MESSAGES[loadMsgIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                )}

                {outroPhase === "error" && (
                  <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
                    <span aria-hidden style={{ fontSize: 38 }}>
                      ⚠️
                    </span>
                    <p style={{ marginTop: 14, fontSize: 15.5, fontWeight: 700 }}>Un problème est survenu</p>
                    {error && (
                      <p
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
                        }}
                      >
                        {error}
                      </p>
                    )}
                    <button type="button" onClick={() => void runOutroSequence()} className="btn btn-primary mt-6">
                      Réessayer
                    </button>
                  </div>
                )}

                {outroPhase === "done" && (
                  <>
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
                    aria-hidden
                    style={{
                      width: 68,
                      height: 68,
                      margin: "0 auto",
                      borderRadius: 22,
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                    }}
                  >
                    🎉
                  </motion.div>
                  <h1 style={{ fontSize: 26, margin: "14px 0 0" }}>Tout est prêt !</h1>
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      marginTop: 8,
                      color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
                    }}
                  >
                    {foundCount === null ? (
                      <>
                        Tes offres sont prêtes, triées selon <Highlight delay={0.35}>ton profil</Highlight>.
                      </>
                    ) : (
                      <>
                        <strong style={{ color: "var(--color-text)" }}>
                          {foundCount} offre{foundCount > 1 ? "s" : ""}
                        </strong>{" "}
                        {foundCount > 1 ? "matchent" : "matche"} déjà{" "}
                        <Highlight delay={0.35}>ton profil</Highlight>.
                      </>
                    )}
                  </p>
                  {cvFailed && (
                    <p style={{ fontSize: 13, marginTop: 8, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
                      Ton CV n&apos;a pas pu être envoyé : tu pourras l&apos;ajouter depuis ton profil.
                    </p>
                  )}
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
                        ? lookingFor.map((t) => CONTRACT_LABEL[t]).join(" + ")
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
                  ].filter((row) => !(variant === "b" && row.label === "Secteurs")).map((row) => (
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
                {(() => {
                  // Alternance choisie : chiffre DARES/Insee. Sinon : vrai nombre
                  // d'offres en ligne pour les contrats choisis (lu en base).
                  const alt = lookingFor.includes("alternance");
                  const by = proof.offersByContract ?? {};
                  const types = lookingFor.filter((t) => (by[t] ?? 0) > 0);
                  const n = types.reduce((sum, t) => sum + (by[t] ?? 0), 0);
                  if (!alt && n === 0) return null;
                  return (
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
                          {alt ? "📉" : "📈"}
                        </span>
                        <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--color-accent-2-800)", margin: 0 }}>
                          {alt ? (
                            <>
                              <strong>846 700 contrats d&apos;alternance signés en France en 2025</strong>, soit 5% de
                              moins qu&apos;en 2024 (source DARES/Insee) — le marché se resserre, se démarquer compte
                              plus que jamais.
                            </>
                          ) : (
                            <>
                              <strong>
                                {n.toLocaleString("fr-FR")} offres de {types.map((t) => (t === "cdi" || t === "cdd" ? CONTRACT_LABEL[t] : t === "stage_scolaire" ? "stage de collège ou lycée" : "stage")).join(" et ")} en ligne sur Stageio
                              </strong>
                              , mises à jour chaque jour — postuler tôt t&apos;aide à te démarquer.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex-1" style={{ minHeight: 20 }} />

                {/* Avant le premier swipe : le contrat à l'empreinte (28/10). */}
                <button type="button" onClick={goNext} className="btn btn-primary btn-block" style={{ position: "relative" }}>
                  Continuer
                </button>
                  </>
                )}
              </div>
            )}

            {showChrome && (
              <>
                <div className="mt-auto flex items-center gap-2.5 pt-8">
                  <span aria-hidden style={{ fontSize: 15 }}>
                    🎯
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                    Matching précis à{" "}
                    <motion.span
                      key={precision}
                      initial={{ scale: 1.35, color: "var(--color-accent)" }}
                      animate={{ scale: 1, color: "var(--color-text)" }}
                      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                      style={{ display: "inline-block" }}
                    >
                      {precision}%
                    </motion.span>
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
