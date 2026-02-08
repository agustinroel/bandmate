import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function check() {
  const { supabase } = await import("../apps/api/src/lib/supabase.js");

  const { count: worksCount, data: works } = await supabase
    .from("song_works")
    .select("title, artist", { count: "exact" });
  const { count: arrCount } = await supabase
    .from("arrangements")
    .select("*", { count: "exact", head: true });

  console.log(`Total Arrangements: ${arrCount}`);

  if (arrCount > 0) {
    const { data: arrangements } = await supabase
      .from("arrangements")
      .select("id, work_id, content")
      .limit(3);

    console.log(`\n--- SAMPLE ARRANGEMENTS ---`);
    arrangements?.forEach((a: any) => {
      console.log(`\nArrangement ID: ${a.id} (Work: ${a.work_id})`);
      console.log(
        `Sections:`,
        a.content?.sections
          ?.map((s: any) => `${s.name} (${s.bars} bars)`)
          .join(", "),
      );
      if (a.content?.sections?.[0]?.chords) {
        console.log(
          `Chords (First section):`,
          a.content.sections[0].chords.slice(0, 8),
          "...",
        );
      }
    });
  }
}

check();
