"use client";

import { useState } from "react";
import Link from "next/link";
import { Seg } from "@/components/tools/Seg";
import { CvSheet } from "@/components/tools/CvSheet";
import { EMPTY_CV_INPUT, EMPTY_ENTRY, MAX_CV_ENTRIES, type CvContract, type CvEntry, type CvInput } from "@/lib/tools/cv";

type TextField = "firstName" | "lastName" | "headline" | "city" | "phone" | "email" | "link" | "summary" | "availability" | "skills" | "languages" | "interests";

const PLACEHOLDERS: Record<CvContract, Record<TextField, string>> = {
  alternance: {
    firstName: "Léa",
    lastName: "Martin",
    headline: "Alternance en BTS MCO – vendeuse conseil – rentrée septembre 2027",
    city: "Lyon",
    phone: "06 12 34 56 78",
    email: "lea.martin@mail.fr",
    link: "linkedin.com/in/leamartin",
    summary: "Passionnée de sport et à l'aise avec les clients, je cherche une alternance en vente pour préparer mon BTS MCO.",
    availability: "2 jours en formation, 3 jours en entreprise, dès septembre 2027",
    skills: "Encaissement, conseil client, mise en rayon, Excel",
    languages: "Anglais : B1, Espagnol : A2",
    interests: "Running (semi-marathon), bénévolat au club de foot",
  },
  stage: {
    firstName: "Inès",
    lastName: "Durand",
    headline: "Stage de 10 semaines en marketing digital – avril 2027",
    city: "Lille",
    phone: "06 22 33 44 55",
    email: "ines.durand@mail.fr",
    link: "linkedin.com/in/inesdurand",
    summary: "Étudiante en BUT TC, créative et à l'aise avec les réseaux sociaux, je cherche un stage pour gérer des campagnes réelles.",
    availability: "Du 6 avril au 12 juin 2027",
    skills: "Canva, Meta Business Suite, rédaction web, Google Analytics",
    languages: "Anglais : B2",
    interests: "Photo, gestion du compte Instagram de l'association sportive",
  },
};

const ENTRY_PLACEHOLDERS: Record<"education" | "experience", CvEntry> = {
  education: { dates: "2025-2027", title: "Baccalauréat STMG", place: "Lycée Ampère, Lyon", details: "Mention bien\nOption mercatique" },
  experience: {
    dates: "Été 2026",
    title: "Agent d'accueil (job d'été)",
    place: "Camping Les Pins",
    details: "Accueil et renseignement de 200 vacanciers par jour\nGestion des réservations et de la caisse",
  },
};

const CONTRACT_OPTIONS: { value: CvContract; label: string }[] = [
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
];

