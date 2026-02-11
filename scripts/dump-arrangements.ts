import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function run() {
  const { supabase } = await import("../apps/api/src/lib/supabase.js");
  const { data: arrangements } = await supabase
    .from("arrangements")
    .select("id, sections, key, bpm, song_works(title, artist)")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log(JSON.stringify(arrangements, null, 2));
}

run();
