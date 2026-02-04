import type { FastifyInstance } from "fastify";
import type {
  CreateSetlistDto,
  UpdateSetlistDto,
  AddSetlistItemDto,
  ReorderSetlistDto,
} from "@bandmate/shared";
import {
  listSetlistsForUser,
  getSetlistForUser,
  createSetlistForUser,
  updateSetlistForUser,
  deleteSetlistForUser,
  addSongToSetlistForUser,
  removeSongFromSetlistForUser,
  reorderSetlistForUser,
} from "./setlists.repo.js";

export async function setlistsRoutes(app: FastifyInstance) {
  app.get("/setlists", async (req) => {
    const userId = req.user!.id;
    return listSetlistsForUser(userId);
  });

  app.get<{ Params: { id: string } }>("/setlists/:id", async (req, reply) => {
    const userId = req.user!.id;
    const res = await getSetlistForUser(userId, req.params.id);
    if (res === null)
      return reply.code(404).send({ message: "Setlist not found" });
    if (res === "FORBIDDEN")
      return reply.code(403).send({ message: "Forbidden" });
    return res;
  });

  app.post<{ Body: CreateSetlistDto }>("/setlists", async (req, reply) => {
    const userId = req.user!.id;
    const dto = req.body;
    if (!dto?.name?.trim())
      return reply.code(400).send({ message: "name is required" });
    const created = await createSetlistForUser(userId, {
      name: dto.name,
      notes: (dto as any).notes,
    });
    return reply.code(201).send(created);
  });

  app.patch<{ Params: { id: string }; Body: UpdateSetlistDto }>(
    "/setlists/:id",
    async (req, reply) => {
      const userId = req.user!.id;
      const res = await updateSetlistForUser(userId, req.params.id, {
        name: (req.body as any).name,
        notes: (req.body as any).notes,
      });

      if (res === null)
        return reply.code(404).send({ message: "Setlist not found" });
      if (res === "FORBIDDEN")
        return reply.code(403).send({ message: "Forbidden" });
      return res;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/setlists/:id",
    async (req, reply) => {
      const userId = req.user!.id;
      const res = await deleteSetlistForUser(userId, req.params.id);

      if (res === null)
        return reply.code(404).send({ message: "Setlist not found" });
      if (res === "FORBIDDEN")
        return reply.code(403).send({ message: "Forbidden" });

      return reply.code(204).send();
    },
  );

  app.post<{ Params: { id: string }; Body: AddSetlistItemDto }>(
    "/setlists/:id/items",
    async (req, reply) => {
      const userId = req.user!.id;
      const dto = req.body;

      if (!dto?.songId)
        return reply.code(400).send({ message: "songId is required" });

      const res = await addSongToSetlistForUser(
        userId,
        req.params.id,
        dto.songId,
      );

      if (res === null)
        return reply.code(404).send({ message: "Setlist not found" });
      if (res === "FORBIDDEN")
        return reply.code(403).send({ message: "Forbidden" });

      return res;
    },
  );

  app.delete<{ Params: { id: string; songId: string } }>(
    "/setlists/:id/items/:songId",
    async (req, reply) => {
      const userId = req.user!.id;
      const res = await removeSongFromSetlistForUser(
        userId,
        req.params.id,
        req.params.songId,
      );

      if (res === null)
        return reply.code(404).send({ message: "Setlist not found" });
      if (res === "FORBIDDEN")
        return reply.code(403).send({ message: "Forbidden" });

      return res;
    },
  );

  app.post<{ Params: { id: string }; Body: ReorderSetlistDto }>(
    "/setlists/:id/reorder",
    async (req, reply) => {
      const userId = req.user!.id;
      const dto = req.body;

      const songIds = (dto as any).songIds as string[] | undefined;
      if (!Array.isArray(songIds))
        return reply.code(400).send({ message: "songIds is required" });

      const res = await reorderSetlistForUser(userId, req.params.id, songIds);

      if (res === null)
        return reply.code(404).send({ message: "Setlist not found" });
      if (res === "FORBIDDEN")
        return reply.code(403).send({ message: "Forbidden" });

      return res;
    },
  );
}
