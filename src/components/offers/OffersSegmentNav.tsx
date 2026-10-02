import Link from "next/link";

// Liens vers les vraies pages indexables (/offres, /offres/alternance,
// /offres/stage) plutôt que des query strings ?type= -- chacune a son
// propre contenu/metadata et peut se classer sur "alternance" ou "stage"
// séparément, au lieu de se faire absorber par le canonical de /offres.
export function OffersSegmentNav({ active }: { active?: "alternance" | "stage" }) {
  return (
    <div className="seg mt-5">
      <Link href="/offres" className={`seg-opt${!active ? " is-active" : ""}`}>
        Toutes
      </Link>
      <Link href="/offres/alternance" className={`seg-opt${active === "alternance" ? " is-active" : ""}`}>
        Alternance
      </Link>
      <Link href="/offres/stage" className={`seg-opt${active === "stage" ? " is-active" : ""}`}>
        Stage
      </Link>
    </div>
  );
}
