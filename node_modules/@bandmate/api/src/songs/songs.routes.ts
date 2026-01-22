import type { FastifyInstance } from "fastify";
import type { CreateSongInput, UpdateSongInput } from "./songs.repo.js";
import {
  createSongForUser,
  deleteSongForUser,
  getSongByIdForUser,
  listSongsForUser,
  updateSongForUser,
} from "./songs.repo.js";

type AuthedRequest = {
  user?: { id: string };
};

function getUserId(req: any): string | null {
  // Ajustá acá si tu auth plugin usa otro shape (sub, userId, etc.)
  const u = (req as AuthedRequest).user;
  return u?.id ?? null;
}

export async function songsRoutes(app: FastifyInstance) {
  // LIST
  app.get("/songs", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const songs = await listSongsForUser(userId);
    return songs;
  });

  // GET BY ID
  app.get("/songs/:id", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const song = await getSongByIdForUser(userId, id);

    if (!song) return reply.code(404).send({ message: "Song not found" });
    return song;
  });

  // CREATE
  app.post("/songs", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const dto = req.body as Partial<CreateSongInput>;

    // Validación mínima (MVP)
    if (!dto?.title?.trim() || !dto?.artist?.trim()) {
      return reply.code(400).send({ message: "title and artist are required" });
    }

    const created = await createSongForUser(userId, dto as CreateSongInput);
    return reply.code(201).send(created);
  });

  // UPDATE
  app.patch("/songs/:id", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const patch = (req.body ?? {}) as UpdateSongInput;

    const updated = await updateSongForUser(userId, id, patch);

    if (updated === null)
      return reply.code(404).send({ message: "Song not found" });

    if (updated === "FORBIDDEN_SEED")
      return reply.code(403).send({ message: "Seed songs are read-only" });

    if (updated === "FORBIDDEN")
      return reply.code(403).send({ message: "Forbidden" });

    return updated;
  });

  // DELETE
  app.delete("/songs/:id", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const res = await deleteSongForUser(userId, id);

    if (res === null)
      return reply.code(404).send({ message: "Song not found" });

    if (res === "FORBIDDEN_SEED")
      return reply.code(403).send({ message: "Seed songs are read-only" });

    if (res === "FORBIDDEN")
      return reply.code(403).send({ message: "Forbidden" });

    return reply.code(204).send();
  });
}
