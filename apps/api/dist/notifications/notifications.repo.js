import { supabase } from "../lib/supabase.js";
export async function createNotification(userId, type, title, message, data) {
    const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        type,
        title,
        message,
        data,
    });
    if (error)
        throw error;
}
export async function listNotifications(userId, limit = 20) {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return data;
}
export async function markNotificationRead(id, userId) {
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId);
    if (error)
        throw error;
}
export async function markAllNotificationsRead(userId) {
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    if (error)
        throw error;
}
