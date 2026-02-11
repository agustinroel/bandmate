/**
 * Stripe Subscription Routes
 *
 * POST /subscriptions/checkout  → creates a Checkout Session for Pro/Studio
 * POST /subscriptions/portal    → creates a Customer Portal session (manage/cancel)
 *
 * The actual fulfillment happens via webhook (checkout.session.completed)
 * in stripe.webhook.ts.
 */
import Stripe from "stripe";
import { FastifyInstance, FastifyRequest } from "fastify";
import { supabase } from "../lib/supabase.js";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is missing");
    stripeInstance = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
}

// ------------------------------------------------------------------
// Price IDs - You MUST create these Products/Prices in your Stripe
// dashboard first, then paste the price IDs here, or set them as
// environment variables.
// ------------------------------------------------------------------
function getPriceId(tier: "pro" | "studio"): string {
  if (tier === "pro") {
    return process.env.STRIPE_PRO_PRICE_ID || "price_REPLACE_WITH_PRO_PRICE_ID";
  }
  return (
    process.env.STRIPE_STUDIO_PRICE_ID || "price_REPLACE_WITH_STUDIO_PRICE_ID"
  );
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Get or create a Stripe Customer for a Bandmate user */
async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  // Check if user already has a stripe_customer_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create in Stripe
  const customer = await getStripe().customers.create({
    email,
    metadata: { bandmate_user_id: userId },
  });

  // Save to profile
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
export async function subscriptionRoutes(app: FastifyInstance) {
  app.log.info("Registering Subscription routes...");

  /**
   * POST /subscriptions/checkout
   * Body: { tier: 'pro' | 'studio' }
   * Returns: { url: string } — redirect the frontend here
   */
  app.post("/subscriptions/checkout", async (req, reply) => {
    const userId = req.user?.id;
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { tier } = req.body as { tier?: string };
    if (tier !== "pro" && tier !== "studio") {
      return reply
        .code(400)
        .send({ message: "tier must be 'pro' or 'studio'" });
    }

    const email = req.user?.email || "";
    const customerId = await getOrCreateStripeCustomer(userId, email);
    const priceId = getPriceId(tier);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings?upgraded=${tier}`,
      cancel_url: `${frontendUrl}/settings?upgrade_cancelled=true`,
      metadata: {
        bandmate_user_id: userId,
        tier,
      },
      subscription_data: {
        metadata: {
          bandmate_user_id: userId,
          tier,
        },
      },
    });

    return reply.send({ url: session.url });
  });

  /**
   * POST /subscriptions/portal
   * Returns: { url: string } — Customer Portal to manage/cancel subscription
   */
  app.post("/subscriptions/portal", async (req, reply) => {
    const userId = req.user?.id;
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return reply.code(404).send({ message: "No active subscription found" });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${frontendUrl}/settings`,
    });

    return reply.send({ url: portalSession.url });
  });
}
