"use client";

import { useState } from "react";
import Link from "next/link";
import { Seg } from "@/components/tools/Seg";
import { ShareButtons } from "@/components/share/ShareButtons";
import { SITE_URL } from "@/lib/site";
import {
  EMPTY_LETTER_INPUT,
  MAX_QUALITIES,
  QUALITIES,
  aidAvailable,
  buildCoverEmail,
  buildCoverLetter,
  emailToText,
  letterToText,
  type LetterContract,
  type LetterGender,
  type LetterInput,
  type QualityKey,
} from "@/lib/tools/coverLetter";

type TextField = Exclude<keyof LetterInput, "contract" | "gender" | "qualities" | "mentionAid">;

const FIELDS: Record<LetterContract, { key: TextField; label: string; placeholder: string; long?: boolean }[]> = {
  alternance: [
    { key: "company", label: "Entreprise", placeholder: "Atlas Sport" },
    { key: "position", label: "Poste visé", placeholder: "vendeur conseil" },
    { key: "currentStudies", label: "Ce que tu fais aujourd'hui", placeholder: "en terminale STMG" },
    { key: "targetTraining", label: "Formation que tu vas préparer", placeholder: "un BTS MCO" },
    { key: "school", label: "École ou CFA", placeholder: "CFA de la CCI de Lyon" },
    { key: "startDate", label: "Date de rentrée", placeholder: "septembre 2027" },
    { key: "rhythm", label: "Rythme (facultatif)", placeholder: "2 jours en formation, 3 jours en entreprise" },
    { key: "whyCompany", label: "Je veux les rejoindre parce que…", placeholder: "vos vendeurs m'ont super bien conseillé pour mes chaussures de running", long: true },
    { key: "experience", label: "Une expérience à mettre en avant", placeholder: "Pendant mon job d'été en caisse, j'ai appris à garder le sourire et à conseiller les clients même en plein rush.", long: true },
  ],
  stage: [
    { key: "company", label: "Entreprise", placeholder: "Agence Nova" },
    { key: "position", label: "Poste visé", placeholder: "assistant marketing digital" },
    { key: "currentStudies", label: "Tes études aujourd'hui", placeholder: "en 2e année de BUT TC" },
    { key: "school", label: "École ou université", placeholder: "IUT de Lille" },
    { key: "duration", label: "Durée du stage", placeholder: "10 semaines" },
    { key: "startDate", label: "Date de début", placeholder: "avril 2027" },
    { key: "whyCompany", label: "Je veux les rejoindre parce que…", placeholder: "vos campagnes sur les réseaux sociaux sont celles que je partage le plus", long: true },
    { key: "experience", label: "Une expérience à mettre en avant", placeholder: "J'ai géré le compte Instagram de l'association sportive de mon IUT et doublé ses abonnés en un an.", long: true },
  ],
};

const CONTACT_FIELDS: { key: TextField; label: string; placeholder: string; type?: string }[] = [
  { key: "firstName", label: "Prénom", placeholder: "Léa" },
  { key: "lastName", label: "Nom", placeholder: "Martin" },
  { key: "phone", label: "Téléphone", placeholder: "06 12 34 56 78", type: "tel" },
  { key: "email", label: "Mail", placeholder: "lea.martin@mail.fr", type: "email" },
];

const GENDER_OPTIONS: { value: LetterGender; label: string }[] = [
  { value: "f", label: "Elle" },
  { value: "m", label: "Il" },
  { value: "n", label: "Neutre" },
];

const CONTRACT_OPTIONS: { value: LetterContract; label: string }[] = [
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
];

const QUALITY_KEYS = Object.keys(QUALITIES) as QualityKey[];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copié ✓" : label}
    </button>
  );
}

