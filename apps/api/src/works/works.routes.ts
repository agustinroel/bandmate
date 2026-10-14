import type { FastifyInstance } from "fastify";
import {
  createWork,
  getWorkByIdWithArrangements,
  listWorksWithTopArrangement,
} from "./works.repo.js";
import { createArrangementForWork } from "../arrangements/arrangements.repo.js";
import { aiService } from "../ai/ai.service.js";

type AuthedRequest = { user?: { id: string } };

function getUserId(req: any): string | null {
  const u = (req as AuthedRequest).user;
  return u?.id ?? null;
}

export async function worksRoutes(app: FastifyInstance) {
  // LIST library works (public or authed)
  app.get("/works", async (req, reply) => {
    const items = await listWorksWithTopArrangement();
    return items;
  });

  // GET work + arrangements (public or authed)
  app.get("/works/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await getWorkByIdWithArrangements(id);
    if (!res) return reply.code(404).send({ message: "Work not found" });

    return res;
  });

  // CREATE work (opcional)
  app.post("/works", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const body = (req.body ?? {}) as any;
    if (!body?.title?.trim() || !body?.artist?.trim()) {
      return reply.code(400).send({ message: "title and artist are required" });
    }

    const created = await createWork({
      title: body.title,
      artist: body.artist,
      rights: body.rights,
      source: body.source,
      musicbrainzId: body.musicbrainzId ?? null,
      wikidataId: body.wikidataId ?? null,
      rightsNotes: body.rightsNotes ?? null,
    });

    return reply.code(201).send(created);
  });

  // CREATE arrangement for a work
  app.post("/works/:id/arrangements", async (req, reply) => {
    const userId = getUserId(req);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id: workId } = req.params as { id: string };
    const body = (req.body ?? {}) as any;

    // mínimo: sections
    const sections = Array.isArray(body.sections) ? body.sections : [];
    const created = await createArrangementForWork(userId, workId, {
      sections,
      key: body.key ?? null,
      bpm: body.bpm ?? null,
      durationSec: body.durationSec ?? null,
      notes: body.notes ?? null,
      links: Array.isArray(body.links) ? body.links : [],
      tags: Array.isArray(body.tags) ? body.tags : null,
      capo: body.capo ?? null,
      timeSignature: body.timeSignature ?? null,
      source: body.source ?? "community",
    });

    if (created === "WORK_NOT_FOUND") {
      return reply.code(404).send({ message: "Work not found" });
    }

    return reply.code(201).send(created);
  });

  // GENERATE AI arrangement for a work
  app.post("/works/:id/generate-ai-arrangement", async (req, reply) => {
    const userId = getUserId(req);
    const { id: workId } = req.params as { id: string };
    const workRes = await getWorkByIdWithArrangements(workId);
    if (!workRes?.work) {
      return reply.code(404).send({ message: "Work not found" });
    }

    const { title, artist } = workRes.work;
    const aiArr = await aiService.generateArrangement({ title, artist });

    const created = await createArrangementForWork(userId ?? "", workId, {
      sections: aiArr.sections,
      key: aiArr.key,
      bpm: aiArr.bpm ? String(aiArr.bpm) : null,
      timeSignature: aiArr.timeSignature,
      notes: `Arrangement generated with Gemini AI (${aiArr.source || "AI Transcription"}).`,
      source: "community",
    });

    if (created === "WORK_NOT_FOUND") {
      return reply.code(404).send({ message: "Work not found" });
    }

    return reply.code(201).send(created);
  });
}
