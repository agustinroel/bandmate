import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function run() {
  const { supabase } = await import("../apps/api/src/lib/supabase.js");
  const { data, error } = await supabase
    .from("arrangements")
    .select("id, work_id, key, bpm, notes, song_works(title, artist)");

  if (error) {
    console.error("DB Error:", error);
    return;
  }

  console.log("Current Arrangements in DB:");
  console.log(JSON.stringify(data, null, 2));
}

run();
