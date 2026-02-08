import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from apps/api/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../apps/api/.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanLibrary() {
  console.log("🧹 Starting library cleanup...");

  // 1. Delete all arrangements that are NOT seeds
  // These are the ones created via ingestion
  const { count: arrCount, error: arrError } = await supabase
    .from("arrangements")
    .delete({ count: "exact" })
    .eq("is_seed", false);

  if (arrError) {
    console.error("❌ Error deleting arrangements:", arrError.message);
    return;
  }
  console.log(`✅ Deleted ${arrCount} non-seed arrangements.`);

  // 2. Delete works that have no arrangements left
  // (Assuming non-seed works were the ones ingested)
  // We identify them by source 'musicbrainz' or 'import'
  const { count: workCount, error: workError } = await supabase
    .from("song_works")
    .delete({ count: "exact" })
    .in("source", ["musicbrainz", "import"]);

  if (workError) {
    console.error("❌ Error deleting song_works:", workError.message);
    return;
  }
  console.log(`✅ Deleted ${workCount} library works.`);

  console.log("✨ Cleanup complete!");
}

cleanLibrary().catch(console.error);
