import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY non configuré côté serveur.");
    client = new Stripe(secretKey);
  }
  return client;
}
