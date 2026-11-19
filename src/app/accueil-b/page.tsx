import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicReviewStats, getPublicTestimonials } from "@/lib/reviews/publicStats";
import { SwipeDemo } from "@/components/landing/SwipeDemo";
import { FaqItem, FeatureCycle, RotatingWord } from "@/components/landing/LandingBClient";
import { PLAN_PRICES } from "@/lib/pricing/plans";
import { SITE_URL } from "@/lib/site";

// Page d'accueil B du test A/B (19/11, Nathan : « copie la LP de Wapply ») :
// mêmes sections, même ordre que wapply.io, mais nos textes, nos couleurs et
// nos vrais chiffres (lus en base, jamais arrondis vers le haut). Pas de
// logos d'entreprises (pas d'accord pour leurs marques), pas de formule
// « gratuite » (rien n'est gratuit chez nous), pas de « il postule pour toi »
// (seulement pour la formule Auto). Servie à la place de « / » pour la
// moitié des visiteurs (proxy.ts, lib/ab/landing.ts) ; jamais indexée.

export const metadata: Metadata = {
  title: "Stageio · Trouve ton CDI, ton alternance ou ton stage en swipant",
  robots: { index: false, follow: true },
  alternates: { canonical: SITE_URL },
};
export const revalidate = 3600;

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const muted = "color-mix(in srgb, var(--color-text) 64%, transparent)";
const h2 = { fontSize: 27, lineHeight: 1.14, textAlign: "center" as const, margin: "0 0 10px", letterSpacing: "-0.01em" };
const lead = { color: muted, textAlign: "center" as const, fontSize: 15.5, lineHeight: 1.55, margin: "0 0 18px" };

const FAQ = [
  {
    q: "Stageio, c'est gratuit ?",
    a: `L'inscription et le parcours des offres sont gratuits. Liker une offre, candidater et générer ta lettre de motivation sont réservés à Premium : ${PLAN_PRICES.monthly.regular}/mois sans engagement ou ${PLAN_PRICES.lifetime.regular} à vie (prix de bienvenue de ${PLAN_PRICES.monthly.welcome}/mois ou ${PLAN_PRICES.lifetime.welcome} à vie pendant 10 minutes).`,
  },
  { q: "D'où viennent les offres ?", a: "Des offres publiques de France Travail, de La bonne alternance et de 1élève1stage, mises à jour chaque jour. Chaque fiche indique sa source." },
  { q: "Comment est écrite ma lettre ?", a: "À partir de ton profil et de l'offre : elle reprend le poste, l'entreprise et ce que tu as renseigné. Tu peux la relire et la modifier avant de l'envoyer." },
  { q: "Comment arrêter mon abonnement ?", a: "En un clic depuis ton profil, sans justification. L'accès à vie, lui, n'a pas de renouvellement." },
  { q: "Mon CV est-il modifié sans mon accord ?", a: "Non. Ton CV n'est jamais modifié ni envoyé sans ton action." },
];

// Fonction SQL count_active_companies (migration du 19/11), pas encore dans
// les types générés : appel non typé, null si elle échoue.
async function countCompanies(admin: ReturnType<typeof createAdminClient>): Promise<number | null> {
  try {
    const rpc = admin.rpc as unknown as (fn: string) => PromiseLike<{ data: unknown; error: unknown }>;
    const { data, error } = await rpc.call(admin, "count_active_companies");
    return !error && typeof data === "number" ? data : null;
  } catch {
    return null;
  }
}

