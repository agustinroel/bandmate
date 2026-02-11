import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function run() {
  const { aiOrchestrator } =
    await import("../apps/api/src/services/ai-orchestrator.service.js");
  const { supabase } = await import("../apps/api/src/lib/supabase.js");

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const songsToTest = [
    {
      title: "Wonderwall",
      artist: "Oasis",
      mbid: "ca2cac2f-f977-43ac-bc21-e1b4fd71661d",
    },
    {
      title: "The Cage",
      artist: "Oasis",
      mbid: "c2277584-9221-4eaf-976b-3a704d86b1c7",
    },
  ];

  console.log("Starting Direct Fidelity Test (Bypassing MusicBrainz fetch)...");

  for (const song of songsToTest) {
    console.log(`\n--- Testing: ${song.title} by ${song.artist} ---`);
    try {
      // 1. Create Work manually
      const { data: work, error: workErr } = await supabase
        .from("song_works")
        .insert({
          title: song.title,
          artist: song.artist,
          musicbrainz_id: song.mbid,
          source: song.mbid ? "musicbrainz" : "manual",
        })
        .select()
        .single();

      if (workErr) throw workErr;
      console.log(`✅ Work created: ${work.id}`);

      // 2. Generate Arrangement
      console.log(`Generating AI arrangement...`);
      const generated = await aiOrchestrator.generateForWork(
        song.mbid || "manual",
        {
          title: song.title,
          artist: song.artist,
        },
      );

      console.log(`AI Confidence: ${generated.confidence}`);
      console.log(`AI Source: ${generated.source}`);

      const firstLine = generated.sections[0]?.lines[0]?.source || "N/A";
      console.log(`First Line Sample: ${firstLine}`);

      // 3. Save Arrangement
      const { data: arr, error: arrErr } = await supabase
        .from("arrangements")
        .insert({
          work_id: work.id,
          author_user_id: "00000000-0000-0000-0000-000000000000", // Dummy system user
          sections: generated.sections,
          key: generated.key,
          bpm: String(generated.bpm), // BPM is string in schema? (Wait, I'll check)
          source: "community",
          is_seed: false,
          notes: `Confidence: ${generated.confidence}\nSource: ${generated.source}\nAI Fidelity Filter Applied.`,
        })
        .select()
        .single();

      if (arrErr) throw arrErr;
      console.log(`✅ Arrangement created: ${arr.id}`);
    } catch (err: any) {
      console.error(`❌ Test failed for ${song.title}:`, err.message);
    }
  }

  console.log("\nDirect Fidelity Test Complete.");
}

run();
