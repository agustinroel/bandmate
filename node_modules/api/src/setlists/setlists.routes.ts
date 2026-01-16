import type { FastifyInstance } from "fastify";
import type {
  CreateSetlistDto,
  UpdateSetlistDto,
  AddSetlistItemDto,
  ReorderSetlistDto,
} from "@bandmate/shared";
import { SetlistsRepo } from "./setlists.repo.js";

const repo = new SetlistsRepo();

export async function setlistsRoutes(app: FastifyInstance) {
  app.get("/setlists", async () => repo.list());

  app.get<{ Params: { id: string } }>("/setlists/:id", async (req, reply) => {
    const s = repo.get(req.params.id);
    if (!s) return reply.code(404).send({ message: "Setlist not found" });
    return s;
  });

  app.post<{ Body: CreateSetlistDto }>("/setlists", async (req, reply) => {
    if (!req.body?.name?.trim())
      return reply.code(400).send({ message: "Name is required" });
    return repo.create(req.body);
  });

  app.patch<{ Params: { id: string }; Body: UpdateSetlistDto }>(
    "/setlists/:id",
    async (req, reply) => {
      const s = repo.update(req.params.id, req.body ?? {});
      if (!s) return reply.code(404).send({ message: "Setlist not found" });
      return s;
    }
  );

  app.delete<{ Params: { id: string; songId: string } }>(
    "/setlists/:id/items/:songId",
    async (req, reply) => {
      const s = repo.removeItem(req.params.id, req.params.songId);
      if (!s) return reply.code(404).send({ message: "Setlist not found" });
      return s;
    }
  );

  app.post<{ Params: { id: string }; Body: AddSetlistItemDto }>(
    "/setlists/:id/items",
    async (req, reply) => {
      const s = repo.addItem(req.params.id, req.body);
      if (!s) return reply.code(404).send({ message: "Setlist not found" });
      return s;
    }
  );

  app.post<{ Params: { id: string }; Body: ReorderSetlistDto }>(
    "/setlists/:id/reorder",
    async (req, reply) => {
      const s = repo.reorder(req.params.id, req.body);
      if (!s) return reply.code(404).send({ message: "Setlist not found" });
      return s;
    }
  );
}
