import { listNotifications, markNotificationRead, markAllNotificationsRead, createNotification, } from "./notifications.repo.js";
export async function notificationsRoutes(app) {
    app.get("/notifications", async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ message: "Unauthorized" });
        try {
            const notes = await listNotifications(user.id);
            return notes;
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ message: "Error fetching notifications" });
        }
    });
    app.post("/notifications/test", async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ message: "Unauthorized" });
        try {
            const notif = await createNotification(user.id, "info", "Notificaciones Push Activas 🎸", "Recibirás alertas instantáneas cuando otros músicos interactúen contigo.", { test: true });
            return notif;
        }
        catch (e) {
            return reply.code(500).send({ message: "Error creating test notification" });
        }
    });
    app.patch("/notifications/:id/read", async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        try {
            await markNotificationRead(id, user.id);
            return { success: true };
        }
        catch (e) {
            return reply.code(500).send({ message: "Error updating notification" });
        }
    });
    app.patch("/notifications/read-all", async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ message: "Unauthorized" });
        try {
            await markAllNotificationsRead(user.id);
            return { success: true };
        }
        catch (e) {
            return reply.code(500).send({ message: "Error updating notifications" });
        }
    });
}
