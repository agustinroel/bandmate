import { config } from "dotenv";
config({ path: "apps/api/.env" });
import { createClient } from "@supabase/supabase-js";

async function run() {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("❌ Missing Supabase env variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
        process.exit(1);
    }

    const supabase = createClient(url, key);

    console.log("🔍 Checking 'Adele' songs in database...");

    // 1. Get Songs
    const { data: songs, error } = await supabase
        .from("songs")
        .select("id, title, artist, work_id, musicbrainz_id, is_imported")
        .ilike("artist", "%Adele%");

    if (error) {
        console.error("❌ Error fetching songs:", error);
        process.exit(1);
    }

    console.log(`Found ${songs.length} songs for Adele.`);

    for (const song of songs) {
        console.log(`\n🎵 Song: ${song.title}`);
        console.log(`   ID: ${song.id}`);
        console.log(`   MBID: ${song.musicbrainz_id || "N/A"}`);
        console.log(`   Work ID: ${song.work_id || "N/A"}`);

        if (song.work_id) {
            const { data: work } = await supabase.from('song_works').select('*').eq('id', song.work_id).single();
            console.log(`   ✅ Linked Work: ${work?.title} (${work?.id})`);

            const { data: arrs } = await supabase.from('arrangements').select('id, version').eq('work_id', song.work_id);
            console.log(`   🎹 Arrangements: ${arrs?.length || 0}`);
        } else {
            console.log(`   ⚠️ No Work linked (Pure Song)`);
        }
    }

    process.exit(0);
}

run();
