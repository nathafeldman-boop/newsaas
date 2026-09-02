"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
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
    matchScore?: number;
    isTop: boolean;
    onExited: (direction: SwipeDirection) => void;
  }
>(function SwipeCard({ offer, matchScore, isTop, onExited }, ref) {
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
        <OfferCardContent offer={offer} matchScore={matchScore} />
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
  userId,
  initialSwipesToday,
  isPremium,
  initialQuotaReached,
}: {
  offers: Offer[];
  scores: Record<string, number>;
  userId: string;
  initialSwipesToday: number;
  isPremium: boolean;
  initialQuotaReached: boolean;
}) {
  const router = useRouter();
  const [stack, setStack] = useState(offers);
  const [busy, setBusy] = useState(false);
  const [swipesToday, setSwipesToday] = useState(initialSwipesToday);
  const [celebrating, setCelebrating] = useState(false);
  const [quotaReached, setQuotaReached] = useState(initialQuotaReached);
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
    if (error?.message.includes("SWIPE_QUOTA_REACHED")) {
      setQuotaReached(true);
    }
  }

  function triggerCelebration() {
    setCelebrating(true);
    if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
    celebrationTimeout.current = setTimeout(() => setCelebrating(false), 1300);
  }

  function handleSwipeIntent(direction: SwipeDirection) {
    if (quotaReached && !isPremium) return;
    const offer = stack[0];
    if (!offer) return;
    void recordSwipe(offer, direction);
    setSwipesToday((n) => n + 1);
    if (direction === "like" && (scores[offer.id] ?? 0) >= CELEBRATION_THRESHOLD) {
      triggerCelebration();
    }
    topCardRef.current?.swipeOut(direction);
  }

  function handleExited(offerId: string) {
    setStack((prev) => prev.filter((o) => o.id !== offerId));
  }

  async function handleApplyNow() {
    const offer = stack[0];
    if (!offer || busy) return;
    setBusy(true);

    const supabase = createClient();
    // Candidater doit rester illimité même quota de swipe atteint : on
    // insère la candidature AVANT le swipe, pour que le trigger de quota
    // (enforce_swipe_quota) voie déjà l'application et laisse passer.
    await supabase
      .from("applications")
      .upsert(
        { user_id: userId, offer_id: offer.id, status: "envoyee" },
        { onConflict: "user_id,offer_id" },
      );
    await supabase
      .from("swipes")
      .upsert(
        { user_id: userId, offer_id: offer.id, direction: "like" },
        { onConflict: "user_id,offer_id" },
      );

    router.push(`/candidature/${offer.id}`);
  }

  if (quotaReached && !isPremium) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20">
        <span className="tag tag-accent">🔓 Premium</span>
        <h2 style={{ fontSize: 22, marginTop: 12 }}>4 offres découvertes cette semaine</h2>
        <p style={{ marginTop: 8, maxWidth: "34ch", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Passe Premium pour swiper en illimité, ou reviens la semaine
          prochaine. Tu peux toujours candidater librement aux offres déjà vues.
        </p>
        <Link href="/premium" className="btn btn-primary mt-5">
          Votre avenir vaut bien 7,99€
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
    <div className="flex flex-col items-center">
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
                  matchScore={scores[offer.id]}
                  isTop={isTop}
                  onExited={() => handleExited(offer.id)}
                />
              </motion.div>
            );
          })}
      </div>

      <div className="mt-7 flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleSwipeIntent("pass")}
          aria-label="Passer"
          className="btn btn-icon btn-secondary"
          style={{ width: 52, height: 52, borderRadius: "50%", fontSize: 20 }}
        >
          ✕
        </button>
        <button
          type="button"
          onClick={handleApplyNow}
          disabled={busy}
          className="btn btn-secondary"
          style={{
            whiteSpace: "nowrap",
            color: "var(--color-accent)",
            borderColor: "var(--color-accent)",
          }}
        >
          Postuler direct
        </button>
        <button
          type="button"
          onClick={() => handleSwipeIntent("like")}
          aria-label="Aimer"
          className="btn btn-icon"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            fontSize: 24,
            background: "var(--color-accent)",
            color: "var(--color-bg)",
          }}
        >
          ♥
        </button>
      </div>

      <p
        style={{
          marginTop: 18,
          fontSize: 12,
          color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
        }}
      >
        {swipesToday > 0
          ? `🔥 Série en cours · ${swipesToday} offre${swipesToday > 1 ? "s" : ""} vue${swipesToday > 1 ? "s" : ""} aujourd'hui`
          : "Swipe ta première offre du jour !"}
      </p>
    </div>
  );
}

export function SwipeDeck({
  offers,
  scores,
  userId,
  swipesToday = 0,
  isPremium = false,
  quotaReached = false,
}: {
  offers: Offer[];
  scores: Record<string, number>;
  userId: string;
  swipesToday?: number;
  isPremium?: boolean;
  quotaReached?: boolean;
}) {
  const availableTypes = useMemo(() => {
    const types = new Set(offers.map((o) => o.contract_type));
    return Array.from(types);
  }, [offers]);

  const [contractFilter, setContractFilter] = useState<ContractType | "all">(
    availableTypes.length > 1 ? "all" : (availableTypes[0] ?? "all"),
  );

  const filteredOffers =
    contractFilter === "all"
      ? offers
      : offers.filter((o) => o.contract_type === contractFilter);

  return (
    <div className="flex flex-col items-center">
      {availableTypes.length > 1 && (
        <div className="seg mb-5">
          {(["alternance", "stage"] as ContractType[]).map((type) => (
            <label
              key={type}
              className={cn("seg-opt", contractFilter === type && "is-active")}
            >
              <input
                type="checkbox"
                checked={contractFilter === type}
                onChange={() =>
                  setContractFilter((prev) => (prev === type ? "all" : type))
                }
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              {type === "alternance" ? "Alternance" : "Stage"}
            </label>
          ))}
        </div>
      )}
      <SwipeDeckInner
        key={contractFilter}
        offers={filteredOffers}
        scores={scores}
        userId={userId}
        initialSwipesToday={swipesToday}
        isPremium={isPremium}
        initialQuotaReached={quotaReached}
      />
    </div>
  );
}
