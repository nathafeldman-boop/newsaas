"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TagInput } from "@/components/ui/TagInput";
import { ChipMultiSelect } from "@/components/ui/ChipMultiSelect";
import { cn } from "@/lib/utils";
import type { ContractType, GenderType, Profile } from "@/types/database";

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

const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "autre", label: "Autre" },
  { value: "non_precise", label: "Je préfère ne pas préciser" },
];

const TOTAL_STEPS = 4;

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
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    initialProfile?.looking_for ?? ["alternance", "stage"],
  );
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birth_date ?? "");
  const [gender, setGender] = useState<GenderType | "">(
    initialProfile?.gender ?? "",
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
        city: city.trim(),
        looking_for: lookingFor,
        bio: bio.trim() || null,
        birth_date: birthDate || null,
        gender: gender || null,
        cv_path: cvPath,
        cv_uploaded_at: cvUploadedAt,
        onboarding_completed: true,
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
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < step ? "bg-brand" : "bg-border",
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">En quoi es-tu bon·ne ?</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Ajoute tes compétences, une par une (Entrée pour valider).
            </p>
          </div>
          <TagInput
            value={skills}
            onChange={setSkills}
            placeholder="Ex : JavaScript, Photoshop, prospection..."
          />
          <div>
            <p className="mb-2 text-sm font-medium">
              Secteurs qui t&apos;intéressent
            </p>
            <ChipMultiSelect
              options={SECTORS}
              value={sectors}
              onChange={setSectors}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Où est-ce que tu vis ?</h1>
            <p className="mt-1 text-sm text-foreground/60">
              On te proposera des offres proches ou en remote.
            </p>
          </div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ta ville"
            className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div>
            <p className="mb-2 text-sm font-medium">Tu cherches...</p>
            <div className="flex gap-2">
              {(["alternance", "stage"] as ContractType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleLookingFor(type)}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors",
                    lookingFor.includes(type)
                      ? "border-brand bg-brand text-white"
                      : "border-border text-foreground/70",
                  )}
                >
                  {type === "alternance" ? "Une alternance" : "Un stage"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Parle-nous de toi</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Ton parcours en quelques mots — ça aide les recruteurs.
            </p>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Ex : Étudiant en BUT informatique, passionné de dev web depuis..."
            className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="birthDate">
                Date de naissance
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="gender">
                Genre
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderType)}
                className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">—</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-foreground/50">
            Ces deux champs sont facultatifs, ils nous servent uniquement à
            mieux comprendre qui utilise Alt.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Ton CV</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Facultatif : tu peux l&apos;ajouter plus tard depuis ton profil.
            </p>
          </div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center cursor-pointer hover:border-brand/50">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-sm font-medium">
              {cvFile ? cvFile.name : "Clique pour choisir ton CV"}
            </span>
            <span className="text-xs text-foreground/50">PDF, DOC ou DOCX</span>
          </label>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="text-sm font-medium text-foreground/60 hover:text-foreground"
          >
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
              className="text-sm font-medium text-foreground/60 hover:text-foreground disabled:opacity-60"
            >
              Passer cette étape
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              step === TOTAL_STEPS ? finish(false) : goNext()
            }
            className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark transition-colors disabled:opacity-60"
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
