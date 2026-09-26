"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { logButtonClick } from "@/lib/analytics/logButtonClick";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { OfferCardContent } from "@/components/swipe/OfferCard";
import { cn } from "@/lib/utils";
import type { ContractType, Offer, SwipeDirection } from "@/types/database";

const SWIPE_THRESHOLD = 120;
const EXIT_DISTANCE = 600;
const CELEBRATION_THRESHOLD = 90;

export interface SwipeCardHandle {
  swipeOut: (direction: SwipeDirection) => void;
}

const SwipeCard = forwardRef<
  SwipeCardHandle,
  {
    offer: Offer;
    reasons?: string[];
    score?: number;
    isTop: boolean;
    isPremium: boolean;
    onExited: (direction: SwipeDirection) => void;
    // Déclenché quand un DRAG physique (pas un clic bouton) franchit le
    // seuil -- doit passer par le même chemin que les boutons (voir
    // handleSwipeIntent côté parent : enregistrement du swipe, célébration
    // de match). Sans ça, glisser une carte l'animait hors de l'écran sans
    // jamais appeler recordSwipe -- swipe perdu côté serveur, offre qui
    // réapparaît au chargement suivant. Bug réel trouvé à l'audit du
    // 2026-09-25.
    //
    // Retourne false quand l'action est refusée (like/candidature sans
    // Premium, voir hard paywall) : dans ce cas la carte n'est jamais
    // éjectée, seul le clic/drag est intercepté et redirigé vers /premium.
    onSwipeIntent: (direction: SwipeDirection) => boolean;
  }
>(function SwipeCard({ offer, reasons, score, isTop, isPremium, onExited, onSwipeIntent }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -20], [1, 0]);

  function swipeOut(direction: SwipeDirection) {
    void animate(x, direction === "like" ? EXIT_DISTANCE : -EXIT_DISTANCE, {
      duration: 0.3,
      ease: "easeIn",
      onComplete: () => onExited(direction),
    });
  }

  useImperativeHandle(ref, () => ({ swipeOut }));

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) {
          const accepted = onSwipeIntent("like");
          if (!accepted) void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          onSwipeIntent("pass");
        } else {
          void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }
      }}
    >
      <div
        className="card elev-lg relative h-full w-full overflow-hidden"
        style={{ padding: 0, background: "var(--color-neutral-100)" }}
      >
        {isTop && (
          <>
            <motion.span
              style={{
                opacity: likeOpacity,
                position: "absolute",
                left: 20,
                top: 92,
                zIndex: 10,
                transform: "rotate(-12deg)",
                border: "3px solid var(--color-accent)",
                color: "var(--color-accent)",
                background: "var(--color-accent-100)",
                borderRadius: 10,
                padding: "2px 12px",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-heading)",
                pointerEvents: "none",
              }}
            >
              LIKE
            </motion.span>
            <motion.span
              style={{
                opacity: passOpacity,
                position: "absolute",
                right: 20,
                top: 92,
                zIndex: 10,
                transform: "rotate(12deg)",
                border: "3px solid var(--color-neutral-500)",
                color: "var(--color-neutral-600)",
                background: "var(--color-neutral-100)",
                borderRadius: 10,
                padding: "2px 12px",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-heading)",
                pointerEvents: "none",
              }}
            >
              PASS
            </motion.span>
          </>
        )}
        <OfferCardContent offer={offer} reasons={reasons} score={score} isPremium={isPremium} />
      </div>
    </motion.div>
  );
});

function MatchModal({
  offer,
  score,
  onApply,
  onClose,
}: {
  offer: Offer | null;
  score: number;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "color-mix(in srgb, var(--color-neutral-900) 55%, transparent)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "var(--color-neutral-100)",
              borderRadius: 28,
              padding: "28px 22px 20px",
              textAlign: "center",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                fontSize: 30,
              }}
            >
              🎉
            </span>
            <p
              style={{
                margin: "16px 0 0",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-accent-700)",
              }}
            >
              {score}% de compatibilité
            </p>
            <h2 style={{ margin: "6px 0 0", fontSize: 27, fontWeight: 800, letterSpacing: "-0.03em" }}>
              Excellent match !
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                lineHeight: 1.5,
                color: "color-mix(in srgb, var(--color-text) 68%, transparent)",
              }}
            >
              Ton profil colle presque parfaitement à <strong style={{ color: "var(--color-text)" }}>{offer.title}</strong>{" "}
              chez {offer.company}.
            </p>
            <button
              type="button"
              onClick={onApply}
              className="btn btn-gradient btn-block"
              style={{ marginTop: 20 }}
            >
              ✈️ Postuler maintenant
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 8,
                width: "100%",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 10,
                fontSize: 14,
                fontWeight: 700,
                color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
              }}
            >
              Continuer à swiper
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Prochaine ingestion d'offres : sync-adzuna tourne tous les jours à 4h UTC
// (voir vercel.json), la plus précoce des deux crons qui ajoutent des
// offres -- sert de base pour dire aux Premium à court d'offres quand en
// attendre de nouvelles, plutôt qu'un vague "reviens plus tard". Calculé en
// useEffect (jamais dans le render direct) pour éviter tout mismatch
// d'hydratation entre l'heure serveur et l'heure client.
function useNextOffersEta(): string | null {
  const [eta, setEta] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(4, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const hours = Math.max(1, Math.round((next.getTime() - now.getTime()) / 3_600_000));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEta(hours <= 1 ? "d'ici moins d'une heure" : `d'ici environ ${hours}h`);
  }, []);
  return eta;
}

