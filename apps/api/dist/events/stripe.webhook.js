import Stripe from "stripe";
import { createTicket } from "./ticketing.repo.js";
import { createNotification } from "../notifications/notifications.repo.js";
import crypto from "node:crypto";
let stripeInstance = null;
function getStripe() {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key)
            throw new Error("STRIPE_SECRET_KEY is missing");
        stripeInstance = new Stripe(key, {
            apiVersion: "2023-10-16",
        });
    }
    return stripeInstance;
}
export async function stripeWebhookRoutes(app) {
    app.log.info("Registering Stripe Webhook routes...");
    app.post("/webhooks/stripe", {
        config: {
            rawBody: true,
        },
        handler: async (req, reply) => {
            const sig = req.headers["stripe-signature"];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            req.log.info({
                hasSig: !!sig,
                hasSecret: !!webhookSecret,
                secretStart: webhookSecret?.substring(0, 7),
            }, "Webhook request received");
            if (!sig || !webhookSecret) {
                req.log.error("Missing signature or secret");
                return reply.code(400).send("Webhook Secret or Signature missing");
            }
            let event;
            try {
                const rawBody = req.rawBody;
                if (!rawBody) {
                    req.log.error("rawBody is missing! Check preParsing hook.");
                    return reply.code(400).send("Raw body is missing");
                }
                req.log.info({ rawBodySize: rawBody.length }, "Constructing Stripe event...");
                event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
            }
            catch (err) {
                req.log.error({ err: err.message }, "Webhook construction failed");
                return reply.code(400).send(`Webhook Error: ${err.message}`);
            }
            req.log.info({ eventType: event.type }, "Stripe Event constructed successfully");
            // Handle the event
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const metadata = session.metadata;
                req.log.info({ metadata, sessionId: session.id }, "Processing checkout.session.completed");
                if (metadata?.userId && metadata?.eventId) {
                    req.log.info(`Fulfilling order for User ${metadata.userId}, Event ${metadata.eventId}`);
                    try {
                        await createTicket({
                            event_id: metadata.eventId,
                            user_id: metadata.userId,
                            qr_hash: crypto.randomUUID(),
                            purchase_price: (session.amount_total || 0) / 100,
                            stripe_payment_intent_id: session.payment_intent,
                        });
                        req.log.info("Ticket created successfully");
                        // Notificar al usuario
                        try {
                            await createNotification(metadata.userId, "ticket_purchased", "¡Entrada confirmada!", `Tu entrada para el evento ya está disponible en tu sección de Tickets.`, { eventId: metadata.eventId });
                            req.log.info("Notification sent successfully");
                        }
                        catch (notifErr) {
                            req.log.error({ notifErr }, "Error sending fulfillment notification");
                            // No fallamos el webhook por una notificación
                        }
                    }
                    catch (repoErr) {
                        req.log.error({ repoErr }, "Error saving ticket to database");
                        // Returning 500 so Stripe retries
                        return reply.code(500).send("Database error fulfilling ticket");
                    }
                }
                else {
                    req.log.warn("Webhook received but metadata (userId/eventId) is missing");
                }
            }
            return reply.code(200).send({ received: true });
        },
    });
}
