"use client";

import { useEffect, useMemo, useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { ProofData } from "@/components/onboarding/ProofScreens";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { BottomNav } from "@/components/nav/BottomNav";
import { DemoApply } from "@/components/demo/DemoApply";
import { DemoContext, setDemoMode } from "@/lib/demo/demoMode";
import type { Offer } from "@/types/database";

type Phase = { name: "onboarding" } | { name: "swipe" } | { name: "apply"; offer: Offer };

// Coquille du parcours de démo : les vrais écrans de l'app, enchaînés sans
// compte. Le mode démo est posé AVANT le premier rendu des enfants, pour que
// le client Supabase n'écrive jamais rien (voir lib/supabase/client.ts).
export function DemoFlow({ offers, proof, trustCount }: { offers: Offer[]; proof: ProofData; trustCount: number }) {
  setDemoMode(true);
  useEffect(() => () => setDemoMode(false), []);
  const [phase, setPhase] = useState<Phase>({ name: "onboarding" });
  const [run, setRun] = useState(0);
  const [applied, setApplied] = useState<string[]>([]);

  // Scores de compatibilité affichés sur les cartes : décroissants, pour la démo.
  const scores = useMemo(() => Object.fromEntries(offers.map((o, i) => [o.id, Math.max(71, 96 - i * 2)])), [offers]);
  const remaining = offers.filter((o) => !applied.includes(o.id));

  const hooks = useMemo(
    () => ({
      onFinishOnboarding: () => setPhase({ name: "swipe" }),
      onApply: (offer: Offer) => setPhase({ name: "apply", offer }),
    }),
    [],
  );

  const restart = () => {
    setApplied([]);
    setRun((r) => r + 1);
    setPhase({ name: "onboarding" });
  };

  return (
    <DemoContext.Provider value={hooks}>
      <div className="flex min-h-dvh flex-1 flex-col" key={run}>
        {phase.name === "onboarding" && (
          <div className="flex flex-1 flex-col px-5 py-6">
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
              <OnboardingWizard userId="demo" initialProfile={null} trustCount={trustCount} proof={proof} />
            </div>
          </div>
        )}
        {phase.name === "swipe" && (
          <div className="flex flex-1 flex-col items-center px-4 pt-4 pb-24">
            <SwipeDeck offers={remaining} scores={scores} userId="demo" isPremium totalSwipesEver={0} />
            <BottomNav />
          </div>
        )}
        {phase.name === "apply" && (
          <DemoApply
            offer={phase.offer}
            onBack={() => {
              setApplied((a) => [...a, phase.offer.id]);
              setPhase({ name: "swipe" });
            }}
          />
        )}
        <button
          type="button"
          onClick={restart}
          aria-label="Recommencer la démo"
          style={{ position: "fixed", top: 6, right: 6, width: 22, height: 22, opacity: 0.08, borderRadius: 11, background: "currentColor", border: 0, zIndex: 50 }}
        />
      </div>
    </DemoContext.Provider>
  );
}