function SwipeDeckInner({
  offers,
  scores,
  reasons,
  userId,
  initialSwipesToday,
  isPremium,
  onStackChange,
}: {
  offers: Offer[];
  scores: Record<string, number>;
  reasons: Record<string, string[]>;
  userId: string;
  initialSwipesToday: number;
  isPremium: boolean;
  onStackChange?: (count: number) => void;
}) {
  const router = useRouter();
  const [stack, setStack] = useState(offers);
  const [, setSwipesToday] = useState(initialSwipesToday);
  // Offre à l'origine du modal de célébration (≥ CELEBRATION_THRESHOLD) --
  // on garde l'offre entière (pas juste un booléen) pour pouvoir afficher
  // son titre/entreprise et proposer "Postuler maintenant" directement
  // depuis le modal, comme le fait le prototype de design.
  const [celebratingOffer, setCelebratingOffer] = useState<Offer | null>(null);
  const topCardRef = useRef<SwipeCardHandle>(null);

  const visible = stack.slice(0, 3);
  const eta = useNextOffersEta();

  // Remonté au parent (voir SwipeDeck) pour afficher un compteur qui
  // décroît vraiment à chaque swipe, juste au-dessus des cartes -- ce
  // composant est remonté (key={contractFilter}) à chaque changement de
  // filtre, donc cet effet retransmet aussi la bonne valeur de départ dès
  // le montage sur le nouveau filtre.
  useEffect(() => {
    onStackChange?.(stack.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack.length]);

  async function recordSwipe(offer: Offer, direction: SwipeDirection) {
    const supabase = createClient();
    const { error } = await supabase
      .from("swipes")
      .upsert(
        { user_id: userId, offer_id: offer.id, direction },
        { onConflict: "user_id,offer_id" },
      );
    if (error) {
      // La carte est déjà retirée de l'écran de façon optimiste (voir
      // topCardRef.current?.swipeOut ci-dessous) avant même que cette
      // requête ne reparte -- sans ce log, un swipe qui échoue disparaît
      // silencieusement (aucune trace ni côté utilisateur ni côté serveur).
      console.error("recordSwipe failed", error, { offerId: offer.id, direction });
    }
  }

  // Hard paywall (pas d'essai gratuit, voir RETENTION_AUDIT.md) : "pass" est
  // de la pure navigation, jamais limité -- un compte gratuit peut parcourir
  // tout le deck. "like" (= mettre en favori) est réservé aux Premium ; pour
  // un compte gratuit, on n'enregistre jamais le swipe et on renvoie tout de
  // suite vers /premium plutôt que de laisser la carte sortir de l'écran
  // (voir SwipeCard : la carte revient au centre quand ceci renvoie false).
  // Miroir du trigger SQL enforce_swipe_quota (voir supabase/migrations) qui
  // referait le même refus si jamais ce check client était contourné.
  function handleSwipeIntent(direction: SwipeDirection): boolean {
    const offer = stack[0];
    if (!offer) return false;

    if (direction === "like" && !isPremium) {
      void logButtonClick(userId, "premium_cta", { source: "swipe_like" });
      router.push("/premium?source=swipe_like");
      return false;
    }

    void recordSwipe(offer, direction);
    setSwipesToday((n) => n + 1);
    if (direction === "like" && (scores[offer.id] ?? 0) >= CELEBRATION_THRESHOLD) {
      setCelebratingOffer(offer);
    }
    topCardRef.current?.swipeOut(direction);
    return true;
  }

  // Bouton "postuler" du milieu (voir design mobile) : réservé aux Premium
  // au même titre que "like" -- candidater n'est plus gratuit (voir hard
  // paywall). Pour un compte gratuit, renvoie directement vers /premium sans
  // toucher à la carte ni enregistrer quoi que ce soit.
  function handleApplyIntent() {
    if (!isPremium) {
      void logButtonClick(userId, "premium_cta", { source: "swipe_apply" });
      router.push("/premium?source=swipe_apply");
      return;
    }
    const offer = stack[0];
    if (!offer) return;
    void recordSwipe(offer, "like");
    setSwipesToday((n) => n + 1);
    router.push(`/candidature/${offer.id}`);
  }

  function handleExited(offerId: string) {
    setStack((prev) => prev.filter((o) => o.id !== offerId));
  }

  // Deck épuisé : plus rien à parcourir pour l'instant. Sous hard paywall,
  // un compte gratuit peut arriver ici aussi (la navigation n'est plus
  // plafonnée) -- même écran pour tout le monde, seul le CTA change : un
  // Premium est renvoyé s'entraîner à l'entretien, un compte gratuit vers
  // /premium (il n'a encore rien pu liker/candidater tant qu'il ne l'a pas
  // pris).
  if (visible.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20">
        <p className="text-4xl">🎉</p>
        <h2 style={{ fontSize: 22, marginTop: 16 }}>Tu as vu toutes les offres du moment</h2>
        <p style={{ marginTop: 8, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          {eta ? `De nouvelles offres arrivent ${eta}.` : "On en ajoute régulièrement."}
        </p>
        {isPremium ? (
          <>
            <p style={{ marginTop: 6, fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              En attendant, entraîne-toi pour ton prochain entretien.
            </p>
            <Link
              href="/dashboard"
              className="btn btn-gradient mt-6"
              onClick={() => void logButtonClick(userId, "interview_practice_cta", { source: "swipe_empty_deck" })}
            >
              🎤 M&apos;entraîner à l&apos;entretien
            </Link>
          </>
        ) : (
          <>
            <p style={{ marginTop: 6, maxWidth: "34ch", fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              Passe Premium pour liker, candidater et générer tes lettres de motivation à volonté.
            </p>
            <PremiumCtaLink userId={userId} source="swipe_empty_deck" className="btn btn-gradient mt-6">
              Passer Premium
            </PremiumCtaLink>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative h-[clamp(360px,66dvh,520px)] w-full max-w-sm">
        <MatchModal
          offer={celebratingOffer}
          score={celebratingOffer ? (scores[celebratingOffer.id] ?? 0) : 0}
          onApply={() => {
            if (!celebratingOffer) return;
            router.push(`/candidature/${celebratingOffer.id}`);
          }}
          onClose={() => setCelebratingOffer(null)}
        />
        {visible
          .slice()
          .reverse()
          .map((offer, i) => {
            const indexFromTop = visible.length - 1 - i;
            const isTop = indexFromTop === 0;
            return (
              <motion.div
                key={offer.id}
                className="absolute inset-0"
                style={{ zIndex: 10 - indexFromTop }}
                animate={{
                  scale: 1 - indexFromTop * 0.04,
                  y: indexFromTop * 10,
                }}
              >
                <SwipeCard
                  ref={isTop ? topCardRef : undefined}
                  offer={offer}
                  reasons={reasons[offer.id]}
                  score={scores[offer.id]}
                  isTop={isTop}
                  isPremium={isPremium}
                  onExited={() => handleExited(offer.id)}
                  onSwipeIntent={handleSwipeIntent}
                />
              </motion.div>
            );
          })}
      </div>

      <div className="mt-7 flex items-center gap-5">
        <button
          type="button"
          onClick={() => handleSwipeIntent("pass")}
          aria-label="Passer"
          className="btn btn-icon btn-secondary"
          style={{ width: 58, height: 58, borderRadius: "50%", fontSize: 22 }}
        >
          ✕
        </button>
        <button
          type="button"
          onClick={handleApplyIntent}
          aria-label="Postuler"
          className="btn btn-icon"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 18,
            border: "1px solid color-mix(in srgb, var(--color-accent-2) 35%, transparent)",
            background: "var(--color-accent-2-100)",
            color: "var(--color-accent-2-700)",
          }}
        >
          ✈️
        </button>
        <button
          type="button"
          onClick={() => handleSwipeIntent("like")}
          aria-label="Aimer"
          className="btn btn-icon"
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            fontSize: 28,
            border: "none",
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
            color: "var(--color-bg)",
            boxShadow: "0 8px 20px color-mix(in srgb, var(--color-accent) 35%, transparent)",
          }}
        >
          ♥
        </button>
      </div>
    </div>
  );
}

export function SwipeDeck({
  offers,
  scores,
  reasons = {},
  userId,
  swipesToday = 0,
  isPremium = false,
  cityBanner = null,
  sectorLabel = null,
  applicationStreak = 0,
}: {
  offers: Offer[];
  scores: Record<string, number>;
  reasons?: Record<string, string[]>;
  userId: string;
  swipesToday?: number;
  isPremium?: boolean;
  cityBanner?: string | null;
  sectorLabel?: string | null;
  applicationStreak?: number;
}) {
  const [contractFilter, setContractFilter] = useState<ContractType | "all">("all");
  // Compteur d'offres restantes DANS LE DECK EN COURS, affiché juste
  // au-dessus des cartes -- vit ici (pas dans SwipeDeckInner) : ce dernier
  // est remonté à chaque changement de filtre Stage/Alternance, donc son
  // propre state `stack` ne peut pas nourrir directement un texte qui doit
  // rester affiché en continu. Initialisé à la taille du deck non filtré :
  // la valeur exacte pour le filtre "all" par défaut, corrigée immédiatement
  // par le premier appel de `onStackChange` sinon (montage ou changement de
  // filtre).
  const [cardsLeft, setCardsLeft] = useState(offers.length);

  const filteredOffers =
    contractFilter === "all"
      ? offers
      : offers.filter((o) => o.contract_type === contractFilter);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-sm">
        {/* Le wordmark Stageio est déjà dans AppNav sur desktop (sm:flex) --
            répété ici seulement en mobile, seul endroit où AppNav est masqué. */}
        <div className="flex items-center gap-1.5 sm:hidden">
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Stageio
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: "14px 0 4px" }}>
          Tes opportunités du jour
        </h1>
        {cardsLeft > 0 && (
          <p
            className="flex items-center gap-1.5"
            style={{ margin: 0, fontSize: 13.5, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
          >
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)" }} />
            {cardsLeft} offre{cardsLeft > 1 ? "s" : ""} restante{cardsLeft > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {(!isPremium || sectorLabel || applicationStreak > 0) && (
        <div className="mt-4 mb-1 flex items-center gap-2">
          {!isPremium && (
            // Hard paywall (pas d'essai gratuit) : rappel permanent plutôt
            // qu'un compteur de swipes restants (retiré, la navigation n'est
            // plus plafonnée) -- la carte elle-même porte déjà le flou/teaser
            // (voir OfferCard), ce tag rappelle juste pourquoi.
            <PremiumCtaLink userId={userId} source="swipe_banner" className="tag tag-accent">
              🔒 Premium débloque like &amp; candidature
            </PremiumCtaLink>
          )}
          {sectorLabel && <span className="tag tag-neutral">{sectorLabel}</span>}
          {applicationStreak > 0 && (
            <span className="tag tag-accent" style={{ fontVariantNumeric: "tabular-nums" }}>
              🔥 {applicationStreak} j
            </span>
          )}
        </div>
      )}
      {applicationStreak > 0 && (
        <p
          style={{
            marginTop: 2,
            marginBottom: 4,
            fontSize: 12,
            textAlign: "center",
            maxWidth: "34ch",
            color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
          }}
        >
          Série de {applicationStreak} jour{applicationStreak > 1 ? "s" : ""} avec une candidature —
          postule aujourd&apos;hui pour la faire durer.
        </p>
      )}
      <div className="seg mt-4 mb-5">
        {(["all", "stage", "alternance"] as const).map((type) => (
          <label
            key={type}
            className={cn("seg-opt", contractFilter === type && "is-active")}
          >
            <input
              type="radio"
              name="contract-filter"
              checked={contractFilter === type}
              onChange={() => setContractFilter(type)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            {type === "alternance" ? "Alternance" : type === "stage" ? "Stage" : "Les deux"}
          </label>
        ))}
      </div>
      {cityBanner && (
        <p
          style={{
            marginTop: -8,
            marginBottom: 16,
            fontSize: 12,
            textAlign: "center",
            maxWidth: "34ch",
            color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
          }}
        >
          📍 {cityBanner}
        </p>
      )}
      <SwipeDeckInner
        key={contractFilter}
        offers={filteredOffers}
        scores={scores}
        reasons={reasons}
        userId={userId}
        initialSwipesToday={swipesToday}
        isPremium={isPremium}
        onStackChange={setCardsLeft}
      />
    </div>
  );
}
