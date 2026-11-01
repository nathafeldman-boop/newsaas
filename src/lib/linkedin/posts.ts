import { createAdminClient } from "@/lib/supabase/admin";
import { checkOfferLink, type LinkVerdict } from "@/lib/offers/linkCheck";
import { offerPath } from "@/lib/offers/publicUrl";
import { normalizeCityKey, titleCase } from "@/lib/offers/segments";
import { SITE_URL } from "@/lib/site";
import { composePost, utmCampaign, withUtm, LINKEDIN_MAX_CHARS, type PostOffer } from "@/lib/linkedin/compose";
import { cityTarget, sectorGroup, segmentLabel, type LinkedinFormat } from "@/lib/linkedin/formats";

// Brouillons LinkedIn : préparation (revérification des offres à la source,
// texte, enregistrement) et historique. Aucune publication automatique : le
// statut « publié » est posé à la main par l'admin après avoir posté.

export type PostStatus = "brouillon" | "publie" | "abandonne";

export type SnapshotOffer = PostOffer & { verdict: LinkVerdict };

export type LinkedinPost = {
  id: string;
  format: LinkedinFormat;
  segment: string | null;
  offer_ids: string[];
  offers_snapshot: SnapshotOffer[];
  body: string;
  first_comment: string | null;
  status: PostStatus;
  utm_campaign: string;
  created_at: string;
  published_at: string | null;
};

export type PrepareResult =
  | { ok: true; post: LinkedinPost; removed: { title: string; reason: string }[] }
  | { ok: false; error: string; removed?: { title: string; reason: string }[] };

type OfferRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string | null;
  is_active: boolean;
  contract_type: string;
  source: string;
  external_id: string | null;
  apply_url: string | null;
};

const VERIFY_TIMEOUT_MS = 6000;

async function verify(row: OfferRow): Promise<LinkVerdict> {
  const timeout = new Promise<LinkVerdict>((resolve) => setTimeout(() => resolve("unknown"), VERIFY_TIMEOUT_MS));
  try {
    return await Promise.race([checkOfferLink(row), timeout]);
  } catch {
    return "unknown";
  }
}

export async function prepareDraft(input: {
  format: LinkedinFormat;
  segment: string | null;
  offerIds: string[];
  linksInComment: boolean;
}): Promise<PrepareResult> {
  const { format, offerIds, linksInComment } = input;
  const segment = format === "secteur" || format === "ville" ? input.segment : null;
  if ((format === "secteur" && !sectorGroup(segment)) || (format === "ville" && !cityTarget(segment))) {
    return { ok: false, error: "Secteur ou ville inconnu." };
  }
  if (offerIds.length === 0) return { ok: false, error: "Sélectionne au moins une offre." };
  if (offerIds.length > 10) return { ok: false, error: "10 offres maximum par publication." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("offers")
    .select("id, title, company, location, duration, is_active, contract_type, source, external_id, apply_url")
    .in("id", offerIds);
  if (error) return { ok: false, error: error.message };
  const byId = new Map(((data ?? []) as OfferRow[]).map((r) => [r.id, r]));

  const removed: { title: string; reason: string }[] = [];
  const kept: OfferRow[] = [];
  for (const id of offerIds) {
    const row = byId.get(id);
    if (!row) removed.push({ title: id, reason: "introuvable" });
    else if (!row.is_active) removed.push({ title: row.title, reason: "n'est plus active sur Stageio" });
    else if (row.contract_type !== "alternance") removed.push({ title: row.title, reason: "n'est pas une alternance" });
    else kept.push(row);
  }

  // Revérification à la source, en parallèle (API France Travail).
  const verdicts = await Promise.all(kept.map(verify));
  const now = new Date();
  const campaign = utmCampaign(format, segment, now);
  const offers: SnapshotOffer[] = [];
  const liveIds: string[] = [];
  kept.forEach((row, i) => {
    const verdict = verdicts[i];
    if (verdict === "dead") {
      removed.push({ title: row.title, reason: "retirée par le recruteur (vérifié chez France Travail)" });
      return;
    }
    liveIds.push(row.id);
    offers.push({
      id: row.id,
      title: row.title,
      company: row.company,
      city: titleCase(normalizeCityKey(row.location)) || row.location,
      duration: row.duration,
      url: withUtm(`${SITE_URL}${offerPath(row)}`, campaign),
      verdict,
    });
  });
  if (offers.length === 0) return { ok: false, error: "Aucune offre encore en ligne dans la sélection.", removed };

  const moreUrl = withUtm(
    `${SITE_URL}${sectorGroup(segment)?.hubPath ?? cityTarget(segment)?.hubPath ?? "/offres/alternance"}`,
    campaign,
  );
  const composed = composePost({
    format,
    segment: segmentLabel(format, segment),
    offers,
    moreUrl,
    extraHashtag: sectorGroup(segment)?.hashtag ?? null,
    checkedAt: now,
    allVerified: offers.every((o) => o.verdict === "alive"),
    linksInComment,
  });
  if (composed.body.length > LINKEDIN_MAX_CHARS) {
    return { ok: false, error: `Texte trop long pour LinkedIn (${composed.body.length} caractères sur 3 000) : retire une offre.`, removed };
  }

  const { data: inserted, error: insertError } = await admin
    .from("linkedin_posts")
    .insert({
      format,
      segment,
      offer_ids: liveIds,
      offers_snapshot: offers,
      body: composed.body,
      first_comment: composed.firstComment,
      utm_campaign: campaign,
    })
    .select("*")
    .single();
  if (insertError) return { ok: false, error: insertError.message, removed };
  return { ok: true, post: inserted as LinkedinPost, removed };
}

export async function listPosts(limit = 40): Promise<LinkedinPost[]> {
  const { data, error } = await createAdminClient()
    .from("linkedin_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as LinkedinPost[];
}

export async function getPost(id: string): Promise<LinkedinPost | null> {
  const { data, error } = await createAdminClient().from("linkedin_posts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as LinkedinPost | null) ?? null;
}

export async function setPostStatus(id: string, status: PostStatus): Promise<void> {
  const { error } = await createAdminClient()
    .from("linkedin_posts")
    .update({ status, published_at: status === "publie" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
