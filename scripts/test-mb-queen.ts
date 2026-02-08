import { musicBrainzService } from "../apps/api/src/services/musicbrainz.service.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function test() {
  try {
    console.log("Searching for Queen recordings...");
    const recordings = await musicBrainzService.searchRecording("", "Queen");
    console.log(`Found ${recordings.length} recordings.`);
    if (recordings.length > 0) {
      console.log("First 5 recordings:");
      recordings.slice(0, 5).forEach((r) => {
        console.log(`- ${r.title} (${r.id})`);
      });
    }
  } catch (err: any) {
    console.error("MB Search Failed:", err.message);
  }
}

test();
