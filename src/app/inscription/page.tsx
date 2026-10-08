import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { fetchActiveOfferCount } from "@/lib/offers/fetchPublicOffers";
import { resolveSignupIntent, signupHeadline } from "@/lib/signup/intent";
import { normalizeUtmSource } from "@/lib/analytics/referrerSource";
import { RememberSignupCity } from "@/components/signup/RememberSignupCity";

export const metadata: Metadata = {
  title: "Inscription gratuite",
  description:
    "Crée ton compte Stageio gratuitement : renseigne ton profil et reçois des offres d'alternance et de stage triées selon ton secteur, ta ville et ton niveau d'études.",
  alternates: { canonical: `${SITE_URL}/inscription` },
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ aff?: string; utm_source?: string; type?: string; metier?: string; ville?: string }>;
}) {
  const { aff, utm_source: utmSourceParam, type, metier, ville } = await searchParams;
  // Contexte de la page d'où vient le visiteur (voir lib/signup/intent.ts).
  const intent = resolveSignupIntent({ type, metier, ville });
  const headline = signupHeadline(intent);
  // Fallback cookie (voir proxy.ts) : le lien affilié amène désormais sur la
  // home plutôt que directement ici, donc "aff" n'est plus forcément présent
  // dans l'URL de cette page -- sans ce fallback, l'attribution se perdrait
  // dès que la personne clique un CTA de la landing avant de s'inscrire.
  const cookieStore = await cookies();
  const affiliateCode = aff ?? cookieStore.get("aff_code")?.value ?? null;
  // Même logique pour l'attribution publicitaire (utm_source) : voir proxy.ts.
  const utmSource =
    (utmSourceParam ? normalizeUtmSource(utmSourceParam).source : null) ?? cookieStore.get("utm_source")?.value ?? null;
  // Réassurance : le vrai nombre d'offres (compte en cache 10 min), arrondi à
  // la centaine inférieure. Sans compte disponible, la ligne disparaît.
  const offerCount = await fetchActiveOfferCount("all").catch(() => 0);
  const roundedCount = Math.floor(offerCount / 100) * 100;

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
        <h1 style={{ fontSize: 32, margin: "20px 0 0" }}>Crée ton compte</h1>
        <p
          style={{
            fontSize: 14,
            color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
            margin: "6px 0 0",
          }}
        >
          {headline ?? "Deux minutes, puis des offres qui te correspondent."}
        </p>
        {intent.city && <RememberSignupCity city={intent.city} />}
        {roundedCount >= 1000 && (
          <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--color-accent-700)", fontWeight: 600 }}>
            Gratuit · plus de {roundedCount.toLocaleString("fr-FR")} offres d&apos;alternance et de stage · mises à jour
            chaque jour
          </p>
        )}
        <div className="mt-6">
          <Suspense>
            <RegisterForm initialAffiliateCode={affiliateCode} initialUtmSource={utmSource} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
