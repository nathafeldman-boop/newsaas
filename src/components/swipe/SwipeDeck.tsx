"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
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
    isTop: boolean;
    onExited: (direction: SwipeDirection) => void;
  }
>(function SwipeCard({ offer, reasons, isTop, onExited }, ref) {
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
          swipeOut("like");
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          swipeOut("pass");
        } else {
          void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }
      }}
    >
      <div
        className="card elev-lg relative h-full w-full overflow-hidden"
        style={{ padding: 0, background: "var(--color-surface)" }}
      >
        {isTop && (
          <>
            <motion.span
              style={{
                opacity: likeOpacity,
                position: "absolute",
                left: 24,
                top: 24,
                zIndex: 10,
                transform: "rotate(-12deg)",
                border: "4px solid var(--color-accent-2)",
                color: "var(--color-accent-2)",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 20,
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
                right: 24,
                top: 24,
                zIndex: 10,
                transform: "rotate(12deg)",
                border: "4px solid var(--color-neutral-500)",
                color: "var(--color-neutral-600)",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 20,
                fontFamily: "var(--font-heading)",
                pointerEvents: "none",
              }}
            >
              PASS
            </motion.span>
          </>
        )}
        <OfferCardContent offer={offer} reasons={reasons} />
      </div>
    </motion.div>
  );
});

