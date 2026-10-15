import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";

// Boîte mail Stageio (15/10, demande de Nathan) : chaque étudiant a sa propre
// adresse sur un sous-domaine dédié (INBOX_DOMAIN, ex. candidat.stageio.fr).
// Ses candidatures partent de cette adresse et les réponses des recruteurs
// arrivent dans l'appli (voir api/inbox/webhook). Sous-domaine à part : la
// réputation d'envoi des candidatures ne touche jamais les emails de compte.

export function inboxDomain(): string | null {
  const domain = process.env.INBOX_DOMAIN?.trim().toLowerCase();
  return domain && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? domain : null;
}

export function isInboxAddress(address: string): boolean {
  const domain = inboxDomain();
  return !!domain && address.trim().toLowerCase().endsWith(`@${domain}`);
}

// « Inès Martin » → « ines.martin » ; vide si le nom est inutilisable.
function localPart(fullName: string | null): string {
  return (fullName ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 30);
}

// Adresse existante, sinon une nouvelle (nom + 4 caractères au hasard pour
// l'unicité). null si la boîte n'est pas configurée ou la colonne absente.
export async function getOrCreateInboxAddress(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  fullName: string | null,
): Promise<string | null> {
  const domain = inboxDomain();
  if (!domain) return null;

  const { data: profile, error } = await admin.from("profiles").select("inbox_address").eq("id", userId).maybeSingle();
  if (error) {
    console.error("inbox: lecture de l'adresse impossible (SQL de la boîte pas encore passé ?)", error.message);
    return null;
  }
  if (profile?.inbox_address) return profile.inbox_address;

  const base = localPart(fullName) || "candidat";
  for (let attempt = 0; attempt < 3; attempt++) {
    const address = `${base}.${randomBytes(3).toString("hex").slice(0, 4)}@${domain}`;
    const { error: updateError } = await admin
      .from("profiles")
      .update({ inbox_address: address })
      .eq("id", userId)
      .is("inbox_address", null);
    if (!updateError) {
      const { data: saved } = await admin.from("profiles").select("inbox_address").eq("id", userId).maybeSingle();
      if (saved?.inbox_address) return saved.inbox_address;
    } else if (!/duplicate|unique/i.test(updateError.message)) {
      console.error("inbox: création de l'adresse impossible", updateError.message);
      return null;
    }
  }
  return null;
}
