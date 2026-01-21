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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { NgClass, DatePipe } from '@angular/common';
import { useSkeletonUx } from '../../../shared/utils/skeleton-ux';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';
import { SongPolicy } from '@bandmate/shared';

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
    NgClass,
    DatePipe,
  ],
  template: `
    <div class="d-flex align-items-start gap-3 mb-3">
      <div class="bm-mark" aria-hidden="true">
        <mat-icon>library_music</mat-icon>
      </div>
      <div class="flex-grow-1">
        <h2 class="m-0">Songs</h2>
        <div class="small opacity-75">{{ store.count() }} total</div>
      </div>

      <button mat-raised-button color="primary" (click)="goNew()">
        <mat-icon class="me-1">add</mat-icon>
        Add song
      </button>
    </div>

    <!-- Search -->
    <div class="mt-3">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Search</mat-label>
        <mat-icon matPrefix class="me-2">search</mat-icon>

        <input
          matInput
          [value]="query()"
          (input)="query.set($any($event.target).value)"
          placeholder="Title, artist or key"
        />

        @if (query()) {
          <button mat-icon-button matSuffix (click)="query.set('')" aria-label="Clear">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>
    </div>

    <!-- Advanced filters -->
    <div class="bm-filters">
      <div class="bm-filters-head">
        <div class="bm-filters-title">Filters</div>

        @if (hasActiveFilters()) {
          <button mat-stroked-button type="button" class="bm-clear" (click)="clearFilters()">
            <mat-icon class="me-1">close</mat-icon>
            Clear
          </button>
        }
      </div>

      <div class="bm-filters-row">
        <mat-form-field appearance="outline" class="bm-field">
          <mat-label>Artist</mat-label>
          <mat-select [value]="filters().artist" (selectionChange)="setArtist($event.value)">
            <mat-option [value]="null">All artists</mat-option>
            @for (a of artistOptions(); track a) {
              <mat-option [value]="a">{{ a }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="bm-field">
          <mat-label>Key</mat-label>
          <mat-select [value]="filters().key" (selectionChange)="setKey($event.value)">
            <mat-option [value]="null">All keys</mat-option>
            @for (k of keyOptions(); track k) {
              <mat-option [value]="k">{{ k }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Sort</mat-label>
          <mat-select [value]="sort()" (selectionChange)="sort.set($event.value)">
            <mat-option value="updatedDesc">Recently updated</mat-option>
            <mat-option value="updatedAsc">Oldest updated</mat-option>
            <mat-option value="titleAsc">Title A–Z</mat-option>
            <mat-option value="titleDesc">Title Z–A</mat-option>
            <mat-option value="artistAsc">Artist A–Z</mat-option>
            <mat-option value="artistDesc">Artist Z–A</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Futuro: genre -->
        <mat-form-field appearance="outline" class="bm-field bm-field--disabled">
          <mat-label>Genre</mat-label>
          <mat-select [disabled]="true">
            <mat-option>Coming soon</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    @if (isLoading()) {
      <div class="songs-grid">
        @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
          <mat-card class="song-card song-card--skeleton">
            <div class="sk-title"></div>
            <div class="sk-artist"></div>
            <div class="sk-row">
              <span class="sk-pill"></span>
              <span class="sk-pill"></span>
            </div>
            <div class="sk-updated"></div>
          </mat-card>
        }
      </div>
    }

    @if (isError()) {
      <div class="alert alert-danger mt-2 d-flex align-items-center justify-content-between gap-2">
        <span>{{ store.error() }}</span>
        <button mat-stroked-button (click)="store.load()">
          <mat-icon class="me-1">refresh</mat-icon>
          Retry
        </button>
      </div>
    }

    @if (!isLoading() && isEmpty()) {
      <div class="text-center py-5">
        <mat-icon style="font-size: 48px; height: 48px; width: 48px" class="opacity-50">
          queue_music
        </mat-icon>

        <div class="mt-2 fw-semibold">No songs yet</div>

        <div class="small opacity-75 mb-3">
          Add your first song and start building your rehearsal library.
        </div>

        <button mat-stroked-button color="primary" (click)="goNew()">Add your first song</button>
      </div>
    } @else if (!isLoading() && isNoResults()) {
      <div class="text-center py-5">
        <mat-icon style="font-size: 48px; height: 48px; width: 48px" class="opacity-50">
          search_off
        </mat-icon>

        <div class="mt-2 fw-semibold">No results</div>

        <div class="small opacity-75 mb-3">Try a different search, or clear filters.</div>

        <div class="d-inline-flex gap-2 flex-wrap justify-content-center">
          <button mat-stroked-button type="button" (click)="clearAllSearchAndFilters()">
            <mat-icon class="me-1">close</mat-icon>
            Clear all
          </button>

          <button mat-flat-button color="primary" (click)="goNew()">
            <mat-icon class="me-1">add</mat-icon>
            Add song
          </button>
        </div>
      </div>
    } @else if (grouped().hasAny) {
      <!-- ========================= -->
      <!-- YOUR SONGS -->
      <!-- ========================= -->
      @if (grouped().mine.length > 0) {
        <div class="bm-section-head">
          <div class="bm-section-title">Your songs</div>
          <div class="bm-section-sub small opacity-75">{{ grouped().mine.length }} songs</div>
        </div>

        <div class="songs-grid">
          @for (s of grouped().mine; track s.id) {
            <mat-card
              class="song-card"
              tabindex="0"
              role="button"
              (keydown)="onCardKeyDown($event, s.id)"
              (click)="goEdit(s.id)"
            >
              <div class="song-top">
                <div class="song-main">
                  <div class="song-title-row">
                    <div class="song-title" [title]="s.title">{{ s.title }}</div>

                    @if (s.key) {
                      <span class="bm-pill bm-pill--key" [ngClass]="keyClass(s.key)">
                        Key {{ s.key }}
                      </span>
                    }
                  </div>

                  <div class="song-artist" [title]="s.artist">{{ s.artist }}</div>
                </div>

                <div class="song-actions">
                  @if (SongPolicy.canDelete(s)) {
                    <button
                      class="song-del"
                      mat-icon-button
                      (click)="askDelete(s.id, s.title); $event.stopPropagation()"
                      matTooltip="Delete"
                      aria-label="Delete"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
              </div>

              @if (s.bpm || durationLabel(s.durationSec)) {
                <div class="song-meta">
                  @if (s.bpm) {
                    <span class="bm-pill">
                      <mat-icon class="pill-ic">speed</mat-icon>
                      <span>{{ s.bpm }} BPM</span>
                    </span>
                  }

                  @if (durationLabel(s.durationSec)) {
                    <span class="bm-pill">
                      <mat-icon class="pill-ic">schedule</mat-icon>
                      <span>{{ durationLabel(s.durationSec) }}</span>
                    </span>
                  }
                </div>
              }

              <div class="song-updated opacity-75">
                <mat-icon class="updated-ic">history</mat-icon>
                Updated: {{ s.updatedAt | date: 'MMM d, y' }}
              </div>
            </mat-card>
          }
        </div>
      }

      <!-- Divider -->
      @if (grouped().mine.length > 0 && grouped().library.length > 0) {
        <div class="bm-section-sep"></div>
      }

      <!-- ========================= -->
      <!-- LIBRARY (SEED SONGS) -->
      <!-- ========================= -->
      @if (grouped().library.length > 0) {
        <div class="bm-section-head">
          <div class="bm-section-title">Library</div>
          <div class="bm-section-sub small opacity-75">{{ grouped().library.length }} songs</div>
        </div>

        <div class="songs-grid">
          @for (s of grouped().library; track s.id) {
            <mat-card
              class="song-card song-card--seed"
              tabindex="0"
              role="button"
              (keydown)="onCardKeyDown($event, s.id)"
              (click)="goEdit(s.id)"
            >
              <div class="song-top">
                <div class="song-main">
                  <div class="song-title-row">
                    <div class="song-title" [title]="s.title">{{ s.title }}</div>

                    <span class="bm-seed-pill">Library</span>

                    @if (s.key) {
                      <span class="bm-pill bm-pill--key" [ngClass]="keyClass(s.key)">
                        Key {{ s.key }}
                      </span>
                    }
                  </div>

                  <div class="song-artist" [title]="s.artist">{{ s.artist }}</div>
                </div>

                <!-- 🚫 No delete button for library songs -->
              </div>

              @if (s.bpm || durationLabel(s.durationSec)) {
                <div class="song-meta">
                  @if (s.bpm) {
                    <span class="bm-pill">
                      <mat-icon class="pill-ic">speed</mat-icon>
                      <span>{{ s.bpm }} BPM</span>
                    </span>
                  }

                  @if (durationLabel(s.durationSec)) {
                    <span class="bm-pill">
                      <mat-icon class="pill-ic">schedule</mat-icon>
                      <span>{{ durationLabel(s.durationSec) }}</span>
                    </span>
                  }
                </div>
              }

              <div class="song-updated opacity-75">
                <mat-icon class="updated-ic">history</mat-icon>
                Updated: {{ s.updatedAt | date: 'MMM d, y' }}
              </div>
            </mat-card>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      /* --- Filters --- */
      .bm-filters {
        margin-top: 10px;
        padding: 12px 12px 4px;
        border-radius: 16px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(0, 0, 0, 0.012);
      }

      .bm-filters-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .bm-filters-title {
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        opacity: 0.55;
        text-transform: uppercase;
      }

      .bm-clear {
        margin-left: auto;
        border-radius: 14px;
        padding: 6px 12px;
      }

      .bm-filters-row {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr;
      }

      @media (min-width: 720px) {
        .bm-filters-row {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
        }
      }

      .bm-field {
        width: 100%;
      }

      .bm-field--disabled {
        opacity: 0.65;
      }

      /* --- GRID --- */
      .songs-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: 1fr;
        margin-top: 14px;
      }

      @media (min-width: 720px) {
        .songs-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
      }

      @media (min-width: 1100px) {
        .songs-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      /* --- CARD --- */
      .song-card {
        cursor: pointer;
        border-radius: 16px;
        overflow: hidden;
        padding: 14px 14px 14px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(0, 0, 0, 0.01);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
        transition:
          transform 120ms ease,
          box-shadow 120ms ease,
          border-color 120ms ease;
      }

      .song-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
        border-color: rgba(0, 0, 0, 0.09);
      }

      .song-card:focus {
        outline: none;
      }

      .song-card:focus-visible {
        outline: 2px solid rgba(201, 162, 39, 0.45);
        outline-offset: 2px;
      }

      .song-card:active {
        transform: translateY(0px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
      }

      .song-del {
        opacity: 0;
        transform: translateY(2px);
        pointer-events: none;
        transition:
          opacity 160ms ease,
          transform 160ms ease,
          background-color 160ms ease,
          box-shadow 160ms ease;
        border-radius: 12px;
      }

      .song-card:hover .song-del,
      .song-card:focus-within .song-del {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .song-del:hover {
        background: rgba(0, 0, 0, 0.05);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      }

      @media (hover: none), (pointer: coarse) {
        .song-del {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
      }

      .song-top {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .song-main {
        min-width: 0;
        flex: 1;
      }

      .song-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .song-title {
        font-weight: 700;
        letter-spacing: -0.01em;
        font-size: 1.05rem;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        flex: 1;
      }

      .song-artist {
        margin-top: 4px;
        opacity: 0.74;
        font-size: 0.95rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      .song-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.9;
      }

      .song-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }

      .bm-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(0, 0, 0, 0.018);
        border-color: rgba(0, 0, 0, 0.07);
        font-weight: 600;
        font-size: 0.85rem;
        line-height: 1;
        white-space: nowrap;
        min-height: 28px;
        box-sizing: border-box;
      }

      .bm-pill--key {
        font-weight: 800;
        border-color: rgba(201, 162, 39, 0.26);
        background: rgba(201, 162, 39, 0.1);
      }

      .pill-ic {
        font-size: 18px;
        height: 18px;
        width: 18px;
        opacity: 0.72;
      }

      .song-updated {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        opacity: 0.68;
        margin-top: 10px;
      }

      .updated-ic {
        font-size: 16px;
        width: 16px;
        height: 16px;
        line-height: 16px;
        opacity: 0.7;
      }

      /* --- Skeleton --- */
      .song-card--skeleton {
        pointer-events: none;
      }

      .song-card--skeleton .sk-title,
      .song-card--skeleton .sk-artist,
      .song-card--skeleton .sk-pill,
      .song-card--skeleton .sk-updated {
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.06);
        position: relative;
        overflow: hidden;
      }

      .song-card--skeleton .sk-title {
        height: 18px;
        width: 70%;
        margin-bottom: 10px;
      }

      .song-card--skeleton .sk-artist {
        height: 14px;
        width: 45%;
        margin-bottom: 14px;
      }

      .song-card--skeleton .sk-row {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .song-card--skeleton .sk-pill {
        height: 22px;
        width: 92px;
        border-radius: 999px;
      }

      .song-card--skeleton .sk-updated {
        height: 12px;
        width: 55%;
      }

      .song-card--skeleton .sk-title::after,
      .song-card--skeleton .sk-artist::after,
      .song-card--skeleton .sk-pill::after,
      .song-card--skeleton .sk-updated::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(201, 162, 39, 0.14), transparent);
        animation: bmShimmer 1.2s ease-in-out infinite;
      }

      @keyframes bmShimmer {
        100% {
          transform: translateX(100%);
        }
      }

      /* key palette (reuse yours) */
      .key-major {
        box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0.06);
      }
      .key-minor {
        box-shadow: inset 0 0 0 999px rgba(0, 0, 0, 0.03);
      }
      .key-c {
        background: rgba(201, 162, 39, 0.14);
      }
      .key-cs {
        background: rgba(39, 132, 201, 0.12);
      }
      .key-d {
        background: rgba(39, 201, 162, 0.12);
      }
      .key-ds {
        background: rgba(201, 39, 132, 0.12);
      }
      .key-e {
        background: rgba(120, 39, 201, 0.12);
      }
      .key-f {
        background: rgba(201, 120, 39, 0.12);
      }
      .key-fs {
        background: rgba(39, 201, 78, 0.12);
      }
      .key-g {
        background: rgba(39, 78, 201, 0.12);
      }
      .key-gs {
        background: rgba(201, 39, 78, 0.12);
      }
      .key-a {
        background: rgba(78, 201, 39, 0.12);
      }
      .key-as {
        background: rgba(39, 201, 201, 0.12);
      }
      .key-b {
        background: rgba(201, 39, 201, 0.1);
      }
      .key-other {
        background: rgba(0, 0, 0, 0.05);
      }

      /* --- Section headers (Your songs / Library) --- */
      .bm-section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-top: 18px;
        padding: 10px 4px 6px;
      }

      .bm-section-title {
        font-weight: 800;
        letter-spacing: -0.01em;
        font-size: 0.98rem;
      }

      .bm-section-sub {
        font-size: 0.82rem;
        opacity: 0.65;
      }

      /* --- Library visual distinction --- */
      .song-card--seed {
        background: rgba(0, 0, 0, 0.008);
        border-style: dashed;
        border-color: rgba(0, 0, 0, 0.07);
      }

      .bm-seed-pill {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        opacity: 0.75;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(0, 0, 0, 0.03);
      }

      .bm-section-sep {
        height: 1px;
        margin: 14px 0 4px;
        background: rgba(0, 0, 0, 0.06);
      }
    `,
  ],
})
export class SongsPageComponent {
  readonly store = inject(SongsStore);
  readonly router = inject(Router);
  readonly dialog = inject(MatDialog);

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
    const library = list.filter((s) => s.isSeed);

