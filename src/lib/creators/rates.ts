import { createAdminClient } from "@/lib/supabase/admin";
import { RPM_EUR, type RpmRates } from "@/lib/creators/earnings";
import type { Creator } from "@/types/database";

// RPM réglé par Nathan dans /admin/createurs (21/11) : tarifs par défaut
// (table creator_rpm) et tarif propre à un créateur (colonnes rpm_* de
// creators, vides = défaut). Table absente ou illisible : tarifs de départ.

export async function loadRpmDefaults(): Promise<RpmRates> {
  const { data, error } = await createAdminClient().from("creator_rpm").select("carousel, faceless, face").eq("id", 1).maybeSingle();
  if (error || !data) return RPM_EUR;
  return { carousel: Number(data.carousel), faceless: Number(data.faceless), face: Number(data.face) };
}

type RpmColumns = Pick<Creator, "rpm_carousel" | "rpm_faceless" | "rpm_face">;

export function ratesFor(creator: RpmColumns | null | undefined, defaults: RpmRates): RpmRates {
  const pick = (own: number | null | undefined, base: number) => (own === null || own === undefined ? base : Number(own));
  return {
    carousel: pick(creator?.rpm_carousel, defaults.carousel),
    faceless: pick(creator?.rpm_faceless, defaults.faceless),
    face: pick(creator?.rpm_face, defaults.face),
  };
}

/** Le créateur a-t-il au moins un tarif à lui ? */
export function hasOwnRates(creator: RpmColumns): boolean {
  return [creator.rpm_carousel, creator.rpm_faceless, creator.rpm_face].some((x) => x !== null && x !== undefined);
}

/** « 1,25 » ou « 1.25 » -> 1.25 ; vide -> null ; invalide -> undefined. */
export function parseRpm(raw: FormDataEntryValue | null): number | null | undefined {
  const text = String(raw ?? "").trim().replace(",", ".").replace(/\s*€$/, "");
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 1000) return undefined;
  return Math.round(n * 100) / 100;
}
