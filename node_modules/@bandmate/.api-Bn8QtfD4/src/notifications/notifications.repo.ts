import { supabase } from "../lib/supabase.js";

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
};

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  data?: any,
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    data,
  });

  if (error) throw error;
}

export async function listNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as NotificationRow[];
}

export async function markNotificationRead(id: string, userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}
