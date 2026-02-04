import { createSongForUser, deleteSongForUser, getSongByIdForUser, listSongsForUser, updateSongForUser, rateSongForUser, } from "./songs.repo.js";
function getUserId(req) {
    // Ajustá acá si tu auth plugin usa otro shape (sub, userId, etc.)
    const u = req.user;
    return u?.id ?? null;
}
export async function songsRoutes(app) {
    // LIST
    app.get("/songs", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const songs = await listSongsForUser(userId);
        return songs;
    });
    // GET BY ID
    app.get("/songs/:id", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        const song = await getSongByIdForUser(userId, id);
        if (!song)
            return reply.code(404).send({ message: "Song not found" });
        return song;
    });
    // CREATE
    app.post("/songs", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const dto = req.body;
        // Validación mínima (MVP)
        if (!dto?.title?.trim() || !dto?.artist?.trim()) {
            return reply.code(400).send({ message: "title and artist are required" });
        }
        const created = await createSongForUser(userId, dto);
        return reply.code(201).send(created);
    });
    // UPDATE
    app.patch("/songs/:id", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        const patch = (req.body ?? {});
        const updated = await updateSongForUser(userId, id, patch);
        if (updated === null)
            return reply.code(404).send({ message: "Song not found" });
        if (updated === "FORBIDDEN_SEED")
            return reply.code(403).send({ message: "Seed songs are read-only" });
        if (updated === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return updated;
    });
    // RATE (1..5)
    app.post("/songs/:id/rate", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        const body = (req.body ?? {});
        // acepta { value } o { rating }
        const raw = body.value ?? body.rating;
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 1 || value > 5) {
            return reply
                .code(400)
                .send({ message: "rating must be a number between 1 and 5" });
        }
        const updated = await rateSongForUser(userId, id, value);
        if (!updated)
            return reply.code(404).send({ message: "Song not found" });
        if (updated === "FORBIDDEN")
            return reply
                .code(403)
                .send({ message: "Only library songs can be rated" });
        return reply.code(200).send(updated);
    });
    // DELETE
    app.delete("/songs/:id", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        const res = await deleteSongForUser(userId, id);
        if (res === null)
            return reply.code(404).send({ message: "Song not found" });
        if (res === "FORBIDDEN_SEED")
            return reply.code(403).send({ message: "Seed songs are read-only" });
        if (res === "FORBIDDEN")
            return reply.code(403).send({ message: "Forbidden" });
        return reply.code(204).send();
    });
    // PUBLISH (Contribute to community)
    app.post("/songs/:id/publish", async (req, reply) => {
        const userId = getUserId(req);
        if (!userId)
            return reply.code(401).send({ message: "Unauthorized" });
        const { id } = req.params;
        // 1. Get song
        const { supabase } = await import("../lib/supabase.js");
        const { data: song, error: e1 } = await supabase
            .from("songs")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (e1)
            throw e1;
        if (!song)
            return reply.code(404).send({ message: "Song not found" });
        // 2. Validate ownership & work link
        if (song.owner_id !== userId)
            return reply.code(403).send({ message: "Forbidden" });
        if (!song.work_id)
            return reply.code(400).send({ message: "Song is not linked to a work" });
        // 3. Publish
        const { createArrangementFromSong } = await import("../works/works.repo.js");
        const arrangement = await createArrangementFromSong(userId, song);
        return reply.code(201).send(arrangement);
    });
}
