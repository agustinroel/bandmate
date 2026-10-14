// apps/api/src/library/library.repo.ts
import { supabase } from "../lib/supabase.js";
function pickSeedSlug(rightsNotes) {
    const notes = String(rightsNotes ?? "");
    const m = notes.match(/seedSlug:([a-z0-9\-]+)/i);
    return m?.[1] ?? null;
}
export async function listLibrary() {
    // list works + best arrangement rating (por ahora: rating_avg del arrangement)
    const { data: works, error } = await supabase
        .from("song_works")
        .select("id,title,artist,rights,rights_notes,updated_at,created_at")
        .order("updated_at", { ascending: false });
    if (error)
        throw error;
    // Para MVP: traemos arrangements seed y armamos "topArrangement"
    const workIds = (works ?? []).map((w) => w.id);
    if (workIds.length === 0)
        return [];
    const { data: arrs, error: e2 } = await supabase
        .from("arrangements")
        .select("id,work_id,rating_avg,rating_count,updated_at,is_seed,source")
        .in("work_id", workIds)
        .eq("is_seed", true);
    if (e2)
        throw e2;
    const bestByWork = new Map();
    for (const a of arrs ?? []) {
        const prev = bestByWork.get(a.work_id);
        if (!prev)
            bestByWork.set(a.work_id, a);
        else {
            // mejor por rating_count primero, luego rating_avg
            const pc = (prev.rating_count ?? 0);
            const nc = (a.rating_count ?? 0);
            const pa = (prev.rating_avg ?? 0);
            const na = (a.rating_avg ?? 0);
            const better = nc > pc ||
                (nc === pc && na > pa) ||
                (nc === pc && na === pa && a.updated_at > prev.updated_at);
            if (better)
                bestByWork.set(a.work_id, a);
        }
    }
    return (works ?? []).map((w) => {
        const best = bestByWork.get(w.id);
        return {
            id: w.id,
            title: w.title,
            artist: w.artist,
            rights: w.rights,
            seedSlug: pickSeedSlug(w.rights_notes),
            updatedAt: w.updated_at ?? w.created_at,
            // “top rating” (para pintar estrellas en la lista)
            ratingAvg: best?.rating_avg ?? 0,
            ratingCount: best?.rating_count ?? 0,
            topArrangementId: best?.id ?? null,
        };
    });
}
export async function getLibraryWork(workId) {
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
        .select("*")
        .eq("work_id", workId)
        .order("rating_count", { ascending: false })
        .order("rating_avg", { ascending: false });
    if (e2)
        throw e2;
    // active = mejor rankeado o primero
    const active = (arrs ?? [])[0] ?? null;
    return {
        work,
        arrangements: arrs ?? [],
        activeArrangement: active,
    };
}
