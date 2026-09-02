import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offre expirée",
  robots: { index: false, follow: true },
};

export default function OfferNotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center sm:px-9">
      <h1 style={{ fontSize: 24, margin: 0 }}>Cette offre n&apos;est plus disponible</h1>
      <p style={{ fontSize: 14, margin: "10px 0 24px" }}>
        Elle a été pourvue ou retirée. Découvre les offres actives sur Stageio.
      </p>
      <Link href="/offres" className="btn btn-primary">
        Voir les offres
      </Link>
    </div>
  );
}
