// Webhook Resend : signature Svix exigée, événements non suivis ignorés.
// Lancer : npx tsx --tsconfig tsconfig.json tests/resend-webhook.test.ts
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";

const key = randomBytes(24);
process.env.RESEND_WEBHOOK_SECRET = `whsec_${key.toString("base64")}`;

async function main() {
  const { POST } = await import("../src/app/api/resend/webhook/route");
  const body = JSON.stringify({ type: "email.delivered", data: { to: ["x@example.com"] } });
  const id = "msg_test";
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  const req = (signature: string, timestamp = ts) =>
    new NextRequest("https://www.stageio.fr/api/resend/webhook", {
      method: "POST",
      body,
      headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": signature },
    });

  const ok = await POST(req(`v1,${sig}`));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ignored: "email.delivered" });

  const bad = await POST(req(`v1,${Buffer.from("faux").toString("base64")}`));
  assert.equal(bad.status, 401);

  const old = String(Math.floor(Date.now() / 1000) - 3600);
  const oldSig = createHmac("sha256", key).update(`${id}.${old}.${body}`).digest("base64");
  const replay = await POST(req(`v1,${oldSig}`, old));
  assert.equal(replay.status, 401);

  delete process.env.RESEND_WEBHOOK_SECRET;
  const missing = await POST(req(`v1,${sig}`));
  assert.equal(missing.status, 503);
  console.log("resend-webhook : OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
