import { spotifyService } from "../services/spotify.service.js";
import { musicBrainzService } from "../services/musicbrainz.service.js";
import { createSongForUser } from "../songs/songs.repo.js";
import { aiOrchestrator } from "../services/ai-orchestrator.service.js";
import { createWork, createArrangementFromSong } from "../works/works.repo.js";
import { addToIngestionQueue } from "../services/ingestion-queue.service.js";
export const importRoutes = async (app) => {
    /**
     * GET /import/spotify/playlist/:id
     * Fetch tracks from a Spotify playlist for preview.
     */
    app.get("/import/spotify/playlist/:id", async (req, reply) => {
        const { id } = req.params;
        const token = req.headers["x-spotify-token"]; // Simplified for now
        if (!token) {
            return reply
                .status(401)
                .send({ message: "Missing Spotify Access Token" });
        }
        try {
            const tracks = await spotifyService.getPlaylistTracks(token, id);
            return tracks;
        }
        catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    });
    /**
     * POST /import/spotify/sync
     * Import selected tracks into the user's library.
     */
    app.post("/import/spotify/sync", async (req, reply) => {
        const { tracks } = req.body; // Array of Spotify tracks
        const userId = req.user.id;
        const results = [];
        for (const st of tracks) {
            try {
                // 1. Check MusicBrainz for high-fidelity duration/metadata
                const mbMatches = await musicBrainzService.searchRecording(st.name, st.artist);
                const mbId = mbMatches[0]?.id;
                const duration = mbMatches[0]?.duration || Math.round(st.durationMs / 1000);
                // 2. Create the song in Bandmate
                const song = await createSongForUser(userId, {
                    title: st.name,
                    artist: st.artist,
                    duration_sec: duration,
                    spotify_id: st.id,
                    musicbrainz_id: mbId,
                    is_imported: true,
                    notes: `Imported from Spotify album: ${st.album}`,
                    sections: [],
                    links: [`https://open.spotify.com/track/${st.id}`],
                });
                results.push({ id: st.id, success: true, songId: song.id });
            }
            catch (err) {
                results.push({ id: st.id, success: false, error: err.message });
            }
        }
        return results;
    });
    /**
     * Phase 1 Prototype: AI Ingestion
     * POST /import/ingest/:mbid
     */
    app.post("/ingest/:mbid", async (req, reply) => {
        let { mbid } = req.params;
        const { title, artist, force } = req.query; // Fallback search + force flag
        const userId = req.user.id;
        const isForce = force === "true" || force === true;
        try {
            let details;
            if (mbid === "search" && title && artist) {
                console.log(`[Ingest] Searching for: ${title} - ${artist}`);
                const matches = await musicBrainzService.searchRecording(title, artist);
                if (matches.length === 0)
                    return reply
                        .status(404)
                        .send({ message: "No matches found for search" });
                mbid = matches[0].id;
                details = matches[0];
            }
            else {
                details = await musicBrainzService.getRecordingDetails(mbid);
            }
            if (!details) {
                return reply.status(404).send({
                    message: "Recording not found",
                    mbid,
                    hint: "Ensure you are using a Recording MBID, not a Release or Artist ID.",
                });
            }
            // 2. Create the "Work" (The canonical song)
            const work = await createWork({
                title: details.title,
                artist: details.artist,
                musicbrainzId: mbid,
                source: "musicbrainz",
            });
            // 3. Generate AI Arrangement
            const generated = await aiOrchestrator.generateForWork(mbid);
            // 4. Store Arrangement
            const arr = await createArrangementFromSong(userId, {
                work_id: work.id,
                sections: generated.sections,
                key: generated.key,
                bpm: generated.bpm,
                duration_sec: details.duration,
            });
            return {
                success: true,
                workId: work.id,
                arrangementId: arr.id,
                preview: generated,
            };
        }
        catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    });
    /**
     * POST /import/bulk
     * Body: { artists: string[] }
     */
    app.post("/bulk", async (req, reply) => {
        const { artists } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(artists)) {
            return reply
                .status(400)
                .send({ message: "Artists must be an array of strings" });
        }
        console.log(`[Import] Bulk ingestion requested for ${artists.length} artists.`);
        for (const artist of artists) {
            await addToIngestionQueue({
                type: "ingest-artist",
                payload: { artist },
                userId,
            });
        }
        return {
            success: true,
            message: `${artists.length} artist ingestion jobs accepted.`,
            processingMode: "Resilient Hybrid (Redis or Sequential)",
        };
    });
};
