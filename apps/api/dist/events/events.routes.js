import { createEvent, updateEvent, getEvent, listBandsEvents, discoverEventsByLocation, } from "./events.repo.js";
export async function eventsRoutes(app) {
    // Discovery: List published events
    app.get("/events/discovery", async (req, reply) => {
        const { lat, lng, radius } = req.query;
        try {
            // For now, simpler list. Lat/Lng will be used when PostGIS is ready.
            const events = await discoverEventsByLocation(lat ? Number(lat) : 0, lng ? Number(lng) : 0, radius ? Number(radius) : 50);
            return events;
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ message: "Error discovering events" });
        }
    });
    // Get details of a specific event
    app.get("/events/:id", async (req, reply) => {
        const { id } = req.params;
        try {
            const event = await getEvent(id);
            if (!event)
                return reply.code(404).send({ message: "Event not found" });
            return event;
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ message: "Error fetching event" });
        }
    });
    // --- Band specific management routes ---
    // List events for a specific band
    app.get("/bands/:bandId/events", async (req, reply) => {
        const { bandId } = req.params;
        try {
            const events = await listBandsEvents(bandId);
            return events;
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ message: "Error listing band events" });
        }
    });
    // Create a new event for a band
    app.post("/bands/:bandId/events", async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ message: "Unauthorized" });
        const { bandId } = req.params;
        const body = req.body;
        try {
            // In prod: Check if user is admin of the band
            const event = await createEvent(bandId, body);
            return event;
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ message: "Error creating event" });
        }
    });
    // Update an event
    app.patch("/events/:id", async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        const body = req.body;
        try {
            // In prod: Check if user is admin of the band associated with the event
            const event = await updateEvent(id, body);
            return event;
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ message: "Error updating event" });
        }
    });
}
