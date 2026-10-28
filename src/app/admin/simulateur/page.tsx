import Link from "next/link";
import { Card } from "@/components/admin/cockpit/Kpi";
import { Simulator } from "@/components/admin/goals/Simulator";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { monthRange } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { expectedRenewals, shiftMonth } from "@/lib/admin/goals";
import { getMeasuredRates } from "@/lib/admin/goalsData";

// Simulateur (26/10, demande de Nathan) : « si je veux faire 10 000 € par
// mois, combien d'utilisateurs ? si je ramène 6 000 personnes de TikTok,
// d'Instagram, de Snap, combien d'argent ? ». Taux mesurés côté serveur,
// calculs dans le navigateur (lib/admin/goals.ts).
export const maxDuration = 60;

export default async function SimulateurPage() {
  await requireAdminPage();
  const now = nowMs();
  const [{ snap, error }, rates] = await Promise.all([loadSnapshot(), getMeasuredRates().catch(() => null)]);
  if (!snap || !rates) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Chiffres indisponibles pour l&apos;instant{error ? ` (${error})` : " (base lente)"} : recharge dans quelques minutes.</p>
      </Card>
    );
  }
  const next = monthRange(shiftMonth(monthRange(undefined, now).key, 1), now).range;
  const renewals = expectedRenewals(snap, next, now);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Simulateur</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)", maxWidth: "80ch" }}>
        Combien d&apos;inscrits pour un chiffre donné, et combien rapportent N inscrits selon d&apos;où ils viennent. Tout part des vrais chiffres des 30 derniers jours
        (Stripe, inscrits, réponses « Tu nous as connus comment ? »). Les objectifs du mois sont dans <Link href="/admin/objectifs">Objectifs</Link>.
      </p>
      <Simulator
        rates={{
          windowDays: rates.windowDays,
          signups: rates.signups,
          payers: rates.payers,
          conversion: rates.conversion,
          avgFirstPaymentCents: rates.avgFirstPaymentCents,
          paywallRate: rates.paywallRate,
          checkoutRate: rates.checkoutRate,
          signupsPer1000Views: rates.signupsPer1000Views,
          monthlyShare: rates.monthlyShare,
          monthlyPriceCents: rates.monthlyPriceCents,
          retention: rates.retention,
          nextMonthRenewalsCents: renewals.cents,
          channels: rates.channels,
        }}
      />
      {rates.channelsError && (
        <p className="cockpit-pill is-warn" style={{ marginTop: 12 }}>
          Réponses « Tu nous as connus comment ? » indisponibles pour l&apos;instant : tous les canaux utilisent le taux global.
        </p>
      )}
    </div>
  );
}
