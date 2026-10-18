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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  data?: any,
): Promise<NotificationRow> {
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

      // Broadcast real-time push event to connected clients
      const ch = supabase.channel("community_live_feed");
      await ch.send({
        type: "broadcast",
        event: "notif_update",
        payload: newNotif,
      });
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase insert/broadcast warning:", err);
  }

  return newNotif;
}

export async function resolveUserNotificationAliases(userId: string): Promise<string[]> {
  const userAliases = new Set<string>([userId]);
  try {
    const { getProfileById } = await import("../profiles/profiles.repo.js");
    const prof = await getProfileById(userId);
    if (prof) {
      if (prof.username) userAliases.add(prof.username);
      if (prof.id) userAliases.add(prof.id);
      if (prof.username === "agustinroel") {
        userAliases.add("usr-agustin-roel");
      }
    }
  } catch (_) {}
  return Array.from(userAliases);
}

export async function listNotifications(userId: string, limit = 30) {
  const userAliases = await resolveUserNotificationAliases(userId);
  const uuidAliases = userAliases.filter((a) => UUID_REGEX.test(a));

  const mergedMap = new Map<string, NotificationRow>();

  try {
    if (supabase && uuidAliases.length > 0) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .in("user_id", uuidAliases)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        for (const row of data as NotificationRow[]) {
          mergedMap.set(row.id, row);
        }
      }
    }
  } catch {
    // Fallback to local
  }

  const all = await getStoredNotifications();
  for (const n of all) {
    if (userAliases.includes(n.user_id) && !mergedMap.has(n.id)) {
      mergedMap.set(n.id, n);
    }
  }

  return Array.from(mergedMap.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
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
  const userAliases = await resolveUserNotificationAliases(userId);
  const uuidAliases = userAliases.filter((a) => UUID_REGEX.test(a));

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
    if (supabase && uuidAliases.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("user_id", uuidAliases)
        .eq("is_read", false);
    }
  } catch (err) {
    console.warn("[notifications.repo] Supabase mark all read warning:", err);
  }
}


