import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { nowMs } from "@/lib/admin/cockpit/load";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkOfferLink, type LinkVerdict } from "@/lib/offers/linkCheck";
import { shortAge } from "@/lib/offers/freshness";
import {
  KIND_LABELS,
  LINKEDIN_CITIES,
  POST_SIZE,
  SECTOR_GROUPS,
  buildPost,
  cityFrom,
  cityOf,
  cleanCompany,
  cleanTitle,
  sectorGroupFrom,
  type PostKind,
} from "@/lib/linkedin/format";
import { fetchOffersByIds, loadCandidates, loadHistory, loadPost, loadTarget, loadUsedOfferIds, LINKEDIN_POSTS_SQL, type History } from "@/lib/linkedin/data";
import { pickDiverse, rankCandidates } from "@/lib/linkedin/pick";
import { idsFrom, kindFrom } from "@/lib/linkedin/params";
import { SKIP_LABELS, type LinkedinOffer } from "@/lib/linkedin/rules";
import { deletePostAction, markPublishedAction, savePostAction } from "./actions";
import { PostEditor } from "./PostEditor";

// Publications LinkedIn (1/11, Nathan : « transformer LinkedIn en un canal
// d'acquisition régulier »). Prépare le texte et le visuel à partir des vraies
// offres de la base ; Nathan relit, copie, publie à la main. Voir docs/linkedin.md.
// La lecture des offres et la vérification des liens (6 s au plus par offre,
// en parallèle) peuvent dépasser le délai habituel.
export const maxDuration = 60;

const muted = { color: "var(--color-neutral-600)" } as const;

const GENERATE_LABEL: Record<PostKind, string> = {
  daily: "Générer les offres du jour",
  sector: "Générer les offres du secteur",
  city: "Générer les offres de la ville",
  weekly: "Générer le récap de la semaine",
};

const SOURCE_LABEL: Record<string, string> = {
  france_travail: "France Travail",
  la_bonne_alternance: "La bonne alternance",
  manuel: "Ajoutée à la main",
  mistral_ingest: "Site de l'entreprise",
};

const REJECTION_LABEL: Record<string, string> = {
  ...SKIP_LABELS,
  deja_preparee: "Déjà préparée dans les 60 derniers jours",
  hors_cible: "Hors secteur ou hors ville",
  trop_ancienne_fenetre: "Trop ancienne pour ce format",
  doublon: "Même annonce déjà présente (autre source)",
};

const VERDICT_BADGE: Record<LinkVerdict, { text: string; color: string } | null> = {
  alive: { text: "Vérifiée en ligne", color: "#0c7a44" },
  unknown: { text: "Lien non vérifiable : à contrôler", color: "#9a6700" },
  suspect: { text: "Le lien laisse entendre qu'elle est pourvue : à contrôler", color: "#c0392b" },
  dead: { text: "Plus en ligne", color: "#c0392b" },
};

const dateTime = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const isFridayInParis = (now: number) => new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" }).format(now) === "Fri";

type SearchParams = { f?: string; s?: string; v?: string; go?: string; liens?: string; ids?: string | string[]; h?: string; ok?: string; erreur?: string };

function visualHref(kind: PostKind, ids: string[], sector: string | null, city: string | null, at: number) {
  const q = new URLSearchParams({ f: kind, ids: ids.join(","), at: String(at) });
  if (sector) q.set("s", sector);
  if (city) q.set("v", city);
  return `/admin/linkedin/visuel?${q.toString()}`;
}

function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 999, padding: "1px 8px", whiteSpace: "nowrap" }}>{children}</span>
  );
}

// Contrôle des liens : les offres retirées sont écartées d'office. Sans choix
// de Nathan, on remplace les offres retirées par les suivantes de la liste.
async function chooseLive(
  proposal: LinkedinOffer[],
  requested: LinkedinOffer[] | null,
  count: number,
): Promise<{ chosen: LinkedinOffer[]; verdicts: Map<string, LinkVerdict>; dropped: LinkedinOffer[] }> {
  const verdicts = new Map<string, LinkVerdict>();
  const check = async (offers: LinkedinOffer[]) => {
    const results = await Promise.all(offers.map(async (o) => [o.id, await checkOfferLink(o)] as const));
    for (const [id, verdict] of results) verdicts.set(id, verdict);
  };
  if (requested) {
    await check(requested);
    return { chosen: requested.filter((o) => verdicts.get(o.id) !== "dead"), verdicts, dropped: requested.filter((o) => verdicts.get(o.id) === "dead") };
  }
  const chosen: LinkedinOffer[] = [];
  const dropped: LinkedinOffer[] = [];
  let cursor = 0;
  for (let round = 0; round < 3 && chosen.length < count && cursor < proposal.length; round++) {
    const batch = proposal.slice(cursor, cursor + (count - chosen.length) + 2);
    cursor += batch.length;
    await check(batch);
    for (const o of batch) (verdicts.get(o.id) === "dead" ? dropped : chosen.length < count ? chosen : []).push(o);
  }
  return { chosen, verdicts, dropped };
}

