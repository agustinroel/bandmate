import { supabase } from "../lib/supabase.js";
function mapWork(row) {
    return {
        id: row.id,
        title: row.title,
        artist: row.artist,
        musicbrainzId: row.musicbrainz_id ?? null,
        wikidataId: row.wikidata_id ?? null,
        rights: row.rights ?? "unknown",
        rightsNotes: row.rights_notes ?? null,
        source: row.source ?? "user",
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
    };
}
function mapArrangement(row) {
    return {
        id: row.id,
        workId: row.work_id,
        authorUserId: row.author_user_id ?? null,
        version: row.version ?? 1,
        sections: row.sections ?? [],
        key: row.key ?? null,
        bpm: row.bpm ?? null,
        durationSec: row.duration_sec ?? null,
        notes: row.notes ?? null,
        links: row.links ?? [],
        tags: row.tags ?? null,
        capo: row.capo ?? null,
        timeSignature: row.time_signature ?? null,
        source: row.source ?? "community",
        isSeed: row.is_seed === true,
        ratingAvg: row.rating_avg ?? 0,
        ratingCount: row.rating_count ?? 0,
        authorName: row.profiles?.username ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
    };
}
/**
 * Library listing: works + top arrangement (by rating, then updated)
 */
export async function listWorksWithTopArrangement() {
    // 1) works
    const { data: works, error: e1 } = await supabase
        .from("song_works")
        .select("*")
        .order("artist", { ascending: true })
        .order("title", { ascending: true });
    if (e1)
        throw e1;
    const workRows = works ?? [];
    const workIds = workRows.map((w) => w.id);
    // 2) top arrangement per work (simple approach: fetch all, pick best in JS)
    // Para MVP está perfecto. Si se vuelve grande, hacemos RPC o view.
    const { data: arrs, error: e2 } = await supabase
        .from("arrangements")
        .select("*")
        .in("work_id", workIds.length ? workIds : ["00000000-0000-0000-0000-000000000000"]);
    if (e2)
        throw e2;
    const byWork = new Map();
    for (const a of arrs ?? []) {
        const k = a.work_id;
        const list = byWork.get(k) ?? [];
        list.push(a);
        byWork.set(k, list);
    }
    const pickTop = (list) => {
        if (!list?.length)
            return null;
        const sorted = list.slice().sort((a, b) => {
            const ar = Number(a.rating_avg ?? 0);
            const br = Number(b.rating_avg ?? 0);
            if (br !== ar)
                return br - ar;
            const ac = Number(a.rating_count ?? 0);
            const bc = Number(b.rating_count ?? 0);
            if (bc !== ac)
                return bc - ac;
            const at = Date.parse(String(a.updated_at ?? a.created_at ?? ""));
            const bt = Date.parse(String(b.updated_at ?? b.created_at ?? ""));
            return (bt || 0) - (at || 0);
        });
        return sorted[0];
    };
    return workRows.map((w) => {
        const top = pickTop(byWork.get(w.id) ?? []);
        return {
            ...mapWork(w),
            topArrangement: top ? mapArrangement(top) : null,
        };
    });
}
export async function getWorkByIdWithArrangements(workId) {
    const { data: work, error: e1 } = await supabase
        .from("song_works")
        .select("*")
        .eq("id", workId)
        .maybeSingle();
    if (e1)
        throw e1;
    if (!work)
        return null;
    const { data: arrs, error: e2 } = await supabase
        .from("arrangements")
        .select("*, profiles(username)")
        .eq("work_id", workId)
        .order("rating_avg", { ascending: false })
        .order("rating_count", { ascending: false })
        .order("updated_at", { ascending: false });
    if (e2)
        throw e2;
    return {
        work: mapWork(work),
        arrangements: (arrs ?? []).map(mapArrangement),
    };
}
/**
 * Create work (optional, por si querés crear desde UI más adelante)
 */
export async function createWork(input) {
    const { musicbrainzId, title, artist } = input;
    // Try to find existing work first
    let query = supabase.from("song_works").select("*");
    if (musicbrainzId) {
        query = query.eq("musicbrainz_id", musicbrainzId);
    }
    else {
        query = query.eq("title", title.trim()).eq("artist", artist.trim());
    }
    const { data: existing, error: findError } = await query.maybeSingle();
    if (findError)
        throw findError;
    if (existing)
        return mapWork(existing);
    const payload = {
        title: title.trim(),
        artist: artist.trim(),
        rights: input.rights ?? "unknown",
        source: input.source ?? "user",
        musicbrainz_id: musicbrainzId ?? null,
        wikidata_id: input.wikidataId ?? null,
        rights_notes: input.rightsNotes ?? null,
    };
    const { data, error } = await supabase
        .from("song_works")
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return mapWork(data);
}
export async function createArrangementFromSong(userId, song) {
    // 1. Create arrangements payload
    // We'll increment version based on existing arrangements count or just use next number?
    // Ideally we query max version. For now, let's assume we just create it.
    // Let's get max version for this work to auto-increment
    const { data: maxVer } = await supabase
        .from("arrangements")
        .select("version")
        .eq("work_id", song.work_id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextVersion = (maxVer?.version ?? 0) + 1;
    const payload = {
        work_id: song.work_id,
        author_user_id: userId,
        version: nextVersion,
        sections: song.sections ?? [],
        key: song.key ?? null,
        bpm: song.bpm ? String(song.bpm) : null,
        duration_sec: song.duration_sec ?? null,
        notes: song.notes ?? null,
        source: "community",
        is_seed: false,
        rating_avg: 0,
        rating_count: 0,
    };
    const { data, error } = await supabase
        .from("arrangements")
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return mapArrangement(data);
}
