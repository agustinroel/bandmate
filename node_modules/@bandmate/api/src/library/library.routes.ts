// apps/api/src/library/library.routes.ts
import type { FastifyInstance } from "fastify";
import { getLibraryWork, listLibrary } from "./library.repo.js";

export async function libraryRoutes(app: FastifyInstance) {
  app.get("/library", async (_req, _reply) => {
    return listLibrary();
  });

  app.get("/library/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = await getLibraryWork(id);
    if (!data) return reply.code(404).send({ message: "Work not found" });
    return data;
  });
}
