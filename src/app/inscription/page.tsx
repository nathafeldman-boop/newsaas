import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ aff?: string }>;
}) {
  const { aff } = await searchParams;
  // Fallback cookie (voir proxy.ts) : le lien affilié amène désormais sur la
  // home plutôt que directement ici, donc "aff" n'est plus forcément présent
  // dans l'URL de cette page -- sans ce fallback, l'attribution se perdrait
  // dès que la personne clique un CTA de la landing avant de s'inscrire.
  const cookieStore = await cookies();
  const affiliateCode = aff ?? cookieStore.get("aff_code")?.value ?? null;

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
          Deux minutes, puis des offres qui te correspondent.
        </p>
        <div className="mt-6">
          <Suspense>
            <RegisterForm initialAffiliateCode={affiliateCode} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
