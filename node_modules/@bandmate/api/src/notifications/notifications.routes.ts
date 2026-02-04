import { FastifyInstance } from "fastify";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications.repo.js";

export async function notificationsRoutes(app: FastifyInstance) {
  app.get("/notifications", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    try {
      const notes = await listNotifications(user.id);
      return notes;
    } catch (e: any) {
      req.log.error(e);
      return reply.code(500).send({ message: "Error fetching notifications" });
    }
  });

  app.patch("/notifications/:id/read", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };

    try {
      await markNotificationRead(id, user.id);
      return { success: true };
    } catch (e: any) {
      return reply.code(500).send({ message: "Error updating notification" });
    }
  });

  app.patch("/notifications/read-all", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    try {
      await markAllNotificationsRead(user.id);
      return { success: true };
    } catch (e: any) {
      return reply.code(500).send({ message: "Error updating notifications" });
    }
  });
}
