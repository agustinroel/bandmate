import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function run() {
  const { supabase } = await import("../apps/api/src/lib/supabase.js");
  console.log("Starting Fresh Library Cleanup...");

  try {
    // Delete arrangements
    const { error: err1 } = await supabase
      .from("arrangements")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (err1) throw err1;
    console.log("✅ Cleared all arrangements.");

    // Delete song works
    const { error: err2 } = await supabase
      .from("song_works")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (err2) throw err2;
    console.log("✅ Cleared all song_works.");

    console.log("\nLIBRARY IS NOW FRESH.");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

run();
