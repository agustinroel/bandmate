import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function run() {
  const { musicBrainzService } =
    await import("../apps/api/src/services/musicbrainz.service.js");
  const { processSingleSongIngestion } =
    await import("../apps/api/src/services/ingestion-queue.service.js");

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const songsToIngest = [
    { title: "Wonderwall", mbid: "ca2cac2f-f977-43ac-bc21-e1b4fd71661d" },
    { title: "The Cage", mbid: "c2277584-9221-4eaf-976b-3a704d86b1c7" },
  ];

  console.log("Starting Hardcoded MBID Ingestion Test...");

  for (const song of songsToIngest) {
    console.log(`\n--- Processing: ${song.title} (${song.mbid}) ---`);
    try {
      await processSingleSongIngestion(song.mbid, "test-user-id");
      console.log(`✅ Ingestion successful for ${song.title}`);
    } catch (err: any) {
      console.error(`❌ Ingestion failed for ${song.title}:`, err.message);
    }
  }

  console.log("\nIngestion test finished. Verifying DB...");
}

run();