export default async function LandingB() {
  const admin = createAdminClient();
  const [{ count: offers }, { count: users }, companiesRes, reviewStats, testimonials] = await Promise.all([
    admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    countCompanies(admin),
    getPublicReviewStats().catch(() => ({ count: 0, average: null })),
    getPublicTestimonials(3).catch(() => []),
  ]);
  const usersShown = users && users >= 200 ? Math.floor(users / 100) * 100 : (users ?? 0);
  const companies = companiesRes;
  const rating = reviewStats.count >= 3 && reviewStats.average !== null ? `${reviewStats.average.toLocaleString("fr-FR")}/5` : null;

  return (
    <main style={{ background: "var(--color-bg)" }}>
      <div className="mx-auto w-full" style={{ maxWidth: 520, padding: "0 18px" }}>
        <header className="flex items-center justify-between" style={{ padding: "14px 0" }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 22, color: "inherit", textDecoration: "none" }}>
            stageio<span style={{ color: "var(--color-accent)" }}>.</span>
          </Link>
          <Link href="/login" style={{ fontWeight: 700, fontSize: 14 }}>
            Connexion
          </Link>
        </header>

        {/* 1. Accueil */}
        <section style={{ paddingTop: 6 }}>
          <div style={{ borderRadius: 28, overflow: "hidden", boxShadow: "0 20px 44px rgba(19,43,51,.14)" }}>
            <SwipeDemo />
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.08, margin: "22px 0 10px", textAlign: "center", letterSpacing: "-0.02em" }}>
            Trouve ton <RotatingWord /> sans passer des heures à postuler.
          </h1>
          <p style={lead}>Swipe les offres faites pour toi : à chaque like, ta lettre est prête.</p>
          <Link href="/inscription" className="btn btn-primary btn-block" style={{ fontSize: 16, padding: "15px 20px" }}>
            Voir les offres
          </Link>
        </section>

        {/* 2. Confiance */}
        <section style={{ padding: "44px 0 10px" }}>
          {usersShown > 0 && <h2 style={h2}>La confiance de plus de {fmt(usersShown)} candidats en France</h2>}
          <div className="grid grid-cols-2" style={{ gap: 18, marginTop: 18 }}>
            {[
              rating ? { v: rating, l: "⭐ note globale" } : null,
              usersShown > 0 ? { v: `+${fmt(usersShown)}`, l: "candidats inscrits" } : null,
              offers ? { v: fmt(offers), l: "offres en ligne" } : null,
              { v: "2 min", l: "pour s'inscrire" },
            ]
              .filter((s): s is { v: string; l: string } => s !== null)
              .map((s) => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 30, fontWeight: 900, fontFamily: "var(--font-heading)" }}>{s.v}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: muted }}>{s.l}</p>
                </div>
              ))}
          </div>
          {companies && companies > 0 && (
            <p style={{ ...h2, fontSize: 19, marginTop: 34 }}>Plus de {fmt(Math.floor(companies / 100) * 100)} entreprises ont des offres sur Stageio en ce moment.</p>
          )}
        </section>
      </div>

      {/* 3. Le service */}
      <section style={{ background: "var(--color-surface)", padding: "44px 18px" }}>
        <div className="mx-auto" style={{ maxWidth: 520 }}>
          <h2 style={h2}>Ta recherche d&apos;emploi, mâchée pour toi.</h2>
          <p style={lead}>Stageio lit ton profil, trie les offres qui te correspondent et prépare ta lettre pour chacune. Tu n&apos;as plus qu&apos;à liker.</p>
          <p style={{ textAlign: "center", fontWeight: 800, margin: "22px 0 0" }}>Pensé pour toi</p>
          <FeatureCycle />
        </div>
      </section>

      <div className="mx-auto w-full" style={{ maxWidth: 520, padding: "0 18px" }}>
        {/* 4. Trois étapes */}
        <section style={{ padding: "44px 0" }}>
          <h2 style={h2}>Trois étapes, et c&apos;est parti.</h2>
          <p style={lead}>
            Dis-nous ce que tu cherches, swipe, like : <b>un like = une candidature prête</b>. De l&apos;inscription au premier like : moins de 2 minutes.
          </p>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {[
              ["Dis-nous ce que tu cherches", "Métier, ville, contrat. CV facultatif."],
              ["Swipe les offres", "Triées pour ton profil, les plus proches d'abord."],
              ["Like = candidature prête", "Ta lettre est écrite pour cette offre."],
            ].map(([t, d], i) => (
              <div key={t} className="card flex items-start" style={{ gap: 12, padding: 14 }}>
                <span className="flex items-center justify-center" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-bg)", fontWeight: 900 }}>
                  {i + 1}
                </span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800 }}>{t}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: muted }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 5. Essai */}
      <section style={{ background: "var(--color-surface)", padding: "44px 18px" }}>
        <div className="mx-auto" style={{ maxWidth: 520 }}>
          <p style={{ textAlign: "center", color: "var(--color-accent-700)", fontWeight: 800, fontSize: 13, margin: "0 0 6px", letterSpacing: ".06em" }}>ESSAIE ICI</p>
          <h2 style={h2}>Like une offre. Regarde ce qui se passe.</h2>
          <p style={lead}>Glisse à droite pour liker, à gauche pour passer.</p>
          <ol style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
            {["Ta lettre est écrite pour cette offre", "Ton CV est joint", "Ta candidature est prête à partir"].map((t, i) => (
              <li key={t} className="flex items-center" style={{ gap: 10, fontSize: 14.5, margin: "8px 0" }}>
                <span className="flex items-center justify-center" style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent-100)", color: "var(--color-accent-800)", fontWeight: 900, fontSize: 12 }}>
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
          <div style={{ maxWidth: 340, margin: "0 auto", borderRadius: 28, overflow: "hidden", boxShadow: "0 20px 44px rgba(19,43,51,.14)" }}>
            <SwipeDemo />
          </div>
          <p style={{ fontSize: 12, color: muted, textAlign: "center", margin: "10px 0 0" }}>Simulation avec des offres d&apos;exemple : rien n&apos;est envoyé.</p>
        </div>
      </section>

      <div className="mx-auto w-full" style={{ maxWidth: 520, padding: "0 18px" }}>
        {/* 6. Avis (vrais avis approuvés uniquement) */}
        {testimonials.length > 0 && (
          <section style={{ padding: "44px 0 10px" }}>
            <h2 style={h2}>Ils cherchent avec Stageio.</h2>
            {testimonials.map((t, i) => (
              <figure key={i} className="card" style={{ margin: "0 0 12px", padding: 16 }}>
                <div aria-hidden style={{ color: "#f5a623", letterSpacing: 2 }}>{"★".repeat(Math.round(t.rating))}</div>
                <blockquote style={{ margin: "8px 0", fontSize: 15, lineHeight: 1.5 }}>« {t.quote.length > 220 ? `${t.quote.slice(0, 217)}…` : t.quote} »</blockquote>
                <figcaption style={{ fontSize: 13.5 }}>
                  <b>{t.author}</b> <span style={{ color: muted }}>· avis laissé sur Stageio</span>
                </figcaption>
              </figure>
            ))}
          </section>
        )}

        {/* 7. Tarifs */}
        <section style={{ padding: "44px 0" }}>
          <h2 style={h2}>Tarifs</h2>
          <p style={lead}>Prix de bienvenue pendant 10 minutes après l&apos;inscription.</p>
          <div className="card" style={{ padding: 18, marginBottom: 12, border: "2px solid var(--color-accent)" }}>
            <span style={{ display: "inline-block", borderRadius: 999, padding: "5px 12px", fontWeight: 800, fontSize: 12.5, background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>Le plus choisi</span>
            <p style={{ margin: "10px 0 0", fontWeight: 800 }}>Premium à vie</p>
            <p style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>
              {PLAN_PRICES.lifetime.welcome} <span style={{ fontSize: 14, fontWeight: 600, color: muted }}>une seule fois</span>
            </p>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>ensuite {PLAN_PRICES.lifetime.regular}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 14px", fontSize: 14, lineHeight: 1.9 }}>
              {["Likes et candidatures illimités", "Lettres de motivation IA", "Audit de CV et matching", "Simulateur d'entretien", "Jamais de renouvellement"].map((x) => (
                <li key={x}>
                  <span style={{ color: "var(--color-accent-700)", fontWeight: 900 }}>✓</span> {x}
                </li>
              ))}
            </ul>
            <Link href="/inscription" className="btn btn-primary btn-block">
              Commencer
            </Link>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <p style={{ margin: 0, fontWeight: 800 }}>Premium mensuel</p>
            <p style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>
              {PLAN_PRICES.monthly.welcome} <span style={{ fontSize: 14, fontWeight: 600, color: muted }}>/mois</span>
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: muted }}>ensuite {PLAN_PRICES.monthly.regular}/mois · sans engagement</p>
            <Link href="/inscription" className="btn btn-block" style={{ border: "1.5px solid var(--color-divider)" }}>
              Commencer
            </Link>
          </div>
        </section>

        {/* 8. FAQ */}
        <section style={{ padding: "10px 0 44px" }}>
          <h2 style={h2}>Des questions ? Voici les réponses.</h2>
          {FAQ.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </section>

        {/* 9. Dernier appel */}
        <section style={{ borderRadius: 28, padding: "28px 18px", textAlign: "center", background: "linear-gradient(160deg, color-mix(in srgb, var(--color-accent) 14%, var(--color-bg)), color-mix(in srgb, var(--color-accent) 24%, var(--color-bg)))" }}>
          {(rating || usersShown > 0) && (
            <span style={{ display: "inline-block", background: "var(--color-bg)", borderRadius: 999, padding: "7px 14px", fontWeight: 800, fontSize: 13 }}>
              {[rating ? `⭐ ${rating}` : null, usersShown > 0 ? `+${fmt(usersShown)} candidats` : null].filter(Boolean).join(" · ")}
            </span>
          )}
          <h2 style={{ ...h2, marginTop: 14 }}>Ton prochain job t&apos;attend quelque part.</h2>
          <Link href="/inscription" className="btn btn-primary btn-block" style={{ fontSize: 16, padding: "15px 20px" }}>
            Voir les offres
          </Link>
          <p style={{ fontSize: 12.5, color: muted, margin: "10px 0 0" }}>Inscription en 2 minutes · CV facultatif</p>
        </section>

        <footer style={{ padding: "30px 0 40px", textAlign: "center", color: muted, fontSize: 13, lineHeight: 2 }}>
          <Link href="/offres">Offres</Link> · <Link href="/legal/mentions-legales">Mentions légales</Link> · <Link href="/legal/cgu">CGU</Link> · <Link href="/legal/confidentialite">Confidentialité</Link>
        </footer>
      </div>
    </main>
  );
}
