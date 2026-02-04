import { listSetlistsForUser, getSetlistForUser, createSetlistForUser, updateSetlistForUser, deleteSetlistForUser, addSongToSetlistForUser, removeSongFromSetlistForUser, reorderSetlistForUser, } from "./setlists.repo.js";
export async function setlistsRoutes(app) {
    app.get("/setlists", async (req) => {
        const userId = req.user.id;
        return listSetlistsForUser(userId);
    });
    app.get("/setlists/:id", async (req, reply) => {
        const userId = req.user.id;
        const res = await getSetlistForUser(userId, req.params.id);
        if (res === null)
            return reply.code(404).send({ message: "Setlist not found" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return res;
    });
    app.post("/setlists", async (req, reply) => {
        const userId = req.user.id;
        const dto = req.body;
        if (!dto?.name?.trim())
            return reply.code(400).send({ message: "name is required" });
        const created = await createSetlistForUser(userId, {
            name: dto.name,
            notes: dto.notes,
        });
        return reply.code(201).send(created);
    });
    app.patch("/setlists/:id", async (req, reply) => {
        const userId = req.user.id;
        const res = await updateSetlistForUser(userId, req.params.id, {
            name: req.body.name,
            notes: req.body.notes,
        });
        if (res === null)
            return reply.code(404).send({ message: "Setlist not found" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return res;
    });
    app.delete("/setlists/:id", async (req, reply) => {
        const userId = req.user.id;
        const res = await deleteSetlistForUser(userId, req.params.id);
        if (res === null)
            return reply.code(404).send({ message: "Setlist not found" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return reply.code(204).send();
    });
    app.post("/setlists/:id/items", async (req, reply) => {
        const userId = req.user.id;
        const dto = req.body;
        if (!dto?.songId)
            return reply.code(400).send({ message: "songId is required" });
        const res = await addSongToSetlistForUser(userId, req.params.id, dto.songId);
        if (res === null)
            return reply.code(404).send({ message: "Setlist not found" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return res;
    });
    app.delete("/setlists/:id/items/:songId", async (req, reply) => {
        const userId = req.user.id;
        const res = await removeSongFromSetlistForUser(userId, req.params.id, req.params.songId);
        if (res === null)
            return reply.code(404).send({ message: "Setlist not found" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return res;
    });
    app.post("/setlists/:id/reorder", async (req, reply) => {
        const userId = req.user.id;
        const dto = req.body;
        const songIds = dto.songIds;
        if (!Array.isArray(songIds))
            return reply.code(400).send({ message: "songIds is required" });
        const res = await reorderSetlistForUser(userId, req.params.id, songIds);
        if (res === null)
            return reply.code(404).send({ message: "Setlist not found" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return res;
    });
}
