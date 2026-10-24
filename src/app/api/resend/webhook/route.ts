import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Événements de délivrabilité Resend (24/10, cockpit « E-mails ») : la clé
// d'API de Stageio est en envoi seul, elle ne peut pas relire rebonds et
// plaintes. Resend les pousse ici, signés (Svix), si un webhook est créé
// dans le tableau de bord Resend vers cette adresse avec les événements
// email.bounced, email.complained, email.delivery_delayed et email.failed,
// et que son secret de signature est dans Vercel (RESEND_WEBHOOK_SECRET).
// Rien n'est enregistré sans signature valide.
//
// Chaque événement est noté dans user_events (email_bounced…) pour le
// compte destinataire. Plainte ou rebond définitif : plus d'e-mails de
// relance (notify_new_offers = false, comme une désinscription), pour ne
// pas abîmer la réputation d'envoi de stageio.fr.

const TOLERANCE_S = 5 * 60;
const HANDLED: Record<string, string> = {
  "email.bounced": "email_bounced",
  "email.complained": "email_complained",
  "email.delivery_delayed": "email_delivery_delayed",
  "email.failed": "email_failed",
};

function verify(secret: string, id: string, timestamp: string, body: string, signatures: string): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_S) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type ResendEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    subject?: string;
    tags?: Record<string, string> | { name: string; value: string }[];
    bounce?: { type?: string; subType?: string };
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET non configuré." }, { status: 503 });

  const body = await request.text();
  const id = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signatures = request.headers.get("svix-signature") ?? "";
  if (!id || !verify(secret, id, timestamp, body, signatures)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Corps illisible." }, { status: 400 });
  }
  const eventType = HANDLED[event.type];
  if (!eventType) return NextResponse.json({ ignored: event.type });

  const to = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to;
  if (!to) return NextResponse.json({ ignored: "sans destinataire" });

  const db = createAdminClient();
  // ilike pour ignorer la casse ; % et _ échappés (jokers de LIKE, « _ » est courant dans les adresses).
  const pattern = to.trim().replace(/[%_\\]/g, (c) => `\\${c}`);
  const { data: profile } = await db.from("profiles").select("id").ilike("email", pattern).limit(1).maybeSingle();
  if (!profile) return NextResponse.json({ ignored: "destinataire inconnu" });

  // Resend peut renvoyer le même événement : une seule ligne par svix-id.
  const { data: seen } = await db.from("user_events").select("id").eq("user_id", profile.id).eq("event_type", eventType).eq("metadata->>svix_id", id).limit(1);
  if (seen && seen.length > 0) return NextResponse.json({ duplicate: true });

  const tags = event.data?.tags;
  const campaign = Array.isArray(tags) ? tags.find((t) => t.name === "campaign")?.value : tags?.campaign;
  const permanent = event.type === "email.bounced" && /permanent/i.test(event.data?.bounce?.type ?? "");
  const { error } = await db.from("user_events").insert({
    user_id: profile.id,
    event_type: eventType,
    metadata: {
      v: 1,
      svix_id: id,
      email_id: event.data?.email_id ?? null,
      campaign: campaign ?? null,
      bounce_type: event.data?.bounce?.type ?? null,
      bounce_subtype: event.data?.bounce?.subType ?? null,
    },
  });
  if (error) {
    console.error("resend webhook: enregistrement en échec", error.message);
    return NextResponse.json({ error: "Base indisponible." }, { status: 500 });
  }
  if (event.type === "email.complained" || permanent) {
    await db.from("profiles").update({ notify_new_offers: false }).eq("id", profile.id);
  }
  return NextResponse.json({ ok: true });
}
