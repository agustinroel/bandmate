import { supabase } from "../lib/supabase.js";

export type TicketRow = {
  id: string;
  event_id: string;
  user_id: string;
  qr_hash: string;
  status: "active" | "used" | "refunded";
  purchase_price: number;
  stripe_payment_intent_id?: string;
  created_at: string;
  used_at?: string;
  events?: {
    id: string;
    title: string;
    event_date: string;
    location_name: string;
    bands: {
      name: string;
    };
  };
};

export async function listUserTickets(userId: string) {
  const { data, error } = await supabase
    .from("event_tickets")
    .select(
      `
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
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTicket(ticketId: string, userId: string) {
  const { data, error } = await supabase
    .from("event_tickets")
    .select(
      `
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
    `,
    )
    .eq("id", ticketId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}
export async function createTicket(
  ticket: Omit<TicketRow, "id" | "created_at" | "status">,
) {
  const { data, error } = await supabase
    .from("event_tickets")
    .insert([
      {
        ...ticket,
        status: "active",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
