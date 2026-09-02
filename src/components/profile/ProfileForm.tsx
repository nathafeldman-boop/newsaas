"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export function ProfileForm({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Profile;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [skills, setSkills] = useState<string[]>(initialProfile.skills);
  const [sectors, setSectors] = useState<string[]>(initialProfile.sectors);
  const [targetJobs, setTargetJobs] = useState<string[]>(
    initialProfile.target_jobs,
  );
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [mobility, setMobility] = useState(initialProfile.mobility ?? "");
  const [lookingFor, setLookingFor] = useState<ContractType[]>(
    initialProfile.looking_for,
  );
  const [educationLevel, setEducationLevel] = useState(
    initialProfile.education_level ?? "",
  );
  const [formation, setFormation] = useState(initialProfile.formation ?? "");
  const [experienceLevel, setExperienceLevel] = useState(
    initialProfile.experience_level ?? "",
  );
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile.birth_date ?? "");
  const [availabilityDate, setAvailabilityDate] = useState(
    initialProfile.availability_date ?? "",
  );
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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
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
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="field">
        <label htmlFor="fullName">Prénom et nom</label>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
      </div>

      <div className="field">
        <label>Compétences</label>
        <TagInput value={skills} onChange={setSkills} placeholder="Ajoute une compétence" />
      </div>

      <div>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, margin: "0 0 9px" }}>
          Secteurs qui t&apos;intéressent
        </p>
        <ChipMultiSelect options={SECTORS} value={sectors} onChange={setSectors} />
      </div>

      <div className="field">
        <label>Métiers recherchés</label>
        <TagInput value={targetJobs} onChange={setTargetJobs} placeholder="Ajoute un métier" />
      </div>

      <div className="field">
        <label htmlFor="city">Ville</label>
        <input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="input" />
      </div>

      <div className="field">
        <label htmlFor="mobility">Mobilité</label>
        <select id="mobility" value={mobility} onChange={(e) => setMobility(e.target.value)} className="input">
          <option value="">—</option>
          {MOBILITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, margin: "0 0 9px" }}>Tu cherches...</p>
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="field">
        <label htmlFor="formation">Formation / école</label>
        <input id="formation" value={formation} onChange={(e) => setFormation(e.target.value)} className="input" />
      </div>

      <div className="field">
        <label htmlFor="bio">Ton parcours</label>
        <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="input" />
      </div>

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

      {error && <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>{error}</p>}
      {success && <p className="text-sm" style={{ color: "var(--color-accent-2-700)" }}>Profil mis à jour ✓</p>}

      <div className="flex items-center justify-between" style={{ paddingTop: 6 }}>
        <Link href="/parrainage" style={{ fontSize: 13 }}>
          Voir mon lien de parrainage →
        </Link>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
