import { supabase } from "../lib/supabase.js";

type DbSetlist = {
  id: string;
  owner_id: string;
  name: string;
  notes: string | null;
  created_at: string;
};

type DbSetlistItem = {
  setlist_id: string;
  song_id: string;
  position: number;
};

function toApiSetlist(s: DbSetlist, items: DbSetlistItem[]) {
  return {
    id: s.id,
    name: s.name,
    notes: s.notes,
    items: items
      .sort((a, b) => a.position - b.position)
      .map((it) => ({ songId: it.song_id })),
  };
}

export async function listSetlistsForUser(userId: string) {
  const { data: setlists, error: e1 } = await supabase
    .from("setlists")
    .select("id, owner_id, name, notes, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (e1) throw e1;

  const ids = (setlists ?? []).map((s: any) => s.id);
  let itemsBySetlist = new Map<string, DbSetlistItem[]>();

  if (ids.length) {
    const { data: items, error: e2 } = await supabase
      .from("setlist_items")
      .select("setlist_id, song_id, position")
      .in("setlist_id", ids)
      .order("position", { ascending: true });

    if (e2) throw e2;

    for (const it of (items ?? []) as any[]) {
      const arr = itemsBySetlist.get(it.setlist_id) ?? [];
      arr.push(it as DbSetlistItem);
      itemsBySetlist.set(it.setlist_id, arr);
    }
  }

  return (setlists ?? []).map((s: any) =>
    toApiSetlist(s as DbSetlist, itemsBySetlist.get(s.id) ?? []),
  );
}

export async function getSetlistForUser(userId: string, id: string) {
  const { data: s, error: e1 } = await supabase
    .from("setlists")
    .select("id, owner_id, name, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (e1) throw e1;
  if (!s) return null;
  if (s.owner_id !== userId) return "FORBIDDEN" as const;

  const { data: items, error: e2 } = await supabase
    .from("setlist_items")
    .select("setlist_id, song_id, position")
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  if (e2) throw e2;

  return toApiSetlist(s as DbSetlist, (items ?? []) as any);
}

export async function createSetlistForUser(
  userId: string,
  dto: { name: string; notes?: string },
) {
  const payload = {
    owner_id: userId,
    name: dto.name.trim(),
    notes: dto.notes?.trim() ?? null,
  };

  const { data, error } = await supabase
    .from("setlists")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;

  return toApiSetlist(data as any, []);
}

export async function updateSetlistForUser(
  userId: string,
  id: string,
  patch: { name?: string; notes?: string | null },
) {
  // ownership
  const { data: s, error: e1 } = await supabase
    .from("setlists")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (e1) throw e1;
  if (!s) return null;
  if (s.owner_id !== userId) return "FORBIDDEN" as const;

  const payload: any = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.notes !== undefined)
    payload.notes = patch.notes === null ? null : patch.notes.trim();

  const { data, error } = await supabase
    .from("setlists")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  // items
  const { data: items, error: e2 } = await supabase
    .from("setlist_items")
    .select("setlist_id, song_id, position")
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  if (e2) throw e2;

  return toApiSetlist(data as any, (items ?? []) as any);
}

export async function deleteSetlistForUser(userId: string, id: string) {
  const { data: s, error: e1 } = await supabase
    .from("setlists")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (e1) throw e1;
  if (!s) return null;
  if (s.owner_id !== userId) return "FORBIDDEN" as const;

  const { error } = await supabase.from("setlists").delete().eq("id", id);
  if (error) throw error;

  return true;
}

export async function addSongToSetlistForUser(
  userId: string,
  setlistId: string,
  songId: string,
) {
  // ownership
  const { data: s, error: e1 } = await supabase
    .from("setlists")
    .select("id, owner_id")
    .eq("id", setlistId)
    .maybeSingle();

  if (e1) throw e1;
  if (!s) return null;
  if (s.owner_id !== userId) return "FORBIDDEN" as const;

  // next position
  const { data: maxRow, error: e2 } = await supabase
    .from("setlist_items")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e2) throw e2;

  const nextPos = (maxRow?.position ?? -1) + 1;

  const { error: e3 } = await supabase.from("setlist_items").insert({
    setlist_id: setlistId,
    song_id: songId,
    position: nextPos,
  });

  // si ya existe por unique (setlist_id, song_id), devolvemos "igual" como UX friendly
  if (e3 && (e3 as any).code !== "23505") throw e3;

  return getSetlistForUser(userId, setlistId);
}

export async function removeSongFromSetlistForUser(
  userId: string,
  setlistId: string,
  songId: string,
) {
  const current = await getSetlistForUser(userId, setlistId);
  if (current === null) return null;
  if (current === "FORBIDDEN") return "FORBIDDEN" as const;

  const { error: e1 } = await supabase
    .from("setlist_items")
    .delete()
    .eq("setlist_id", setlistId)
    .eq("song_id", songId);

  if (e1) throw e1;

  // re-pack positions
  return reorderSetlistForUser(
    userId,
    setlistId,
    current.items.filter((i) => i.songId !== songId).map((i) => i.songId),
  );
}

export async function reorderSetlistForUser(
  userId: string,
  setlistId: string,
  songIds: string[],
) {
  const current = await getSetlistForUser(userId, setlistId);
  if (current === null) return null;
  if (current === "FORBIDDEN") return "FORBIDDEN" as const;

  // (Opcional pero recomendable) Validar que no vengan duplicados
  const uniq = new Set(songIds);
  if (uniq.size !== songIds.length) {
    const err: any = new Error("songIds contains duplicates");
    err.statusCode = 400;
    throw err;
  }

  // 1) Borramos todos los items del setlist
  const { error: delErr } = await supabase
    .from("setlist_items")
    .delete()
    .eq("setlist_id", setlistId);

  if (delErr) throw delErr;

  // 2) Insertamos el nuevo orden (posiciones 0..n-1)
  if (songIds.length > 0) {
    const rows = songIds.map((songId, idx) => ({
      setlist_id: setlistId,
      song_id: songId,
      position: idx,
    }));

    const { error: insErr } = await supabase.from("setlist_items").insert(rows);
    if (insErr) throw insErr;
  }

  // 3) Devolvemos setlist actualizado
  return getSetlistForUser(userId, setlistId);
}
