import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env") });
import { supabase } from "../apps/api/dist/lib/supabase.js";

async function run() {
  console.log("=== SYNCING ALL LIBRARY ARRANGEMENTS ===");

  // 1. Fetch all songs from `songs`
  const { data: songs, error: e1 } = await supabase
    .from("songs")
    .select("*");

  if (e1) {
    console.error("Error fetching songs:", e1);
    process.exit(1);
  }

  console.log(`Found ${songs.length} songs in songs table.`);

  // 2. Fetch all works from `song_works`
  const { data: works, error: e2 } = await supabase
    .from("song_works")
    .select("*");

  if (e2) {
    console.error("Error fetching works:", e2);
    process.exit(1);
  }

  console.log(`Found ${works.length} works in song_works table.`);

  // 3. Ensure every song in `songs` with valid sections has a `song_work`
  const workMap = new Map();
  for (const w of works) {
    const key = `${w.title.trim().toLowerCase()}__${w.artist.trim().toLowerCase()}`;
    workMap.set(key, w);
  }

  for (const s of songs) {
    if (!s.sections || s.sections.length === 0) continue;
    const key = `${s.title.trim().toLowerCase()}__${s.artist.trim().toLowerCase()}`;
    if (!workMap.has(key)) {
      console.log(`Creating missing song_work for "${s.title}" by "${s.artist}"...`);
      const { data: newWork, error: errWork } = await supabase
        .from("song_works")
        .insert({
          title: s.title.trim(),
          artist: s.artist.trim(),
          rights: "copyrighted",
          rights_notes: "Community ChordPro arrangement",
          source: "import",
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single();

      if (errWork) {
        console.error(`Failed to create work for ${s.title}:`, errWork);
      } else {
        workMap.set(key, newWork);
      }
    }
  }

  // 4. Fetch existing arrangements
  const { data: existingArrs, error: e3 } = await supabase
    .from("arrangements")
    .select("*");

  if (e3) {
    console.error("Error fetching arrangements:", e3);
    process.exit(1);
  }

  console.log(`Found ${existingArrs.length} existing arrangements.`);
  const arrMap = new Map();
  for (const a of existingArrs) {
    const list = arrMap.get(a.work_id) || [];
    list.push(a);
    arrMap.set(a.work_id, list);
  }

  // 5. For each work in workMap, check if it has a populated arrangement
  let createdCount = 0;
  let updatedCount = 0;

  for (const [key, work] of workMap.entries()) {
    // Find matching song with sections
    const matchSong = songs.find(s => {
      const sKey = `${s.title.trim().toLowerCase()}__${s.artist.trim().toLowerCase()}`;
      if (sKey === key && s.sections && s.sections.length > 0) return true;
      return false;
    }) || songs.find(s => {
      // Fuzzy fallback
      return s.title.toLowerCase().trim() === work.title.toLowerCase().trim() && s.sections && s.sections.length > 0;
    });

    if (!matchSong || !matchSong.sections || matchSong.sections.length === 0) {
      console.log(`[SKIP] No song with sections found for work "${work.title}"`);
      continue;
    }

    const currentArrs = arrMap.get(work.id) || [];
    const validArr = currentArrs.find(a => Array.isArray(a.sections) && a.sections.length > 0);

    if (validArr) {
      console.log(`[OK] Work "${work.title}" already has arrangement ${validArr.id} (${validArr.sections.length} sections)`);
      continue;
    }

    // If an arrangement exists but is empty (sections = []), update it!
    const emptyArr = currentArrs.find(a => !a.sections || a.sections.length === 0);
    if (emptyArr) {
      console.log(`[UPDATE] Updating empty arrangement ${emptyArr.id} for "${work.title}"...`);
      const { error: updErr } = await supabase
        .from("arrangements")
        .update({
          sections: matchSong.sections,
          key: matchSong.key || null,
          bpm: matchSong.bpm ? String(matchSong.bpm) : null,
          duration_sec: matchSong.duration_sec || null,
          notes: matchSong.notes || "Official Bandmate community ChordPro arrangement.",
          updated_at: new Date().toISOString()
        })
        .eq("id", emptyArr.id);

      if (updErr) {
        console.error(`Error updating arrangement for ${work.title}:`, updErr);
      } else {
        updatedCount++;
      }
      continue;
    }

    // Otherwise, create a new arrangement!
    console.log(`[CREATE] Creating arrangement for "${work.title}" by "${work.artist}" (key: ${matchSong.key}, bpm: ${matchSong.bpm})...`);
    const { error: insErr } = await supabase
      .from("arrangements")
      .insert({
        work_id: work.id,
        author_user_id: null,
        version: 1,
        sections: matchSong.sections,
        key: matchSong.key || null,
        bpm: matchSong.bpm ? String(matchSong.bpm) : null,
        duration_sec: matchSong.duration_sec || null,
        notes: "Official Bandmate community ChordPro arrangement.",
        links: [],
        tags: ["community", "chords", "rehearsal"],
        source: "community",
        is_seed: true,
        rating_avg: 4.8,
        rating_count: 5,
        updated_at: new Date().toISOString()
      });

    if (insErr) {
      console.error(`Error inserting arrangement for ${work.title}:`, insErr);
    } else {
      createdCount++;
    }
  }

  console.log(`\n=== SYNC FINISHED: Created ${createdCount}, Updated ${updatedCount} arrangements ===`);
  process.exit(0);
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
