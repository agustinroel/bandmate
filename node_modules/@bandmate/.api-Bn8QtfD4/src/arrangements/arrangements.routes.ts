import type { FastifyInstance } from "fastify";
import {
  deleteArrangementForUser,
  getArrangementById,
  rateArrangementForUser,
  updateArrangementForUser,
} from "./arrangements.repo.js";

type AuthedRequest = { user?: { id: string } };

function getUserId(req: any): string | null {
  const u = (req as AuthedRequest).user;
  return u?.id ?? null;
}

export async function arrangementsRoutes(app: FastifyInstance) {
  // GET arrangement
  app.get("/arrangements/:id", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const a = await getArrangementById(id);
    if (!a) return reply.code(404).send({ message: "Arrangement not found" });
    return a;
  });

  // PATCH arrangement (solo autor)
  app.patch("/arrangements/:id", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const patch = (req.body ?? {}) as any;

    const updated = await updateArrangementForUser(userId, id, patch);

    if (updated === null)
      return reply.code(404).send({ message: "Arrangement not found" });
    if (updated === "FORBIDDEN_SEED")
      return reply.code(403).send({ message: "Seed is read-only" });
    if (updated === "FORBIDDEN")
      return reply.code(403).send({ message: "Forbidden" });

    return updated;
  });

  // DELETE arrangement (solo autor)
  app.delete("/arrangements/:id", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const res = await deleteArrangementForUser(userId, id);

    if (res === null)
      return reply.code(404).send({ message: "Arrangement not found" });
    if (res === "FORBIDDEN_SEED")
      return reply.code(403).send({ message: "Seed is read-only" });
    if (res === "FORBIDDEN")
      return reply.code(403).send({ message: "Forbidden" });

    return reply.code(204).send();
  });

  // RATE arrangement (1..5)
  app.post("/arrangements/:id/rate", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as any;

    const raw = body.value ?? body.rating;
    const value = Number(raw);

    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return reply
        .code(400)
        .send({ message: "rating must be a number between 1 and 5" });
    }

    const updated = await rateArrangementForUser(userId, id, value);

    if (updated === "BAD_RATING") {
      return reply
        .code(400)
        .send({ message: "rating must be a number between 1 and 5" });
    }
    if (!updated)
      return reply.code(404).send({ message: "Arrangement not found" });

    return reply.code(200).send(updated);
  });
}