function Field({ id, label, value, placeholder, onChange, long }: { id: string; label: string; value: string; placeholder: string; onChange: (value: string) => void; long?: boolean }) {
  return (
    <div className="field mt-3">
      <label htmlFor={id}>{label}</label>
      {long ? (
        <textarea id={id} className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

// Le CV s'imprime seul dans une fenêtre dédiée (ses styles sont en ligne),
// sans le reste de la page : « Enregistrer au format PDF » donne une page A4
// propre. Fenêtre bloquée : impression de la page entière en secours.
function printCv(fileName: string) {
  const sheet = document.querySelector(".cv-print");
  const win = sheet ? window.open("", "_blank") : null;
  if (!sheet || !win) {
    window.print();
    return;
  }
  const title = fileName.replace(/[<>&"]/g, "");
  win.document.write(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>` +
      "<style>@page{size:A4;margin:12mm}body{margin:0}.cv-sheet{box-shadow:none!important;border-radius:0!important;padding:0!important}</style>" +
      `</head><body>${sheet.innerHTML}</body></html>`,
  );
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function CvBuilder({ defaultContract }: { defaultContract: CvContract }) {
  const [cv, setCv] = useState<CvInput>({ ...EMPTY_CV_INPUT, contract: defaultContract });
  const set = <K extends keyof CvInput>(key: K, value: CvInput[K]) => setCv((prev) => ({ ...prev, [key]: value }));
  const ph = PLACEHOLDERS[cv.contract];

  const setEntry = (list: "education" | "experience", index: number, key: keyof CvEntry, value: string) =>
    setCv((prev) => ({ ...prev, [list]: prev[list].map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)) }));
  const addEntry = (list: "education" | "experience") =>
    setCv((prev) => (prev[list].length >= MAX_CV_ENTRIES ? prev : { ...prev, [list]: [...prev[list], { ...EMPTY_ENTRY }] }));
  const removeEntry = (list: "education" | "experience", index: number) =>
    setCv((prev) => ({ ...prev, [list]: prev[list].length > 1 ? prev[list].filter((_, i) => i !== index) : [{ ...EMPTY_ENTRY }] }));

  const entriesBlock = (list: "education" | "experience", title: string) => (
    <fieldset style={{ border: 0, padding: 0, margin: "18px 0 0" }}>
      <legend style={{ fontWeight: 700, fontSize: 14 }}>{title}</legend>
      {cv[list].map((entry, i) => (
        <div key={i} className="card mt-2" style={{ padding: "var(--space-4)" }}>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`cv-${list}-${i}-dates`} label="Dates" value={entry.dates} placeholder={ENTRY_PLACEHOLDERS[list].dates} onChange={(v) => setEntry(list, i, "dates", v)} />
            <Field id={`cv-${list}-${i}-place`} label={list === "education" ? "Établissement" : "Entreprise ou structure"} value={entry.place} placeholder={ENTRY_PLACEHOLDERS[list].place} onChange={(v) => setEntry(list, i, "place", v)} />
          </div>
          <Field id={`cv-${list}-${i}-title`} label={list === "education" ? "Diplôme" : "Poste ou projet"} value={entry.title} placeholder={ENTRY_PLACEHOLDERS[list].title} onChange={(v) => setEntry(list, i, "title", v)} />
          <Field id={`cv-${list}-${i}-details`} label="Détails (une ligne par point)" value={entry.details} placeholder={ENTRY_PLACEHOLDERS[list].details} onChange={(v) => setEntry(list, i, "details", v)} long />
          <button type="button" className="tag tag-neutral mt-2" onClick={() => removeEntry(list, i)}>
            Retirer
          </button>
        </div>
      ))}
      {cv[list].length < MAX_CV_ENTRIES && (
        <button type="button" className="tag tag-accent mt-2" onClick={() => addEntry(list)}>
          + Ajouter
        </button>
      )}
    </fieldset>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card elev-sm cv-form" style={{ padding: "var(--space-6)" }}>
        <div className="field">
          <label>Tu cherches</label>
          <Seg name="Type de contrat" options={CONTRACT_OPTIONS} value={cv.contract} onChange={(value) => set("contract", value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="cv-firstName" label="Prénom" value={cv.firstName} placeholder={ph.firstName} onChange={(v) => set("firstName", v)} />
          <Field id="cv-lastName" label="Nom" value={cv.lastName} placeholder={ph.lastName} onChange={(v) => set("lastName", v)} />
        </div>
        <Field id="cv-headline" label="Titre du CV : le poste et le contrat visés" value={cv.headline} placeholder={ph.headline} onChange={(v) => set("headline", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field id="cv-city" label="Ville" value={cv.city} placeholder={ph.city} onChange={(v) => set("city", v)} />
          <Field id="cv-phone" label="Téléphone" value={cv.phone} placeholder={ph.phone} onChange={(v) => set("phone", v)} />
          <Field id="cv-email" label="Mail" value={cv.email} placeholder={ph.email} onChange={(v) => set("email", v)} />
          <Field id="cv-link" label="LinkedIn (facultatif)" value={cv.link} placeholder={ph.link} onChange={(v) => set("link", v)} />
        </div>
        <Field id="cv-availability" label={cv.contract === "alternance" ? "Rythme et date de rentrée" : "Dates du stage"} value={cv.availability} placeholder={ph.availability} onChange={(v) => set("availability", v)} />
        <Field id="cv-summary" label="Profil (2 lignes)" value={cv.summary} placeholder={ph.summary} onChange={(v) => set("summary", v)} long />
        {entriesBlock("education", "Formation")}
        {entriesBlock("experience", "Expériences (jobs, stages, projets, bénévolat)")}
        <Field id="cv-skills" label="Compétences (séparées par des virgules)" value={cv.skills} placeholder={ph.skills} onChange={(v) => set("skills", v)} />
        <Field id="cv-languages" label="Langues" value={cv.languages} placeholder={ph.languages} onChange={(v) => set("languages", v)} />
        <Field id="cv-interests" label="Centres d'intérêt (facultatif)" value={cv.interests} placeholder={ph.interests} onChange={(v) => set("interests", v)} />
        <p style={{ fontSize: 12, margin: "12px 0 0" }}>Rien n&apos;est envoyé ni enregistré : tout se passe dans ton navigateur.</p>
      </div>

      <div>
        <div className="cv-print">
          <CvSheet cv={cv} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 cv-actions">
          <button type="button" className="btn btn-primary" onClick={() => printCv(`CV ${cv.firstName} ${cv.lastName}`.trim())}>
            Télécharger en PDF
          </button>
        </div>
        <p style={{ fontSize: 13, margin: "10px 0 0" }} className="cv-actions">
          Dans la fenêtre d&apos;impression, choisis « Enregistrer au format PDF ». Garde une seule page.
        </p>
        <div className="card mt-4 cv-actions" style={{ padding: "var(--space-4)", fontSize: 14 }}>
          <strong>Ton CV est-il vraiment prêt ?</strong> Sur Stageio, l&apos;audit de CV le note sur 100 et te dit quoi
          corriger, puis tu postules aux offres d&apos;{cv.contract === "alternance" ? "alternance" : "stage"} de ta ville
          (Premium). <Link href="/inscription">Créer mon profil gratuitement</Link>
        </div>
      </div>
    </div>
  );
}
