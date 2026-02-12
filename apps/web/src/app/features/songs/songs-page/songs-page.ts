import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { SongsStore } from '../state/songs-store';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { NgClass, DatePipe } from '@angular/common';
import { useSkeletonUx } from '../../../shared/utils/skeleton-ux';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';
import { SongPolicy } from '@bandmate/shared';
import { LibraryWorkCardComponent } from '../../library/ui/library-work-card';
import { FirstRunHeroComponent } from '../../../shared/ui/first-run-hero/first-run-hero';
import { AnimationService } from '../../../core/services/animation.service';

/** ---- Types ---- */
type SongsSort =
  | 'updatedDesc'
  | 'updatedAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'artistAsc'
  | 'artistDesc';

type SongFilters = {
  artist: string | null;
  key: string | null;
  genre: string | null; // futuro
};

/** ---- Persist ---- */
type SongsListPrefs = {
  v: 1;
  q: string;
  filters: SongFilters;
  sort: SongsSort;
};

const SONGS_PREFS_KEY = 'bm.songs.list.prefs.v1';

function safeReadPrefs(): SongsListPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SONGS_PREFS_KEY);
    if (!raw) return null;

    const obj = JSON.parse(raw);
    if (!obj || obj.v !== 1) return null;

    const sort: SongsSort =
      obj.sort === 'updatedDesc' ||
      obj.sort === 'updatedAsc' ||
      obj.sort === 'titleAsc' ||
      obj.sort === 'titleDesc' ||
      obj.sort === 'artistAsc' ||
      obj.sort === 'artistDesc'
        ? obj.sort
        : 'updatedDesc';

    const filters: SongFilters = {
      artist: typeof obj?.filters?.artist === 'string' ? obj.filters.artist : null,
      key: typeof obj?.filters?.key === 'string' ? obj.filters.key : null,
      genre: typeof obj?.filters?.genre === 'string' ? obj.filters.genre : null,
    };

    return {
      v: 1,
      q: typeof obj.q === 'string' ? obj.q : '',
      filters,
      sort,
    };
  } catch {
    return null;
  }
}

function safeWritePrefs(prefs: SongsListPrefs | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!prefs) {
      localStorage.removeItem(SONGS_PREFS_KEY);
      return;
    }
    localStorage.setItem(SONGS_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgClass,
    DatePipe,
    LibraryWorkCardComponent,
    FirstRunHeroComponent,
  ],
  templateUrl: './songs-page.html',
  styleUrl: './songs-page.scss',
})
export class SongsPageComponent {
  readonly store = inject(SongsStore);
  readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  readonly animation = inject(AnimationService);

  readonly notify = inject(NotificationsService);

  SongPolicy = SongPolicy;

  /** UI state */
  readonly query = signal('');
  readonly filters = signal<SongFilters>({
    artist: null,
    key: null,
    genre: null,
  });
  readonly sort = signal<SongsSort>('updatedDesc');

  readonly filtersOpen = signal(false);

  readonly activeFiltersCount = computed(() => {
    const f = this.filters();
    let n = 0;
    if (this.query().trim()) n++;
    if (f.artist) n++;
    if (f.key) n++;
    if (f.genre) n++;
    if (this.sort() !== 'updatedDesc') n++;
    return n;
  });

  /** Loading */
  readonly isLoading = useSkeletonUx({
    isActive: computed(() => true),
    isLoading: computed(() => {
      const st = this.store.state();
      return st === 'loading' || st === 'idle';
    }),
    showDelayMs: 120,
    minVisibleMs: 280,
  });

  readonly isError = computed(() => this.store.state() === 'error');
  readonly isReady = computed(() => this.store.state() === 'ready');

  /** ✅ Grouped result used by the template */
  readonly grouped = computed(() => {
    const list = this.filtered();
    const mine = list.filter((s) => !s.isSeed);

    return {
      mine: this.sortSongs(mine),
      hasMine: mine.length > 0,
    };
  });

