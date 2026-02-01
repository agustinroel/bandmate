import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ProfileRow, ProfilesService } from '../../services/profile.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

type Draft = {
  username: string;
  about: string;
  instruments: string[];
  genres: string[];
  sings: boolean;
  chordDefaultInstrument: string;
  publicProfile: boolean;
};

const INSTRUMENT_OPTIONS = [
  'Guitar',
  'Acoustic Guitar',
  'Electric Guitar',
  'Piano',
  'Keyboard',
  'Bass',
  'Drums',
  'Ukulele',
  'Violin',
  'Saxophone',
  'Trumpet',
  'Cello',
  'Flute',
] as const;

const GENRE_OPTIONS = [
  'Rock',
  'Pop',
  'Indie',
  'Alternative',
  'Metal',
  'Punk',
  'Jazz',
  'Blues',
  'Funk',
  'Soul',
  'R&B',
  'Hip-Hop',
  'Electronic',
  'Folk',
  'Classical',
  'Latin',
  'Reggae',
] as const;

const CHORD_INSTRUMENT_OPTIONS = [
  { id: 'guitar', label: 'Guitar' },
  { id: 'piano', label: 'Piano' },
  { id: 'ukulele', label: 'Ukulele' },
] as const;

function normalizeUsername(v: string): string {
  return (v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_');
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePageComponent {
  readonly auth = inject(AuthStore);
  readonly profiles = inject(ProfilesService);
  readonly notify = inject(NotificationsService);

  readonly instrumentOptions = INSTRUMENT_OPTIONS;
  readonly genreOptions = GENRE_OPTIONS;
  readonly chordInstrumentOptions = CHORD_INSTRUMENT_OPTIONS;

  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly error = signal<string>('');

  readonly profile = signal<ProfileRow | null>(null);
  readonly draft = signal<Draft | null>(null);

  readonly nowYear = new Date().getFullYear();

  readonly user = computed(() => this.auth.user());
  readonly displayName = computed(() => {
    const u = this.user();
    const name = (u?.user_metadata as any)?.full_name || (u?.user_metadata as any)?.name;
    return name || '—';
  });

  readonly email = computed(() => this.user()?.email ?? '—');
  readonly avatarUrl = computed(() => {
    const u = this.user();
    const url = (u?.user_metadata as any)?.avatar_url || (u?.user_metadata as any)?.picture || null;
    return url;
  });

  readonly username = computed(() => this.draft()?.username ?? '');
  readonly publicProfileUrl = computed(() => {
    const uname = this.username();
    if (!uname) return '';
    // Link pro (y futuro social)
    return new URL(`/u/${uname}`, window.location.origin).toString();
  });

  readonly isDirty = computed(() => {
    const p = this.profile();
    const d = this.draft();
    if (!p || !d) return false;

    const sameArr = (a: string[], b: string[]) =>
      a.length === b.length && a.every((x, i) => x === b[i]);

    return !(
      (p.username ?? '') === d.username &&
      (p.about ?? '') === d.about &&
      sameArr((p.instruments ?? []).slice().sort(), d.instruments.slice().sort()) &&
      sameArr((p.genres ?? []).slice().sort(), d.genres.slice().sort()) &&
      !!p.sings === !!d.sings &&
      (p.chord_default_instrument ?? 'guitar') === d.chordDefaultInstrument &&
      (p.public_profile ?? true) === d.publicProfile
    );
  });

  readonly usernameError = computed(() => {
    const u = this.username();
    if (!u) return 'Username is required';
    if (u.length < 3 || u.length > 24) return '3–24 chars';
    if (!/^[a-z0-9_]+$/.test(u)) return 'Letters, numbers or underscore';
    return '';
  });

  readonly canSave = computed(
    () => this.state() === 'ready' && this.isDirty() && !this.usernameError(),
  );

  constructor() {
    effect(() => {
      const u = this.user();
      if (!u) return;

      // load once when authed
      if (this.state() === 'idle') {
        void this.load();
      }
    });
  }

  async load() {
    const u = this.user();
    if (!u) return;

    this.state.set('loading');
    this.error.set('');

    try {
      const p = await this.profiles.ensureForUser(u);
      this.profile.set(p);

      this.draft.set({
        username: p.username ?? '',
        about: p.about ?? '',
        instruments: (p.instruments ?? []).slice(),
        genres: (p.genres ?? []).slice(),
        sings: !!p.sings,
        chordDefaultInstrument: p.chord_default_instrument ?? 'guitar',
        publicProfile: p.public_profile ?? true,
      });

      this.state.set('ready');
    } catch (e: any) {
      this.state.set('error');
      this.error.set(e?.message ?? 'Could not load profile');
    }
  }

  reset() {
    const p = this.profile();
    if (!p) return;
    this.draft.set({
      username: p.username ?? '',
      about: p.about ?? '',
      instruments: (p.instruments ?? []).slice(),
      genres: (p.genres ?? []).slice(),
      sings: !!p.sings,
      chordDefaultInstrument: p.chord_default_instrument ?? 'guitar',
      publicProfile: p.public_profile ?? true,
    });
    this.notify.info('Changes reverted', 'OK', 1200);
  }

  setUsername(value: string) {
    const next = normalizeUsername(value);
    this.draft.update((d) => (d ? { ...d, username: next } : d));
  }

  setAbout(value: string) {
    this.draft.update((d) => (d ? { ...d, about: value } : d));
  }

  setInstruments(value: string[]) {
    // catálogo cerrado: filtramos por whitelist por seguridad extra
    const allowed = new Set(this.instrumentOptions as unknown as string[]);
    const clean = (value ?? []).filter((x) => allowed.has(x));
    this.draft.update((d) => (d ? { ...d, instruments: clean } : d));
  }

  removeInstrument(name: string) {
    this.draft.update((d) =>
      d ? { ...d, instruments: d.instruments.filter((x) => x !== name) } : d,
    );
  }

  setGenres(value: string[]) {
    const allowed = new Set(this.genreOptions as unknown as string[]);
    const clean = (value ?? []).filter((x) => allowed.has(x));
    this.draft.update((d) => (d ? { ...d, genres: clean } : d));
  }

  removeGenre(name: string) {
    this.draft.update((d) => (d ? { ...d, genres: d.genres.filter((x) => x !== name) } : d));
  }

  toggleSings(v: boolean) {
    this.draft.update((d) => (d ? { ...d, sings: !!v } : d));
  }

  setChordDefaultInstrument(v: string) {
    const ok = this.chordInstrumentOptions.some((x) => x.id === v);
    this.draft.update((d) => (d ? { ...d, chordDefaultInstrument: ok ? v : 'guitar' } : d));
  }

  togglePublicProfile(v: boolean) {
    this.draft.update((d) => (d ? { ...d, publicProfile: !!v } : d));
  }

  async copyPublicUrl() {
    const url = this.publicProfileUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.notify.success('Profile link copied', 'OK', 1400);
    } catch {
      // fallback básico
      this.notify.warn('Could not copy automatically. Select and copy manually.', 'OK', 2200);
    }
  }

  async save() {
    const u = this.user();
    const d = this.draft();
    if (!u || !d) return;
    if (this.usernameError()) return;

    this.state.set('loading');

    try {
      const updated = await this.profiles.upsert({
        id: u.id,
        username: d.username,
        about: d.about || null,
        instruments: d.instruments ?? [],
        genres: d.genres ?? [],
        sings: !!d.sings,
        chord_default_instrument: d.chordDefaultInstrument || 'guitar',
        public_profile: d.publicProfile ?? true,
      });

      this.profile.set(updated);
      this.state.set('ready');
      this.notify.success('Profile updated', 'OK', 1600);
    } catch (e: any) {
      this.state.set('ready');
      this.notify.error(e?.message ?? 'Could not save profile', 'OK', 2600);
    }
  }
}
