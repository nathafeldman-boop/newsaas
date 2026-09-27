import Link from "next/link";

export default async function DesabonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const success = ok !== "0";

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-9">
      <p className="text-4xl">{success ? "✅" : "⚠️"}</p>
      <h1 style={{ fontSize: 24, margin: "16px 0 0" }}>
        {success ? "Tu es désabonné·e" : "Un souci est survenu"}
      </h1>
      <p style={{ fontSize: 14, margin: "10px 0 24px" }}>
        {success
          ? "Tu ne recevras plus d'emails de relance ni d'alertes nouvelles offres de Stageio. Tu peux les réactiver à tout moment dans ton profil."
          : "On n'a pas pu traiter ta demande de désabonnement. Réponds directement à l'un de nos emails, on s'en occupe à la main."}
      </p>
      <Link href="/swipe" className="btn btn-primary">
        Retour à Stageio
      </Link>
    </div>
  );
}
