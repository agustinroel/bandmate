import { FastifyInstance } from "fastify";
import {
  listUserTickets,
  getTicket,
  validateTicket,
} from "./ticketing.repo.js";
import {
  createStripeConnectAccount,
  createOnboardingLink,
  createTicketCheckoutSession,
} from "./ticketing.service.js";
import { getEvent } from "./events.repo.js";
import { getBandPayoutSettings } from "./payouts.repo.js";

export async function ticketingRoutes(app: FastifyInstance) {
  // List current user's tickets
  app.get("/me/tickets", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    try {
      const tickets = await listUserTickets(user.id);
      return tickets;
    } catch (e: any) {
      req.log.error(e);
      return reply.code(500).send({ message: "Error fetching tickets" });
    }
  });

  // Get details for a specific ticket
  app.get("/tickets/:id", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    try {
      const ticket = await getTicket(id, user.id);
      if (!ticket) return reply.code(404).send({ message: "Ticket not found" });
      return ticket;
    } catch (e: any) {
      req.log.error(e);
      return reply.code(500).send({ message: "Error fetching ticket details" });
    }
  });

  // Stripe Onboarding for bands
  app.post("/bands/:bandId/payouts/onboarding", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { bandId } = req.params as { bandId: string };

    try {
      // In prod: verify admin status
      const accountId = await createStripeConnectAccount(bandId, user.email);
      const url = await createOnboardingLink(bandId, accountId);
      return { url };
    } catch (e: any) {
      req.log.error(e);
      return reply
        .code(500)
        .send({ message: e.message || "Error creating onboarding link" });
    }
  });

  // Ticket Checkout
  app.post("/events/:eventId/checkout", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { eventId } = req.params as { eventId: string };
    const { quantity } = (req.body as { quantity?: number }) || {};

    try {
      const event = await getEvent(eventId);
      if (!event) return reply.code(404).send({ message: "Event not found" });

      const payoutSettings = await getBandPayoutSettings(event.band_id);
      if (!payoutSettings?.stripe_connect_id) {
        return reply
          .code(400)
          .send({ message: "Band has not set up payments yet" });
      }

      const session = await createTicketCheckoutSession(
        eventId,
        event.title,
        event.ticket_price,
        event.currency,
        payoutSettings.stripe_connect_id,
        user.id,
        quantity || 1,
      );

      return { checkoutUrl: session.url };
    } catch (e: any) {
      req.log.error(e);
      return reply
        .code(500)
        .send({ message: e.message || "Error creating checkout session" });
    }
  });

  // Ticket Validation (Check-in)
  app.post("/tickets/validate", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { qrHash, bandId } = req.body as { qrHash: string; bandId: string };

    if (!qrHash || !bandId) {
      return reply.code(400).send({ message: "Missing qrHash or bandId" });
    }

    try {
      const result = await validateTicket(qrHash, bandId);
      return result;
    } catch (e: any) {
      req.log.error(e);
      const status = e.message.includes("Unauthorized") ? 403 : 404;
      return reply.code(status).send({ message: e.message });
    }
  });
}
