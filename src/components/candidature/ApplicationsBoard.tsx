"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { updateApplicationDetailsAction } from "@/app/(app)/mes-candidatures/actions";
import { ApplicationStatusControl } from "@/components/candidature/ApplicationStatusControl";
import { followUpMessage } from "@/lib/applications/followUpMessage";
import { STATUS_GROUPS, STATUS_HINTS, statusGroup, type StatusGroupKey } from "@/lib/applications/status";
import type { ApplicationStatus, ContractType } from "@/types/database";

// Tableau de suivi des candidatures (24/10, mission churn) : ce qui reste à
// envoyer, ce qui attend une réponse, les relances dues et les entretiens à
// préparer. Tout vient des candidatures de l'étudiant (aucun chiffre
// inventé) ; la page serveur calcule les dates, ce composant filtre et
// enregistre notes et dates de relance.

export type TrackedApplication = {
  id: string;
  offerId: string;
  status: ApplicationStatus;
  appliedAt: string;
  sentAt: string | null;
  /** Date de relance choisie par l'étudiant (null : date par défaut). */
  followUpAt: string | null;
  /** Date de relance effective, calculée côté serveur (null : rien à relancer). */
  dueAt: number | null;
  note: string | null;
  offer: { title: string; company: string; location: string; contractType: ContractType; isActive: boolean; applyUrl: string | null } | null;
  history: { label: string; at: string }[];
};

const DAY_MS = 86_400_000;
const muted = "color-mix(in srgb, var(--color-text) 60%, transparent)";

