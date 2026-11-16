import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicReviewStats, getPublicTestimonials } from "@/lib/reviews/publicStats";
import type { ProofData } from "@/components/onboarding/ProofScreens";
import { DemoFlow } from "@/components/demo/DemoFlow";
import type { Offer } from "@/types/database";

// Parcours utilisateur rejouable (16/11, tournage TikTok) : onboarding, swipe
// sur de vraies offres CDI/CDD du jour, puis candidature animée. Réservé à
// l'admin. Rien n'est enregistré ni envoyé (voir lib/demo/demoMode.ts).
export const metadata: Metadata = { title: "Stageio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function loadDemoData() {
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [offers, testimonials, reviewStats, weekly, active, trust] = await Promise.all([
    admin
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .in("contract_type", ["cdi", "cdd"])
      .or("is_school_ad.is.null,is_school_ad.eq.false")
      .order("created_at", { ascending: false })
      .limit(60),
    getPublicTestimonials(6).catch(() => []),
    getPublicReviewStats().catch(() => ({ count: 0, average: null })),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
  ]);
  // Une offre par entreprise, avec une vraie entreprise nommée : un deck lisible à l'écran.
  const seen = new Set<string>();
  const deck: Offer[] = [];
  for (const o of offers.data ?? []) {
    const company = (o.company ?? "").trim();
    if (!company || /non communiqu/i.test(company) || seen.has(company.toLowerCase())) continue;
    seen.add(company.toLowerCase());
    deck.push(o);
    if (deck.length >= 20) break;
  }
  const proof: ProofData = {
    testimonials,
    reviewStats,
    weeklySignups: weekly.error ? null : (weekly.count ?? 0),
    activeOffers: active.error ? null : (active.count ?? 0),
  };
  return { deck, proof, trustCount: trust.count ?? 0 };
}

export default async function DemoPage() {
  await requireAdminPage();
  const { deck, proof, trustCount } = await loadDemoData();
  return <DemoFlow offers={deck} proof={proof} trustCount={trustCount} />;
}