function MatchCelebration({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -14 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            translateX: "-50%",
            zIndex: 30,
            pointerEvents: "none",
            background: "var(--color-accent-2)",
            color: "var(--color-bg)",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            padding: "10px 20px",
            borderRadius: 999,
            boxShadow: "var(--shadow-lg)",
            whiteSpace: "nowrap",
          }}
        >
          ✨ Excellent match !
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SwipeDeckInner({
  offers,
  scores,
  reasons,
  userId,
  initialSwipesToday,
  isPremium,
  quotaReached,
  onQuotaReached,
  onBrowseSwipe,
}: {
  offers: Offer[];
  scores: Record<string, number>;
  reasons: Record<string, string[]>;
  userId: string;
  initialSwipesToday: number;
  isPremium: boolean;
  quotaReached: boolean;
  onQuotaReached: () => void;
  onBrowseSwipe?: () => void;
}) {
  const router = useRouter();
  const [stack, setStack] = useState(offers);
  const [, setSwipesToday] = useState(initialSwipesToday);
  const [celebrating, setCelebrating] = useState(false);
  // Un swipe à la fois pour un compte gratuit : le quota est vérifié côté
  // serveur à chaque insertion (trigger enforce_swipe_quota), donc tant que
  // la réponse du swipe en cours n'est pas revenue, on ne sait pas encore
  // s'il a été accepté -- sans ce verrou, dragguer/cliquer vite permettait
  // d'enchaîner plusieurs cartes avant que le blocage ne soit détecté.
  const swipeInFlight = useRef(false);
  const topCardRef = useRef<SwipeCardHandle>(null);
  const celebrationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = stack.slice(0, 3);

  async function recordSwipe(offer: Offer, direction: SwipeDirection) {
    const supabase = createClient();
    const { error } = await supabase
      .from("swipes")
      .upsert(
        { user_id: userId, offer_id: offer.id, direction },
        { onConflict: "user_id,offer_id" },
      );
    swipeInFlight.current = false;
    if (error?.message.includes("SWIPE_QUOTA_REACHED")) {
      onQuotaReached();
      // Direct vers la vraie page paywall plutôt que la carte de blocage
      // inline : dès que le quota tombe, on est déjà censé y être (voir la
      // redirection équivalente au niveau layout pour toute autre page).
      router.push("/premium?limite=1");
    }
  }

  function triggerCelebration() {
    setCelebrating(true);
    if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
    celebrationTimeout.current = setTimeout(() => setCelebrating(false), 1300);
  }

  function handleSwipeIntent(direction: SwipeDirection) {
    if (quotaReached && !isPremium) return;
    if (!isPremium && swipeInFlight.current) return;
    const offer = stack[0];
    if (!offer) return;
    if (!isPremium) swipeInFlight.current = true;
    void recordSwipe(offer, direction);
    setSwipesToday((n) => n + 1);
    onBrowseSwipe?.();
    if (direction === "like" && (scores[offer.id] ?? 0) >= CELEBRATION_THRESHOLD) {
      triggerCelebration();
    }
    topCardRef.current?.swipeOut(direction);
  }

  function handleExited(offerId: string) {
    setStack((prev) => prev.filter((o) => o.id !== offerId));
  }

  // Quota atteint OU plus rien à swiper : pour un compte gratuit, dans les
  // deux cas il n'y a plus rien à faire ici sans passer Premium — un
  // "reviens plus tard" passif serait une impasse plutôt qu'une relance.
  if (!isPremium && (quotaReached || visible.length === 0)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-16">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          aria-hidden
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "var(--color-accent-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          🔒
        </motion.div>
        <h2 style={{ fontSize: 22, marginTop: 20 }}>
          {quotaReached ? "Tu as utilisé tes swipes gratuits" : "Plus d'offres pour l'instant"}
        </h2>
        <p style={{ marginTop: 8, maxWidth: "34ch", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          {quotaReached
            ? "Passe Premium pour swiper sans limite et générer tes lettres de motivation à volonté. Tu peux toujours candidater librement aux offres déjà vues."
            : "On en ajoute régulièrement. Passe Premium pour swiper sans limite dès qu'elles arrivent, et débloquer les lettres de motivation générées par IA."}
        </p>
        <Link href="/premium" className="btn btn-gradient mt-6">
          Passer en illimité
        </Link>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20">
        <p className="text-4xl">🎉</p>
        <h2 style={{ fontSize: 22, marginTop: 16 }}>Tu as vu toutes les offres du moment</h2>
        <p style={{ marginTop: 8, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Reviens un peu plus tard, on en ajoute régulièrement.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative h-[clamp(360px,66dvh,520px)] w-full max-w-sm">
        <MatchCelebration show={celebrating} />
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
                  isTop={isTop}
                  onExited={() => handleExited(offer.id)}
                />
              </motion.div>
            );
          })}
      </div>

      {/* Juste passer/aimer ici : postuler et voir l'offre externe vivent sur
          /favoris une fois l'offre likée, pas sur l'écran de swipe lui-même
          -- swipe reste le geste rapide, candidater est une décision à part. */}
      <div className="mt-7 flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleSwipeIntent("pass")}
          aria-label="Passer"
          className="btn btn-icon btn-secondary"
          style={{ width: 56, height: 56, borderRadius: "50%", fontSize: 22 }}
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => handleSwipeIntent("like")}
          aria-label="Aimer"
          className="btn btn-icon btn-secondary"
          style={{ width: 56, height: 56, borderRadius: "50%", fontSize: 22 }}
        >
          🤍
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
  quotaReached = false,
  remainingSwipes = null,
  cityBanner = null,
  sectorLabel = null,
}: {
  offers: Offer[];
  scores: Record<string, number>;
  reasons?: Record<string, string[]>;
  userId: string;
  swipesToday?: number;
  isPremium?: boolean;
  quotaReached?: boolean;
  remainingSwipes?: number | null;
  cityBanner?: string | null;
  sectorLabel?: string | null;
}) {
  const [contractFilter, setContractFilter] = useState<ContractType | "all">("all");
  // Compteur de swipes restants affiché en haut de l'écran (pill "📱 3") :
  // vit ici plutôt que dans SwipeDeckInner car ce dernier est remonté
  // (key={contractFilter}) à chaque changement de filtre Stage/Alternance,
  // ce qui réinitialiserait le compteur alors que le quota, lui, ne l'est
  // pas.
  const [remaining, setRemaining] = useState(remainingSwipes);
  // Même raison que `remaining` ci-dessus : si ce flag vivait dans
  // SwipeDeckInner (comme avant), changer de filtre une fois le quota
  // atteint le remontait avec sa valeur initiale (donc "non atteint") et
  // débloquait le swipe -- bug réel signalé en prod ("plus de 10 swipes
  // gratuits"). Hissé ici, il ne peut plus être remis à zéro par un simple
  // changement de filtre.
  const [quotaHit, setQuotaHit] = useState(quotaReached);
  // `quotaHit` ne devient vrai qu'après un swipe REJETÉ par le serveur --
  // mais le compteur `remaining` touche déjà 0 sur le DERNIER swipe accepté,
  // avant tout rejet. Si le pool d'offres restant est petit, cette dernière
  // carte swipée peut aussi vider `stack` en même temps : l'écran de blocage
  // s'affichait alors quand même (via visible.length===0) mais avec le
  // mauvais message ("Plus d'offres" au lieu de "Tu as utilisé tes swipes
  // gratuits"), puisque `quotaHit` seul ne reflète pas encore la réalité --
  // bug réel signalé en prod. `remaining === 0` est un signal tout aussi
  // fiable (décrémenté en miroir exact des vrais swipes de découverte) et
  // disponible immédiatement, sans attendre un rejet.
  const quotaReallyReached = quotaHit || remaining === 0;

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
        {offers.length > 0 && (
          <p
            className="flex items-center gap-1.5"
            style={{ margin: 0, fontSize: 13.5, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
          >
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)" }} />
            {offers.length} offre{offers.length > 1 ? "s" : ""} disponible{offers.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {(remaining !== null || sectorLabel) && (
        <div className="mt-4 mb-1 flex items-center gap-2">
          {remaining !== null && (
            <span className="tag tag-accent" style={{ fontVariantNumeric: "tabular-nums" }}>
              📱 {remaining}
            </span>
          )}
          {sectorLabel && <span className="tag tag-neutral">{sectorLabel}</span>}
        </div>
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
        quotaReached={quotaReallyReached}
        onQuotaReached={() => setQuotaHit(true)}
        onBrowseSwipe={() =>
          setRemaining((n) => (n === null ? n : Math.max(0, n - 1)))
        }
      />
    </div>
  );
}
