import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { nowMs } from "@/lib/admin/cockpit/load";
import { Section } from "@/components/admin/cockpit/Kpi";
import { LinkedinStudio } from "@/components/admin/linkedin/LinkedinStudio";
import { PostPreview } from "@/components/admin/linkedin/PostPreview";
import {
  CITY_TARGETS,
  FORMAT_HELP,
  FORMAT_LABELS,
  SECTOR_GROUPS,
  isLinkedinFormat,
  segmentLabel,
  type LinkedinFormat,
} from "@/lib/linkedin/formats";
import { fetchCandidates, type CandidateResult } from "@/lib/linkedin/select";
import { listPosts, type LinkedinPost } from "@/lib/linkedin/posts";

// Préparer les publications LinkedIn en quelques minutes par jour (01/11).
// 1. Choisir le format (jour, secteur, ville, récap du vendredi).
// 2. Cocher les offres (présélection automatique).
// 3. Préparer : revérification chez France Travail, texte, visuel.
// 4. Copier / télécharger, publier à la main sur LinkedIn, cocher « publié ».
// Les visites et inscriptions arrivent dans /admin/trafic (utm_source=linkedin).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FORMATS: LinkedinFormat[] = ["jour", "secteur", "ville", "hebdo"];

type Props = { searchParams: Promise<{ f?: string; s?: string }> };

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid var(--color-divider)",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "#fff" : "var(--color-text)",
  };
}

export default async function LinkedinPage({ searchParams }: Props) {
  await requireAdminPage();
  const now = nowMs();
  const { f, s } = await searchParams;
  const format: LinkedinFormat = isLinkedinFormat(f) ? f : "jour";
  const segment =
    format === "secteur"
      ? (SECTOR_GROUPS.find((g) => g.key === s) ?? SECTOR_GROUPS[0]).key
      : format === "ville"
        ? (CITY_TARGETS.find((c) => c.key === s) ?? CITY_TARGETS[0]).key
        : null;

  let result: CandidateResult | null = null;
  let candidatesError: string | null = null;
  let posts: LinkedinPost[] = [];
  let postsError: string | null = null;
  await Promise.all([
    fetchCandidates(format, segment)
      .then((r) => (result = r))
      .catch((e: unknown) => (candidatesError = e instanceof Error ? e.message : String(e))),
    listPosts()
      .then((p) => (posts = p))
      .catch((e: unknown) => (postsError = e instanceof Error ? e.message : String(e))),
  ]);
  const candidates = result as CandidateResult | null;

  const publishedThisWeek = posts.filter((p) => p.status === "publie" && p.published_at && now - new Date(p.published_at).getTime() < 7 * 86_400_000).length;
  const segments = format === "secteur" ? SECTOR_GROUPS : format === "ville" ? CITY_TARGETS : [];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Publications LinkedIn</h1>
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: 0, maxWidth: "75ch" }}>
        Rien n&apos;est publié automatiquement : tu prépares, tu relis, tu copies sur LinkedIn, puis tu coches « J&apos;ai publié ».
        Une offre publiée n&apos;est plus jamais reproposée. {publishedThisWeek} publication{publishedThisWeek > 1 ? "s" : ""} ces 7 derniers jours ·{" "}
        <Link href="/admin/trafic/source/linkedin">résultats (visites et inscriptions)</Link>
      </p>

      <nav aria-label="Format" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
        {FORMATS.map((key) => (
          <Link key={key} href={`/admin/linkedin?f=${key}`} style={tabStyle(key === format)}>
            {FORMAT_LABELS[key]}
          </Link>
        ))}
      </nav>
      <p style={{ fontSize: 12.5, color: "var(--color-neutral-600)", margin: "8px 0 0" }}>{FORMAT_HELP[format]}</p>

      {segments.length > 0 && (
        <nav aria-label={format === "secteur" ? "Secteur" : "Ville"} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {segments.map((seg) => (
            <Link
              key={seg.key}
              href={`/admin/linkedin?f=${format}&s=${seg.key}`}
              className={`cockpit-pill ${seg.key === segment ? "is-good" : ""}`}
              style={{ textDecoration: "none", fontSize: 12.5, padding: "4px 10px" }}
            >
              {seg.label}
            </Link>
          ))}
        </nav>
      )}

      <Section
        title={segment ? `${FORMAT_LABELS[format]} · ${segmentLabel(format, segment)}` : FORMAT_LABELS[format]}
        subtitle={
          candidates
            ? `${candidates.candidates.length} offre(s) publiable(s)${candidates.excludedPublished ? `, ${candidates.excludedPublished} écartée(s) car déjà publiée(s)` : ""}. Les ${candidates.preselected.length} premières sont cochées.`
            : undefined
        }
        actions={
          <Link href={`/admin/linkedin?f=${format}${segment ? `&s=${segment}` : ""}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }} prefetch={false}>
            {format === "jour" ? "Générer les offres du jour" : "Actualiser la sélection"}
          </Link>
        }
      >
        {candidatesError ? (
          <p style={{ color: "#a12121", fontSize: 14 }}>Lecture des offres impossible : {candidatesError}</p>
        ) : candidates ? (
          <LinkedinStudio
            key={`${format}-${segment ?? ""}-${candidates.preselected.join(",")}`}
            format={format}
            segment={segment}
            candidates={candidates.candidates}
            preselected={candidates.preselected}
          />
        ) : null}
      </Section>

      <Section title="Historique" subtitle="Les 40 dernières publications préparées.">
        {postsError ? (
          <p style={{ color: "#a12121", fontSize: 14 }}>Historique indisponible : {postsError}</p>
        ) : posts.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--color-neutral-600)" }}>Aucune publication préparée pour l&apos;instant.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {posts.map((p) => (
              <details key={p.id} className="cockpit-card">
                <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  {new Date(p.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" })} ·{" "}
                  {FORMAT_LABELS[p.format]}
                  {p.segment ? ` · ${segmentLabel(p.format, p.segment) ?? p.segment}` : ""} · {p.offer_ids.length} offre(s) ·{" "}
                  {p.status === "publie" ? "publié" : p.status === "abandonne" ? "abandonné" : "brouillon"}
                </summary>
                <div style={{ marginTop: 12 }}>
                  <PostPreview post={p} compact />
                </div>
              </details>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
