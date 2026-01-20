import { Component, computed, effect, inject, signal } from '@angular/core';
import { SongsStore } from '../state/songs-store';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { NgClass, DatePipe } from '@angular/common';
import { useSkeletonUx } from '../../../shared/utils/skeleton-ux';

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    NgClass,
    DatePipe,
  ],
  template: `
    <div class="d-flex align-items-center gap-2 mb-3">
      <div>
        <h2 class="m-0">Songs</h2>
        <div class="small opacity-75">{{ store.count() }} total</div>
      </div>

      <span class="flex-grow-1"></span>

      <button mat-raised-button color="primary" (click)="goNew()">
        <mat-icon class="me-1">add</mat-icon>
        Add song
      </button>
    </div>

    <div class="mt-3">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Search</mat-label>
        <mat-icon matPrefix class="me-2">search</mat-icon>

        <input
          matInput
          [value]="query()"
          (input)="query.set($any($event.target).value)"
          placeholder="Title or artist"
        />

        @if (query()) {
          <button mat-icon-button matSuffix (click)="query.set('')" aria-label="Clear">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>
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

        <div class="small opacity-75 mb-3">Try a different search, or clear the filter.</div>

        <div class="d-inline-flex gap-2 flex-wrap justify-content-center">
          <button mat-stroked-button type="button" (click)="query.set('')">
            <mat-icon class="me-1">close</mat-icon>
            Clear search
          </button>

          <button mat-flat-button color="primary" (click)="goNew()">
            <mat-icon class="me-1">add</mat-icon>
            Add song
          </button>
        </div>
      </div>
    } @else if (filtered().length > 0) {
      <div class="songs-grid">
        @for (s of filtered(); track s.id) {
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
                    <span class="bm-pill bm-pill--key" [ngClass]="keyClass(s.key)"
                      >Key {{ s.key }}</span
                    >
                  }
                </div>

                <div class="song-artist" [title]="s.artist">{{ s.artist }}</div>
              </div>

              <div class="song-actions">
                <button
                  class="song-del"
                  mat-icon-button
                  (click)="askDelete(s.id, s.title); $event.stopPropagation()"
                  matTooltip="Delete"
                  aria-label="Delete"
                >
                  <mat-icon>delete</mat-icon>
                </button>
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
  `,
  styles: [
    `
      /* GRID */
      .songs-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: 1fr;
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

      /* CARD */
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

      /* Delete: escondido por defecto en desktop */
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

      /* aparece en hover/focus dentro de la card */
      .song-card:hover .song-del,
      .song-card:focus-within .song-del {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      /* micro feedback */
      .song-del:hover {
        background: rgba(0, 0, 0, 0.05);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      }

      /* Mobile/tablet: siempre visible */
      @media (hover: none), (pointer: coarse) {
        .song-del {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
      }

      /* Layout */
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

      .song-actions button {
        opacity: 0.75;
        transition:
          opacity 120ms ease,
          transform 120ms ease;
      }

      .song-card:hover .song-actions button {
        opacity: 1;
      }

      .song-actions button:active {
        transform: scale(0.96);
      }

      /* Pills: “premium”, no deform */
      .song-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }

      /* Pills base (match SongEditor) */
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

      .bm-pill-ic {
        font-size: 18px;
        height: 18px;
        width: 18px;
        opacity: 0.72;
      }

      .bm-pill--key {
        font-weight: 800;
        border-color: rgba(201, 162, 39, 0.26);
        background: rgba(201, 162, 39, 0.1);
      }

      /* Paleta por tonalidad (sobria) */
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

      /* Updated line */
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

      /* Skeleton */
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

      /* DELETE: hidden by default on desktop */
      .song-card .song-actions .song-del {
        opacity: 0;
        transform: translateY(2px);
        pointer-events: none;
      }

      /* show on hover/focus */
      .song-card:hover .song-actions .song-del,
      .song-card:focus-within .song-actions .song-del {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      /* keep tooltip working only when visible */
      .song-card .song-actions .song-del {
        transition:
          opacity 160ms ease,
          transform 160ms ease,
          background-color 160ms ease,
          box-shadow 160ms ease;
        border-radius: 12px;
      }

      .song-card:hover .song-actions .song-del:hover {
        background: rgba(0, 0, 0, 0.05);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      }

      /* Mobile/tablet: always visible */
      @media (hover: none), (pointer: coarse) {
        .song-card .song-actions .song-del {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
      }

      .song-card:hover .song-actions .song-del {
        background: rgba(0, 0, 0, 0.035);
      }
    `,
  ],
})
export class SongsPageComponent {
  readonly store = inject(SongsStore);
  readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  readonly snack = inject(MatSnackBar);

  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.store.songs();
    return this.store
      .songs()
      .filter((s) => (s.title + ' ' + s.artist + ' ' + (s.key ?? '')).toLowerCase().includes(q));
  });

  readonly isLoading = useSkeletonUx({
    isActive: computed(() => true), // siempre activo en esta page
    isLoading: computed(() => {
      const st = this.store.state();
      return st === 'loading' || st === 'idle';
    }),
    showDelayMs: 120,
    minVisibleMs: 280,
  });
  readonly isError = computed(() => this.store.state() === 'error');
  readonly isReady = computed(() => this.store.state() === 'ready');
  readonly isEmpty = computed(() => this.isReady() && this.store.count() === 0 && !this.query());

  readonly isNoResults = computed(
    () => this.isReady() && this.store.count() > 0 && this.filtered().length === 0,
  );

  constructor() {
    effect(() => {
      if (this.store.state() === 'idle') this.store.load();
    });
  }

  goNew() {
    this.router.navigate(['/songs/new']);
  }

  goEdit(id: string) {
    this.router.navigate(['/songs', id]);
  }

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
        next: () => this.snack.open('Song deleted', 'OK', { duration: 2000 }),
        error: () => this.snack.open('Could not delete song', 'OK', { duration: 3000 }),
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

    // detecta menor si termina en "M" pero no "MAJ" (Gm, Am, Dm, etc.)
    const isMinor = /M$/.test(k) && !/MAJ$/.test(k);

    // raíz: primera letra + opcional #/b
    const root = k.match(/^[A-G](#|B)?/)?.[0] ?? k;

    // 12 clases base (sobrias) + variante minor
    // Nota: uso B para bemol en uppercase; si guardás "Bb" viene como "BB" -> lo normalizamos abajo.
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
}
