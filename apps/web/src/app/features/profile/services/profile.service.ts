import { Injectable } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../core/supabase/supabase.client';

export type ProfileRow = {
  id: string; // uuid = auth.users.id
  username: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  about: string | null;
  instruments: string[];
  genres: string[];
  sings: boolean;
  chord_default_instrument: string; // 'guitar' | 'piano' | ...
  is_public: boolean;
  subscription_tier?: string | null; // 'free' | 'pro' | 'studio'
  updated_at?: string | null;
  created_at?: string | null;
};

type UpsertProfileInput = Pick<
  ProfileRow,
  | 'id'
  | 'username'
  | 'full_name'
  | 'avatar_url'
  | 'about'
  | 'instruments'
  | 'genres'
  | 'sings'
  | 'chord_default_instrument'
  | 'is_public'
>;

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  async getById(id: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    return (data as ProfileRow | null) ?? null;
  }

  async ensureForUser(user: User): Promise<ProfileRow> {
    const existing = await this.getById(user.id);

    // Sync metadata from auth if missing in profile (One-time sync mechanism)
    const meta = user.user_metadata || {};
    const authAvatar = meta['avatar_url'] || meta['picture'] || null;
    const authName = meta['full_name'] || meta['name'] || null;

    if (existing) {
      const changes: Partial<UpsertProfileInput> = {};
      let shouldUpdate = false;

      // Sync if missing OR different (keep profile fresh from Auth)
      if (authAvatar && existing.avatar_url !== authAvatar) {
        changes.avatar_url = authAvatar;
        shouldUpdate = true;
      }
      if (authName && existing.full_name !== authName) {
        changes.full_name = authName;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        const updates: UpsertProfileInput = {
          ...existing,
          ...changes,
          // Ensure required fields for UpsertProfileInput (though we are merging)
          // We cast to UpsertProfileInput because we know existing has the fields.
        } as UpsertProfileInput;

        // We need to be careful with strict typing.
        // Let's construct a clean object.
        const cleanUpdate: UpsertProfileInput = {
          id: user.id,
          username: existing.username,
          full_name: changes.full_name ?? existing.full_name,
          avatar_url: changes.avatar_url ?? existing.avatar_url,
          about: existing.about,
          instruments: existing.instruments,
          genres: existing.genres,
          sings: existing.sings,
          chord_default_instrument: existing.chord_default_instrument,
          is_public: existing.is_public,
        };

        return this.upsert(cleanUpdate);
      }
      return this.normalize(existing);
    }

    // username sugerido: parte de email si existe
    const email = user.email ?? '';
    const base = email.split('@')[0]?.trim() || 'user';
    const safe = base
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 24);
    const username = safe.length >= 3 ? safe : `user_${user.id.slice(0, 6)}`;

    const row: UpsertProfileInput = {
      id: user.id,
      username,
      full_name: authName,
      avatar_url: authAvatar,
      about: null,
      instruments: [],
      genres: [],
      sings: false,
      chord_default_instrument: 'guitar',
      is_public: true,
    };

    const created = await this.upsert(row);
    return this.normalize(created);
  }

  async upsert(input: UpsertProfileInput): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(input, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw error;
    return data as ProfileRow;
  }

  async getByUsername(username: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return (data as ProfileRow | null) ?? null;
  }

  private normalize(p: ProfileRow): ProfileRow {
    return {
      ...p,
      instruments: Array.isArray(p.instruments) ? p.instruments : [],
      genres: Array.isArray(p.genres) ? p.genres : [],
      sings: !!p.sings,
      chord_default_instrument: p.chord_default_instrument || 'guitar',
      is_public: p.is_public ?? true,
    };
  }
}