const parisDate = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const shortDate = (t: string | number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

function companyInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function daysBetween(from: number, to: number): number {
  return Math.max(0, Math.floor((to - from) / DAY_MS));
}

type Todo = { key: string; appId: string; text: string; cta: string; href?: string; rank: number };

function buildTodos(items: TrackedApplication[], now: number): Todo[] {
  const todos: Todo[] = [];
  for (const a of items) {
    const company = a.offer?.company ?? "l'entreprise";
    if (a.dueAt !== null && a.dueAt <= now) {
      const since = daysBetween(Date.parse(a.sentAt ?? a.appliedAt), now);
      todos.push({ key: `f-${a.id}`, appId: a.id, text: `Relance ${company} : candidature envoyée il y a ${since} jour${since > 1 ? "s" : ""}, sans réponse.`, cta: "Relancer", rank: 0 });
    } else if (a.status === "entretien") {
      todos.push({ key: `i-${a.id}`, appId: a.id, text: `Entretien chez ${company} : entraîne-toi sur les questions du métier.`, cta: "Simulateur", href: "/dashboard#simulateur", rank: 1 });
    } else if (a.status === "a_preparer") {
      if (a.offer && !a.offer.isActive) {
        todos.push({ key: `g-${a.id}`, appId: a.id, text: `L'offre de ${company} n'est plus en ligne : classe-la en « Clôturée ».`, cta: "Mettre à jour", rank: 3 });
      } else {
        todos.push({ key: `s-${a.id}`, appId: a.id, text: `Ta lettre pour ${company} est prête : il reste à envoyer la candidature.`, cta: "Finaliser", href: `/candidature/${a.offerId}`, rank: 2 });
      }
    }
  }
  return todos.sort((x, y) => x.rank - y.rank);
}

export function ApplicationsBoard({
  items,
  now,
  trackingReady,
  fullName,
}: {
  items: TrackedApplication[];
  now: number;
  trackingReady: boolean;
  fullName: string | null;
}) {
  const [group, setGroup] = useState<StatusGroupKey | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAllTodos, setShowAllTodos] = useState(false);

  const counts = useMemo(() => {
    const c: Record<StatusGroupKey, number> = { todo: 0, waiting: 0, interview: 0, done: 0 };
    for (const a of items) c[statusGroup(a.status)]++;
    return c;
  }, [items]);
  const todos = useMemo(() => buildTodos(items, now), [items, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (group !== "all" && statusGroup(a.status) !== group) return false;
      if (!q) return true;
      const hay = `${a.offer?.title ?? ""} ${a.offer?.company ?? ""} ${a.offer?.location ?? ""} ${a.note ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, group, query]);

  const sections = STATUS_GROUPS.map((g) => ({
    ...g,
    rows: filtered
      .filter((a) => statusGroup(a.status) === g.key)
      .sort((x, y) => (g.key === "waiting" ? (x.dueAt ?? Infinity) - (y.dueAt ?? Infinity) : Date.parse(y.appliedAt) - Date.parse(x.appliedAt))),
  })).filter((s) => s.rows.length > 0);

  const openRow = (id: string) => {
    setOpenId(id);
    setGroup("all");
    setQuery("");
    requestAnimationFrame(() => document.getElementById(`app-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const visibleTodos = showAllTodos ? todos : todos.slice(0, 4);

  return (
    <div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_GROUPS.map((g) => {
          const active = group === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(active ? "all" : g.key)}
              aria-pressed={active}
              className="card elev-sm"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                border: `1.5px solid ${active ? "var(--color-accent)" : "transparent"}`,
                background: "var(--color-surface)",
              }}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1, color: g.key === "todo" && counts.todo > 0 ? "var(--color-accent)" : undefined }}>
                {counts[g.key]}
              </span>
              <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: muted }}>{g.label}</span>
            </button>
          );
        })}
      </div>

      {todos.length > 0 && (
        <div className="card elev-sm mt-4" style={{ padding: "var(--space-4) var(--space-6)", background: "var(--color-surface)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>À faire maintenant</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleTodos.map((t) => (
              <li key={t.key} className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, lineHeight: 1.4, flex: "1 1 220px" }}>{t.text}</span>
                {t.href ? (
                  <Link href={t.href} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }}>
                    {t.cta}
                  </Link>
                ) : (
                  <button type="button" onClick={() => openRow(t.appId)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }}>
                    {t.cta}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {todos.length > 4 && (
            <button type="button" onClick={() => setShowAllTodos((v) => !v)} className="btn btn-ghost" style={{ alignSelf: "flex-start", fontSize: 12.5 }}>
              {showAllTodos ? "Réduire" : `Voir les ${todos.length - 4} autres`}
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un poste, une entreprise, une ville…"
          className="input"
          aria-label="Rechercher dans mes candidatures"
        />
      </div>

      {sections.length === 0 ? (
        <p className="mt-8 text-center" style={{ color: muted }}>
          Aucune candidature ne correspond.
        </p>
      ) : (
        sections.map((s) => (
          <section key={s.key} className="mt-6">
            <h2 style={{ fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", color: muted, margin: "0 0 8px", fontWeight: 600 }}>
              {s.label} · {s.rows.length}
            </h2>
            <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              {s.rows.map((a, i) => (
                <ApplicationRow
                  key={a.id}
                  app={a}
                  now={now}
                  last={i === s.rows.length - 1}
                  open={openId === a.id}
                  onToggle={() => setOpenId(openId === a.id ? null : a.id)}
                  trackingReady={trackingReady}
                  fullName={fullName}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ApplicationRow({
  app,
  now,
  last,
  open,
  onToggle,
  trackingReady,
  fullName,
}: {
  app: TrackedApplication;
  now: number;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  trackingReady: boolean;
  fullName: string | null;
}) {
  const offer = app.offer;
  const due = app.dueAt !== null && app.dueAt <= now;
  const dates = [
    `Ajoutée le ${shortDate(app.appliedAt)}`,
    app.sentAt ? `envoyée le ${shortDate(app.sentAt)}` : null,
    app.dueAt !== null ? `relance ${due ? "à faire" : `le ${shortDate(app.dueAt)}`}` : null,
  ].filter(Boolean);

  return (
    <div id={`app-${app.id}`} style={{ borderBottom: last ? "none" : "1px solid var(--color-divider)" }}>
      <div className="flex flex-wrap items-center gap-3" style={{ padding: "14px 16px" }}>
        <div
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            flexShrink: 0,
            background: offer?.isActive === false ? "var(--color-neutral-200)" : "var(--color-accent-100)",
            color: offer?.isActive === false ? "var(--color-neutral-600)" : "var(--color-accent-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {companyInitials(offer?.company ?? "?")}
        </div>
        <button type="button" onClick={onToggle} aria-expanded={open} style={{ all: "unset", cursor: "pointer", minWidth: 0, flex: "1 1 200px" }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {offer?.title ?? "Offre supprimée"}
          </p>
          <p style={{ fontSize: 12, color: muted, margin: "2px 0 0" }}>
            {offer ? `${offer.company} · ${offer.location}` : "Annonce retirée de Stageio"}
            {offer?.isActive === false && (
              <span className="tag tag-neutral" style={{ marginLeft: 6, padding: "1px 8px", fontSize: 10.5 }}>
                Offre plus en ligne
              </span>
            )}
          </p>
          <p style={{ fontSize: 11.5, color: due ? "var(--color-accent-700)" : muted, margin: "2px 0 0", fontWeight: due ? 600 : 400 }}>{dates.join(" · ")}</p>
        </button>
        <span style={{ marginLeft: "auto" }}>
          <ApplicationStatusControl applicationId={app.id} status={app.status} />
        </span>
      </div>

      {open && <RowDetails app={app} now={now} trackingReady={trackingReady} fullName={fullName} />}
    </div>
  );
}

function RowDetails({ app, now, trackingReady, fullName }: { app: TrackedApplication; now: number; trackingReady: boolean; fullName: string | null }) {
  const [note, setNote] = useState(app.note ?? "");
  const [date, setDate] = useState(app.dueAt !== null ? parisDate.format(app.dueAt) : "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const offer = app.offer;
  const followUp = offer && app.dueAt !== null ? followUpMessage({ title: offer.title, company: offer.company, contractType: offer.contractType, sentAt: app.sentAt ?? app.appliedAt, fullName }) : null;

  const save = (details: { note?: string; followUpDate?: string | null }, okText: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateApplicationDetailsAction(app.id, details);
      setMessage(result.ok ? { ok: true, text: okText } : { ok: false, text: result.error });
    });
  };

  const copyFollowUp = async () => {
    if (!followUp) return;
    try {
      await navigator.clipboard.writeText(`Objet : ${followUp.subject}\n\n${followUp.body}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pl-4 sm:pl-[68px]" style={{ paddingRight: 16, paddingBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 12.5, color: muted, margin: 0 }}>{STATUS_HINTS[app.status]}.</p>

      {followUp && (
        <div className="card" style={{ padding: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
            {app.dueAt !== null && app.dueAt <= now ? "C'est le moment de relancer" : `Relance prévue le ${shortDate(app.dueAt!)}`}
          </p>
          <p style={{ fontSize: 12.5, color: muted, margin: 0 }}>
            Une relance polie une semaine après l&apos;envoi montre ta motivation.{" "}
            <Link href="/guides/relancer-candidature">Comment bien relancer</Link>
          </p>
          <details>
            <summary style={{ fontSize: 12.5, cursor: "pointer" }}>Voir le message de relance</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12.5, margin: "8px 0 0", lineHeight: 1.5 }}>
              {`Objet : ${followUp.subject}\n\n${followUp.body}`}
            </pre>
          </details>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyFollowUp()} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }}>
              {copied ? "Message copié ✓" : "Copier le message"}
            </button>
            {offer?.applyUrl && offer.isActive && (
              <a href={offer.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 12.5 }}>
                Page de l&apos;offre ↗
              </a>
            )}
          </div>
          {trackingReady && (
            <label className="flex flex-wrap items-center gap-2" style={{ fontSize: 12.5 }}>
              Me la rappeler le
              <input
                type="date"
                value={date}
                min={parisDate.format(now)}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                style={{ width: "auto", minHeight: 30, padding: "2px 10px", fontSize: 12.5 }}
              />
              <button
                type="button"
                disabled={pending || !date}
                onClick={() => save({ followUpDate: date }, `Relance reportée au ${shortDate(`${date}T12:00:00Z`)}.`)}
                className="btn btn-secondary"
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Enregistrer
              </button>
            </label>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={`note-${app.id}`} style={{ fontSize: 12.5, fontWeight: 600 }}>
          Mes notes
        </label>
        {trackingReady ? (
          <>
            <textarea
              id={`note-${app.id}`}
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contact, date d'entretien, ce qu'on t'a dit au téléphone…"
              className="input"
              style={{ fontSize: 13 }}
            />
            <button
              type="button"
              disabled={pending || note === (app.note ?? "")}
              onClick={() => save({ note }, "Note enregistrée.")}
              className="btn btn-secondary"
              style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 12.5 }}
            >
              Enregistrer la note
            </button>
          </>
        ) : (
          <p style={{ fontSize: 12.5, color: muted, margin: 0 }}>Les notes et les dates de relance arrivent très bientôt sur cette page.</p>
        )}
        {message && (
          <p role="status" style={{ fontSize: 12, margin: 0, color: message.ok ? "var(--color-accent-2-700)" : "var(--color-accent-700)" }}>
            {message.text}
          </p>
        )}
      </div>

      {app.history.length > 0 && (
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 600, margin: "0 0 6px" }}>Historique</p>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {app.history.map((h, i) => (
              <li key={`${h.at}-${i}`} style={{ fontSize: 12.5, color: muted }}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{shortDate(h.at)}</span> · {h.label}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/candidature/${app.offerId}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }}>
          {app.status === "a_preparer" ? "Finaliser ma candidature" : "Voir l'offre et ma lettre"}
        </Link>
      </div>
    </div>
  );
}
