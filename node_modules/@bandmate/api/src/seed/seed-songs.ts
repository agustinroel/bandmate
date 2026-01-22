import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import { seedSongsMeta } from "./seed-songs.meta.js";

async function run() {
  const rows = seedSongsMeta.map((s) => ({
    owner_id: null,
    is_seed: true,
    title: s.title,
    artist: s.artist,
    key: s.key ?? null,
    bpm: typeof s.bpm === "string" ? Number(s.bpm) : (s.bpm ?? null),
    duration_sec:
      typeof s.durationSec === "string"
        ? Number(s.durationSec)
        : (s.durationSec ?? null),
    notes: "Demo library song (read-only).",
    version: 1,
    sections: s.sections ?? [],
  }));

  const { error } = await supabase.from("songs").upsert(rows, {
    onConflict: "title,artist,is_seed",
  });

  if (error) throw error;

  console.log(`✅ Seeded songs: ${rows.length}`);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ seed failed", e);
  process.exit(1);
});
