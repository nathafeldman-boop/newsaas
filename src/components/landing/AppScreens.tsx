import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

// Vraies captures de l'appli (14/10, demande de Nathan : plus de maquettes
// codées ni d'émojis pour montrer le produit). Rendu des vrais composants
// (SwipeDeck, LikeChoiceSheet, CoverLetterPanel) avec de vraies offres
// publiques Stageio, sur un écran de téléphone de 390 × 844 px.
const SCREENS = [
  {
    src: "/app/swipe.png",
    step: "01",
    title: "Swipe les offres faites pour toi",
    text: "Ton métier, ta ville, ton niveau : chaque offre affiche son % de compatibilité et pourquoi elle te correspond.",
    alt: "Écran Stageio : offre d'alternance de chargé commercial à Lyon chez Groupe Restalliance, compatible à 94 %",
    premium: false,
  },
  {
    src: "/app/like.png",
    step: "02",
    title: "Un like lance ta candidature",
    text: "Tu choisis : postuler tout de suite, ou garder l'offre en favori pour plus tard.",
    alt: "Écran Stageio : après un like, choix entre « Postuler directement » et « Juste mettre en favori »",
    premium: true,
  },
  {
    src: "/app/candidature.png",
    step: "03",
    title: "Ta lettre est déjà écrite",
    text: "Une lettre pour cette offre, à partir de ton profil. « Postuler sur le site » la copie et ouvre l'offre.",
    alt: "Écran Stageio : lettre de motivation prête pour l'offre de chargé commercial chez Groupe Restalliance",
    premium: true,
  },
];

export function AppScreens() {
  return (
    <div className="mt-9 grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
      {SCREENS.map((screen, i) => (
        <Reveal key={screen.src} delay={i * 0.08}>
          <figure className="m-0 flex flex-col items-center">
            <div
              style={{
                width: "min(100%, 270px)",
                padding: 8,
                borderRadius: 40,
                background: "var(--color-neutral-900)",
                boxShadow: "0 24px 48px color-mix(in srgb, var(--color-text) 18%, transparent)",
              }}
            >
              <Image
                src={screen.src}
                alt={screen.alt}
                width={780}
                height={1688}
                sizes="(max-width: 640px) 80vw, 270px"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: 32 }}
              />
            </div>
            <figcaption style={{ marginTop: 20, textAlign: "center", maxWidth: 300 }}>
              <span className="flex items-center justify-center gap-2.5">
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-accent)" }}>{screen.step}</span>
                <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>{screen.title}</span>
              </span>
              <span
                style={{
                  display: "block",
                  margin: "8px 0 0",
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: "color-mix(in srgb, var(--color-text) 68%, transparent)",
                }}
              >
                {screen.text}
                {screen.premium && (
                  <span className="tag tag-accent" style={{ marginLeft: 6, fontSize: 11, verticalAlign: "1px" }}>
                    Premium
                  </span>
                )}
              </span>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