async function Workbench({ kind, sp, now }: { kind: PostKind; sp: SearchParams; now: number }) {
  const db = createAdminClient();
  const sector = sectorGroupFrom(sp.s) ?? SECTOR_GROUPS[0];
  const city = cityFrom(sp.v) ?? LINKEDIN_CITIES[0];
  const linksInComment = sp.liens === "1";
  const count = POST_SIZE[kind];

  let used = { blocked: new Set<string>(), seen: new Set<string>(), tableMissing: false };
  try {
    used = await loadUsedOfferIds(db, kind, now);
  } catch (err) {
    console.error("linkedin: historique illisible", err);
  }
  const candidates = await loadCandidates(db, kind, now, kind === "city" ? city.label : null);
  const { eligible, rejected } = rankCandidates(candidates, {
    kind,
    now,
    blocked: used.blocked,
    seen: used.seen,
    sector: kind === "sector" ? sector : null,
    citySlug: kind === "city" ? city.slug : null,
  });
  const proposal = pickDiverse(eligible, count * 3, kind === "weekly" ? 3 : Infinity);

  const requestedIds = idsFrom(sp.ids);
  const requested = requestedIds.length > 0 ? eligible.filter((o) => requestedIds.includes(o.id)) : null;
  const { chosen, verdicts, dropped } = await chooseLive(proposal, requested, count);

  const listing = [...chosen, ...proposal.filter((o) => !chosen.some((c) => c.id === o.id) && !dropped.some((d) => d.id === o.id))];
  const chosenIds = new Set(chosen.map((o) => o.id));
  const target = kind === "sector" || kind === "city" ? await loadTarget(kind, sector, city) : null;
  const draft = chosen.length > 0 ? buildPost({ kind, offers: chosen, now, target, linksInComment }) : null;
  const rejectedRows = Object.entries(rejected).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="cockpit-card flex flex-col gap-3">
        <div style={{ fontSize: 14, fontWeight: 700 }}>1. Choisis les offres</div>
        <p style={{ margin: 0, fontSize: 12.5, ...muted }}>
          {candidates.length.toLocaleString("fr-FR")} offres lues, {eligible.length.toLocaleString("fr-FR")} publiables
          {rejectedRows.length > 0 && <> · écartées : {rejectedRows.map(([reason, n]) => `${n} ${(REJECTION_LABEL[reason] ?? reason).toLowerCase()}`).join(", ")}</>}.
        </p>
        {kind === "weekly" && !isFridayInParis(now) && <p style={{ margin: 0, fontSize: 12.5, color: "#9a6700" }}>Le récap se publie le vendredi : tu peux le préparer d&apos;avance, les chiffres sont ceux d&apos;aujourd&apos;hui.</p>}
        {dropped.length > 0 && (
          <p style={{ margin: 0, fontSize: 12.5, color: "#c0392b" }}>
            Retirées, car plus en ligne : {dropped.map((o) => `${cleanTitle(o.title)} (${cleanCompany(o.company)})`).join(" · ")}.
          </p>
        )}
        {listing.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>Aucune offre publiable pour ce format en ce moment. Reviens après la prochaine synchronisation.</p>
        ) : (
          <form method="get" action="/admin/linkedin" className="flex flex-col gap-2">
            <input type="hidden" name="f" value={kind} />
            <input type="hidden" name="s" value={sector.slug} />
            <input type="hidden" name="v" value={city.slug} />
            <input type="hidden" name="go" value="1" />
            {linksInComment && <input type="hidden" name="liens" value="1" />}
            {listing.map((o) => {
              const verdict = verdicts.get(o.id);
              const badge = verdict ? VERDICT_BADGE[verdict] : null;
              return (
                <label
                  key={o.id}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, background: chosenIds.has(o.id) ? "var(--color-accent-100)" : "transparent", border: "1px solid var(--color-divider)" }}
                >
                  <input type="checkbox" name="ids" value={o.id} defaultChecked={chosenIds.has(o.id)} style={{ marginTop: 4 }} />
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{cleanTitle(o.title)}</span>
                    <span style={{ fontSize: 12.5, ...muted }}>
                      {cleanCompany(o.company)} · {cityOf(o) ?? "ville non précisée"} · publiée {shortAge(o.published_at)} · {SOURCE_LABEL[o.source] ?? o.source}
                    </span>
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {badge && <Badge color={badge.color}>{badge.text}</Badge>}
                      {used.seen.has(o.id) && <Badge color="#9a6700">Déjà mise en avant dans une autre publication</Badge>}
                    </span>
                  </span>
                </label>
              );
            })}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-secondary" style={{ fontSize: 13 }}>
                Mettre à jour l&apos;aperçu
              </button>
              <span style={{ fontSize: 12, ...muted }}>
                {chosen.length} sélectionnée{chosen.length > 1 ? "s" : ""} (objectif : {count}).
              </span>
            </div>
          </form>
        )}
      </div>

      {draft && (
        <div className="cockpit-card flex flex-col gap-3">
          <div style={{ fontSize: 14, fontWeight: 700 }}>2. Relis, copie, publie</div>
          <PostEditor
            key={`${chosen.map((o) => o.id).join(",")}-${linksInComment}`}
            initialText={draft.text}
            initialComment={draft.comment}
            kind={kind}
            label={draft.label}
            offerIds={draft.offerIds}
            sector={kind === "sector" ? sector.slug : null}
            city={kind === "city" ? city.slug : null}
            visualSrc={visualHref(kind, draft.offerIds, kind === "sector" ? sector.slug : null, kind === "city" ? city.slug : null, now)}
            saved={false}
            saveAction={savePostAction}
          />
        </div>
      )}
    </>
  );
}

