import { supabase } from "../lib/supabase.js";

export type SongRow = {
  id: string;
  owner_id: string | null;
  is_seed: boolean;
  title: string;
  artist: string;
  key?: string | null;
  bpm?: number | null;
  duration_sec?: number | null;
  notes?: string | null;
  created_at?: string;
  version?: number | null;
  sections?: any[] | null;
  links?: any[] | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  work_id?: string | null;
  origin_arrangement_id?: string | null;
};

export type CreateSongInput = Omit<
  SongRow,
  "id" | "created_at" | "owner_id" | "is_seed"
> & {
  // dejamos lo que viene del FE
  workId?: string | null;
  originArrangementId?: string | null;
};

export type UpdateSongInput = Partial<
  Omit<SongRow, "id" | "owner_id" | "is_seed" | "created_at">
>;

function mapSong(row: any) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    key: row.key,
    bpm: row.bpm,
    durationSec: row.duration_sec,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at, // según schema
    isSeed: row.is_seed === true,

    version: row.version ?? 1,
    sections: row.sections ?? [],

    links: row.links ?? [],
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
    workId: row.work_id ?? null,
    originArrangementId: row.origin_arrangement_id ?? null,
  };
}

export async function listSongsForUser(userId: string) {
  // ✅ seeds (owner null, is_seed true) OR owner_id = userId
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .or(`is_seed.eq.true,owner_id.eq.${userId}`)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapSong);
}

export async function getSongByIdForUser(userId: string, id: string) {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // ✅ permiso: seed o dueño
  if (data.is_seed === true) return mapSong(data);
  if (data.owner_id === userId) return mapSong(data);

  return null;
}

export async function createSongForUser(userId: string, dto: CreateSongInput) {
  const payload = {
    title: dto.title?.trim(),
    artist: dto.artist?.trim(),
    key: pick(dto, "key", "key") ?? null,
    bpm: pick(dto, "bpm", "bpm") ?? null,
    duration_sec: pick(dto, "durationSec", "duration_sec") ?? null,
    notes: pick(dto, "notes", "notes") ?? null,

    links: pick(dto, "links", "links") ?? [],

    // 👇 body
    sections: pick(dto, "sections", "sections") ?? [],

    owner_id: userId,
    is_seed: false,
    version: pick(dto, "version", "version") ?? 1,

    // Link info
    work_id: pick(dto, "workId", "work_id") ?? null,
    origin_arrangement_id: pick(dto, "originArrangementId", "origin_arrangement_id") ?? null,
  };

  const { data, error } = await supabase
    .from("songs")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return mapSong(data);
}

export async function updateSongForUser(
  userId: string,
  id: string,
  patch: UpdateSongInput,
) {
  // 1) Traemos para validar ownership/seed + para devolver si no hay cambios
  const { data: existing, error: e1 } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (e1) throw e1;
  if (!existing) return null;
  if (existing.is_seed) return "FORBIDDEN_SEED" as const;
  if (existing.owner_id !== userId) return "FORBIDDEN" as const;

  const p: any = patch as any;

  // 2) Armamos payload (incluyendo sections)
  const payload: any = {};

  // --- META ---
  if (p.title !== undefined) payload.title = p.title?.trim();
  if (p.artist !== undefined) payload.artist = p.artist?.trim();

  // key puede venir como string/null
  if (p.key !== undefined) payload.key = p.key ?? null;

  // bpm puede venir number/string/null => lo dejamos pasar, pero si querés lo normalizamos
  if (p.bpm !== undefined) payload.bpm = p.bpm ?? null;

  // soporta snake_case y camelCase para duration
  if (p.duration_sec !== undefined)
    payload.duration_sec = p.duration_sec ?? null;
  if (p.durationSec !== undefined) payload.duration_sec = p.durationSec ?? null;

  if (p.notes !== undefined) payload.notes = p.notes ?? null;

  // --- BODY ---
  if (p.sections !== undefined) payload.sections = p.sections ?? [];

  // version: si viene, la seteamos; si no viene no tocamos
  if (p.version !== undefined)
    payload.version = p.version ?? existing.version ?? 1;

  // --- LINKS ---

  if (p.links !== undefined) payload.links = p.links ?? [];

  // 3) Si no hay nada para actualizar => devolvemos existing (y evitamos PGRST116)
  if (Object.keys(payload).length === 0) {
    return mapSong(existing);
  }

  // 4) Update real
  const { data, error } = await supabase
    .from("songs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapSong(data);
}

export async function deleteSongForUser(userId: string, id: string) {
  const { data: existing, error: e1 } = await supabase
    .from("songs")
    .select("id, owner_id, is_seed")
    .eq("id", id)
    .maybeSingle();

  if (e1) throw e1;
  if (!existing) return null;
  if (existing.is_seed) return "FORBIDDEN_SEED" as const;
  if (existing.owner_id !== userId) return "FORBIDDEN" as const;

  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function rateSongForUser(
  userId: string,
  id: string,
  rating: number,
) {
  const song = await getSongByIdForUser(userId, id);
  if (!song) return null;

  if (!song.isSeed) return "FORBIDDEN" as const;

  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new Error("rating must be a number between 1 and 5");
  }

  const { error } = await supabase.rpc("rate_song", {
    p_song_id: id,
    p_user_id: userId,
    p_value: value,
  });

  if (error) throw error;

  const { data, error: e2 } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (e2) throw e2;
  if (!data) return null;

  return mapSong(data);
}

function pick<T = any>(obj: any, camel: string, snake: string) {
  if (!obj) return undefined;
  if (obj[camel] !== undefined) return obj[camel];
  if (obj[snake] !== undefined) return obj[snake];
  return undefined;
}
