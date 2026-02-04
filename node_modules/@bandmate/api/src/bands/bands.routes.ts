import {
  addSongToBand,
  createBand,
  getBand,
  listBandMembers,
  listBandSongs,
  listBandsForUser,
  removeSongFromBand,
  updateBand,
  getOrCreateInviteCode,
  joinBandByCode,
  inviteUserToBand,
  listPendingInvites,
  respondToInvite,
} from "./bands.repo.js";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function bandsRoutes(app: FastifyInstance) {
  // --- Invitations (User to User) ---

  // Invite a user to a band
  app.post("/bands/:id/users", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const { userId } = req.body as { userId: string };

    if (!userId) return reply.code(400).send({ message: "userId is required" });

    try {
      // TODO: Check if user is admin/owner of band 'id'
      await inviteUserToBand(id, user.id, userId);
      return { success: true };
    } catch (e: any) {
      req.log.error(e);
      return reply.code(400).send({ message: e.message });
    }
  });

  // List my pending invitations
  app.get("/me/invitations", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    try {
      const invites = await listPendingInvites(user.id);
      return invites;
    } catch (e: any) {
      req.log.error(e);
      return reply.code(500).send({ message: "Error fetching invitations" });
    }
  });

  // Respond to invitation
  app.post("/invitations/:id/respond", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const { accept } = req.body as { accept: boolean };

    try {
      const result = await respondToInvite(id, user.id, accept);
      return result;
    } catch (e: any) {
      req.log.error(e);
      return reply.code(400).send({ message: e.message });
    }
  });
  // Create a new band
  app.post("/bands", async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const body = req.body as { name: string; description?: string };
    if (!body.name || body.name.length < 2) {
      return reply
        .code(400)
        .send({ message: "Name is required (min 2 chars)" });
    }

    try {
      const band = await createBand(user.id, body);
      return band;
    } catch (e: any) {
      req.log.error(e);
      return reply
        .code(500)
        .send({ message: e.message || "Could not create band" });
    }
  });

  // List my bands (Authenticated)
  app.get("/me/bands", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    try {
      const bands = await listBandsForUser(user.id);
      return bands;
    } catch (e: any) {
      req.log.error(e);
      return reply.code(500).send({ message: "Could not list bands" });
    }
  });

  // List bands for a specific profile (Public or Auth)
  app.get("/profiles/:userId/bands", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    if (!userId) return reply.code(400).send();

    try {
      // reuse same logic: list bands where user is member
      const bands = await listBandsForUser(userId);
      return bands;
    } catch (e: any) {
      return reply.code(500).send({ message: "Error fetching bands" });
    }
  });

  // --- Band Details & Interactions ---

  // Get Band Details
  app.get("/bands/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const band = await getBand(id);
      if (!band) return reply.code(404).send({ message: "Band not found" });
      return band;
    } catch (e) {
      req.log.error(e);
      return reply.code(500).send({ message: "Error fetching band" });
    }
  });

  // Get Band Members
  app.get("/bands/:id/members", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      return await listBandMembers(id);
    } catch (e) {
      return reply.code(500).send({ message: "Error fetching members" });
    }
  });

  // Get Shared Songs
  app.get("/bands/:id/songs", async (req, reply) => {
    const { id } = req.params as { id: string };
    // In future: Check if user is member? For now assumed public/member readable via RLS (repo handles query)
    try {
      return await listBandSongs(id);
    } catch (e) {
      req.log.error(e);
      return reply
        .code(500)
        .send({ message: "Error fetching songs", details: e });
    }
  });

  // Share Song
  app.post("/bands/:id/songs", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = req.params as { id: string };
    const { songId } = req.body as { songId: string };

    if (!songId) return reply.code(400).send({ message: "songId is required" });

    try {
      await addSongToBand(user.id, id, songId);
      return { success: true };
    } catch (e: any) {
      req.log.error(e);
      // Could be unique violation if already shared
      return reply.code(500).send({ message: "Could not share song" });
    }
  });

  // Unshare Song
  app.delete("/bands/:id/songs/:songId", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { id, songId } = req.params as { id: string; songId: string };

    try {
      await removeSongFromBand(user.id, id, songId);
      return { success: true };
    } catch (e) {
      return reply.code(500).send({ message: "Could not unshare song" });
    }
  });

  // Update Band (Admin/Owner check via RLS or logic)
  app.patch("/bands/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      name?: string;
      description?: string;
      avatar_url?: string;
    };
    try {
      // In production: Check if user is owner/admin
      const data = await updateBand(id, body);
      return data;
    } catch (e) {
      req.log.error(e);
      return reply.code(500).send({ message: "Error updating band" });
    }
  });

  // Invite Code
  app.post("/bands/:id/invite", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      // In prod: check if user is admin
      const code = await getOrCreateInviteCode(id);
      return { code };
    } catch (e: any) {
      return reply.code(500).send({ message: e.message });
    }
  });

  // Join Band
  app.post("/bands/join", async (req, reply) => {
    const user = (req as any).user;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });

    const { code } = req.body as { code: string };
    console.log(`[API] Join attempt for user ${user.id} with code ${code}`);

    if (!code) return reply.code(400).send({ message: "code is required" });

    try {
      const band = await joinBandByCode(user.id, code);
      console.log(`[API] Join successful for band ${band.id}`);
      return { success: true, band };
    } catch (e: any) {
      console.error(`[API] Join failed:`, e);
      return reply.code(400).send({ message: e.message });
    }
  });
}
