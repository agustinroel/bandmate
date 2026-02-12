import { FastifyPluginAsync } from "fastify";
import { spotifyService } from "../services/spotify.service.js";
import { musicBrainzService } from "../services/musicbrainz.service.js";
import { createSongForUser } from "../songs/songs.repo.js";
import { aiOrchestrator } from "../services/ai-orchestrator.service.js";
import { createWork, createArrangementFromSong } from "../works/works.repo.js";
import { addToIngestionQueue } from "../services/ingestion-queue.service.js";
import fs from "fs";
import path from "path";

function logToIngestionFile(msg: string) {
  const logPath = path.join(process.cwd(), "ingestion.log");
  const stamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${stamp}] [HTTP-Route] ${msg}\n`);
}

export const importRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /import/spotify/playlist/:id
   * Fetch tracks from a Spotify playlist for preview.
   */
  app.get("/import/spotify/playlist/:id", async (req: any, reply) => {
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
    } catch (err: any) {
      return reply.status(500).send({ message: err.message });
    }
  });

  /**
   * POST /import/spotify/sync
   * Import selected tracks into the user's library.
   */
  app.post("/import/spotify/sync", async (req: any, reply) => {
    const { tracks } = req.body; // Array of Spotify tracks
    const userId = req.user.id;

    const results = [];
    for (const st of tracks) {
      try {
        // 1. Check MusicBrainz for high-fidelity duration/metadata
        const mbMatches = await musicBrainzService.searchRecording(
          st.name,
          st.artist,
        );
        const mbId = mbMatches[0]?.id;
        const duration =
          mbMatches[0]?.duration || Math.round(st.durationMs / 1000);

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
      } catch (err: any) {
        results.push({ id: st.id, success: false, error: err.message });
      }
    }

    return results;
  });

  /**
   * Phase 1 Prototype: AI Ingestion
   * POST /import/ingest/:mbid
   */
  app.post("/ingest/:mbid", async (req: any, reply) => {
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
      } else {
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
        genre: details.genre,
        musicbrainzId: mbid,
        source: "musicbrainz",
      });

      // 3. Generate AI Arrangement with duplicate check
      const generated = await aiOrchestrator.generateForWork(mbid);

      // We'll use the service to handle storing etc but routes usually do direct logic too
      // However, to keep it consistent with the queue improvements:
      const { getWorkArrangementsCount } =
        await import("../works/works.repo.js");
      const arrCount = await getWorkArrangementsCount(work.id);

      if (arrCount > 0 && !isForce) {
        return {
          success: true,
          workId: work.id,
          message:
            "Work already has an arrangement. Use force=true to regenerate.",
          skipped: true,
        };
      }

      // 4. Store Arrangement
      const arr = await createArrangementFromSong(userId, {
        work_id: work.id,
        sections: generated.sections,
        key: generated.key,
        bpm: generated.bpm,
        duration_sec: details.duration,
      });

      // 5. Create legacy song entry for user visibility in Setlists/Library
      await createSongForUser(userId, {
        title: details.title,
        artist: details.artist,
        duration_sec: details.duration,
        musicbrainzId: mbid,
        workId: work.id,
        originArrangementId: arr.id,
        sections: generated.sections,
        key: generated.key,
        bpm: generated.bpm,
        is_imported: true,
      });

      return {
        success: true,
        workId: work.id,
        arrangementId: arr.id,
        preview: generated,
      };
    } catch (err: any) {
      return reply.status(500).send({ message: err.message });
    }
  });

  /**
   * POST /import/bulk
   * Body: { artists: string[] }
   */
  app.post("/bulk", async (req: any, reply) => {
    const { artists } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(artists)) {
      return reply
        .status(400)
        .send({ message: "Artists must be an array of strings" });
    }

    logToIngestionFile(
      `Bulk ingestion requested for ${artists.length} artists: ${artists.join(", ")} (User: ${userId})`,
    );
    console.log(
      `[Import] Bulk ingestion requested for ${artists.length} artists.`,
    );

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

  /**
   * GET /import/search?q=...
   * Search MusicBrainz for a recording.
   */
  app.get("/search", async (req: any, reply) => {
    const { q } = req.query;
    if (!q) return [];

    try {
      // Logic: if 'q' has a dash, split artist - title, else search as title
      let matches;
      if (q.includes("-")) {
        const [artist, title] = q.split("-").map((s: string) => s.trim());
        matches = await musicBrainzService.searchRecording(title, artist);
      } else {
        matches = await musicBrainzService.searchRecording(q, ""); // artist as empty string
      }
      return matches;
    } catch (err: any) {
      return reply.status(500).send({ message: err.message });
    }
  });
};