export function CoverLetterGenerator({ defaultContract }: { defaultContract: LetterContract }) {
  const [input, setInput] = useState<LetterInput>({ ...EMPTY_LETTER_INPUT, contract: defaultContract });
  const [view, setView] = useState<"letter" | "email">("letter");
  const set = <K extends keyof LetterInput>(key: K, value: LetterInput[K]) => setInput((prev) => ({ ...prev, [key]: value }));

  const letter = buildCoverLetter(input);
  const email = buildCoverEmail(input);
  const toggleQuality = (key: QualityKey) =>
    set(
      "qualities",
      input.qualities.includes(key)
        ? input.qualities.filter((q) => q !== key)
        : input.qualities.length < MAX_QUALITIES
          ? [...input.qualities, key]
          : input.qualities,
    );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
        <div className="field">
          <label>Tu cherches</label>
          <Seg name="Type de contrat" options={CONTRACT_OPTIONS} value={input.contract} onChange={(value) => set("contract", value)} />
        </div>
        <div className="field mt-4">
          <label>Accords de la lettre</label>
          <Seg name="Accords" options={GENDER_OPTIONS} value={input.gender} onChange={(value) => set("gender", value)} />
        </div>
        {FIELDS[input.contract].map((field) => (
          <div key={field.key} className="field mt-4">
            <label htmlFor={`lm-${field.key}`}>{field.label}</label>
            {field.long ? (
              <textarea
                id={`lm-${field.key}`}
                className="input"
                placeholder={field.placeholder}
                value={input[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : (
              <input
                id={`lm-${field.key}`}
                className="input"
                placeholder={field.placeholder}
                value={input[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
        <div className="field mt-4">
          <label>Tes qualités (jusqu&apos;à {MAX_QUALITIES})</label>
          <div className="flex flex-wrap gap-2">
            {QUALITY_KEYS.map((key) => {
              const active = input.qualities.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  className={`tag ${active ? "tag-accent" : "tag-neutral"}`}
                  onClick={() => toggleQuality(key)}
                >
                  {QUALITIES[key].label}
                </button>
              );
            })}
          </div>
        </div>
        {input.contract === "alternance" && aidAvailable() && (
          <label className="mt-4 flex items-start gap-2" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={input.mentionAid} onChange={(e) => set("mentionAid", e.target.checked)} />
            <span>Rappeler à l&apos;employeur l&apos;aide de l&apos;État pour la 1re année (contrats conclus jusqu&apos;au 31/12/2026)</span>
          </label>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {CONTACT_FIELDS.map((field) => (
            <div key={field.key} className="field">
              <label htmlFor={`lm-${field.key}`}>{field.label}</label>
              <input
                id={`lm-${field.key}`}
                className="input"
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                value={input[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, margin: "12px 0 0" }}>Rien n&apos;est envoyé ni enregistré : tout se passe dans ton navigateur.</p>
      </div>

      <div>
        <Seg
          name="Format"
          options={[
            { value: "letter", label: "Lettre" },
            { value: "email", label: "Mail d'envoi" },
          ]}
          value={view}
          onChange={setView}
        />
        <div className="card elev-sm mt-3" style={{ padding: "var(--space-6)", fontSize: 14, lineHeight: 1.6 }}>
          {view === "letter" ? (
            <>
              <p style={{ margin: "0 0 12px" }}>
                <strong>Objet : {letter.subject}</strong>
              </p>
              <p style={{ margin: "0 0 12px" }}>{letter.greeting}</p>
              {letter.paragraphs.map((paragraph) => (
                <p key={paragraph} style={{ margin: "0 0 12px" }}>
                  {paragraph}
                </p>
              ))}
              <p style={{ margin: "0 0 12px" }}>{letter.closing}</p>
              <p style={{ margin: 0 }}>{letter.signature}</p>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 12px" }}>
                <strong>Objet : {email.subject}</strong>
              </p>
              {email.lines.map((line) => (
                <p key={line} style={{ margin: "0 0 12px" }}>
                  {line}
                </p>
              ))}
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={view === "letter" ? letterToText(letter) : emailToText(email)} label={view === "letter" ? "Copier la lettre" : "Copier le mail"} />
        </div>
        <p style={{ fontSize: 13, margin: "12px 0 0" }}>
          Relis-la et personnalise chaque phrase entre crochets : une lettre qui parle vraiment de l&apos;entreprise fait
          toute la différence.
        </p>
        <div className="card mt-4" style={{ padding: "var(--space-4)", fontSize: 14 }}>
          <strong>Une lettre adaptée à chaque offre, en un clic ?</strong> Sur Stageio, tu swipes les offres d&apos;
          {input.contract === "alternance" ? "alternance" : "stage"} de ta ville et l&apos;IA écrit ta lettre à partir de
          l&apos;annonce et de ton profil (Premium).{" "}
          <Link href="/inscription">Créer mon profil gratuitement</Link>
        </div>
        <ShareButtons
          title="Un pote cherche aussi ?"
          url={`${SITE_URL}/outils/lettre-de-motivation-${input.contract}`}
          text="Générateur gratuit de lettre de motivation pour une alternance ou un stage :"
        />
      </div>
    </div>
  );
}
