import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { musicBrainzService } from "./musicbrainz.service.js";
import { aiOrchestrator } from "./ai-orchestrator.service.js";
import { createWork, createArrangementFromSong } from "../works/works.repo.js";
import fs from "fs";
import path from "path";

const REDIS_URL = process.env.REDIS_URL;
let connection: Redis | null = null;
let queue: Queue | null = null;
let worker: Worker | null = null;

// Track if we should use fallback mode
let useFallback = false;

function logToFile(msg: string) {
  const logPath = path.join(process.cwd(), "ingestion.log");
  const stamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${stamp}] ${msg}\n`);
}

// Pass logger to AI Orchestrator
aiOrchestrator.setLogger(logToFile);

async function initRedis() {
  if (!REDIS_URL) {
    console.warn(
      "[Ingestion] No REDIS_URL found. Using sequential fallback mode.",
    );
    useFallback = true;
    return;
  }

  try {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 5000, // 5 seconds timeout
    });

    connection.on("error", (err) => {
      if (!useFallback) {
        console.error(
          "[Redis] Connection failed. Switching to Lite Mode (Sequential Ingestion).",
          err.message,
        );
        useFallback = true;
      }
    });

    queue = new Queue("ingestion-queue", { connection });
    worker = new Worker(
      "ingestion-queue",
      async (job: Job) => {
        const { type, payload, userId } = job.data;
        if (type === "ingest-artist")
          return processArtistIngestion(payload.artist, userId);
        if (type === "ingest-single-song")
          return processSingleSongIngestion(payload.mbid, userId);
      },
      { connection },
    );

    worker.on("completed", (job) =>
      console.log(`[Worker] Job ${job.id} completed.`),
    );
    worker.on("failed", (job, err) =>
      console.error(`[Worker] Job ${job?.id} failed:`, err.message),
    );

    console.log("[Redis] Initialization attempted.");
  } catch (err) {
    console.error("[Redis] Initialization failed. Using fallback.", err);
    useFallback = true;
  }
}

// Initializing immediately
initRedis();

/**
 * Public API to add tasks.
 * If Redis is working, it uses BullMQ.
 * If not, it runs them sequentially in the background.
 */
export async function addToIngestionQueue(data: any) {
  if (!useFallback && queue) {
    try {
      await queue.add(data.type, data);
      console.log(`[Ingestion] Task ${data.type} added to Redis queue.`);
      return;
    } catch (err) {
      console.warn(
        "[Ingestion] Failed to add to Redis. Falling back to local processing.",
      );
      useFallback = true;
    }
  }

  // Fallback: Process immediately but await if possible
  console.log(
    `[Ingestion] Processing ${data.type} in Lite Mode (Sequential)...`,
  );
  try {
    await processFallback(data);
  } catch (err: any) {
    console.error("[Ingestion] Local task failed:", err.message);
  }
}

async function processFallback(data: any) {
  const { type, payload, userId } = data;
  if (type === "ingest-artist") {
    await processArtistIngestion(payload.artist, userId);
  } else if (type === "ingest-single-song") {
    await processSingleSongIngestion(payload.mbid, userId);
  }
}

export async function processArtistIngestion(
  artistName: string,
  userId: string,
) {
  logToFile(
    `[ArtistIngestion] Discovering recordings for: ${artistName} (User: ${userId})`,
  );
  console.log(`[Ingestion] Discovering recordings for: ${artistName}`);

  try {
    const recordings = await musicBrainzService.searchRecording("", artistName);

    logToFile(
      `[ArtistIngestion] Found ${recordings.length} qualified recordings for ${artistName}.`,
    );
    console.log(
      `[Ingestion] Found ${recordings.length} qualified recordings for ${artistName}.`,
    );

    // In Lite Mode, we process them one by one to avoid overwhelming Gemini/MusicBrainz
    for (const rec of recordings) {
      if (!rec.id) continue;

      logToFile(`[ArtistIngestion] Processing: ${rec.title} (${rec.id})`);
      console.log(
        `[Ingestion] Processing individual song: ${rec.title} (${rec.id})`,
      );

      try {
        if (useFallback) {
          // IN FALLBACK MODE: process right here
          await processSingleSongIngestion(rec.id, userId, false);
          // High delay (12s) to stay far from the 15 RPM free tier limit
          await new Promise((r) => setTimeout(r, 12000));
        } else {
          await addToIngestionQueue({
            type: "ingest-single-song",
            payload: { mbid: rec.id },
            userId,
          });
        }
      } catch (songErr: any) {
        logToFile(
          `[ArtistIngestion] ERROR for song ${rec.title}: ${songErr.message}`,
        );
        console.error(
          `[Ingestion] Failed for song ${rec.title}:`,
          songErr.message,
        );
        // Continue with next song
      }
    }

    return { artist: artistName, queued: recordings.length };
  } catch (err: any) {
    logToFile(
      `[ArtistIngestion] FATAL discovery failed for ${artistName}: ${err.message}`,
    );
    console.error(
      `[Ingestion] Artist discovery failed for ${artistName}:`,
      err.message,
    );
    throw err;
  }
}

export async function processSingleSongIngestion(
  mbid: string,
  userId: string,
  force: boolean = false,
) {
  logToFile(
    `[SingleSong] Starting: ${mbid} (User: ${userId}, Force: ${force})`,
  );
  console.log(`[Ingestion] Processing song MBID: ${mbid}`);

  try {
    const details = await musicBrainzService.getRecordingDetails(mbid);
    if (!details) {
      logToFile(`[SingleSong] FAILED: Details not found for ${mbid}`);
      throw new Error(`Recording details not found for ${mbid}`);
    }

    // Double check quality (in case search didn't filter it out)
    const titleLower = details.title.toLowerCase();
    if (
      titleLower.includes("interview") ||
      titleLower.includes("talk") ||
      titleLower.includes("commentary")
    ) {
      logToFile(`[SingleSong] Skipping unwanted recording: ${details.title}`);
      console.warn(`[Ingestion] Skipping unwanted recording: ${details.title}`);
      return { mbid, success: true, skipped: true };
    }

    const work = await createWork({
      title: details.title,
      artist: details.artist,
      genre: details.genre,
      musicbrainzId: details.id,
      source: "musicbrainz",
    });

    logToFile(`[SingleSong] Work verified: ${work.id} (${work.title})`);

    // --- INGESTION GUARD ---
    if (!force) {
      const { getWorkArrangementsCount } =
        await import("../works/works.repo.js");
      const arrCount = await getWorkArrangementsCount(work.id);
      if (arrCount > 0) {
        logToFile(
          `[SingleSong] SKIP: Work ${work.id} already has ${arrCount} arrangement(s).`,
        );
        console.log(
          `[Ingestion] Skipping ${work.title} - Already has an arrangement.`,
        );
        return { mbid, success: true, skipped: true, reason: "already_exists" };
      }
    }

    const generated = await aiOrchestrator.generateForWork(
      work.musicbrainzId!,
      details,
    );
    logToFile(
      `[SingleSong] AI Generated sections: ${generated.sections?.length}, Key: ${generated.key}`,
    );
    console.log(
      `[Ingestion] Generated arrangement for ${work.title}. BPM: ${generated.bpm}, Key: ${generated.key}`,
    );

    const arr = await createArrangementFromSong(userId, {
      work_id: work.id,
      sections: generated.sections,
      key: generated.key,
      bpm: generated.bpm,
      source: "community",
      notes: `AI Confidence: ${generated.confidence}\nAI Source: ${generated.source}\nFidelity filters applied.`,
    } as any);

    logToFile(
      `[SingleSong] SUCCESS: Created Arrangement ${arr.id} for Work ${work.id}`,
    );
    console.log(
      `[Ingestion] Successfully ingested: ${work.title} - ${work.artist} (Arrangement ID: ${arr.id})`,
    );
    return { mbid, success: true };
  } catch (err: any) {
    logToFile(`[SingleSong] ERROR during ingestion of ${mbid}: ${err.message}`);
    if (err.stack) logToFile(err.stack);
    console.error(
      `[Ingestion] Song ingestion failed for MBID ${mbid}:`,
      err.message,
    );
    throw err;
  }
}

// Exporting the queue object just in case, but preferred way is addToIngestionQueue
export const ingestionQueue = queue;
