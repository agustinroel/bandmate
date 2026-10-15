import { supabase } from "../lib/supabase.js";
import { readJson, writeJson } from "../persistance/json.store.js";

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

const NOTIFS_FILE = "user_notifications.json";
let cachedNotifs: NotificationRow[] | null = null;

async function getStoredNotifications(): Promise<NotificationRow[]> {
  if (cachedNotifs === null) {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          cachedNotifs = data as NotificationRow[];
          await writeJson(NOTIFS_FILE, cachedNotifs);
          return cachedNotifs;
        }
      }
    } catch {
      // Fallback
    }
    cachedNotifs = await readJson<NotificationRow[]>(NOTIFS_FILE, []);
  }
  return cachedNotifs;
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  data?: any,
) {
  const newNotif: NotificationRow = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    type,
    title,
    message,
    data,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const all = await getStoredNotifications();
  all.unshift(newNotif);
  cachedNotifs = all;
  await writeJson(NOTIFS_FILE, all);

  try {
    if (supabase) {
      await supabase.from("notifications").insert(newNotif);
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase insert warning:", err);
  }
}

export async function listNotifications(userId: string, limit = 20) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as NotificationRow[];
      }
    }
  } catch {
    // Fallback to local
  }

  const all = await getStoredNotifications();
  return all.filter((n) => n.user_id === userId).slice(0, limit);
}

export async function markNotificationRead(id: string, userId: string) {
  const all = await getStoredNotifications();
  const target = all.find((n) => n.id === id && n.user_id === userId);
  if (target) {
    target.is_read = true;
    await writeJson(NOTIFS_FILE, all);
  }

  try {
    if (supabase) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId);
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase mark read warning:", err);
  }
}

export async function markAllNotificationsRead(userId: string) {
  const all = await getStoredNotifications();
  let modified = false;
  for (const n of all) {
    if (n.user_id === userId && !n.is_read) {
      n.is_read = true;
      modified = true;
    }
  }
  if (modified) {
    await writeJson(NOTIFS_FILE, all);
  }

  try {
    if (supabase) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase mark all read warning:", err);
  }
}

