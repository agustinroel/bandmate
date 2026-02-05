import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { musicBrainzService } from "./musicbrainz.service.js";
import { aiOrchestrator } from "./ai-orchestrator.service.js";
import { createWork, createArrangementFromSong } from "../works/works.repo.js";
const REDIS_URL = process.env.REDIS_URL;
let connection = null;
let queue = null;
let worker = null;
// Track if we should use fallback mode
let useFallback = false;
async function initRedis() {
    if (!REDIS_URL) {
        console.warn("[Ingestion] No REDIS_URL found. Using sequential fallback mode.");
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
                console.error("[Redis] Connection failed. Switching to Lite Mode (Sequential Ingestion).", err.message);
                useFallback = true;
            }
        });
        queue = new Queue("ingestion-queue", { connection });
        worker = new Worker("ingestion-queue", async (job) => {
            const { type, payload, userId } = job.data;
            if (type === "ingest-artist")
                return processArtistIngestion(payload.artist, userId);
            if (type === "ingest-single-song")
                return processSingleSongIngestion(payload.mbid, userId);
        }, { connection });
        worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} completed.`));
        worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
        console.log("[Redis] Initialization attempted.");
    }
    catch (err) {
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
export async function addToIngestionQueue(data) {
    if (!useFallback && queue) {
        try {
            await queue.add(data.type, data);
            console.log(`[Ingestion] Task ${data.type} added to Redis queue.`);
            return;
        }
        catch (err) {
            console.warn("[Ingestion] Failed to add to Redis. Falling back to local processing.");
            useFallback = true;
        }
    }
    // Fallback: Process immediately but asynchronously
    console.log(`[Ingestion] Processing ${data.type} in Lite Mode (Sequential)...`);
    processFallback(data).catch((err) => console.error("[Ingestion] Local task failed:", err.message));
}
async function processFallback(data) {
    const { type, payload, userId } = data;
    if (type === "ingest-artist") {
        await processArtistIngestion(payload.artist, userId);
    }
    else if (type === "ingest-single-song") {
        await processSingleSongIngestion(payload.mbid, userId);
    }
}
async function processArtistIngestion(artistName, userId) {
    console.log(`[Ingestion] Discovering recordings for: ${artistName}`);
    const url = `https://musicbrainz.org/ws/2/recording?query=artist:"${encodeURIComponent(artistName)}"&limit=10&fmt=json`;
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Bandmate/1.0.0 (https://bandmate.io)",
                Accept: "application/json",
            },
        });
        if (!response.ok)
            throw new Error(`MB API error: ${response.status}`);
        const data = await response.json();
        const recordings = data.recordings || [];
        console.log(`[Ingestion] Found ${recordings.length} recordings for ${artistName}.`);
        // In Lite Mode, we process them one by one to avoid overwhelming Gemini/MusicBrainz
        for (const rec of recordings) {
            if (!rec.id)
                continue;
            await addToIngestionQueue({
                type: "ingest-single-song",
                payload: { mbid: rec.id },
                userId,
            });
            // Small delay between songs in Lite Mode
            if (useFallback)
                await new Promise((r) => setTimeout(r, 1000));
        }
        return { artist: artistName, queued: recordings.length };
    }
    catch (err) {
        console.error(`[Ingestion] Artist discovery failed for ${artistName}:`, err.message);
        throw err;
    }
}
async function processSingleSongIngestion(mbid, userId) {
    console.log(`[Ingestion] Processing song MBID: ${mbid}`);
    try {
        const details = await musicBrainzService.getRecordingDetails(mbid);
        if (!details)
            throw new Error("Metadata not found");
        const work = await createWork({
            title: details.title,
            artist: details.artist,
            musicbrainzId: details.id,
            source: "musicbrainz",
        });
        const generated = await aiOrchestrator.generateForWork(work.musicbrainzId);
        await createArrangementFromSong(userId, {
            work_id: work.id,
            sections: generated.sections,
            key: generated.key,
            bpm: generated.bpm,
            source: "community",
        });
        console.log(`[Ingestion] Successfully ingested: ${work.title} - ${work.artist}`);
        return { mbid, success: true };
    }
    catch (err) {
        console.error(`[Ingestion] Song ingestion failed for MBID ${mbid}:`, err.message);
        throw err;
    }
}
// Exporting the queue object just in case, but preferred way is addToIngestionQueue
export const ingestionQueue = queue;
