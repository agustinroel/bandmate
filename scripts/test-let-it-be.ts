import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function verify() {
  const { aiOrchestrator } =
    await import("../apps/api/src/services/ai-orchestrator.service.js");

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  console.log(`\n\n--- TESTING: Let It Be - The Beatles (Detailed) ---`);
  try {
    const result = await aiOrchestrator.generateForWork("test-mbid", {
      title: "Let It Be",
      artist: "The Beatles",
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

verify();
