"use client";

import { useMemo, useState } from "react";
import { OfferListCard } from "@/components/offers/OfferListCard";
import { statusGroup, type StatusGroupKey } from "@/lib/applications/status";
import type { ApplicationStatus, Offer } from "@/types/database";

// Favoris (24/10, mission churn) : la liste de travail de l'étudiant.
// Filtres métier / ville / contrat / statut, tri, et les offres qui ne sont
// plus en ligne restent visibles à part au lieu de disparaître.

export type FavoriteItem = {
  offer: Offer;
  likedAt: string;
  status: ApplicationStatus | null;
  matchScore: number | null;
};

type StatusFilter = "all" | "none" | StatusGroupKey;
type Sort = "liked" | "match" | "published";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "none", label: "Pas encore postulé" },
  { value: "todo", label: "Lettre prête, à envoyer" },
  { value: "waiting", label: "Envoyées, en attente" },
  { value: "interview", label: "Entretiens" },
  { value: "done", label: "Terminées" },
];

const muted = "color-mix(in srgb, var(--color-text) 65%, transparent)";
const shortDate = (t: string) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

function cityOf(location: string): string {
  return location.split(/[,(]/)[0].replace(/^\d{2,3}\s*-\s*/, "").trim() || location;
}

export function FavoritesBoard({ items }: { items: FavoriteItem[] }) {
  const [query, setQuery] = useState("");
  const [contract, setContract] = useState<"all" | "alternance" | "stage">("all");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("liked");
  const [showGone, setShowGone] = useState(false);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) counts.set(cityOf(it.offer.location), (counts.get(cityOf(it.offer.location)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((it) => {
      if (contract !== "all" && it.offer.contract_type !== contract) return false;
      if (city !== "all" && cityOf(it.offer.location) !== city) return false;
      if (status === "none" && it.status) return false;
      if (status !== "all" && status !== "none" && (!it.status || statusGroup(it.status) !== status)) return false;
      if (q && !`${it.offer.title} ${it.offer.company} ${it.offer.sector ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const key: Record<Sort, (it: FavoriteItem) => number> = {
      liked: (it) => -Date.parse(it.likedAt),
      match: (it) => -(it.matchScore ?? 0),
      published: (it) => -Date.parse(it.offer.published_at),
    };
    return list.sort((a, b) => key[sort](a) - key[sort](b));
  }, [items, query, contract, city, status, sort]);

  const live = filtered.filter((it) => it.offer.is_active);
  const gone = filtered.filter((it) => !it.offer.is_active);
  const toApply = items.filter((it) => it.offer.is_active && !it.status).length;
  const filtering = query.trim() !== "" || contract !== "all" || city !== "all" || status !== "all";

  const reset = () => {
    setQuery("");
    setContract("all");
    setCity("all");
    setStatus("all");
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: muted, margin: "10px 0 0" }}>
        {items.length} favori{items.length > 1 ? "s" : ""}
        {toApply > 0 && (
          <>
            {" · "}
            <button type="button" onClick={() => setStatus("none")} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent)", fontWeight: 600 }}>
              {toApply} sans candidature
            </button>
          </>
        )}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Métier, entreprise…"
          className="input"
          aria-label="Rechercher dans mes favoris"
        />
        <div className="flex flex-wrap gap-2">
          <div className="seg" role="group" aria-label="Type de contrat">
            {(["all", "alternance", "stage"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setContract(c)} className={`seg-opt${contract === c ? " is-active" : ""}`} aria-pressed={contract === c}>
                {c === "all" ? "Tous" : c === "alternance" ? "Alternance" : "Stage"}
              </button>
            ))}
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input" style={{ width: "auto", fontSize: 13 }} aria-label="Ville">
            <option value="all">Toutes les villes</option>
            {cities.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="input" style={{ width: "auto", fontSize: 13 }} aria-label="Statut">
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input" style={{ width: "auto", fontSize: 13 }} aria-label="Trier">
            <option value="liked">Likées récemment</option>
            <option value="match">Meilleure compatibilité</option>
            <option value="published">Publiées récemment</option>
          </select>
          {filtering && (
            <button type="button" onClick={reset} className="btn btn-ghost" style={{ fontSize: 13 }}>
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {live.length === 0 && gone.length === 0 ? (
        <p className="mt-10 text-center" style={{ color: muted }}>
          Aucun favori ne correspond à ces filtres.
        </p>
      ) : (
        <>
          {live.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((it) => (
                <OfferListCard
                  key={it.offer.id}
                  offer={it.offer}
                  applicationStatus={it.status}
                  matchScore={it.matchScore ?? undefined}
                  meta={`Likée le ${shortDate(it.likedAt)}`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center" style={{ color: muted }}>
              Aucune offre encore en ligne pour ces filtres.
            </p>
          )}

          {gone.length > 0 && (
            <section className="mt-8">
              <button type="button" onClick={() => setShowGone((v) => !v)} aria-expanded={showGone} className="btn btn-secondary" style={{ fontSize: 13 }}>
                {showGone ? "Masquer" : "Afficher"} les offres plus en ligne ({gone.length})
              </button>
              {showGone && (
                <>
                  <p style={{ fontSize: 12.5, color: muted, margin: "8px 0 0" }}>
                    Pourvues ou retirées par le recruteur. Tes candidatures envoyées restent suivies dans « Mes candidatures ».
                  </p>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ opacity: 0.8 }}>
                    {gone.map((it) => (
                      <OfferListCard key={it.offer.id} offer={it.offer} applicationStatus={it.status} inactive meta={`Likée le ${shortDate(it.likedAt)}`} />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
