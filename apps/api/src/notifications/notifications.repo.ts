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
  const userAliases = [userId];
  try {
    const { getProfileById } = await import("../profiles/profiles.repo.js");
    const prof = await getProfileById(userId);
    if (prof) {
      if (prof.username && !userAliases.includes(prof.username)) userAliases.push(prof.username);
      if (prof.id && !userAliases.includes(prof.id)) userAliases.push(prof.id);
      if (prof.username === 'agustinroel' && !userAliases.includes('usr-agustin-roel')) {
        userAliases.push('usr-agustin-roel');
      }
    }
  } catch (_) {}

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .in("user_id", userAliases)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as NotificationRow[];
      }
    }
  } catch {
    // Fallback to local
  }

  const all = await getStoredNotifications();
  return all.filter((n) => userAliases.includes(n.user_id)).slice(0, limit);
}

export async function markNotificationRead(id: string, userId: string) {
  const all = await getStoredNotifications();
  const target = all.find((n) => n.id === id);
  if (target) {
    target.is_read = true;
    await writeJson(NOTIFS_FILE, all);
  }

  try {
    if (supabase) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase mark read warning:", err);
  }
}

export async function markAllNotificationsRead(userId: string) {
  const userAliases = [userId];
  try {
    const { getProfileById } = await import("../profiles/profiles.repo.js");
    const prof = await getProfileById(userId);
    if (prof?.username && !userAliases.includes(prof.username)) userAliases.push(prof.username);
    if (prof?.username === 'agustinroel' && !userAliases.includes('usr-agustin-roel')) {
      userAliases.push('usr-agustin-roel');
    }
  } catch (_) {}

  const all = await getStoredNotifications();
  let modified = false;
  for (const n of all) {
    if (userAliases.includes(n.user_id) && !n.is_read) {
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
        .in("user_id", userAliases)
        .eq("is_read", false);
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase mark all read warning:", err);
  }
}

