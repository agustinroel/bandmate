import { Injectable } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../core/supabase/supabase.client';

export type ProfileRow = {
  id: string; // uuid = auth.users.id
  username: string | null;
  about: string | null;
  instruments: string[];
  genres: string[];
  sings: boolean;
  chord_default_instrument: string; // 'guitar' | 'piano' | ...
  public_profile: boolean;
  updated_at?: string | null;
  created_at?: string | null;
};

type UpsertProfileInput = Pick<
  ProfileRow,
  | 'id'
  | 'username'
  | 'about'
  | 'instruments'
  | 'genres'
  | 'sings'
  | 'chord_default_instrument'
  | 'public_profile'
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
    if (existing) return this.normalize(existing);

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
      about: null,
      instruments: [],
      genres: [],
      sings: false,
      chord_default_instrument: 'guitar',
      public_profile: true,
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
      public_profile: p.public_profile ?? true,
    };
  }
}
