import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function verify() {
  const { aiOrchestrator } =
    await import("../apps/api/src/services/ai-orchestrator.service.js");

  const songs = [
    { title: "The Cage", artist: "Oasis" }, // Known hallucination target
    { title: "Let It Be", artist: "The Beatles" }, // High confidence target
  ];

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  for (const song of songs) {
    console.log(`\n\n--- TESTING: ${song.title} - ${song.artist} ---`);
    try {
      const result = await aiOrchestrator.generateForWork("test-mbid", song);
      console.log(`Confidence: ${result.confidence || "N/A"}`);
      console.log(`Source: ${result.source || "N/A"}`);
      console.log(`First Line: ${result.sections[0]?.lines[0]?.source}`);

      const hasHallucination = JSON.stringify(result)
        .toLowerCase()
        .includes("edge of time");
      console.log(
        `Hallucination Trope Detected: ${hasHallucination ? "YES (FAIL)" : "NO (PASS)"}`,
      );

      const isRestricted = JSON.stringify(result).includes(
        "[LYRICS_RESTRICTED]",
      );
      console.log(`Lyrics Restricted: ${isRestricted ? "YES" : "NO"}`);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  }
}

verify();
