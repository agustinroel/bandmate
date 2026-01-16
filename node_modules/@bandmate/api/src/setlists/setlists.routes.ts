import type { FastifyPluginAsync } from "fastify";
import type {
  AddSetlistItemDto,
  CreateSetlistDto,
  ReorderSetlistDto,
  UpdateSetlistDto,
} from "@bandmate/shared";

import {
  addSetlistItem,
  createSetlist,
  deleteSetlist,
  getSetlist,
  listSetlists,
  removeSetlistItem,
  reorderSetlist,
  updateSetlist,
} from "./setlists.repo.js";

export const setlistsRoutes: FastifyPluginAsync = async (app) => {
  // List
  app.get("/setlists", async () => listSetlists());

  // Get
  app.get<{ Params: { id: string } }>("/setlists/:id", async (req, reply) => {
    const setlist = await getSetlist(req.params.id);
    if (!setlist) return reply.code(404).send({ message: "Setlist not found" });
    return setlist;
  });

  // Create
  app.post<{ Body: CreateSetlistDto }>("/setlists", async (req, reply) => {
    const dto = req.body;

    if (!dto?.name?.trim()) {
      return reply.code(400).send({ message: "Name is required" });
    }

    const created = await createSetlist(dto);
    return reply.code(201).send(created);
  });

  // Update
  app.patch<{ Params: { id: string }; Body: UpdateSetlistDto }>(
    "/setlists/:id",
    async (req, reply) => {
      const dto = req.body ?? {};
      const updated = await updateSetlist(req.params.id, dto);
      if (!updated)
        return reply.code(404).send({ message: "Setlist not found" });
      return updated;
    }
  );

  // Delete
  app.delete<{ Params: { id: string } }>(
    "/setlists/:id",
    async (req, reply) => {
      const ok = await deleteSetlist(req.params.id);
      if (!ok) return reply.code(404).send({ message: "Setlist not found" });
      return reply.code(204).send();
    }
  );

  // Add item
  app.post<{ Params: { id: string }; Body: AddSetlistItemDto }>(
    "/setlists/:id/items",
    async (req, reply) => {
      const dto = req.body;

      if (!dto?.songId?.trim()) {
        return reply.code(400).send({ message: "songId is required" });
      }

      const res = await addSetlistItem(req.params.id, dto);

      if (res === null)
        return reply.code(404).send({ message: "Setlist not found" });
      if ("error" in res && res.error === "duplicate") {
        return reply.code(409).send({ message: "Song already in setlist" });
      }

      return res;
    }
  );

  // Remove item
  app.delete<{ Params: { id: string; songId: string } }>(
    "/setlists/:id/items/:songId",
    async (req, reply) => {
      const updated = await removeSetlistItem(req.params.id, req.params.songId);
      if (!updated)
        return reply.code(404).send({ message: "Setlist not found" });
      return updated;
    }
  );

  // Reorder
  app.put<{ Params: { id: string }; Body: ReorderSetlistDto }>(
    "/setlists/:id/reorder",
    async (req, reply) => {
      const dto = req.body;

      if (!dto?.songIds || !Array.isArray(dto.songIds)) {
        return reply.code(400).send({ message: "songIds is required" });
      }

      const updated = await reorderSetlist(req.params.id, dto);
      if (!updated)
        return reply.code(400).send({ message: "Invalid reorder payload" });
      return updated;
    }
  );
};
