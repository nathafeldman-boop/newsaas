import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { AUTO_DAILY_LIMIT } from "@/lib/pricing/plans";
import { CONTACT_EMAIL } from "@/lib/site";
import { reconcileFromSession } from "@/lib/stripe/reconcileCheckout";

export default async function PremiumSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; auto?: string }>;
}) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (session_id && user) {
    await reconcileFromSession(session_id, user.id);
  }
  // Formule Auto (24/10) : message et premier pas propres à l'envoi au like.
  const { data: profile } = user ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : { data: null };
  const auto = isAutoTier(profile);

  // Premiers pas (29/10, satisfaction) : la plupart des résiliations
  // arrivent le premier jour, avant la première candidature. Les mêmes
  // 3 étapes que l'email d'accueil (lib/subscribers/welcome).
  const steps = auto
    ? [
        { title: "Vérifie ton CV et ton téléphone", text: "Ils partent avec chaque candidature.", href: "/cv", cta: "Mon CV" },
        { title: "Like tes premières offres", text: `Chaque like envoie ta candidature, jusqu'à ${AUTO_DAILY_LIMIT} par jour.`, href: "/swipe", cta: "Swiper" },
        { title: "Regarde ta boîte Stageio", text: "Les réponses des recruteurs y arrivent.", href: "/boite", cta: "Ma boîte" },
      ]
    : [
        { title: "Vérifie ton CV", text: "L'audit te dit quoi corriger avant d'envoyer.", href: "/cv", cta: "Mon CV" },
        { title: "Envoie tes 3 premières candidatures", text: "Dans «\u00a0Prêt à postuler\u00a0», la lettre est déjà écrite pour chaque offre.", href: "/dashboard", cta: "Prêt à postuler" },
        { title: "Garde tes alertes activées", text: "Une offre qui te correspond vraiment ? Tu la reçois dans l'heure.", href: "/profil", cta: "Mon profil" },
      ];

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-5 py-12 sm:px-9">
      <div className="text-center">
        <p className="text-4xl" style={{ margin: 0 }}>🎉</p>
        <h1 style={{ fontSize: 24, margin: "14px 0 0" }}>{auto ? "Bienvenue dans Stageio Auto" : "Bienvenue dans Premium"}</h1>
        <p style={{ fontSize: 14, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 68%, transparent)" }}>
          Ton accès est actif. Fais ces 3 étapes aujourd&apos;hui, ça prend 10 minutes :
        </p>
      </div>
      <ol className="mt-5 flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
        {steps.map((s, i) => (
          <li key={s.href}>
            <Link href={s.href} className="card elev-sm flex-row items-center gap-3 no-underline animate-in" style={{ color: "inherit", padding: "12px 14px", animationDelay: `${i * 80}ms` }}>
              <span
                aria-hidden
                style={{ flex: "0 0 28px", height: 28, borderRadius: 14, background: "var(--color-accent)", color: "#fff", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>{s.title}</span>
                <span style={{ display: "block", fontSize: 12.5, marginTop: 2, color: "color-mix(in srgb, var(--color-text) 64%, transparent)" }}>{s.text}</span>
              </span>
              <span aria-label={s.cta} style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)" }}>
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href={steps[1].href} className="btn btn-primary" style={{ marginTop: 18 }}>
        {auto ? "Swiper et postuler" : "Commencer à postuler"}
      </Link>
      <p style={{ fontSize: 12.5, textAlign: "center", margin: "14px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
        Un souci, une question ? Écris-moi à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, je réponds moi-même. Nathan
      </p>
    </div>
  );
}