    return {
      mine: this.sortSongs(mine),
      library: this.sortSongs(library),
      hasAny: mine.length + library.length > 0,
    };
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

    return list;
  });

  /** Sorting (single source of truth: sort()) */
  readonly sorted = computed(() => {
    const list = this.filtered().slice();

    const cmpStr = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

    list.sort((a, b) => {
      switch (this.sort()) {
        case 'updatedDesc':
          return this.parseTime(b.updatedAt) - this.parseTime(a.updatedAt);

        case 'updatedAsc':
          return this.parseTime(a.updatedAt) - this.parseTime(b.updatedAt);

        case 'titleAsc':
          return cmpStr(this.normalizeStr(a.title), this.normalizeStr(b.title));

        case 'titleDesc':
          return cmpStr(this.normalizeStr(b.title), this.normalizeStr(a.title));

        case 'artistAsc':
          return cmpStr(this.normalizeStr(a.artist), this.normalizeStr(b.artist));

        case 'artistDesc':
          return cmpStr(this.normalizeStr(b.artist), this.normalizeStr(a.artist));

        default:
          return 0;
      }
    });

    return list;
  });

  readonly isEmpty = computed(
    () => this.isReady() && this.store.count() === 0 && !this.query().trim(),
  );

  readonly isNoResults = computed(() => {
    const g = this.grouped();
    return this.isReady() && this.store.count() > 0 && !g.hasAny;
  });

  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!this.query().trim() || !!f.artist || !!f.key || this.sort() !== 'updatedDesc';
  });

  constructor() {
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
  }

  /** Filter setters */
  setArtist(value: string | null) {
    this.filters.update((f) => ({ ...f, artist: value || null }));
  }

  setKey(value: string | null) {
    this.filters.update((f) => ({ ...f, key: value || null }));
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

  /** Helpers */
  private normalizeStr(v: unknown): string {
    return String(v ?? '')
      .trim()
      .toLowerCase();
  }

  private parseTime(v: unknown): number {
    const t = Date.parse(String(v ?? ''));
    return Number.isFinite(t) ? t : 0;
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
}
