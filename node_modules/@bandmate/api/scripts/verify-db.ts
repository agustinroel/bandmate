
import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";

async function check() {
    console.log("🔍 Checking Database...");

    const { data: works, error: e1 } = await supabase.from("song_works").select("*");
    if (e1) console.error("Error fetching works:", e1);
    else console.log(`found ${works?.length} works.`);

    if (works && works.length > 0) {
        works.forEach(w => console.log(`- [Work] ${w.title} by ${w.artist}`));
    }

    const { data: arr, error: e2 } = await supabase.from("arrangements").select("*");
    if (e2) console.error("Error fetching arrangements:", e2);
    else console.log(`found ${arr?.length} arrangements.`);

    process.exit(0);
}

check();
