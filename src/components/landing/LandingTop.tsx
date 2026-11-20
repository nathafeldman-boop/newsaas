import Link from "next/link";
import { LandingSignup } from "@/components/landing/LandingSignup";

// Haut de la page d'accueil (20/11, checklist « La landing qui convertit » de
// l'incubateur, validée par Nathan sur maquette) : hero en dégradé vert animé,
// vraies offres au-dessus de la promesse, inscription Google tout de suite,
// preuves réelles, trois bénéfices (une phrase + un visuel), CTA final.
// Un seul vert (--color-accent), une seule police (celle du site).

export type HeroOffer = { id: string; title: string; company: string; city: string; contract: string };

const CONTRACT: Record<string, string> = { cdi: "CDI", cdd: "CDD", alternance: "Alternance", stage: "Stage" };

const css = `
.lp2-hero{position:relative;overflow:hidden;color:#fff;padding:28px 0 52px;background:linear-gradient(130deg,#0b7a43,var(--color-accent),#2fb06a,var(--color-accent),#0b7a43);background-size:300% 300%;animation:lp2flow 14s ease infinite}
@keyframes lp2flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.lp2-wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.lp2-nav{display:flex;justify-content:space-between;align-items:center;height:44px;margin-bottom:18px}
.lp2-logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:20px;color:#fff;text-decoration:none;letter-spacing:-.02em}
.lp2-logo i{width:9px;height:9px;border-radius:50%;background:#fff}
.lp2-nav a.lp2-login{color:#fff;font-weight:700;font-size:14px;opacity:.92}
.lp2-grid{display:grid;gap:26px;align-items:center}
.lp2-stack{position:relative;height:190px;max-width:340px;width:100%;margin:0 auto;order:-1}
.lp2-card{position:absolute;left:0;right:0;margin:auto;width:88%;background:#fff;color:#0d1b14;border-radius:20px;padding:18px;box-shadow:0 18px 40px rgba(0,0,0,.18)}
.lp2-tag{display:inline-block;font-size:11.5px;font-weight:800;color:#0b7a43;background:#e8f7ef;border-radius:999px;padding:4px 10px}
.lp2-card h3{font-size:16.5px;line-height:1.3;margin:10px 0 4px;font-weight:800}
.lp2-card p{font-size:13px;color:#5b6b63;margin:0}
.lp2-row{display:flex;justify-content:space-between;margin-top:14px}
.lp2-btn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:20px;font-weight:800}
.lp2-no{background:#f2f4f3;color:#9aa6a0}.lp2-yes{background:var(--color-accent);color:#fff}
.lp2-c1{top:34px;transform:rotate(-5deg) scale(.92);opacity:.75}
.lp2-c2{top:20px;transform:rotate(4deg) scale(.96);opacity:.9}
.lp2-c3{top:0;animation:lp2swipe 4.5s ease-in-out infinite}
@keyframes lp2swipe{0%,55%{transform:translateX(0) rotate(0);opacity:1}75%{transform:translateX(120%) rotate(14deg);opacity:0}76%,100%{transform:translateX(0) rotate(0);opacity:1}}
.lp2-stamp{position:absolute;top:18px;right:18px;border:3px solid var(--color-accent);color:var(--color-accent);font-weight:800;border-radius:8px;padding:2px 8px;transform:rotate(12deg);font-size:14px;animation:lp2stamp 4.5s ease-in-out infinite;opacity:0}
@keyframes lp2stamp{0%,40%{opacity:0}50%,70%{opacity:1}71%,100%{opacity:0}}
.lp2-h1{font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-.02em;margin:0}
.lp2-sub{font-size:17px;line-height:1.45;margin:12px 0 0;opacity:.95;max-width:30ch}
.lp2-ctas{margin-top:22px}
.lp2-proof{margin-top:18px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13.5px;font-weight:700;opacity:.95}
.lp2-b{padding:52px 0 0}
.lp2-b .lp2-wrap{display:grid;gap:20px;align-items:center}
.lp2-b .lp2-wrap>*,.lp2-grid>*{min-width:0}
.lp2-b h2{font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.01em;margin:0}
.lp2-b h2 em{font-style:normal;color:var(--color-accent)}
.lp2-lead{color:color-mix(in srgb,var(--color-text) 65%,transparent);font-size:16px;margin:8px 0 0;max-width:34ch;line-height:1.45}
.lp2-visual{background:color-mix(in srgb,var(--color-accent) 10%,var(--color-bg));border-radius:24px;padding:22px}
.lp2-chips{display:flex;flex-wrap:wrap;gap:8px}
.lp2-chip{background:var(--color-bg);border-radius:999px;padding:9px 14px;font-weight:800;font-size:14px}
.lp2-chip b{color:var(--color-accent)}
.lp2-letter{background:var(--color-bg);border-radius:16px;padding:16px;font-size:13.5px;line-height:1.55}
.lp2-hl{background:color-mix(in srgb,var(--color-accent) 14%,transparent);border-radius:4px;padding:0 3px}
.lp2-track{display:grid;gap:8px}
.lp2-trow{min-width:0;background:var(--color-bg);border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13.5px;font-weight:700}
.lp2-st{font-size:12px;font-weight:800;border-radius:999px;padding:4px 10px;background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent);white-space:nowrap}
.lp2-final{margin:56px 0 0;background:#0d1b14;color:#fff;text-align:center;padding:52px 20px}
.lp2-final h2{font-size:28px;font-weight:800;margin:0 0 20px}
.lp2-final .lp2-center{display:flex;justify-content:center}
@media (min-width:900px){
 .lp2-hero{padding:28px 0 84px}
 .lp2-grid{grid-template-columns:1.05fr .95fr}
 .lp2-stack{order:2;height:300px;max-width:380px}
 .lp2-h1{font-size:54px}
 .lp2-b .lp2-wrap{grid-template-columns:1fr 1fr;gap:56px}
 .lp2-b.lp2-rev .lp2-visual{order:-1}
}
@media (prefers-reduced-motion:reduce){.lp2-hero,.lp2-c3,.lp2-stamp{animation:none}.lp2-stamp{opacity:0}}
`;

