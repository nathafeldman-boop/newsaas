"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TagInput } from "@/components/ui/TagInput";
import { ChipMultiSelect } from "@/components/ui/ChipMultiSelect";
import { cn } from "@/lib/utils";
import type { ContractType, Profile } from "@/types/database";

const SECTORS = [
  "Informatique",
  "Marketing",
  "Vente",
  "Design",
  "Data",
  "Produit",
  "RH",
  "Finance",
  "BTP",
  "Autre",
];

const EDUCATION_LEVELS = ["Bac", "Bac+2", "Bac+3", "Bac+4", "Bac+5", "Bac+6 et plus"];

const EXPERIENCE_LEVELS = [
  "Aucune expérience",
  "Stage(s) réalisé(s)",
  "1-2 ans",
  "3-5 ans",
  "5 ans et plus",
];

const MOBILITY_OPTIONS = [
  "Sur place uniquement",
  "Mobile dans la région",
  "Mobile en France",
  "Full remote",
];

const TOTAL_STEPS = 5;

export function OnboardingWizard({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Profile | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);
  const [sectors, setSectors] = useState<string[]>(
    initialProfile?.sectors ?? [],
  );
  const [targetJobs, setTargetJobs] = useState<string[]>(
    initialProfile?.target_jobs ?? [],
  );

  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [mobility, setMobility] = useState(initialProfile?.mobility ?? "");
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    initialProfile?.looking_for ?? ["alternance", "stage"],
  );

  const [educationLevel, setEducationLevel] = useState(
    initialProfile?.education_level ?? "",
  );
  const [formation, setFormation] = useState(initialProfile?.formation ?? "");
  const [experienceLevel, setExperienceLevel] = useState(
    initialProfile?.experience_level ?? "",
  );

  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birth_date ?? "");
  const [availabilityDate, setAvailabilityDate] = useState(
    initialProfile?.availability_date ?? "",
  );

  const [cvFile, setCvFile] = useState<File | null>(null);

  function toggleLookingFor(type: ContractType) {
    setLookingFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function goNext() {
    setError(null);
    if (step === 2 && !city.trim()) {
      setError("Indique au moins ta ville.");
      return;
    }
    if (step === 2 && lookingFor.length === 0) {
      setError("Sélectionne alternance et/ou stage.");
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function finish(skipCv: boolean) {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    let cvPath = initialProfile?.cv_path ?? null;
    let cvUploadedAt = initialProfile?.cv_uploaded_at ?? null;

    if (!skipCv && cvFile) {
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
        formation: formation.trim() || null,
        experience_level: experienceLevel || null,
        bio: bio.trim() || null,
        birth_date: birthDate || null,
        availability_date: availabilityDate || null,
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

  return (
    <div>
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-accent-700)",
        }}
      >
        Étape {step} / {TOTAL_STEPS}
      </span>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "var(--color-neutral-200)",
          marginTop: 10,
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${(step / TOTAL_STEPS) * 100}%`,
            background: "var(--color-accent)",
            borderRadius: 999,
            transition: "width 0.2s ease",
          }}
        />
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 style={{ fontSize: 30, margin: 0 }}>En quoi es-tu bon·ne ?</h1>
            <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
              Ajoute tes compétences, une par une (Entrée pour valider).
            </p>
          </div>
          <TagInput
            value={skills}
            onChange={setSkills}
            placeholder="Ex : JavaScript, Photoshop, prospection..."
          />
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, margin: "0 0 10px" }}>
              Secteurs qui t&apos;intéressent
            </p>
            <ChipMultiSelect
              options={SECTORS}
              value={sectors}
              onChange={setSectors}
            />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, margin: "0 0 10px" }}>
              Métiers recherchés (optionnel)
            </p>
            <TagInput
              value={targetJobs}
              onChange={setTargetJobs}
              placeholder="Ex : Chargé de marketing, développeur..."
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 style={{ fontSize: 30, margin: 0 }}>Où est-ce que tu vis ?</h1>
            <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
              On te proposera des offres proches ou compatibles avec ta mobilité.
            </p>
          </div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ta ville"
            className="input"
          />
          <div className="field">
            <label htmlFor="mobility">Mobilité</label>
            <select
              id="mobility"
              value={mobility}
              onChange={(e) => setMobility(e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {MOBILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, margin: "0 0 10px" }}>Tu cherches...</p>
            <div className="seg" style={{ width: "100%" }}>
              {(["alternance", "stage"] as ContractType[]).map((type) => (
                <label
                  key={type}
                  className={cn("seg-opt", lookingFor.includes(type) && "is-active")}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={lookingFor.includes(type)}
                    onChange={() => toggleLookingFor(type)}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  />
                  {type === "alternance" ? "Alternance" : "Stage"}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 style={{ fontSize: 30, margin: 0 }}>Ton parcours scolaire</h1>
            <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
              Ça nous aide à ne te montrer que des offres accessibles.
            </p>
          </div>
          <div className="field">
            <label htmlFor="educationLevel">Niveau d&apos;études</label>
            <select
              id="educationLevel"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {EDUCATION_LEVELS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="formation">Formation / école</label>
            <input
              id="formation"
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              placeholder="Ex : BUT informatique, BTS MCO..."
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="experienceLevel">Expérience</label>
            <select
              id="experienceLevel"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {EXPERIENCE_LEVELS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 style={{ fontSize: 30, margin: 0 }}>Parle-nous de toi</h1>
            <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
              Ton parcours en quelques mots — ça aide les recruteurs.
            </p>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Ex : Étudiant en BUT informatique, passionné de dev web depuis..."
            className="input"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label htmlFor="birthDate">Date de naissance</label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="field">
              <label htmlFor="availabilityDate">Disponible à partir de</label>
              <input
                id="availabilityDate"
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            Ces deux champs sont facultatifs.
          </p>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 style={{ fontSize: 30, margin: 0 }}>Ajoute ton CV</h1>
            <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
              Améliore automatiquement tes recommandations. Tu peux aussi le
              faire plus tard depuis ton profil.
            </p>
          </div>
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

      {error && <p className="mt-4 text-sm" style={{ color: "var(--color-accent-700)" }}>{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={goBack} className="btn btn-ghost">
            Retour
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {step === TOTAL_STEPS && (
            <button
              type="button"
              disabled={saving}
              onClick={() => finish(true)}
              className="btn btn-ghost"
            >
              Passer pour l&apos;instant
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => (step === TOTAL_STEPS ? finish(false) : goNext())}
            className="btn btn-primary"
          >
            {saving
              ? "Enregistrement..."
              : step === TOTAL_STEPS
                ? "Terminer"
                : "Continuer"}
          </button>
        </div>
      </div>
    </div>
  );
}
