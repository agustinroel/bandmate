import { listPublicProfiles, getProfileByUsername } from "./profiles.repo.js";
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
        return items;
    });
    // GET public profile details by username
    app.get("/profiles/:username", async (req, reply) => {
        const { username } = req.params;
        const profile = await getProfileByUsername(username);
        if (!profile) {
            return reply.code(404).send({ message: "Profile not found" });
        }
        if (!profile.is_public) {
            // If not public, maybe 404 or 403?
            // Requirement: "filter all, but only see info if public".
            // So if I know the username but it's private, I should probably not see details.
            return reply.code(403).send({ message: "This profile is private." });
        }
        return profile;
    });
}