export default async function AdminLinkedinPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const now = nowMs();
  const db = createAdminClient();

  let history: History = { rows: [], tableMissing: false };
  let historyError: string | null = null;
  try {
    history = await loadHistory(db);
  } catch (err) {
    historyError = err instanceof Error ? err.message : String(err);
  }

  // Publication rouverte depuis l'historique.
  const reopened = typeof sp.h === "string" ? await loadPost(db, sp.h) : null;
  const reopenedOffers = reopened ? await fetchOffersByIds(db, reopened.offer_ids) : [];
  const kind = reopened ? reopened.kind : kindFrom(sp.f);
  const sector = sectorGroupFrom(sp.s) ?? SECTOR_GROUPS[0];
  const city = cityFrom(sp.v) ?? LINKEDIN_CITIES[0];
  const showMissingTable = history.tableMissing || sp.erreur === "missing_table";

  const tabHref = (k: PostKind) => `/admin/linkedin?f=${k}`;

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 1000 }}>
      <div>
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Publications LinkedIn</h1>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          Prépare une publication en quelques minutes : tu choisis les offres, tu relis, tu copies le texte et tu télécharges le visuel. Rien n&apos;est publié
          automatiquement. Offres publiées : France Travail, La bonne alternance et offres ajoutées à la main, alternance seulement, revues par la synchro depuis moins de
          48 h. Adzuna est exclue (ses conditions n&apos;autorisent pas la republication). Jamais de description ni de contact du recruteur.
        </p>
      </div>

      {sp.ok && (
        <p className="card" style={{ padding: "var(--space-4)", margin: 0, borderColor: "var(--color-accent-600)" }}>
          ✅ {sp.ok}
        </p>
      )}
      {sp.erreur && sp.erreur !== "missing_table" && (
        <p className="card" style={{ padding: "var(--space-4)", margin: 0, borderColor: "#c0392b" }}>
          ⚠️ {sp.erreur}
        </p>
      )}
      {historyError && (
        <p className="card" style={{ padding: "var(--space-4)", margin: 0, borderColor: "#c0392b" }}>
          ⚠️ {historyError}
        </p>
      )}
      {showMissingTable && (
        <div className="cockpit-card">
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Une étape pour garder l&apos;historique</p>
          <p style={{ margin: "6px 0 10px", fontSize: 13, ...muted }}>
            Colle ce SQL dans Supabase → SQL Editor → Run, puis recharge la page. Sans lui, l&apos;outil marche mais ne se souvient pas des offres déjà préparées : tu risques de
            republier la même.
          </p>
          <pre style={{ margin: 0, padding: 12, fontSize: 12, borderRadius: 8, background: "var(--color-surface)", overflowX: "auto" }}>{LINKEDIN_POSTS_SQL}</pre>
        </div>
      )}

      {reopened ? (
        <div className="cockpit-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {KIND_LABELS[reopened.kind]} · {reopened.label} · préparée le {dateTime.format(Date.parse(reopened.created_at))}
            </div>
            <Link href="/admin/linkedin" className="btn btn-secondary" style={{ fontSize: 12 }}>
              Nouvelle publication
            </Link>
          </div>
          <PostEditor
            key={reopened.id}
            initialText={reopened.body}
            initialComment={reopened.comment}
            kind={reopened.kind}
            label={reopened.label}
            offerIds={reopened.offer_ids}
            sector={null}
            city={null}
            visualSrc={visualHref(reopened.kind, reopenedOffers.map((o) => o.id), SECTOR_GROUPS.find((g) => reopened.label.toLowerCase() === g.label)?.slug ?? null, LINKEDIN_CITIES.find((c) => c.label === reopened.label)?.slug ?? null, Date.parse(reopened.created_at))}
            saved
            saveAction={savePostAction}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(KIND_LABELS) as PostKind[]).map((k) => (
              <Link key={k} href={tabHref(k)} className={k === kind ? "btn btn-primary" : "btn btn-secondary"} style={{ fontSize: 13 }}>
                {KIND_LABELS[k]}
              </Link>
            ))}
          </div>

          <form method="get" action="/admin/linkedin" className="cockpit-card" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 14 }}>
            <input type="hidden" name="f" value={kind} />
            <input type="hidden" name="go" value="1" />
            {kind === "sector" && (
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                Secteur
                <select name="s" className="input" defaultValue={sector.slug} style={{ minWidth: 260 }}>
                  {SECTOR_GROUPS.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label.charAt(0).toUpperCase() + g.label.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {kind === "city" && (
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                Ville
                <select name="v" className="input" defaultValue={city.slug} style={{ minWidth: 200 }}>
                  {LINKEDIN_CITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" name="liens" value="1" defaultChecked={sp.liens === "1"} />
              Liens dans le premier commentaire
            </label>
            <button type="submit" className="btn btn-primary" style={{ fontSize: 14 }}>
              {GENERATE_LABEL[kind]}
            </button>
            <p style={{ flexBasis: "100%", margin: 0, fontSize: 12, ...muted }}>
              {kind === "daily" && "Les 5 offres d'alternance les plus récentes, contrôlées une par une."}
              {kind === "sector" && "5 offres du secteur choisi, avec le nombre d'offres en ligne et un lien vers la page du secteur."}
              {kind === "city" && "5 offres de la ville choisie, avec le nombre d'offres en ligne et un lien vers la page de la ville."}
              {kind === "weekly" && "Les 10 offres les mieux renseignées de la semaine, pour le vendredi."} LinkedIn montre moins un post qui contient des liens : cocher la case met les liens
              dans un premier commentaire à publier juste après.
            </p>
          </form>

          {sp.go === "1" && <Workbench kind={kind} sp={sp} now={now} />}
        </>
      )}

      <div className="cockpit-card flex flex-col gap-3">
        <div style={{ fontSize: 14, fontWeight: 700 }}>Historique</div>
        {history.rows.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, ...muted }}>{history.tableMissing ? "L'historique démarre après l'étape SQL ci-dessus." : "Aucune publication enregistrée pour l'instant."}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", ...muted }}>
                  <th style={{ padding: "4px 8px 4px 0" }}>Préparée</th>
                  <th style={{ padding: "4px 8px" }}>Format</th>
                  <th style={{ padding: "4px 8px" }}>Titre</th>
                  <th style={{ padding: "4px 8px" }}>Offres</th>
                  <th style={{ padding: "4px 8px" }}>Statut</th>
                  <th style={{ padding: "4px 0 4px 8px" }}></th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map((row) => (
                  <tr key={row.id} style={{ borderTop: "1px solid var(--color-divider)", verticalAlign: "top" }}>
                    <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>{dateTime.format(Date.parse(row.created_at))}</td>
                    <td style={{ padding: "6px 8px" }}>{KIND_LABELS[row.kind] ?? row.kind}</td>
                    <td style={{ padding: "6px 8px" }}>{row.label}</td>
                    <td style={{ padding: "6px 8px" }}>{row.offer_ids.length}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {row.published ? (
                        <>
                          Publiée{row.published_at ? ` le ${dateTime.format(Date.parse(row.published_at))}` : ""}
                          {row.linkedin_url && (
                            <>
                              {" "}
                              <a href={row.linkedin_url} target="_blank" rel="noreferrer">
                                voir
                              </a>
                            </>
                          )}
                        </>
                      ) : (
                        "Préparée"
                      )}
                    </td>
                    <td style={{ padding: "6px 0 6px 8px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                        <Link href={`/admin/linkedin?h=${row.id}`} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
                          Rouvrir
                        </Link>
                        {!row.published && (
                          <form action={markPublishedAction} style={{ display: "flex", gap: 6 }}>
                            <input type="hidden" name="id" value={row.id} />
                            <input name="url" className="input" placeholder="Lien LinkedIn (facultatif)" style={{ fontSize: 12, padding: "4px 8px", width: 170 }} />
                            <button type="submit" className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
                              Marquer publiée
                            </button>
                          </form>
                        )}
                        <form action={deletePostAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
