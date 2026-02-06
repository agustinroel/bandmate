import Stripe from "stripe";
import { FastifyInstance } from "fastify";
import { createTicket } from "./ticketing.repo.js";
import crypto from "node:crypto";

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

      // Handle the event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        req.log.info(
          { metadata, sessionId: session.id },
          "Processing checkout.session.completed",
        );

        if (metadata?.userId && metadata?.eventId) {
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
          } catch (repoErr: any) {
            req.log.error({ repoErr }, "Error saving ticket to database");
            // Returning 500 so Stripe retries
            return reply.code(500).send("Database error fulfilling ticket");
          }
        } else {
          req.log.warn(
            "Webhook received but metadata (userId/eventId) is missing",
          );
        }
      }

      return reply.code(200).send({ received: true });
    },
  });
}
