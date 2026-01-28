import { supabase } from "../lib/supabase.js";

export type ArrangementRow = {
  id: string;
  work_id: string;
  author_user_id?: string | null;

  version?: number | null;
  sections?: any[] | null;

  key?: string | null;
  bpm?: string | null;
  duration_sec?: number | null;
  notes?: string | null;
  links?: any[] | null;

  tags?: any[] | null;
  capo?: number | null;
  time_signature?: string | null;

  source: "community" | "official" | "public-domain";
  is_seed: boolean;

  rating_avg?: number | null;
  rating_count?: number | null;

  created_at: string;
  updated_at: string;
};

function mapArrangement(row: any) {
  return {
    id: row.id,
    workId: row.work_id,
    version: row.version ?? 1,
    sections: row.sections ?? [],

    key: row.key ?? null,
    bpm: row.bpm ?? null,
    durationSec: row.duration_sec ?? null,
    notes: row.notes ?? null,

    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,

    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    isSeed: row.is_seed === true,
  };
}

export async function createArrangementForWork(
  userId: string,
  workId: string,
  dto: {
    sections: any[];
    key?: string | null;
    bpm?: string | null;
    durationSec?: number | null;
    notes?: string | null;
    links?: any[];
    tags?: any[] | null;
    capo?: number | null;
    timeSignature?: string | null;
    source?: "community" | "official" | "public-domain";
  },
) {
  // validar work existe
  const { data: work, error: e0 } = await supabase
    .from("song_works")
    .select("id")
    .eq("id", workId)
    .maybeSingle();

  if (e0) throw e0;
  if (!work) return "WORK_NOT_FOUND" as const;

  const payload = {
    work_id: workId,
    author_user_id: userId, // por ahora userId string (uuid supabase normalmente)
    version: 1,
    sections: dto.sections ?? [],
    key: dto.key ?? null,
    bpm: dto.bpm ?? null,
    duration_sec: dto.durationSec ?? null,
    notes: dto.notes ?? null,
    links: dto.links ?? [],
    tags: dto.tags ?? null,
    capo: dto.capo ?? null,
    time_signature: dto.timeSignature ?? null,
    source: dto.source ?? "community",
    is_seed: false,
  };

  const { data, error } = await supabase
    .from("arrangements")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return mapArrangement(data);
}

export async function getArrangementById(arrangementId: string) {
  const { data, error } = await supabase
    .from("arrangements")
    .select("*")
    .eq("id", arrangementId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapArrangement(data);
}

export async function updateArrangementForUser(
  userId: string,
  arrangementId: string,
  patch: Partial<{
    sections: any[];
    key: string | null;
    bpm: string | null;
    durationSec: number | null;
    notes: string | null;
    links: any[];
    tags: any[] | null;
    capo: number | null;
    timeSignature: string | null;
  }>,
) {
  const { data: existing, error: e1 } = await supabase
    .from("arrangements")
    .select("*")
    .eq("id", arrangementId)
    .maybeSingle();

  if (e1) throw e1;
  if (!existing) return null;
  if (existing.is_seed) return "FORBIDDEN_SEED" as const;
  if (String(existing.author_user_id ?? "") !== String(userId))
    return "FORBIDDEN" as const;

  const p: any = patch ?? {};
  const payload: any = {};

  if (p.sections !== undefined)
    payload.sections = Array.isArray(p.sections) ? p.sections : [];
  if (p.key !== undefined) payload.key = p.key ?? null;
  if (p.bpm !== undefined) payload.bpm = p.bpm ?? null;
  if (p.durationSec !== undefined) payload.duration_sec = p.durationSec ?? null;
  if (p.duration_sec !== undefined)
    payload.duration_sec = p.duration_sec ?? null;
  if (p.notes !== undefined) payload.notes = p.notes ?? null;
  if (p.links !== undefined)
    payload.links = Array.isArray(p.links) ? p.links : [];
  if (p.tags !== undefined)
    payload.tags = Array.isArray(p.tags) ? p.tags : null;
  if (p.capo !== undefined) payload.capo = p.capo ?? null;
  if (p.timeSignature !== undefined)
    payload.time_signature = p.timeSignature ?? null;
  if (p.time_signature !== undefined)
    payload.time_signature = p.time_signature ?? null;

  if (Object.keys(payload).length === 0) return mapArrangement(existing);

  const { data, error } = await supabase
    .from("arrangements")
    .update(payload)
    .eq("id", arrangementId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapArrangement(data);
}

export async function deleteArrangementForUser(
  userId: string,
  arrangementId: string,
) {
  const { data: existing, error: e1 } = await supabase
    .from("arrangements")
    .select("id, author_user_id, is_seed")
    .eq("id", arrangementId)
    .maybeSingle();

  if (e1) throw e1;
  if (!existing) return null;
  if (existing.is_seed) return "FORBIDDEN_SEED" as const;
  if (String(existing.author_user_id ?? "") !== String(userId))
    return "FORBIDDEN" as const;

  const { error } = await supabase
    .from("arrangements")
    .delete()
    .eq("id", arrangementId);
  if (error) throw error;
  return true;
}

// ✅ permiso básico: si tu GET ya controla acceso, esto es extra safety.
// Alineado a songs: solo seed se ratea (si querés community-only)
export async function rateArrangementForUser(
  userId: string,
  arrangementId: string,
  rating: number,
) {
  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return "BAD_RATING" as const;
  }

  // Traemos arrangement para validar que exista + si es seed
  const { data: existing, error: e1 } = await supabase
    .from("arrangements")
    .select("id, is_seed")
    .eq("id", arrangementId)
    .maybeSingle();

  if (e1) throw e1;
  if (!existing) return null;

  if (existing.is_seed !== true) return "FORBIDDEN" as const;

  // RPC que upsertea en arrangement_ratings y recalcula avg/count en arrangements
  const { error } = await supabase.rpc("rate_arrangement", {
    p_arrangement_id: arrangementId,
    p_user_id: userId,
    p_value: value,
  });

  if (error) throw error;

  const { data, error: e2 } = await supabase
    .from("arrangements")
    .select("*")
    .eq("id", arrangementId)
    .maybeSingle();

  if (e2) throw e2;
  if (!data) return null;

  return mapArrangement(data);
}
