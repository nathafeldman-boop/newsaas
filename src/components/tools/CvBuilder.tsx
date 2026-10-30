"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Seg } from "@/components/tools/Seg";
import { CvSheet } from "@/components/tools/CvSheet";
import {
  EMPTY_CV_INPUT,
  EMPTY_ENTRY,
  MAX_CV_ENTRIES,
  cvPlaceholders,
  keywordCoverage,
  splitList,
  type CvContract,
  type CvEntry,
  type CvInput,
} from "@/lib/tools/cv";
import { CV_COLORS, CV_LAYOUTS, DEFAULT_CV_DESIGN, type CvDesign, type CvLayout } from "@/lib/tools/cvDesigns";
import { prefersReducedMotion } from "@/lib/fx/events";

type TextField =
  | "firstName"
  | "lastName"
  | "headline"
  | "city"
  | "phone"
  | "email"
  | "link"
  | "summary"
  | "availability"
  | "skills"
  | "qualities"
  | "languages"
  | "interests";

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
    qualities: "Sens du contact, dynamisme, esprit d'équipe",
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
    qualities: "Créativité, organisation, curiosité",
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

const PREP_STEPS = ["Titre du CV", "Profil", "Compétences du métier"];

// Brouillon gardé sur l'appareil (jamais envoyé) : on retrouve son CV en
// revenant. Navigation privée ou stockage bloqué : rien de grave, le CV
// reste juste en mémoire le temps de la page.
type Draft = { cv: CvInput; design: CvDesign; metier: string; metierSkills: string[] };

function readDraft(key: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<Draft>;
    if (!draft.cv || typeof draft.cv !== "object") return null;
    return {
      cv: { ...EMPTY_CV_INPUT, ...draft.cv },
      design: draft.design && CV_LAYOUTS.some((l) => l.id === draft.design?.layout) ? draft.design : DEFAULT_CV_DESIGN,
      metier: typeof draft.metier === "string" ? draft.metier : "",
      metierSkills: Array.isArray(draft.metierSkills) ? draft.metierSkills : [],
    };
  } catch {
    return null;
  }
}

function Field({
  id,
  label,
  value,
  placeholder,
  onChange,
  long,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  long?: boolean;
}) {
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

// Aperçu miniature d'une mise en page, pour le choix du modèle.
function LayoutThumb({ layout, color }: { layout: CvLayout; color: string }) {
  const line = (w: string, c = "#d5d8dc", h = 3) => <div style={{ width: w, height: h, background: c, borderRadius: 2, marginTop: 3 }} />;
  const title = (w: string) =>
    layout === "impact" ? (
      <div style={{ width: w, height: 5, background: color, borderRadius: 1, marginTop: 6 }} />
    ) : layout === "moderne" ? (
      <div style={{ width: w, height: 4, background: color, borderRadius: 1, marginTop: 6, borderLeft: `2px solid ${color}` }} />
    ) : layout === "epure" ? (
      <div style={{ width: "100%", height: 1, background: "#c8ccd0", marginTop: 7 }} />
    ) : (
      <div style={{ width: w, height: 3, background: color, borderRadius: 1, marginTop: 6 }} />
    );
  return (
    <div
      aria-hidden
      style={{
        width: 58,
        height: 76,
        background: "#fff",
        borderRadius: 4,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        padding: layout === "bandeau" ? "6px 6px 6px 10px" : 6,
        borderLeft: layout === "bandeau" ? `5px solid ${color}` : undefined,
        overflow: "hidden",
        textAlign: layout === "epure" ? "center" : "left",
      }}
    >
      {layout === "moderne" ? (
        <div style={{ background: color, borderRadius: 2, padding: 3 }}>
          {line("70%", "#ffffff", 4)}
          {line("50%", "rgba(255,255,255,0.7)")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: layout === "epure" ? "center" : "flex-start" }}>
          {line("70%", layout === "impact" ? color : "#3c4043", 5)}
          {line("50%", layout === "epure" || layout === "classique" || layout === "elegant" ? color : "#9aa0a6")}
        </div>
      )}
      {layout === "elegant" && <div style={{ height: 1.5, background: color, marginTop: 4 }} />}
      {title("45%")}
      {line("100%")}
      {line("85%")}
      {title("40%")}
      {line("95%")}
      {line("70%")}
    </div>
  );
}

