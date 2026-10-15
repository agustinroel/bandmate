import { listPublicProfiles, getProfileByUsername, getProfileById, } from "./profiles.repo.js";
export async function profilesRoutes(app) {
    // LIST public profiles (discovery)
    app.get("/profiles", async (req, reply) => {
        const query = (req.query ?? {});
        const limit = query.limit ? Number(query.limit) : 20;
        const offset = query.offset ? Number(query.offset) : 0;
        const filters = {};
        if (query.q) {
            filters.query = query.q;
        }
        if (query.instruments) {
            filters.instruments = query.instruments
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean);
        }
        if (query.genres) {
            filters.genres = query.genres
                .split(",")
                .map((g) => g.trim())
                .filter(Boolean);
        }
        if (query.sings === "true" || query.sings === "1") {
            filters.sings = true;
        }
        const items = await listPublicProfiles(filters, limit, offset);
        const { getMultipleFollowStats } = await import("../community/follows.repo.js");
        const userIds = items.map((p) => p.id);
        const followStats = await getMultipleFollowStats(userIds, req.user?.id);
        const enriched = items.map((p) => ({
            ...p,
            followersCount: followStats[p.id]?.followersCount ?? 0,
            followingCount: followStats[p.id]?.followingCount ?? 0,
            isFollowing: followStats[p.id]?.isFollowing ?? false,
        }));
        return enriched;
    });
    // GET public profile details by username
    app.get("/profiles/:username", async (req, reply) => {
        const { username } = req.params;
        const profile = await getProfileByUsername(username);
        if (!profile) {
            return reply.code(404).send({ message: "Profile not found" });
        }
        if (!profile.is_public) {
            return reply.code(403).send({ message: "This profile is private." });
        }
        let followersCount = 0;
        let followingCount = 0;
        let isFollowing = false;
        let mainBand = null;
        try {
            const { getFollowStatus } = await import("../community/follows.repo.js");
            const callerId = req.user?.id;
            const stats = await getFollowStatus(callerId, profile.id);
            followersCount = stats.followersCount;
            followingCount = stats.followingCount;
            isFollowing = stats.isFollowing;
        }
        catch (_) { }
        try {
            const { listBandsForUser } = await import("../bands/bands.repo.js");
            const bands = await listBandsForUser(profile.id);
            if (bands && bands.length > 0) {
                mainBand = bands[0]?.name || null;
            }
        }
        catch (_) { }
        return {
            ...profile,
            followersCount,
            followingCount,
            isFollowing,
            mainBand,
        };
    });
    // GET current user's profile (authenticated)
    app.get("/profiles/me", { preHandler: [app.requireAuth] }, async (req, reply) => {
        const userId = req.user.id;
        const profile = await getProfileById(userId);
        if (!profile) {
            return reply.code(404).send({ message: "Profile not found" });
        }
        return profile;
    });
}
