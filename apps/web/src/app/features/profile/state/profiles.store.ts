import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import type { Profile, ProfileDraft } from '../profile.types';
import { AuthStore } from '../../../core/auth/auth.store';
import { supabase } from '../../../core/supabase/supabase.client';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'error';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

function normalizeInstrument(v: string) {
  return v.trim().replace(/\s+/g, ' ');
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly auth = inject(AuthStore);

  readonly loadState = signal<LoadState>('idle');
  readonly saveState = signal<SaveState>('idle');
  readonly error = signal<string | null>(null);

  readonly profile = signal<Profile | null>(null);

  // draft editable
  readonly draft = signal<ProfileDraft>({
    username: '',
    bio: '',
    instruments: [],
    preferences: {},
    push_enabled: false,
    is_public: true,
  });

  readonly user = computed(() => this.auth.user());
  readonly isAuthed = computed(() => this.auth.isAuthed());

  readonly readonlyInfo = computed(() => {
    const u = this.user();
    return {
      displayName:
        (u?.user_metadata as any)?.full_name ?? (u?.user_metadata as any)?.name ?? u?.email ?? '—',
      email: u?.email ?? '—',
      avatarUrl: (u?.user_metadata as any)?.avatar_url ?? null,
    };
  });

  readonly isReady = computed(() => this.loadState() === 'ready');
  readonly isLoading = computed(() => this.loadState() === 'loading');
  readonly isSaving = computed(() => this.saveState() === 'saving');

  readonly usernameError = computed(() => {
    const v = this.draft().username.trim();
    if (!v) return null; // opcional
    if (!USERNAME_RE.test(v)) return 'Use 3–24 chars: letters, numbers or underscore';
    return null;
  });

  readonly bioCount = computed(() => this.draft().bio.length);

  readonly isDirty = computed(() => {
    const p = this.profile();
    const d = this.draft();
    if (!p) return false;

    const same =
      (p.username ?? '') === d.username.trim() &&
      (p.bio ?? '') === d.bio.trim() &&
      JSON.stringify(p.instruments ?? []) === JSON.stringify(d.instruments ?? []) &&
      JSON.stringify(p.preferences ?? {}) === JSON.stringify(d.preferences ?? {}) &&
      !!p.push_enabled === !!d.push_enabled &&
      !!p.is_public === !!d.is_public;

    return !same;
  });

  readonly canSave = computed(() => {
    if (!this.isReady()) return false;
    if (this.isSaving()) return false;
    if (!this.isDirty()) return false;
    if (this.usernameError()) return false;
    if (this.draft().bio.length > 280) return false; // estándar "mini bio"
    return true;
  });

  constructor() {
    // cuando se autentica, load profile 1 vez
    effect(() => {
      const u = this.user();
      if (!u) {
        this.profile.set(null);
        this.loadState.set('idle');
        this.error.set(null);
        return;
      }

      // si ya está cargando/ready, no repitas
      if (this.loadState() === 'idle') {
        this.loadMyProfile();
      }
    });
  }

  async loadMyProfile() {
    const u = this.user();
    if (!u) return;

    this.loadState.set('loading');
    this.error.set(null);

    try {
      const id = u.id;

      // 1) Intentar traer el profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      // 2) Si no existe, crearlo con defaults del provider
      const created = data ?? (await this.createProfileFromAuth());

      this.profile.set(created);

      // 3) Sync draft
      untracked(() => this.syncDraftFromProfile(created));

      this.loadState.set('ready');
    } catch (e: any) {
      this.loadState.set('error');
      this.error.set(e?.message ?? 'Could not load profile');
    }
  }

  private async createProfileFromAuth(): Promise<Profile> {
    const u = this.user();
    if (!u) throw new Error('No user');

    const displayName =
      (u.user_metadata as any)?.full_name ?? (u.user_metadata as any)?.name ?? null;

    const avatarUrl = (u.user_metadata as any)?.avatar_url ?? null;

    const baseUsername = this.suggestUsername(displayName ?? u.email ?? 'user');

    const payload = {
      id: u.id,
      username: baseUsername,
      display_name: displayName,
      avatar_url: avatarUrl,
      bio: null,
      instruments: [],
      preferences: {},
      push_enabled: false,
      is_public: true,
    };

    // Ojo: username es unique, podría chocar. Si choca, lo dejamos null y el usuario elige.
    const { data, error } = await supabase.from('profiles').insert(payload).select('*').single();

    if (!error) return data as Profile;

    // fallback si choca username u otra constraint
    const { data: data2, error: error2 } = await supabase
      .from('profiles')
      .insert({ ...payload, username: null })
      .select('*')
      .single();

    if (error2) throw error2;
    return data2 as Profile;
  }

  private suggestUsername(seed: string): string {
    const s = String(seed ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);

    const fallback = 'user_' + Math.random().toString(36).slice(2, 8);
    const candidate = s.length >= 3 ? s : fallback;
    return candidate.slice(0, 24);
  }

  private syncDraftFromProfile(p: Profile) {
    this.draft.set({
      username: (p.username ?? '').trim(),
      bio: (p.bio ?? '').trim(),
      instruments: Array.isArray(p.instruments) ? p.instruments : [],
      preferences: (p.preferences ?? {}) as Record<string, unknown>,
      push_enabled: !!p.push_enabled,
      is_public: p.is_public ?? true,
    });
  }

  setUsername(v: string) {
    this.draft.update((d) => ({ ...d, username: v }));
  }

  setBio(v: string) {
    this.draft.update((d) => ({ ...d, bio: v }));
  }

  setPushEnabled(v: boolean) {
    this.draft.update((d) => ({ ...d, push_enabled: v }));
  }

  setPublic(v: boolean) {
    this.draft.update((d) => ({ ...d, is_public: v }));
  }

  addInstrument(raw: string) {
    const v = normalizeInstrument(raw);
    if (!v) return;

    this.draft.update((d) => ({
      ...d,
      instruments: uniq([...d.instruments, v]).slice(0, 12), // limit razonable
    }));
  }

  removeInstrument(value: string) {
    this.draft.update((d) => ({
      ...d,
      instruments: d.instruments.filter((x) => x !== value),
    }));
  }

  resetDraft() {
    const p = this.profile();
    if (!p) return;
    this.syncDraftFromProfile(p);
  }

  async save() {
    const p = this.profile();
    const u = this.user();
    if (!p || !u) return;

    if (this.usernameError()) {
      this.saveState.set('error');
      return;
    }

    this.saveState.set('saving');
    this.error.set(null);

    try {
      const d = this.draft();
      const patch = {
        username: d.username.trim() || null,
        bio: d.bio.trim() || null,
        instruments: d.instruments,
        preferences: d.preferences,
        push_enabled: !!d.push_enabled,
        is_public: !!d.is_public,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', u.id)
        .select('*')
        .single();

      if (error) throw error;

      this.profile.set(data as Profile);
      untracked(() => this.syncDraftFromProfile(data as Profile));

      this.saveState.set('idle');
      return data as Profile;
    } catch (e: any) {
      this.saveState.set('error');
      this.error.set(e?.message ?? 'Could not save profile');
      throw e;
    }
  }
}
