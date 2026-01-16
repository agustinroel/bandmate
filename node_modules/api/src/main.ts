import Fastify from "fastify";
import cors from "@fastify/cors";
import type { CreateSongDto, Song, UpdateSongDto } from "@bandmate/shared";
import { randomUUID } from "node:crypto";
import { setlistsRoutes } from "./setlists/setlists.routes.js";
import "dotenv/config";

const corsOrigin = process.env.CORS_ORIGIN ?? "true";
const app = Fastify({ logger: true });

await app.register(cors, { origin: corsOrigin === "true" ? true : corsOrigin });

// ✅ Importante: NO prefix /api, porque el proxy ya lo recorta
app.register(setlistsRoutes);

const nowIso = () => new Date().toISOString();

let songs: Song[] = [
  {
    id: randomUUID(),
    title: "Something",
    artist: "The Beatles",
    key: "C",
    bpm: 66,
    durationSec: 182,
    notes: "Dinámica suave. Armonías en estribillo.",
    links: ["https://www.youtube.com/watch?v=UelDrZ1aFeY"],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

app.get("/songs", async () => songs);

app.get<{ Params: { id: string } }>("/songs/:id", async (req, reply) => {
  const song = songs.find((s) => s.id === req.params.id);
  if (!song) return reply.code(404).send({ message: "Song not found" });
  return song;
});

app.post<{ Body: CreateSongDto }>("/songs", async (req, reply) => {
  const dto = req.body;

  if (!dto?.title?.trim() || !dto?.artist?.trim()) {
    return reply.code(400).send({ message: "title and artist are required" });
  }

  const song: Song = {
    id: randomUUID(),
    title: dto.title.trim(),
    artist: dto.artist.trim(),
    key: dto.key,
    bpm: dto.bpm,
    durationSec: dto.durationSec,
    notes: dto.notes,
    links: dto.links ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  songs = [song, ...songs];
  return reply.code(201).send(song);
});

app.patch<{ Params: { id: string }; Body: UpdateSongDto }>(
  "/songs/:id",
  async (req, reply) => {
    const idx = songs.findIndex((s) => s.id === req.params.id);
    if (idx < 0) return reply.code(404).send({ message: "Song not found" });

    const current = songs[idx];
    const dto = req.body ?? {};

    const updated: Song = {
      ...current,
      ...dto,
      title: dto.title?.trim() ?? current.title,
      artist: dto.artist?.trim() ?? current.artist,
      links: dto.links ?? current.links,
      updatedAt: nowIso(),
    };

    songs[idx] = updated;
    return updated;
  }
);

app.delete<{ Params: { id: string } }>("/songs/:id", async (req, reply) => {
  const before = songs.length;
  songs = songs.filter((s) => s.id !== req.params.id);
  if (songs.length === before) {
    return reply.code(404).send({ message: "Song not found" });
  }
  return reply.code(204).send();
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
