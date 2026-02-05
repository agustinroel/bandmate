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
  app.post("/webhooks/stripe", {
    config: {
      rawBody: true,
    },
    handler: async (req, reply) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return reply.code(400).send("Webhook Secret or Signature missing");
      }

      let event;

      try {
        // We assume @fastify/raw-body or manual raw body handling is active
        const rawBody = (req as any).rawBody;
        event = getStripe().webhooks.constructEvent(
          rawBody,
          sig,
          webhookSecret,
        );
      } catch (err: any) {
        app.log.error(`Webhook Error: ${err.message}`);
        return reply.code(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.userId && metadata?.eventId) {
          app.log.info(
            `Fulfilling order for User ${metadata.userId}, Event ${metadata.eventId}`,
          );

          await createTicket({
            event_id: metadata.eventId,
            user_id: metadata.userId,
            qr_hash: crypto.randomUUID(), // Standard UUID for QR
            purchase_price: (session.amount_total || 0) / 100,
            stripe_payment_intent_id: session.payment_intent as string,
          });
        }
      }

      return reply.code(200).send({ received: true });
    },
  });
}
