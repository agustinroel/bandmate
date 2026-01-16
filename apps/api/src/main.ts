import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

import type { CreateSongDto, UpdateSongDto } from "@bandmate/shared";
import { setlistsRoutes } from "./setlists/setlists.routes.js";
import {
  listSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
} from "./songs/songs.repo.js";

const corsOrigin = process.env.CORS_ORIGIN ?? "true";
const app = Fastify({ logger: true });

await app.register(cors, { origin: corsOrigin === "true" ? true : corsOrigin });

// ✅ Importante: NO prefix /api, porque el proxy ya lo recorta
app.register(setlistsRoutes);

// ---- Songs ----

app.get("/songs", async () => listSongs());

app.get<{ Params: { id: string } }>("/songs/:id", async (req, reply) => {
  const song = await getSong(req.params.id);
  if (!song) return reply.code(404).send({ message: "Song not found" });
  return song;
});

app.post<{ Body: CreateSongDto }>("/songs", async (req, reply) => {
  const dto = req.body;

  if (!dto?.title?.trim() || !dto?.artist?.trim()) {
    return reply.code(400).send({ message: "title and artist are required" });
  }

  const created = await createSong(dto);
  return reply.code(201).send(created);
});

app.patch<{ Params: { id: string }; Body: UpdateSongDto }>(
  "/songs/:id",
  async (req, reply) => {
    const updated = await updateSong(req.params.id, req.body ?? {});
    if (!updated) return reply.code(404).send({ message: "Song not found" });
    return updated;
  }
);

app.delete<{ Params: { id: string } }>("/songs/:id", async (req, reply) => {
  const ok = await deleteSong(req.params.id);
  if (!ok) return reply.code(404).send({ message: "Song not found" });
  return reply.code(204).send();
});

// ---- Start ----

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
