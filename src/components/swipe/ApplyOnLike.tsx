"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cacheCvTextAction } from "@/app/(app)/cv/actions";
import { useAutoApply, type ApplyTarget, type NeedsInfo } from "@/components/swipe/AutoApply";
import { normalizePhone, splitFullName } from "@/lib/laBonneAlternance/applicant";
import type { AutoSendManualReason } from "@/lib/applications/autoSend";

// Like en mode « Postuler directement » : la candidature part toute seule
// (voir api/applications/auto-send). Ce qu'il manque pour l'envoyer (CV ;
// téléphone et nom complet pour La bonne alternance, qui les exige) est
// demandé ici même, une fois par visite.

export type AutoApplySetup = { hasCv: boolean; hasPhone: boolean; hasFullName: boolean };

type Field = "cv" | "phone" | "name";

const FIELD_OF_REASON: Partial<Record<AutoSendManualReason, Field>> = { no_cv: "cv", no_phone: "phone", no_name: "name" };

// Infos ajoutées ou refusées depuis la fenêtre ci-dessous : valent pour le
// reste de la visite, même si le deck se remonte (changement de filtre).
const completedThisVisit = new Set<Field>();
let declinedThisVisit = false;

export function useApplyOnLike(setup: AutoApplySetup | undefined, userId: string) {
  const autoApply = useAutoApply();
  const [known, setKnown] = useState(() => {
    const set = new Set<Field>(completedThisVisit);
    if (setup?.hasCv) set.add("cv");
    if (setup?.hasPhone) set.add("phone");
    if (setup?.hasFullName) set.add("name");
    return set;
  });
  const [prompt, setPrompt] = useState<{ offer: ApplyTarget; fields: Field[] } | null>(null);

  // Réponse du serveur « il manque X » alors qu'on le croyait connu (numéro
  // refusé, CV supprimé) : on le redemande, sauf si l'étudiant a déjà dit
  // « plus tard » pendant cette visite.
  const needsInfo: NeedsInfo = useCallback((offer, reason) => {
    const field = FIELD_OF_REASON[reason];
    if (!field || declinedThisVisit) return false;
    setPrompt({ offer, fields: [field] });
    return true;
  }, []);

  const applyOnLike = useCallback(
    (offer: ApplyTarget) => {
      const required: Field[] = offer.source === "la_bonne_alternance" ? ["cv", "phone", "name"] : ["cv"];
      const missing = required.filter((field) => !known.has(field));
      if (missing.length > 0 && !declinedThisVisit) {
        setPrompt({ offer, fields: missing });
        return;
      }
      void autoApply.start(offer, needsInfo);
    },
    [known, autoApply, needsInfo],
  );

  const ui = (
    <>
      {autoApply.toasts}
      <InfoSheet
        prompt={prompt}
        userId={userId}
        onDone={(saved) => {
          const offer = prompt?.offer;
          setPrompt(null);
          if (saved.length > 0) {
            saved.forEach((field) => completedThisVisit.add(field));
            setKnown((prev) => new Set([...prev, ...saved]));
          } else {
            declinedThisVisit = true;
          }
          if (offer) void autoApply.start(offer, needsInfo);
        }}
      />
    </>
  );

  return { applyOnLike, ui };
}

function InfoSheet({
  prompt,
  userId,
  onDone,
}: {
  prompt: { offer: ApplyTarget; fields: Field[] } | null;
  userId: string;
  onDone: (saved: Field[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = prompt?.fields ?? [];
  const wants = (field: Field) => fields.includes(field);
  const normalizedPhone = normalizePhone(phone);
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const ready =
    (!wants("cv") || !!file) &&
    (!wants("phone") || !!normalizedPhone) &&
    (!wants("name") || !!splitFullName(fullName));

  async function save() {
    if (!ready) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const update: { cv_path?: string; cv_uploaded_at?: string; phone?: string; full_name?: string } = {};

    if (wants("cv") && file) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/cv-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("cvs").upload(path, file, { upsert: true });
      if (uploadError) {
        setSaving(false);
        setError("Le CV n'a pas pu être envoyé, réessaie.");
        return;
      }
      update.cv_path = path;
      update.cv_uploaded_at = new Date().toISOString();
    }
    if (wants("phone") && normalizedPhone) update.phone = normalizedPhone;
    if (wants("name")) update.full_name = fullName;

    const { error: updateError } = await supabase.from("profiles").update(update).eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError("Tes infos n'ont pas pu être enregistrées, réessaie.");
      return;
    }
    setFile(null);
    if (update.cv_path) void cacheCvTextAction();
    onDone(fields);
  }

  return (
    <AnimatePresence>
      {prompt && (
        <motion.div
          key="apply-info"
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: 60, background: "rgba(10, 20, 18, 0.45)", padding: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-info-title"
            className="card elev-lg w-full max-w-sm"
            style={{ padding: "22px 20px" }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <p id="apply-info-title" style={{ fontFamily: "var(--font-heading)", fontSize: 19, margin: 0 }}>
              {fields.length === 1 && wants("cv") ? "Ajoute ton CV" : "Dernière étape avant l'envoi"}
            </p>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 72%, transparent)" }}>
              {wants("phone") || wants("name")
                ? `Le recruteur de ${prompt.offer.company} doit pouvoir te recontacter. On le demande une seule fois, pour cette candidature et les suivantes.`
                : `Il part en pièce jointe de ta candidature à ${prompt.offer.company}, et des suivantes. PDF ou Word (.docx).`}
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {wants("name") && (
                <div className="flex gap-2">
                  <input
                    aria-label="Prénom"
                    placeholder="Prénom"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input"
                  />
                  <input
                    aria-label="Nom"
                    placeholder="Nom"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input"
                  />
                </div>
              )}
              {wants("phone") && (
                <div>
                  <input
                    aria-label="Téléphone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Téléphone (06 12 34 56 78)"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                  />
                  {phone.trim().length >= 6 && !normalizedPhone && (
                    <p style={{ fontSize: 12, margin: "6px 0 0", color: "var(--color-accent-700)" }}>
                      Numéro français (06…, 07…, 01…) ou européen avec l&apos;indicatif (+32…).
                    </p>
                  )}
                </div>
              )}
              {wants("cv") && (
                <label
                  className="flex cursor-pointer items-center justify-center text-center"
                  style={{ border: "2px dashed var(--color-divider)", borderRadius: "var(--radius-lg)", padding: "18px 14px", fontSize: 13 }}
                >
                  <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  {file ? file.name : "Choisir mon CV (PDF ou Word)"}
                </label>
              )}
            </div>

            {error && <p style={{ fontSize: 13, margin: "10px 0 0", color: "var(--color-accent-700)" }}>{error}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="btn btn-primary btn-block" disabled={!ready || saving} onClick={() => void save()}>
                {saving ? "Enregistrement…" : "Envoyer ma candidature"}
              </button>
              <button type="button" className="btn btn-secondary btn-block" disabled={saving} onClick={() => onDone([])}>
                Plus tard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
