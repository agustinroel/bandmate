import { supabase } from "../lib/supabase.js";
export async function listUserTickets(userId) {
    const { data, error } = await supabase
        .from("event_tickets")
        .select(`
      *,
      events (
        id,
        title,
        event_date,
        location_name,
        bands (
          name
        )
      )
    `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (error)
        throw error;
    return data;
}
export async function getTicket(ticketId, userId) {
    const { data, error } = await supabase
        .from("event_tickets")
        .select(`
      *,
      events (
        id,
        title,
        event_date,
        location_name,
        bands (
          name
        )
      )
    `)
        .eq("id", ticketId)
        .eq("user_id", userId)
        .single();
    if (error)
        throw error;
    return data;
}
