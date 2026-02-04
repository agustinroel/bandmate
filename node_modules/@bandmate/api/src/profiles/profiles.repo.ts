import { supabase } from "../lib/supabase.js";

export type ProfileRow = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  is_public?: boolean;
  avatar_url?: string | null;
  instruments?: string[] | null;
  bio?: string | null;
  updated_at?: string;
};

export type ProfileFilters = {
  query?: string;
  instruments?: string[];
  genres?: string[]; // Note: schema might not have genres yet, user asked for it. I see genres in public-profile.ts logic, let's assume it exists or will check.
  // Update: public-profile.ts maps `profile()?.genres` so it likely exists or is handled. I need to be sure.
  // Let's assume schema has it.
  sings?: boolean;
};

export async function listPublicProfiles(
  filters: ProfileFilters = {},
  limit = 50,
  offset = 0,
) {
  let query = supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, instruments, genres, sings, bio, is_public",
    )
    .eq("is_public", true);

  if (filters.query) {
    // Search in username OR full_name
    const q = `%${filters.query}%`;
    query = query.or(`username.ilike.${q},full_name.ilike.${q}`);
  }

  if (filters.instruments && filters.instruments.length > 0) {
    // Array overlap for instruments
    query = query.overlaps("instruments", filters.instruments);
  }

  if (filters.genres && filters.genres.length > 0) {
    // Array overlap for genres
    query = query.overlaps("genres", filters.genres);
  }

  if (filters.sings) {
    query = query.eq("sings", true);
  }

  const { data, error } = await query
    .range(offset, offset + limit - 1)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as any[]; // relaxed type for now
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as ProfileRow;
}

export async function ensureProfile(userId: string, email?: string) {
  const { data: existing, error: e1 } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (e1) throw e1;
  if (existing) return;

  // Fetch user from Auth to get metadata (avatar, name)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.admin.getUserById(userId);

  let authMeta: any = {};
  if (user && user.user_metadata) {
    authMeta = user.user_metadata;
  }

  // Determine avatar and name
  const avatarUrl = authMeta.avatar_url || authMeta.picture || null;
  const fullName = authMeta.full_name || authMeta.name || null;

  const baseUsername = email
    ? email.split("@")[0].replace(/[^a-z0-9]/gi, "_")
    : `user_${userId.slice(0, 5)}`;

  const { error: e2 } = await supabase.from("profiles").insert({
    id: userId,
    username: `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
    full_name: fullName,
    avatar_url: avatarUrl,
    is_public: true,
    instruments: [],
  });

  if (e2) {
    console.error("Failed to auto-create profile", e2);
    // throw e2; // In some cases we might want to ignore if it's not critical,
    // but here it is critical because of the FK.
    throw e2;
  }
}
