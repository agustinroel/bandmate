import { FastifyPluginAsync } from "fastify";
import { parseSmartTab } from "@bandmate/shared";
import { spotifyService } from "../services/spotify.service.js";
import { musicBrainzService } from "../services/musicbrainz.service.js";
import { cifraClubService } from "../services/cifraclub.service.js";
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
   * POST /import/ingest/:mbid
   * Supports CifraClub IDs ("cc:artistSlug__songSlug") directly as well as MusicBrainz fallback.
   */
  app.post("/ingest/:mbid", async (req: any, reply) => {
    let { mbid } = req.params;
    const { title, artist, force } = req.query; // Fallback search + force flag
    const userId = req.user?.id;
    const isForce = force === "true" || force === true;

    try {
      // 1. Direct CifraClub ingestion ("cc:artistSlug__songSlug")
      if (typeof mbid === "string" && mbid.startsWith("cc:")) {
        const result = await cifraClubService.ingestToLibrary(mbid, userId);
        return result;
      }

      // 2. If search by title + artist, try CifraClub first so we get real complete chords
      if (mbid === "search" && title) {
        const ccMatches = await cifraClubService.search(`${title} ${artist || ""}`.trim(), 3);
        if (ccMatches.length > 0) {
          const result = await cifraClubService.ingestToLibrary(ccMatches[0].id, userId);
          return result;
        }
      }

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
          hint: "Ensure you are using a Recording MBID or CifraClub ID (cc:artist__song).",
        });
      }

      // Try CifraClub for this recording's title + artist before falling back to AI
      const ccLookup = await cifraClubService.search(`${details.title} ${details.artist}`, 3);
      if (ccLookup.length > 0) {
        const result = await cifraClubService.ingestToLibrary(ccLookup[0].id, userId);
        return result;
      }

      // Create the "Work" (The canonical song)
      const work = await createWork({
        title: details.title,
        artist: details.artist,
        genre: details.genre,
        musicbrainzId: mbid,
        source: "musicbrainz",
      });

      const generated = await aiOrchestrator.generateForWork(mbid);

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

      const arr = await createArrangementFromSong(userId, {
        work_id: work.id,
        sections: generated.sections,
        key: generated.key,
        bpm: generated.bpm,
        duration_sec: details.duration,
      });

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
   * Searches CifraClub's full 800,000+ song catalog in real time, with MusicBrainz fallback.
   */
  app.get("/search", async (req: any, reply) => {
    const { q } = req.query;
    if (!q) return [];

    try {
      // 1. Primary: Search CifraClub's global catalog
      const ccMatches = await cifraClubService.search(String(q), 24);
      if (ccMatches.length > 0) {
        return ccMatches;
      }

      // 2. Fallback: MusicBrainz
      let matches;
      if (q.includes("-")) {
        const [artist, title] = q.split("-").map((s: string) => s.trim());
        matches = await musicBrainzService.searchRecording(title, artist);
      } else {
        matches = await musicBrainzService.searchRecording(q, "");
      }
      return matches;
    } catch (err: any) {
      return reply.status(500).send({ message: err.message });
    }
  });

  /**
   * POST /import/smart-tab
   * Parses raw tabs/ChordPro/UG/CifraClub and optionally creates a song for user.
   */
  app.post("/smart-tab", async (req: any, reply) => {
    const { rawText, autoSave } = req.body || {};
    const userId = req.user?.id;

    if (!rawText || typeof rawText !== "string") {
      return reply.status(400).send({ message: "rawText is required" });
    }

    const parsed = parseSmartTab(rawText);

    if (autoSave && userId) {
      const song = await createSongForUser(userId, {
        title: parsed.title,
        artist: parsed.artist,
        key: parsed.key,
        bpm: parsed.bpm,
        sections: parsed.sections,
        is_imported: true,
        notes: parsed.capo ? `Capo: ${parsed.capo}. Universal Smart Importer` : "Universal Smart Importer",
      });
      return { success: true, song, parsed };
    }

    return { success: true, parsed };
  });

  /**
   * POST /import/url
   * Scrapes a chord/tab webpage (CifraClub, LaCuerda, Ultimate Guitar, or generic <pre> chord sheet)
   * and returns the parsed song structure.
   */
  app.post("/url", async (req: any, reply) => {
    const { url, autoSave } = req.body || {};
    const userId = req.user?.id;

    if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) {
      return reply.status(400).send({ message: "Valid URL (http/https) is required" });
    }

    const targetUrl = url.trim();

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,pt-BR;q=0.8,en;q=0.7",
        },
      });

      if (!response.ok) {
        return reply
          .status(422)
          .send({ message: `No se pudo descargar la página (HTTP ${response.status})` });
      }

      const html = await response.text();
      const decodeEntities = (str: string) =>
        str
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ");

      let extractedRaw = "";
      let detectedTitle = "";
      let detectedArtist = "";
      let detectedKey = "";
      let detectedCapo: number | undefined;

      // 1. Check Ultimate Guitar .js-store data-content
      const ugStoreMatch = html.match(/class="js-store"\s+data-content="([^"]+)"/i);
      if (ugStoreMatch) {
        try {
          const jsonStr = decodeEntities(ugStoreMatch[1]);
          const storeObj = JSON.parse(jsonStr);
          const pageData = storeObj?.store?.page?.data;
          const wikiContent = pageData?.tab_view?.wiki_tab?.content;
          if (wikiContent) {
            extractedRaw = wikiContent;
          }
          if (pageData?.tab?.song_name) detectedTitle = String(pageData.tab.song_name).trim();
          if (pageData?.tab?.artist_name) detectedArtist = String(pageData.tab.artist_name).trim();
          if (pageData?.tab_view?.meta?.tonality) detectedKey = String(pageData.tab_view.meta.tonality).trim();
          if (pageData?.tab_view?.meta?.capo) detectedCapo = Number(pageData.tab_view.meta.capo) || undefined;
        } catch {
          // fallback to <pre> extraction below
        }
      }

      // 2. Check CifraClub / LaCuerda / <pre> blocks
      if (!extractedRaw) {
        const preMatches = Array.from(html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi));
        if (preMatches.length > 0) {
          // Pick the longest <pre> block (which is the chord sheet)
          const longestPre = preMatches
            .map((m) => m[1])
            .sort((a, b) => b.length - a.length)[0];
          extractedRaw = decodeEntities(longestPre);
        }
      }

      // Extract metadata from HTML title / CifraClub headers / URL slug
      const h1Match = html.match(/<h1[^>]*class="[^"]*t1[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
      const h2Match = html.match(/<h2[^>]*class="[^"]*t3[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
      if (h1Match && !detectedTitle) {
        detectedTitle = decodeEntities(h1Match[1].replace(/<\/?[^>]+(>|$)/g, "")).trim();
      }
      if (h2Match && !detectedArtist) {
        detectedArtist = decodeEntities(h2Match[1].replace(/<\/?[^>]+(>|$)/g, "")).trim();
      }

      const cifraTomMatch = html.match(/id="cifra_tom"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      if (cifraTomMatch && !detectedKey) {
        detectedKey = cifraTomMatch[1].trim();
      }

      if (!detectedTitle || !detectedArtist) {
        const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleTagMatch) {
          const cleanPageTitle = decodeEntities(titleTagMatch[1])
            .replace(/\s*\|\s*Cifra Club.*$/i, "")
            .replace(/\s*-\s*Cifra Club.*$/i, "")
            .replace(/\s*@\s*Ultimate-Guitar.*$/i, "")
            .replace(/\s*chords.*$/i, "")
            .replace(/\s*acordes.*$/i, "")
            .trim();
          if (cleanPageTitle.includes(" - ")) {
            const [p1, p2] = cleanPageTitle.split(" - ").map((s) => s.trim());
            if (!detectedTitle) detectedTitle = p1;
            if (!detectedArtist) detectedArtist = p2;
          } else if (!detectedTitle) {
            detectedTitle = cleanPageTitle;
          }
        }
      }

      // URL slug fallback for cifraclub.com/artist/song
      if (!detectedTitle || !detectedArtist) {
        try {
          const u = new URL(targetUrl);
          const segs = u.pathname.split("/").filter(Boolean);
          if (segs.length >= 2) {
            const toTitle = (slug: string) =>
              slug
                .replace(/\.[a-z0-9]+$/i, "")
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            if (!detectedArtist) detectedArtist = toTitle(segs[0]);
            if (!detectedTitle) detectedTitle = toTitle(segs[1]);
          }
        } catch {
          // ignore
        }
      }

      if (!extractedRaw || extractedRaw.trim().length < 20) {
        return reply.status(422).send({
          message:
            "No se encontraron acordes o tablaturas legibles en la URL proporcionada. Intenta copiar y pegar el texto directamente.",
        });
      }

      const headerBlock = [
        detectedTitle ? `{title: ${detectedTitle}}` : "",
        detectedArtist ? `{artist: ${detectedArtist}}` : "",
        detectedKey ? `{key: ${detectedKey}}` : "",
        detectedCapo ? `{capo: ${detectedCapo}}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const fullRawInput = headerBlock ? `${headerBlock}\n\n${extractedRaw}` : extractedRaw;
      const parsed = parseSmartTab(fullRawInput);

      if (detectedTitle && parsed.title === "Untitled Song") parsed.title = detectedTitle;
      if (detectedArtist && parsed.artist === "Unknown Artist") parsed.artist = detectedArtist;
      if (detectedKey && !parsed.key) parsed.key = detectedKey;
      if (detectedCapo && !parsed.capo) parsed.capo = detectedCapo;

      if (autoSave && userId) {
        const song = await createSongForUser(userId, {
          title: parsed.title,
          artist: parsed.artist,
          key: parsed.key,
          bpm: parsed.bpm,
          sections: parsed.sections,
          is_imported: true,
          links: [targetUrl],
          notes: `Importado desde ${targetUrl}`,
        });
        return { success: true, song, parsed };
      }

      return { success: true, parsed };
    } catch (err: any) {
      return reply.status(500).send({
        message: err?.message || "Error al importar desde la URL",
      });
    }
  });
};
