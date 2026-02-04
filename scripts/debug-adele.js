require("dotenv").config({ path: "apps/api/.env" });
const { createClient } = require("@supabase/supabase-js");

async function run() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("❌ Missing Supabase env variables.");
        process.exit(1);
    }

    const supabase = createClient(url, key);

    console.log("🔍 Database connected using SERVICE ROLE KEY.");

    console.log("🔍 Fetching ALL songs...");
    const { data: songs, error } = await supabase.from("songs").select("*");

    if (error) {
        console.error("❌ Error fetching songs:", error);
        process.exit(1);
    }

    console.log(`Found ${songs.length} songs.`);

    for (const song of songs) {
        console.log(`\n🎵 Song: "${song.title}" by "${song.artist}"`);
        console.log(`   ID: ${song.id}`);
        console.log(`   Work ID: ${song.work_id || "N/A"}`);

        if (song.artist.toLowerCase().includes("adele")) {
            console.log("   👉 THIS MATCHES 'ADELE' via case-insensitive JS check!");
        }

        if (song.work_id) {
            const { data: arrs } = await supabase.from('arrangements').select('id, version').eq('work_id', song.work_id);
            console.log(`   🎹 Arrangements: ${arrs?.length || 0}`);
        } else {
            console.log(`   ⚠️ No Work linked`);
        }
    }
}

run();
