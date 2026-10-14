import { supabase } from "../lib/supabase.js";
export async function getBandPayoutSettings(bandId) {
    const { data, error } = await supabase
        .from("band_payout_settings")
        .select("*")
        .eq("band_id", bandId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
export async function upsertBandPayoutSettings(bandId, data) {
    const { data: result, error } = await supabase
        .from("band_payout_settings")
        .upsert({
        band_id: bandId,
        ...data,
        updated_at: new Date().toISOString(),
    })
        .select()
        .single();
    if (error)
        throw error;
    return result;
}
