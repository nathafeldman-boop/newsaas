"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TagInput } from "@/components/ui/TagInput";
import { ChipMultiSelect } from "@/components/ui/ChipMultiSelect";
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

export function ProfileForm({
  userId,
  initialProfile,
  cvSignedUrl,
}: {
  userId: string;
  initialProfile: Profile;
  cvSignedUrl: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [skills, setSkills] = useState<string[]>(initialProfile.skills);
  const [sectors, setSectors] = useState<string[]>(initialProfile.sectors);
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    initialProfile.looking_for,
  );
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile.birth_date ?? "");
  const [gender, setGender] = useState<GenderType | "">(
    initialProfile.gender ?? "",
  );
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleLookingFor(type: ContractType) {
    setLookingFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    let cvPath = initialProfile.cv_path;
    let cvUploadedAt = initialProfile.cv_uploaded_at;

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
        full_name: fullName.trim() || null,
        skills,
        sectors,
        city: city.trim(),
        looking_for: lookingFor,
        bio: bio.trim() || null,
        birth_date: birthDate || null,
        gender: gender || null,
        cv_path: cvPath,
        cv_uploaded_at: cvUploadedAt,
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setCvFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="fullName">
          Prénom et nom
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Compétences</label>
        <TagInput
          value={skills}
          onChange={setSkills}
          placeholder="Ajoute une compétence"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Secteurs qui t&apos;intéressent</p>
        <ChipMultiSelect options={SECTORS} value={sectors} onChange={setSectors} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="city">
          Ville
        </label>
        <input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Tu cherches...</p>
        <div className="flex gap-2">
          {(["alternance", "stage"] as ContractType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleLookingFor(type)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                lookingFor.includes(type)
                  ? "border-brand bg-brand text-white"
                  : "border-border text-foreground/70"
              }`}
            >
              {type === "alternance" ? "Alternance" : "Stage"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="bio">
          Ton parcours
        </label>
        <textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

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

      <div>
        <p className="mb-1 text-sm font-medium">CV</p>
        {cvSignedUrl && (
          <a
            href={cvSignedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand font-medium"
          >
            Voir mon CV actuel
          </a>
        )}
        <label className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center cursor-pointer hover:border-brand/50">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-sm font-medium">
            {cvFile ? cvFile.name : "Remplacer mon CV"}
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Profil mis à jour ✓</p>
      )}

      <div className="flex items-center justify-between">
        <Link href="/parrainage" className="text-sm text-brand font-medium">
          Voir mon lien de parrainage →
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
