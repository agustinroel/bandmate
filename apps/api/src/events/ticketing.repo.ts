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

export async function validateTicket(qrHash: string, bandId: string) {
  // 1. Get ticket and verify event owner
  const { data: ticket, error: fetchError } = await supabase
    .from("event_tickets")
    .select(
      `
      *,
      events!inner (
        band_id,
        title,
        event_date
      ),
      profiles:user_id (
        full_name,
        email
      )
    `,
    )
    .eq("qr_hash", qrHash)
    .single();

  if (fetchError || !ticket) {
    throw new Error("Ticket not found");
  }

  // 2. Security check: Only the band that owns the event can validate
  if (ticket.events.band_id !== bandId) {
    throw new Error(
      "Unauthorized: This ticket belongs to another band's event",
    );
  }

  // 3. Status check
  if (ticket.status !== "active") {
    return {
      success: false,
      message: `Ticket already ${ticket.status}`,
      ticket,
    };
  }

  // 4. Update status to used
  const { data: updated, error: updateError } = await supabase
    .from("event_tickets")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
    })
    .eq("id", ticket.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    success: true,
    message: "Ticket validated successfully",
    ticket: {
      ...ticket,
      status: "used",
    },
  };
}