  readonly libraryWorks = computed(() => {
    if (this.store.libraryState() !== 'ready') return [];

    const q = this.query().trim().toLowerCase();
    const f = this.filters();

    let list = this.store.library();

    if (q) {
      list = list.filter((w) => `${w.title} ${w.artist}`.toLowerCase().includes(q));
    }

    if (f.artist) {
      list = list.filter((w) => (w.artist ?? '').trim() === f.artist);
    }

    // library works usually dont have 'key' at the top level in the store yet,
    // but if they do, we filter it.
    if (f.key) {
      list = list.filter((w) => ((w as any).key ?? '').trim() === f.key);
    }

    if (f.genre) {
      list = list.filter((w) => ((w as any).genre ?? '').trim() === f.genre);
    }

    return list.slice().sort((a, b) => {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  });

  /** Options */
  readonly artistOptions = computed(() => {
    const set = new Set<string>();
    for (const s of this.store.songs()) {
      const a = (s.artist ?? '').trim();
      if (a) set.add(a);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  readonly keyOptions = computed(() => {
    const set = new Set<string>();
    for (const s of this.store.songs()) {
      const k = (s.key ?? '').toString().trim();
      if (k) set.add(k);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  readonly genreOptions = computed(() => {
    const predefined = [
      'Rock',
      'Pop',
      'Jazz',
      'Blues',
      'Metal',
      'Country',
      'Folk',
      'Electronic',
      'Latin',
      'Reggae',
      'Classic Rock',
    ];
    const set = new Set<string>(predefined);

    // Get genres from library works
    for (const w of this.libraryWorks()) {
      const g = ((w as any).genre ?? '').trim();
      if (g) set.add(g);
    }
    // Also from user songs
    for (const s of this.store.songs()) {
      const g = ((s as any).genre ?? '').trim();
      if (g) set.add(g);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  /** Filtering */
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filters();

    let list = this.store.songs();

    if (q) {
      list = list.filter((s) => `${s.title} ${s.artist} ${s.key ?? ''}`.toLowerCase().includes(q));
    }

    if (f.artist) {
      list = list.filter((s) => (s.artist ?? '').trim() === f.artist);
    }

    if (f.key) {
      list = list.filter((s) => ((s.key ?? '') + '').trim() === f.key);
    }

    if (f.genre) {
      list = list.filter((s) => ((s as any).genre ?? '').trim() === f.genre);
    }

    return list;
  });

  readonly isEmpty = computed(
    () => this.isReady() && this.store.count() === 0 && !this.query().trim(),
  );

  readonly hasAnythingToShow = computed(() => {
    const hasMine = this.grouped().mine.length > 0;
    const hasLibrary = this.libraryWorks().length > 0;
    return hasMine || hasLibrary;
  });

  readonly isNoResults = computed(() => {
    return this.isReady() && this.hasActiveFilters() && !this.hasAnythingToShow();
  });

  readonly isSearchingExternal = signal(false);

  searchExternal() {
    this.isSearchingExternal.set(true);
    this.store.searchExternal(this.query());
  }

  ingest(match: any) {
    this.store.ingestAndOpen(match.id);
  }

  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return (
      !!this.query().trim() || !!f.artist || !!f.key || !!f.genre || this.sort() !== 'updatedDesc'
    );
  });

  readonly showFirstRun = computed(() => {
    if (!this.isReady()) return false;

    // first-run solo cuando no estás filtrando/buscando
    if (this.hasActiveFilters()) return false;

    // no tenés canciones tuyas
    return this.grouped().mine.length === 0;
  });

  readonly isTotallyEmpty = computed(() => {
    // “Empty state” solo si no hay nada tuyo Y tampoco hay library para mostrar
    if (!this.isReady()) return false;
    if (this.hasActiveFilters()) return false;

    const mineEmpty = this.grouped().mine.length === 0;
    const libraryEmpty = this.libraryWorks().length === 0;

    return mineEmpty && libraryEmpty;
  });

  constructor() {
    //0) Estado de los filtros en desktop y mobile
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(min-width: 720px)');
      this.filtersOpen.set(mq.matches);
      mq.addEventListener?.('change', (e) => this.filtersOpen.set(e.matches));
    }

    // 1) Restore prefs (ANTES de empezar a persistir)
    const saved = safeReadPrefs();
    if (saved) {
      // untracked para evitar que dispare effects durante init
      untracked(() => {
        this.query.set(saved.q ?? '');
        this.filters.set(saved.filters ?? { artist: null, key: null, genre: null });
        this.sort.set(saved.sort ?? 'updatedDesc');
      });
    }

    // 2) Load data

    effect(() => {
      if (this.store.state() === 'idle') this.store.load();
    });

    effect(() => {
      if (this.store.libraryState() === 'idle') {
        this.store.loadLibrary();
      }
    });

    // 3) Limpia whitespace raro en query
    effect(() => {
      const q = this.query();
      if (q && !q.trim()) this.query.set('');
    });

    // 4) Persist prefs
    effect(() => {
      const prefs: SongsListPrefs = {
        v: 1,
        q: this.query(),
        filters: this.filters(),
        sort: this.sort(),
      };

      const isDefault =
        prefs.q.trim() === '' &&
        !prefs.filters.artist &&
        !prefs.filters.key &&
        !prefs.filters.genre &&
        prefs.sort === 'updatedDesc';

      safeWritePrefs(isDefault ? null : prefs);
    });

    // 5) Animate list on first load only (avoid re-triggering on filter/sort changes)
    let songsAnimated = false;
    effect(() => {
      const mine = this.grouped().mine;
      const library = this.libraryWorks();
      const ready = this.isReady();

      if (ready && !songsAnimated) {
        songsAnimated = true;
        // Delay to allow DOM to catch up
        setTimeout(() => {
          // 1. Static elements
          const head = document.querySelector('.songs-head');
          const search = document.querySelector('.mt-3 mat-form-field');
          const filters = document.querySelector('.bm-filters');
          const sections = document.querySelectorAll('.bm-section-head');

          if (head) this.animation.fadeIn(head, 0);
          if (search) this.animation.slideUp(search, 0.05);
          if (filters) this.animation.slideUp(filters, 0.1);
          if (sections.length) this.animation.staggerList(Array.from(sections), 0.1, 0.15);

          // 2. Dynamic cards
          const cards = document.querySelectorAll('.song-card-item');
          if (cards.length > 0) {
            this.animation.staggerList(Array.from(cards), 0.04, 0.2);
          }

          // 3. Magic Promo
          const promo = document.querySelector('.magic-search-promo');
          if (promo) this.animation.slideUp(promo, 0.3);
        }, 150);
      }
    });
  }

  /** Filter setters */
  setArtist(value: string | null) {
    this.filters.update((f) => ({ ...f, artist: value || null }));
  }

  setKey(value: string | null) {
    this.filters.update((f) => ({ ...f, key: value || null }));
  }

  setGenre(value: string | null) {
    this.filters.update((f) => ({ ...f, genre: value || null }));
  }

  clearFilters() {
    this.filters.set({ artist: null, key: null, genre: null });
    this.sort.set('updatedDesc');
  }

  clearAllSearchAndFilters() {
    this.query.set('');
    this.clearFilters();
  }

  /** Routing */
  goNew() {
    this.router.navigate(['/songs/new']);
  }

  goEdit(id: string) {
    this.router.navigate(['/songs', id]);
  }

  goSpotify() {
    // Redirect to the backend spotify login
    const apiUrl = 'http://localhost:3000'; // Should be dynamic
    window.location.href = `${apiUrl}/auth/spotify/login`;
  }

  /** Delete */
  askDelete(id: string, title: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete song',
        message: `Delete "${title}"? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.store.remove(id).subscribe({
        next: () => this.notify.success('Song deleted', 'OK', 2000),
        error: () => this.notify.error('Could not delete song', 'OK', 3000),
      });
    });
  }

  durationLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const totalSeconds = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  keyClass(key: string): string {
    const k = (key || '').trim().toUpperCase();
    const isMinor = /M$/.test(k) && !/MAJ$/.test(k);
    const root = k.match(/^[A-G](#|B)?/)?.[0] ?? k;
    const normRoot = root.replace('BB', 'B');

    const map: Record<string, string> = {
      C: 'key-c',
      'C#': 'key-cs',
      DB: 'key-cs',
      D: 'key-d',
      'D#': 'key-ds',
      EB: 'key-ds',
      E: 'key-e',
      F: 'key-f',
      'F#': 'key-fs',
      GB: 'key-fs',
      G: 'key-g',
      'G#': 'key-gs',
      AB: 'key-gs',
      A: 'key-a',
      'A#': 'key-as',
      BB: 'key-as',
      B: 'key-b',
    };

    const base = map[normRoot] ?? 'key-other';
    return isMinor ? `${base} key-minor` : `${base} key-major`;
  }

  onCardKeyDown(ev: KeyboardEvent, id: string) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.goEdit(id);
    }
  }

  scrollToLibrary() {
    if (typeof window === 'undefined') return;

    const el = document.getElementById('bm-library-anchor');
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Sorting helper (reusable for both groups) */
  private sortSongs(list: any[]) {
    const cmpStr = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

    const normalize = (v: unknown) =>
      String(v ?? '')
        .trim()
        .toLowerCase();
    const parseTime = (v: unknown) => {
      const t = Date.parse(String(v ?? ''));
      return Number.isFinite(t) ? t : 0;
    };

    const sorted = list.slice();

    sorted.sort((a, b) => {
      switch (this.sort()) {
        case 'updatedDesc':
          return parseTime(b.updatedAt) - parseTime(a.updatedAt);
        case 'updatedAsc':
          return parseTime(a.updatedAt) - parseTime(b.updatedAt);
        case 'titleAsc':
          return cmpStr(normalize(a.title), normalize(b.title));
        case 'titleDesc':
          return cmpStr(normalize(b.title), normalize(a.title));
        case 'artistAsc':
          return cmpStr(normalize(a.artist), normalize(b.artist));
        case 'artistDesc':
          return cmpStr(normalize(b.artist), normalize(a.artist));
        default:
          return 0;
      }
    });

    return sorted;
  }

  ratingLabel(avg?: number | null, count?: number | null) {
    const a = Number(avg ?? 0);
    const c = Number(count ?? 0);
    if (!c) return 'Not rated yet';
    return `${a.toFixed(1)} (${c})`;
  }

  starsFill(avg?: number | null) {
    const a = Math.max(0, Math.min(5, Number(avg ?? 0)));
    return Math.round(a * 2) / 2; // a 0.5
  }

  starKind(i: number, avg?: number | null): 'full' | 'half' | 'empty' {
    const a = this.starsFill(avg);
    const n = i + 1;
    if (a >= n) return 'full';
    if (a >= n - 0.5) return 'half';
    return 'empty';
  }

  onRateClick(ev: Event, songId: string, value: number) {
    ev.preventDefault();
    ev.stopPropagation();

    if (!value) return;

    const s = this.store.songs().find((x) => x.id === songId);
    if (!s?.isSeed) return; // por ahora solo Library

    this.store.rateSong(songId, value).subscribe({
      next: () => this.notify.success(`Rated ${value}★`, 'OK', 1200),
      error: () => this.notify.error('Could not save rating', 'OK', 2200),
    });
  }

  onRateKeydown(ev: KeyboardEvent, songId: string) {
    // evita que Enter/Espacio abran la card
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      ev.stopPropagation();
      // opcional: abrir dialog de rating con teclado
    }
  }
}
