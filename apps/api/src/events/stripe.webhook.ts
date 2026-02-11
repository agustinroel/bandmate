import Stripe from "stripe";
import { FastifyInstance } from "fastify";
import { createTicket } from "./ticketing.repo.js";
import { createNotification } from "../notifications/notifications.repo.js";
import crypto from "node:crypto";
import { supabase } from "../lib/supabase.js";

let stripeInstance: Stripe | null = null;

function getStripe() {
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
// Subscription fulfillment helpers
// ------------------------------------------------------------------
async function activateSubscription(
  userId: string,
  tier: string,
  stripeSubscriptionId: string,
  req: any,
) {
  try {
    await supabase
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_expires_at: null, // Active subscription, no expiry
      })
      .eq("id", userId);

    req.log.info(
      { userId, tier, stripeSubscriptionId },
      "Subscription activated",
    );

    await createNotification(
      userId,
      "subscription_activated",
      `¡Welcome to ${tier === "pro" ? "Pro" : "Studio"}!`,
      `Your ${tier} subscription is now active. Enjoy all your new features!`,
      { tier },
    );
  } catch (err: any) {
    req.log.error({ err }, "Error activating subscription");
    throw err;
  }
}

async function deactivateSubscription(stripeCustomerId: string, req: any) {
  try {
    // Find user by stripe_customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (!profile) {
      req.log.warn({ stripeCustomerId }, "No profile found for customer");
      return;
    }

    await supabase
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_expires_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    req.log.info({ userId: profile.id }, "Subscription deactivated → free");

    await createNotification(
      profile.id,
      "subscription_cancelled",
      "Subscription ended",
      "Your subscription has ended. You've been moved to the Free plan.",
      {},
    );
  } catch (err: any) {
    req.log.error({ err }, "Error deactivating subscription");
  }
}

// ------------------------------------------------------------------
// Webhook Routes
// ------------------------------------------------------------------
export async function stripeWebhookRoutes(app: FastifyInstance) {
  app.log.info("Registering Stripe Webhook routes...");
  app.post("/webhooks/stripe", {
    config: {
      rawBody: true,
    },
    handler: async (req, reply) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      req.log.info(
        {
          hasSig: !!sig,
          hasSecret: !!webhookSecret,
          secretStart: webhookSecret?.substring(0, 7),
        },
        "Webhook request received",
      );

      if (!sig || !webhookSecret) {
        req.log.error("Missing signature or secret");
        return reply.code(400).send("Webhook Secret or Signature missing");
      }

      let event;

      try {
        const rawBody = (req as any).rawBody;
        if (!rawBody) {
          req.log.error("rawBody is missing! Check preParsing hook.");
          return reply.code(400).send("Raw body is missing");
        }

        req.log.info(
          { rawBodySize: rawBody.length },
          "Constructing Stripe event...",
        );
        event = getStripe().webhooks.constructEvent(
          rawBody,
          sig,
          webhookSecret,
        );
      } catch (err: any) {
        req.log.error({ err: err.message }, "Webhook construction failed");
        return reply.code(400).send(`Webhook Error: ${err.message}`);
      }

      req.log.info(
        { eventType: event.type },
        "Stripe Event constructed successfully",
      );

      // ---- Handle event types ----

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        req.log.info(
          { metadata, sessionId: session.id },
          "Processing checkout.session.completed",
        );

        // --- Subscription checkout ---
        if (metadata?.bandmate_user_id && metadata?.tier) {
          await activateSubscription(
            metadata.bandmate_user_id,
            metadata.tier,
            session.subscription as string,
            req,
          );
        }
        // --- Event ticket checkout ---
        else if (metadata?.userId && metadata?.eventId) {
          req.log.info(
            `Fulfilling order for User ${metadata.userId}, Event ${metadata.eventId}`,
          );

          try {
            await createTicket({
              event_id: metadata.eventId,
              user_id: metadata.userId,
              qr_hash: crypto.randomUUID(),
              purchase_price: (session.amount_total || 0) / 100,
              stripe_payment_intent_id: session.payment_intent as string,
            });
            req.log.info("Ticket created successfully");

            try {
              await createNotification(
                metadata.userId,
                "ticket_purchased",
                "¡Entrada confirmada!",
                `Tu entrada para el evento ya está disponible en tu sección de Tickets.`,
                { eventId: metadata.eventId },
              );
              req.log.info("Notification sent successfully");
            } catch (notifErr: any) {
              req.log.error(
                { notifErr },
                "Error sending fulfillment notification",
              );
            }
          } catch (repoErr: any) {
            req.log.error({ repoErr }, "Error saving ticket to database");
            return reply.code(500).send("Database error fulfilling ticket");
          }
        } else {
          req.log.warn(
            "Webhook received but metadata is missing required fields",
          );
        }
      }

      // --- Subscription updated (plan change) ---
      if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const meta = subscription.metadata;

        if (meta?.bandmate_user_id && meta?.tier) {
          await activateSubscription(
            meta.bandmate_user_id,
            meta.tier,
            subscription.id,
            req,
          );
        }
      }

      // --- Subscription cancelled/expired ---
      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await deactivateSubscription(subscription.customer as string, req);
      }

      return reply.code(200).send({ received: true });
    },
  });
}
