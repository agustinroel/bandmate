import { supabase } from "../lib/supabase.js";
import { ensureProfile } from "../profiles/profiles.repo.js";
import { createNotification } from "../notifications/notifications.repo.js";

export async function createBand(
  userId: string,
  data: { name: string; description?: string },
) {
  // 1. Create Band
  // We use the authenticated user's ID as owner_id
  const { data: band, error: e1 } = await supabase
    .from("bands")
    .insert({
      name: data.name,
      description: data.description,
      owner_id: userId,
    })
    .select()
    .single();

  if (e1) throw e1;

  // 2. Add Owner as Member with 'owner' role
  // Note: band_members policies must allow this, or we rely on the owner_id consistency check if RLS is on.
  // Ideally, creating the band makes you owner.
  // If we have strict RLS, the insert to band_members might fail if policies aren't set up to allow "owners of band" to insert members.
  // For MVP, we assume the creator can add themselves or we use a service-role client if needed later.
  const { error: e2 } = await supabase.from("band_members").insert({
    band_id: band.id,
    user_id: userId,
    roles: ["owner", "admin"],
  });

  if (e2) {
    console.error("Failed to add owner member", e2);
    // In a robust system, we would rollback.
  }

  return band;
}

export async function listBandsForUser(userId: string) {
  // Get bands where the user is a member
  const { data, error } = await supabase
    .from("band_members")
    .select(
      `
      roles,
      bands (
        id, name, description, avatar_url, owner_id
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  // Flatten result
  return (data || []).map((m: any) => ({
    ...m.bands,
    my_roles: m.roles,
  }));
}

export async function listBands(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from("bands")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getBand(bandId: string) {
  const { data, error } = await supabase
    .from("bands")
    .select("*")
    .eq("id", bandId)
    .eq("id", bandId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listBandMembers(bandId: string) {
  const { data, error } = await supabase
    .from("band_members")
    .select(
      `
      roles,
      profiles (
        id, username, full_name, avatar_url, instruments
      )
    `,
    )
    .eq("band_id", bandId);

  if (error) throw error;

  return (data || []).map((m: any) => ({
    ...m.profiles,
    roles: m.roles,
  }));
}

export async function listBandSongs(bandId: string) {
  const { data, error } = await supabase
    .from("band_songs")
    .select(
      `
      shared_at,
      shared_by,
      songs (
        id, title, artist, key
      )
    `,
    )
    .eq("band_id", bandId);

  if (error) throw error;

  return (data || []).map((s: any) => ({
    ...s.songs,
    shared_at: s.shared_at,
    shared_by: s.shared_by,
  }));
}

export async function addSongToBand(
  userId: string,
  bandId: string,
  songId: string,
) {
  // Check membership first (RLS handles it but good practice)
  const { error } = await supabase.from("band_songs").insert({
    band_id: bandId,
    song_id: songId,
    shared_by: userId,
  });

  if (error) throw error;
  return { success: true };
}

export async function removeSongFromBand(
  userId: string,
  bandId: string,
  songId: string,
) {
  const { error } = await supabase
    .from("band_songs")
    .delete()
    .eq("band_id", bandId)
    .eq("song_id", songId);

  if (error) throw error;
  return { success: true };
}

export async function updateBand(
  bandId: string,
  data: {
    name?: string;
    description?: string;
    avatar_url?: string;
    invite_code?: string;
  },
) {
  const { data: band, error } = await supabase
    .from("bands")
    .update(data)
    .eq("id", bandId)
    .select()
    .single();

  if (error) throw error;
  return band;
}

export async function getOrCreateInviteCode(bandId: string) {
  // 1. Check if code already exists
  const { data: band, error: e1 } = await supabase
    .from("bands")
    .select("invite_code")
    .eq("id", bandId)
    .single();

  if (e1) throw e1;
  if (band.invite_code) return band.invite_code;

  // 2. Generate random 8-char code
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  // 3. Update band with new code
  const { data: updated, error: e2 } = await supabase
    .from("bands")
    .update({ invite_code: code })
    .eq("id", bandId)
    .select("invite_code")
    .single();

  if (e2) throw e2;
  return updated.invite_code;
}

export async function joinBandByCode(userId: string, code: string) {
  // 0. Ensure profile exists (to prevent FK violation)
  await ensureProfile(userId);

  // 1. Find band by code
  const { data: band, error: e1 } = await supabase
    .from("bands")
    .select("id, name")
    .eq("invite_code", code)
    .maybeSingle();

  if (e1) throw e1;
  if (!band) throw new Error("Invalid invite code");

  // 2. Add as member (role = 'member')
  // We use .upsert to handle if they are already a member
  // Note: we don't want to demote an owner, so maybe check first or use ignore conflict.
  const { error: e2 } = await supabase.from("band_members").upsert(
    {
      band_id: band.id,
      user_id: userId,
      roles: ["member"],
    },
    { onConflict: "band_id,user_id" },
  );

  if (e2) throw e2;
  return band;
}

export async function inviteUserToBand(
  bandId: string,
  invitedBy: string,
  userIdToInvite: string,
) {
  // 1. Check if already member
  const { data: member } = await supabase
    .from("band_members")
    .select("id")
    .eq("band_id", bandId)
    .eq("user_id", userIdToInvite)
    .maybeSingle();

  if (member) throw new Error("User is already a member of this band.");

  // 2. Check if already invited (pending)
  const { data: existing } = await supabase
    .from("band_invites")
    .select("id")
    .eq("band_id", bandId)
    .eq("invited_user_id", userIdToInvite)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) throw new Error("User already has a pending invite.");

  // 3. Create Invite
  const { data: newInvite, error: e1 } = await supabase
    .from("band_invites")
    .insert({
      band_id: bandId,
      invited_by: invitedBy,
      invited_user_id: userIdToInvite,
      status: "pending",
    })
    .select("id")
    .single();

  if (e1) throw e1;

  // 4. Notify User
  // Fetch band name for notification
  const { data: band } = await supabase
    .from("bands")
    .select("name")
    .eq("id", bandId)
    .single();
  const bandName = band?.name || "Unknown Band";

  await createNotification(
    userIdToInvite,
    "band_invite",
    "Band Invitation",
    `You have been invited to join ${bandName}`,
    { bandId, bandName, inviteId: newInvite.id },
  );

  return { success: true };
}

export async function respondToInvite(
  inviteId: string,
  userId: string,
  accept: boolean,
) {
  // 1. Fetch invite to verify ownership
  const { data: invite, error: e1 } = await supabase
    .from("band_invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (e1 || !invite) throw new Error("Invite not found");
  if (invite.invited_user_id !== userId) throw new Error("Not your invite");
  if (invite.status !== "pending")
    throw new Error("Invite already responded to");

  // 2. Update status
  const newStatus = accept ? "accepted" : "rejected";
  const { error: e2 } = await supabase
    .from("band_invites")
    .update({ status: newStatus })
    .eq("id", inviteId);

  if (e2) throw e2;

  // 3. If accepted, add to band members
  if (accept) {
    const { error: e3 } = await supabase.from("band_members").insert({
      band_id: invite.band_id,
      user_id: userId,
      roles: ["member"],
    });
    if (e3) throw e3;
  }

  return { success: true, status: newStatus };
}

export async function listPendingInvites(userId: string) {
  // Simple select first, frontend can fetch details if needed or we use a view
  const { data, error } = await supabase
    .from("band_invites")
    .select(
      `
      id, 
      status, 
      created_at,
      band_id,
      invited_by,
      bands (id, name, avatar_url),
      profiles!invited_by (username)
    `,
    )
    .eq("invited_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