// Le CV s'imprime seul dans une fenêtre dédiée (ses styles sont en ligne),
// sans le reste de la page : « Enregistrer au format PDF » donne une page A4
// propre, en vrai texte (lisible par les logiciels de tri). Fenêtre
// bloquée : impression de la page entière en secours.
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
      "<style>@page{size:A4;margin:12mm}body{margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}.cv-sheet{box-shadow:none!important;border-radius:0!important;padding:0!important}</style>" +
      `</head><body>${sheet.innerHTML}</body></html>`,
  );
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function CvBuilder({
  defaultContract,
  metierOptions = [],
  initial,
  defaultMetier,
  formation,
  storageKey = "stageio-cv-draft",
  inApp = false,
}: {
  defaultContract: CvContract;
  /** Métiers proposés (calculés côté serveur, la liste seule). */
  metierOptions?: { slug: string; label: string }[];
  /** Coordonnées connues (dans l'app : nom, mail, ville, téléphone). */
  initial?: Partial<CvInput>;
  /** Métier déduit des offres likées ou du métier visé : le CV se prépare tout seul. */
  defaultMetier?: string | null;
  formation?: string | null;
  storageKey?: string;
  inApp?: boolean;
}) {
  const [cv, setCv] = useState<CvInput>({ ...EMPTY_CV_INPUT, ...initial, contract: initial?.contract ?? defaultContract });
  const [design, setDesign] = useState<CvDesign>(DEFAULT_CV_DESIGN);
  const [metier, setMetier] = useState(defaultMetier ?? "");
  const [metierSkills, setMetierSkills] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [prepStep, setPrepStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Dernier contenu pré-rempli : on le remplace au changement de métier,
  // jamais ce que l'étudiant a écrit lui-même.
  const lastPrefill = useRef<{ headline: string; summary: string; skills: string; qualities: string } | null>(null);

  const set = <K extends keyof CvInput>(key: K, value: CvInput[K]) => setCv((prev) => ({ ...prev, [key]: value }));
  const ph = PLACEHOLDERS[cv.contract];

  async function prepare(slug: string, contract: CvContract) {
    if (!slug) return;
    setPreparing(true);
    setPrepStep(0);
    const reduced = prefersReducedMotion();
    const stepMs = reduced ? 0 : 420;
    const timers = PREP_STEPS.map((_, i) => setTimeout(() => setPrepStep(i + 1), stepMs * (i + 1)));
    const [{ cvMetierPrefill }] = await Promise.all([
      import("@/lib/tools/cvTemplates"),
      new Promise((resolve) => setTimeout(resolve, stepMs * (PREP_STEPS.length + 1))),
    ]);
    timers.forEach(clearTimeout);
    const prefill = cvMetierPrefill(slug, contract, formation);
    setPreparing(false);
    if (!prefill) return;
    const last = lastPrefill.current;
    setCv((prev) => {
      const replaceable = (current: string, previous: string | undefined) => !current.trim() || current === previous;
      const skills = replaceable(prev.skills, last?.skills)
        ? prefill.skills.join(", ")
        : [...splitList(prev.skills), ...prefill.skills.filter((s) => !splitList(prev.skills).some((p) => p.toLowerCase() === s.toLowerCase()))].join(", ");
      const next = {
        ...prev,
        headline: replaceable(prev.headline, last?.headline) ? prefill.headline : prev.headline,
        summary: replaceable(prev.summary, last?.summary) ? prefill.summary : prev.summary,
        skills,
        qualities: replaceable(prev.qualities, last?.qualities) ? prefill.qualities.join(", ") : prev.qualities,
      };
      lastPrefill.current = { headline: next.headline, summary: next.summary, skills: next.skills, qualities: next.qualities };
      return next;
    });
    setMetierSkills(prefill.skills);
  }

  // Brouillon retrouvé, sinon (dans l'app) CV préparé tout seul pour le
  // métier des offres likées.
  useEffect(() => {
    const draft = readDraft(storageKey);
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCv(draft.cv);
      setDesign(draft.design);
      setMetier(draft.metier);
      setMetierSkills(draft.metierSkills);
    } else if (defaultMetier) {
      void prepare(defaultMetier, initial?.contract ?? defaultContract);
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ cv, design, metier, metierSkills } satisfies Draft));
    } catch {
      // stockage indisponible : le CV reste en mémoire
    }
  }, [loaded, storageKey, cv, design, metier, metierSkills]);

  const setEntry = (list: "education" | "experience", index: number, key: keyof CvEntry, value: string) =>
    setCv((prev) => ({ ...prev, [list]: prev[list].map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)) }));
  const addEntry = (list: "education" | "experience") =>
    setCv((prev) => (prev[list].length >= MAX_CV_ENTRIES ? prev : { ...prev, [list]: [...prev[list], { ...EMPTY_ENTRY }] }));
  const removeEntry = (list: "education" | "experience", index: number) =>
    setCv((prev) => ({ ...prev, [list]: prev[list].length > 1 ? prev[list].filter((_, i) => i !== index) : [{ ...EMPTY_ENTRY }] }));

  const cvText = [cv.headline, cv.summary, cv.skills, cv.qualities, ...cv.education.flatMap(Object.values), ...cv.experience.flatMap(Object.values)].join(" \n ");
  const coverage = keywordCoverage(metierSkills, cvText);
  const covered = coverage.filter((k) => k.present).length;
  const todo = cvPlaceholders(cv);

  const entriesBlock = (list: "education" | "experience", title: string) => (
    <fieldset style={{ border: 0, padding: 0, margin: "18px 0 0" }}>
      <legend style={{ fontWeight: 700, fontSize: 14 }}>{title}</legend>
      {cv[list].map((entry, i) => (
        <div key={i} className="card mt-2" style={{ padding: "var(--space-4)" }}>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`cv-${list}-${i}-dates`} label="Dates" value={entry.dates} placeholder={ENTRY_PLACEHOLDERS[list].dates} onChange={(v) => setEntry(list, i, "dates", v)} />
            <Field
              id={`cv-${list}-${i}-place`}
              label={list === "education" ? "Établissement" : "Entreprise ou structure"}
              value={entry.place}
              placeholder={ENTRY_PLACEHOLDERS[list].place}
              onChange={(v) => setEntry(list, i, "place", v)}
            />
          </div>
          <Field
            id={`cv-${list}-${i}-title`}
            label={list === "education" ? "Diplôme" : "Poste ou projet"}
            value={entry.title}
            placeholder={ENTRY_PLACEHOLDERS[list].title}
            onChange={(v) => setEntry(list, i, "title", v)}
          />
          <Field
            id={`cv-${list}-${i}-details`}
            label="Détails (une ligne par point)"
            value={entry.details}
            placeholder={ENTRY_PLACEHOLDERS[list].details}
            onChange={(v) => setEntry(list, i, "details", v)}
            long
          />
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
          <Seg
            name="Type de contrat"
            options={CONTRACT_OPTIONS}
            value={cv.contract}
            onChange={(value) => {
              set("contract", value);
              // Titre et profil pré-remplis : réécrits pour le bon contrat.
              if (metier && lastPrefill.current) void prepare(metier, value);
            }}
          />
        </div>

        {metierOptions.length > 0 && (
          <div className="mt-4" style={{ padding: "12px 14px", borderRadius: 14, background: "var(--color-accent-100)", border: "1.5px solid var(--color-accent)" }}>
            <label htmlFor="cv-metier" style={{ fontWeight: 800, fontSize: 14 }}>
              ✨ Ton CV prêt pour ton métier
            </label>
            <p style={{ fontSize: 12.5, margin: "2px 0 8px" }}>Titre, profil et compétences que les recruteurs cherchent : tu n&apos;as plus qu&apos;à compléter.</p>
            <div className="flex flex-wrap gap-2">
              <select id="cv-metier" className="input" style={{ flex: "1 1 180px" }} value={metier} onChange={(e) => setMetier(e.target.value)}>
                <option value="">Choisis ton métier</option>
                {metierOptions.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-primary" disabled={!metier || preparing} onClick={() => void prepare(metier, cv.contract)}>
                {preparing ? "Préparation…" : "Préparer mon CV"}
              </button>
            </div>
          </div>
        )}

        <div className="field mt-4">
          <label>Modèle</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mise en page">
            {CV_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={design.layout === l.id}
                onClick={() => setDesign((d) => ({ ...d, layout: l.id }))}
                style={{
                  display: "grid",
                  justifyItems: "center",
                  gap: 4,
                  padding: 6,
                  borderRadius: 10,
                  background: "none",
                  cursor: "pointer",
                  border: design.layout === l.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                  fontSize: 11.5,
                  fontWeight: design.layout === l.id ? 800 : 500,
                }}
              >
                <LayoutThumb layout={l.id} color={design.color} />
                {l.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
            {CV_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={design.color === c.hex}
                aria-label={c.label}
                title={c.label}
                onClick={() => setDesign((d) => ({ ...d, color: c.hex }))}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: c.hex,
                  cursor: "pointer",
                  border: "2px solid #fff",
                  boxShadow: design.color === c.hex ? `0 0 0 2px ${c.hex}` : "0 0 0 1px rgba(0,0,0,0.15)",
                }}
              />
            ))}
          </div>
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
        <Field
          id="cv-availability"
          label={cv.contract === "alternance" ? "Rythme et date de rentrée" : "Dates du stage"}
          value={cv.availability}
          placeholder={ph.availability}
          onChange={(v) => set("availability", v)}
        />
        <Field id="cv-summary" label="Profil (2 lignes)" value={cv.summary} placeholder={ph.summary} onChange={(v) => set("summary", v)} long />
        {entriesBlock("education", "Formation")}
        {entriesBlock("experience", "Expériences (jobs, stages, projets, bénévolat)")}
        <Field id="cv-skills" label="Compétences (séparées par des virgules)" value={cv.skills} placeholder={ph.skills} onChange={(v) => set("skills", v)} long />
        <Field id="cv-qualities" label="Qualités (facultatif)" value={cv.qualities} placeholder={ph.qualities} onChange={(v) => set("qualities", v)} />
        <Field id="cv-languages" label="Langues" value={cv.languages} placeholder={ph.languages} onChange={(v) => set("languages", v)} />
        <Field id="cv-interests" label="Centres d'intérêt (facultatif)" value={cv.interests} placeholder={ph.interests} onChange={(v) => set("interests", v)} />
        <p style={{ fontSize: 12, margin: "12px 0 0" }}>Rien n&apos;est envoyé : ton CV reste dans ton navigateur, sur cet appareil.</p>
      </div>

      <div>
        {todo.length > 0 && (
          <div role="status" className="card mb-3" style={{ padding: "10px 12px", border: "1.5px solid var(--color-accent)", background: "var(--color-accent-100)" }}>
            <p style={{ fontSize: 12.5, margin: 0, fontWeight: 800 }}>✍️ À compléter dans ton CV ({todo.length}) :</p>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5, listStyle: "disc", display: "grid", gap: 3 }}>
              {todo.map((p) => (
                <li key={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</li>
              ))}
            </ul>
            <p style={{ fontSize: 11.5, margin: "6px 0 0" }}>Remplace chaque passage entre crochets [ … ] dans les champs à gauche.</p>
          </div>
        )}
        <div className="cv-print" style={{ position: "relative" }}>
          <CvSheet cv={cv} design={design} />
          {preparing && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "color-mix(in srgb, #ffffff 82%, transparent)",
                backdropFilter: "blur(2px)",
                borderRadius: 6,
              }}
            >
              <div className="card elev-sm" style={{ padding: "16px 20px", minWidth: 220 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>Ton CV se prépare…</p>
                <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 4, fontSize: 13 }}>
                  {PREP_STEPS.map((step, i) => (
                    <li key={step} style={{ opacity: prepStep > i ? 1 : 0.45, transition: "opacity .25s" }}>
                      {prepStep > i ? "✓" : "…"} {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 cv-actions">
          <button type="button" className="btn btn-primary" onClick={() => printCv(`CV ${cv.firstName} ${cv.lastName}`.trim())}>
            Télécharger en PDF
          </button>
        </div>
        <p style={{ fontSize: 13, margin: "10px 0 0" }} className="cv-actions">
          Dans la fenêtre d&apos;impression, choisis « Enregistrer au format PDF ». Garde une seule page.
        </p>

        {coverage.length > 0 && (
          <div className="card mt-4 cv-actions" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>
              Mots-clés du métier dans ton CV : {covered}/{coverage.length}
            </p>
            <p style={{ margin: "2px 0 8px", fontSize: 12.5 }}>
              Les recruteurs et leurs logiciels de tri cherchent ces mots. Garde ceux qui sont vrais pour toi.
            </p>
            <div className="flex flex-wrap gap-2">
              {coverage.map(({ keyword, present }) =>
                present ? (
                  <span key={keyword} className="tag tag-accent">
                    ✓ {keyword}
                  </span>
                ) : (
                  <button
                    key={keyword}
                    type="button"
                    className="tag tag-neutral"
                    onClick={() => set("skills", [...splitList(cv.skills), keyword].join(", "))}
                  >
                    + {keyword}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        <div className="card mt-4 cv-actions" style={{ padding: "var(--space-4)", fontSize: 13.5 }}>
          <p style={{ margin: 0 }}>
            <strong>Lisible par les logiciels de tri</strong> : une seule colonne, des titres de rubrique standard et du vrai texte
            (pas d&apos;image), dans tous les modèles.
          </p>
        </div>

        {inApp ? (
          <div className="card mt-4 cv-actions" style={{ padding: "var(--space-4)", fontSize: 14 }}>
            <p style={{ margin: 0 }}>
              <strong>CV téléchargé ?</strong> Dépose-le dans ton profil : il part avec tes candidatures.{" "}
              <Link href="/cv">Déposer mon CV</Link>
            </p>
          </div>
        ) : (
          <div className="card mt-4 cv-actions" style={{ padding: "var(--space-4)", fontSize: 14 }}>
            <p style={{ margin: 0 }}>
              <strong>Ton CV est-il vraiment prêt ?</strong> Sur Stageio, l&apos;audit de CV le note sur 100 et te dit quoi
              corriger, puis tu postules aux offres d&apos;{cv.contract === "alternance" ? "alternance" : "stage"} de ta ville
              (Premium). <Link href="/inscription">Créer mon profil gratuitement</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
