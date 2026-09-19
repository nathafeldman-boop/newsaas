import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ReferralLinkCard } from "@/components/referral/ReferralLinkCard";
import { applyAsAffiliateAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Indique un email valide pour être payé.",
  "1": "Une erreur est survenue, réessaie.",
};

function fmt(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}

export default async function AffiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affilies");

  const { data: affiliate, error: affiliateError } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (affiliateError) {
    // supabase-js ne throw jamais sur une erreur Postgres -- sans ce log, un
    // souci ici (ex: migration pas encore collée en base) retombe
    // silencieusement sur "pas encore candidat" et affiche le formulaire de
    // candidature sans aucune trace de pourquoi la vraie fiche n'apparaît pas.
    console.error("AffiliesPage: affiliates query failed", affiliateError, { userId: user.id });
  }

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;

  // Pas encore candidat : formulaire d'inscription au programme.
  if (!affiliate) {
    return (
      <div className="mx-auto w-full max-w-[520px]">
        <h1 style={{ fontSize: 28, margin: 0 }}>Programme d&apos;affiliation</h1>
        <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "8px 0 0", lineHeight: 1.5 }}>
          Touche <strong>50% de commission</strong> sur chaque abonnement hebdomadaire (4,50€) ou
          mensuel (7,99€) que tu apportes à Stageio, sur toute la durée de l&apos;abonnement.
        </p>

        <div className="card elev-sm mt-6" style={{ padding: "var(--space-5)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Comment ça marche</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            <li>Candidate ci-dessous (validation manuelle par l&apos;équipe Stageio).</li>
            <li>Une fois approuvé·e, tu reçois ton lien d&apos;affiliation unique.</li>
            <li>Chaque personne qui s&apos;abonne (hebdo ou mensuel) via ton lien te rapporte 50%.</li>
            <li>Suis tes gains en temps réel depuis ce tableau de bord.</li>
          </ul>
        </div>

        <form action={applyAsAffiliateAction} className="card elev-sm mt-4" style={{ padding: "var(--space-5)", gap: 12 }}>
          <div className="field">
            <label htmlFor="payoutEmail">Email pour être payé (PayPal ou virement)</label>
            <input
              id="payoutEmail"
              name="payoutEmail"
              type="email"
              required
              placeholder="toi@exemple.com"
              className="input"
            />
          </div>
          {error && (
            <p style={{ fontSize: 12.5, color: "var(--color-accent-700)", margin: 0 }}>
              {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            Candidater au programme
          </button>
        </form>
      </div>
    );
  }

  // Candidature en attente.
  if (affiliate.status === "pending") {
    return (
      <div className="mx-auto w-full max-w-[520px] text-center" style={{ padding: "40px 0" }}>
        <p style={{ fontSize: 40, margin: 0 }}>⏳</p>
        <h1 style={{ fontSize: 22, margin: "12px 0 0" }}>Candidature en attente</h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: "10px auto 0", maxWidth: "36ch", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Ta candidature au programme d&apos;affiliation est en cours de validation par l&apos;équipe
          Stageio. Tu recevras un email dès qu&apos;elle sera approuvée.
        </p>
      </div>
    );
  }

  if (affiliate.status === "rejected") {
    return (
      <div className="mx-auto w-full max-w-[520px] text-center" style={{ padding: "40px 0" }}>
        <p style={{ fontSize: 40, margin: 0 }}>—</p>
        <h1 style={{ fontSize: 22, margin: "12px 0 0" }}>Candidature non retenue</h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: "10px auto 0", maxWidth: "36ch", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Ta candidature au programme d&apos;affiliation n&apos;a pas été retenue. Pour en savoir plus,
          contacte <a href="mailto:contact@stageio.fr">contact@stageio.fr</a>.
        </p>
      </div>
    );
  }

  // Approuvé : tableau de bord complet.
  const affiliateLink = `${origin}/inscription?aff=${affiliate.code}`;

  const [{ count: clickCount }, { data: clickVisitors }, { count: referredCount }, { data: commissions }] =
    await Promise.all([
      supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
      // Bornée par prudence (voir l'audit du 15/09) : largement au-dessus du
      // volume réel qu'un seul affilié peut générer.
      supabase.from("affiliate_clicks").select("visitor_id").eq("affiliate_id", affiliate.id).limit(5000),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
      supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliate.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  const uniqueVisitors = new Set((clickVisitors ?? []).map((c) => c.visitor_id)).size;
  const allCommissions = commissions ?? [];
  const pendingCents = allCommissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.commission_cents, 0);
  const paidCents = allCommissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.commission_cents, 0);

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <h1 style={{ fontSize: 28, margin: 0 }}>Ton espace affilié</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        50% de commission sur chaque abonnement hebdo ou mensuel apporté via ton lien.
      </p>

      <div className="mt-6">
        <ReferralLinkCard referralLink={affiliateLink} code={affiliate.code} />
      </div>

      <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 55%, transparent)", margin: "20px 0 8px" }}>
        Ton entonnoir
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{clickCount ?? 0}</p>
          <p style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Clics ({uniqueVisitors} uniques)
          </p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{referredCount ?? 0}</p>
          <p style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Inscrits
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0, color: "var(--color-accent-700)" }}>
            {(pendingCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            À recevoir
          </p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>
            {(paidCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Déjà payé
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 style={{ fontSize: 17, margin: 0 }}>Tes commissions</h2>
        {allCommissions.length === 0 ? (
          <p className="mt-3" style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
            Aucune commission pour l&apos;instant — partage ton lien !
          </p>
        ) : (
          <div className="mt-3.5 flex flex-col gap-2.5">
            {allCommissions.map((c) => (
              <div
                key={c.id}
                className="card flex-row items-center justify-between"
                style={{ padding: "var(--space-3) var(--space-4)" }}
              >
                <div>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    {(c.commission_cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €{" "}
                    <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                      ({c.plan_interval === "week" ? "hebdo" : "mensuel"})
                    </span>
                  </p>
                  <p style={{ fontSize: 11, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                    {fmt(c.created_at)}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: c.status === "paid" ? 600 : 400,
                    color: c.status === "paid" ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 50%, transparent)",
                  }}
                >
                  {c.status === "paid" ? "Payé" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
