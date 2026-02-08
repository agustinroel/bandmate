import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function test() {
  // DYNAMIC IMPORTS to ensure env is loaded first
  const { aiOrchestrator } =
    await import("../apps/api/src/services/ai-orchestrator.service.js");
  const { createWork, createArrangementFromSong, getWorkArrangementsCount } =
    await import("../apps/api/src/works/works.repo.js");

  const title = "Strawberry Fields Forever (Demo-Sequenz)";
  const artist = "The Beatles";
  const mbid = "test-mbid-demo-guard-v4";
  const userId = "d9022bb6-526b-4ead-ade2-3f95d0a84796";

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  console.log(`\n--- TEST: Ingestion Guard ---`);
  console.log(`Song: ${title} - ${artist}`);

  try {
    // 1. Create/Verify Work
    const work = await createWork({
      title,
      artist,
      musicbrainzId: mbid,
      source: "musicbrainz",
    });
    console.log(`Work ID: ${work.id}`);

    // 2. CHECK GUARD
    const arrCount = await getWorkArrangementsCount(work.id);
    console.log(`Existing arrangements: ${arrCount}`);

    if (arrCount > 0) {
      console.log("GUARD TRIGGERED: Skipping AI generation.");
    } else {
      // 3. Generate
      console.log("No arrangement found. Generating...");
      const result = await aiOrchestrator.generateForWork(mbid as any, {
        title,
        artist,
      });
      console.log("AI Generation Successful.");

      // 4. Save
      const arr = await createArrangementFromSong(userId, {
        work_id: work.id,
        sections: result.sections,
        key: result.key,
        bpm: result.bpm,
      });
      console.log(`Arrangement created: ${arr.id}`);
    }

    // --- SECOND PASS (Verification) ---
    console.log("\n--- SECOND PASS (Verification) ---");
    const arrCount2 = await getWorkArrangementsCount(work.id);
    console.log(`Existing arrangements: ${arrCount2}`);
    if (arrCount2 > 0) {
      console.log("SUCCESS: Guard would trigger in production flow.");
    }
  } catch (err: any) {
    console.error("FAILED:", err.message);
  }
}

test();
