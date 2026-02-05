import { supabase } from "../lib/supabase.js";
export async function createEvent(bandId, data) {
    const { data: event, error } = await supabase
        .from("events")
        .insert({
        ...data,
        band_id: bandId,
        status: "draft",
    })
        .select()
        .single();
    if (error)
        throw error;
    return event;
}
export async function updateEvent(eventId, data) {
    const { data: event, error } = await supabase
        .from("events")
        .update({
        ...data,
        updated_at: new Date().toISOString(),
    })
        .eq("id", eventId)
        .select()
        .single();
    if (error)
        throw error;
    return event;
}
export async function getEvent(eventId) {
    const { data, error } = await supabase
        .from("events")
        .select("*, bands(id, name, avatar_url)")
        .eq("id", eventId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
export async function listBandsEvents(bandId) {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("band_id", bandId)
        .order("event_date", { ascending: true });
    if (error)
        throw error;
    return data;
}
export async function discoverEventsByLocation(lat, lng, radiusKm = 50, limit = 20) {
    // Simpler implementation for now: filter by status published
    // In a real geo-prod we'd use PostGIS functions (st_distance)
    // For MVP we will do a simple coordinate bounding box or just fetch published
    // We will assume 'published' status is the main filter.
    const { data, error } = await supabase
        .from("events")
        .select("*, bands(id, name, avatar_url)")
        .eq("status", "published")
        .order("event_date", { ascending: true })
        .limit(limit);
    if (error)
        throw error;
    return data;
}