export function LandingTop({
  offers,
  activeOffers,
  cdi,
  cdd,
  users,
  rating,
}: {
  offers: HeroOffer[];
  activeOffers: number | null;
  cdi: number | null;
  cdd: number | null;
  users: number | null;
  rating: number | null;
}) {
  const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");
  // Intitulé court pour la lettre : « Vendeur en boulangerie Samedi - CDI - Paris » → « vendeur en boulangerie samedi ».
  const shortTitle = (t: string) => {
    const head = t.split(/\s[-–—]\s/)[0].trim();
    return head.charAt(0).toLowerCase() + head.slice(1);
  };
  const [top, mid, back] = offers;
  const usersRounded = users && users >= 100 ? Math.floor(users / 100) * 100 : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <section className="lp2-hero">
        <div className="lp2-wrap">
          <nav className="lp2-nav">
            <Link href="/" className="lp2-logo">
              <i aria-hidden />
              Stageio
            </Link>
            <Link href="/login" className="lp2-login">
              Se connecter
            </Link>
          </nav>
          <div className="lp2-grid">
            {top && (
              <div className="lp2-stack" aria-hidden>
                {back && (
                  <div className="lp2-card lp2-c1">
                    <span className="lp2-tag">{CONTRACT[back.contract] ?? back.contract}</span>
                    <h3>{back.title}</h3>
                    <p>
                      {back.company} · {back.city}
                    </p>
                  </div>
                )}
                {mid && (
                  <div className="lp2-card lp2-c2">
                    <span className="lp2-tag">{CONTRACT[mid.contract] ?? mid.contract}</span>
                    <h3>{mid.title}</h3>
                    <p>
                      {mid.company} · {mid.city}
                    </p>
                  </div>
                )}
                <div className="lp2-card lp2-c3">
                  <span className="lp2-stamp">JE POSTULE</span>
                  <span className="lp2-tag">{CONTRACT[top.contract] ?? top.contract}</span>
                  <h3>{top.title}</h3>
                  <p>
                    {top.company} · {top.city}
                  </p>
                  <div className="lp2-row">
                    <span className="lp2-btn lp2-no">✕</span>
                    <span className="lp2-btn lp2-yes">♥</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h1 className="lp2-h1">
                Ton premier job,
                <br />
                sans y passer tes soirées.
              </h1>
              <p className="lp2-sub">Tu swipes les offres faites pour toi. Ta lettre est prête en 1 clic.</p>
              <div className="lp2-ctas">
                <LandingSignup />
              </div>
              <div className="lp2-proof">
                {rating !== null && <span>★ {String(rating).replace(".", ",")}/5 note globale</span>}
                {usersRounded && <span>+{fmt(usersRounded)} candidats</span>}
                {activeOffers ? <span>{fmt(activeOffers)} offres en ligne</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp2-b">
        <div className="lp2-wrap">
          <div>
            <h2>
              Que des offres <em>pour toi.</em>
            </h2>
            <p className="lp2-lead">CDI, CDD, alternance ou stage, près de chez toi, ouverts aux débutants.</p>
          </div>
          <div className="lp2-visual">
            <div className="lp2-chips">
              {cdi ? (
                <Link href="/offres/cdi" className="lp2-chip" style={{ color: "inherit", textDecoration: "none" }}>
                  <b>{fmt(cdi)}</b> CDI
                </Link>
              ) : null}
              {cdd ? (
                <Link href="/offres/cdd" className="lp2-chip" style={{ color: "inherit", textDecoration: "none" }}>
                  <b>{fmt(cdd)}</b> CDD
                </Link>
              ) : null}
              <Link href="/offres/alternance" className="lp2-chip" style={{ color: "inherit", textDecoration: "none" }}>
                Alternance
              </Link>
              <Link href="/offres/stage" className="lp2-chip" style={{ color: "inherit", textDecoration: "none" }}>
                Stage
              </Link>
              <span className="lp2-chip">📍 Près de chez toi</span>
              <span className="lp2-chip">🎓 Débutant accepté</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lp2-b lp2-rev">
        <div className="lp2-wrap">
          <div>
            <h2>
              Ta lettre, <em>écrite pour chaque offre.</em>
            </h2>
            <p className="lp2-lead">Le métier, l&apos;entreprise et ton profil. Tu relis, tu envoies.</p>
          </div>
          <div className="lp2-visual">
            <div className="lp2-letter">
              Madame, Monsieur,
              <br />
              <br />
              Votre offre de <span className="lp2-hl">{top ? shortTitle(top.title) : "vendeur"}</span>
              {top ? (
                <>
                  {" "}
                  chez <span className="lp2-hl">{top.company}</span>
                </>
              ) : null}{" "}
              a retenu toute mon attention : le contact avec les clients et le travail en équipe sont exactement ce que je recherche…
            </div>
          </div>
        </div>
      </section>

      <section className="lp2-b">
        <div className="lp2-wrap">
          <div>
            <h2>
              Tout est <em>suivi.</em>
            </h2>
            <p className="lp2-lead">Tes candidatures, les réponses, les relances. Rien ne se perd.</p>
          </div>
          <div className="lp2-visual">
            <div className="lp2-track">
              {[
                [top?.title, "Envoyée"],
                [mid?.title, "Relance prévue"],
                [back?.title, "Entretien"],
              ]
                .filter(([t]) => t)
                .map(([t, s]) => (
                  <div className="lp2-trow" key={s}>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t}</span>
                    <span className="lp2-st">{s}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp2-final">
        <h2>Ton prochain job t&apos;attend.</h2>
        <div className="lp2-center">
          <LandingSignup />
        </div>
      </section>
    </>
  );
}
