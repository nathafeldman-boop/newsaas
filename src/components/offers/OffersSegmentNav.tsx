import Link from "next/link";
import { ALL_CONTRACT_TYPES, CONTRACT_LABEL } from "@/lib/offers/contractLabels";
import type { ContractType } from "@/types/database";

// Liens vers les vraies pages indexables (/offres, /offres/alternance,
// /offres/stage, /offres/cdi, /offres/cdd) plutôt que des query strings
// ?type= -- chacune a son propre contenu/metadata et peut se classer
// séparément, au lieu de se faire absorber par le canonical de /offres.
export function OffersSegmentNav({ active }: { active?: ContractType }) {
  return (
    <div className="seg mt-5" style={{ flexWrap: "wrap" }}>
      <Link href="/offres" className={`seg-opt${!active ? " is-active" : ""}`}>
        Toutes
      </Link>
      {ALL_CONTRACT_TYPES.map((type) => (
        <Link key={type} href={`/offres/${type}`} className={`seg-opt${active === type ? " is-active" : ""}`}>
          {CONTRACT_LABEL[type]}
        </Link>
      ))}
    </div>
  );
}
