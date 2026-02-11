import { aiOrchestrator } from "./apps/api/src/services/ai-orchestrator.service.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "apps/api/.env") });

async function test() {
  console.log("Starting AI Test...");
  console.log(
    "Using API Key (last 4):",
    (process.env.GOOGLE_GENAI_API_KEY || "").slice(-4),
  );

  try {
    const arrangement = await aiOrchestrator.generateForWork(
      "f6df45b4-32ca-4fbd-9ace-62fa03a79eaf",
      {
        title: "The Fairy Feller’s Master‐Stroke",
        artist: "Queen",
      },
    );
    console.log("AI SUCCESS!");
    console.log("Key:", arrangement.key);
    console.log("BPM:", arrangement.bpm);
    console.log("Sections count:", arrangement.sections.length);
  } catch (err) {
    console.error("AI FAILED:");
    console.error(err);
  }
}

test();
