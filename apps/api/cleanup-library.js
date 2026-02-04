import "dotenv/config";
import { supabase } from "./src/lib/supabase.js";

async function cleanup() {
  console.log("Starting Library Cleanup...");

  try {
    // Due to FK constraints, we should delete arrangements first
    const { error: err1 } = await supabase
      .from("arrangements")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (err1) throw err1;
    console.log("- Cleared arrangements.");

    const { error: err2 } = await supabase
      .from("song_works")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (err2) throw err2;
    console.log("- Cleared song_works.");

    console.log("Cleanup complete! Library is now fresh.");
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
