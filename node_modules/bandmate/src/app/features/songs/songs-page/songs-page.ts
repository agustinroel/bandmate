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
import { NgClass } from '@angular/common';

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
  ],
  template: `<div class="d-flex align-items-center gap-2 mb-3">
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

    @if (store.state() === 'loading') {
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

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

    @if (store.error()) {
    <div class="alert alert-danger mt-2">
      {{ store.error() }}
    </div>
    } @if (store.state() !== 'loading' && filtered().length === 0) {
    <div class="text-center py-5">
      <mat-icon style="font-size: 48px; height: 48px; width: 48px;" class="opacity-50">
        music_off
      </mat-icon>

      <div class="mt-2 fw-semibold">No songs found</div>

      <div class="small opacity-75 mb-3">
        {{
          store.count() === 0
            ? 'Add your first song to start building setlists.'
            : 'Try a different search.'
        }}
      </div>

      @if (store.count() === 0) {
      <button mat-stroked-button color="primary" (click)="goNew()">Add your first song</button>
      }
    </div>
    } @else if (filtered().length > 0) {
    <div class="songs-grid">
      @for (s of filtered(); track s.id) {
      <mat-card class="song-card" (click)="goEdit(s.id)">
        <div class="song-top">
          <div class="song-main">
            <div class="song-title-row">
              <div class="song-title" [title]="s.title">{{ s.title }}</div>

              @if (s.key) {
              <span class="pill pill-key" [ngClass]="keyClass(s.key)"> Key {{ s.key }} </span>
              }
            </div>

            <div class="song-artist" [title]="s.artist">{{ s.artist }}</div>
          </div>

          <div class="song-actions">
            <button
              mat-icon-button
              (click)="goEdit(s.id); $event.stopPropagation()"
              matTooltip="Edit"
              aria-label="Edit"
            >
              <mat-icon>edit</mat-icon>
            </button>

            <button
              mat-icon-button
              (click)="askDelete(s.id, s.title); $event.stopPropagation()"
              matTooltip="Delete"
              aria-label="Delete"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div class="song-meta">
          @if (s.bpm) {
          <span class="pill pill-neutral">
            <mat-icon class="pill-ic">speed</mat-icon>
            <span>{{ s.bpm }} BPM</span>
          </span>
          } @if (durationLabel(s.durationSec)) {
          <span class="pill pill-neutral">
            <mat-icon class="pill-ic">schedule</mat-icon>
            <span>{{ durationLabel(s.durationSec) }}</span>
          </span>
          }
        </div>
      </mat-card>
      }
    </div>
    } `,
  styles: [
    `
      .bm-page-header {
        margin-bottom: 12px;
      }
      .bm-search {
        margin-top: 14px;
        margin-bottom: 16px;
      }

      .bm-mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: rgba(201, 162, 39, 0.16);
        display: grid;
        place-items: center;
      }

      .bm-header-actions {
        padding-top: 2px;
      }

      .bm-cards {
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr;
      }

      @media (min-width: 768px) {
        .bm-cards {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (min-width: 1200px) {
        .bm-cards {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      .bm-song-card {
        cursor: pointer;
        border-radius: 16px;
        transition: transform 120ms ease, box-shadow 120ms ease;
      }

      .bm-song-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
      }

      .bm-card-inner {
        padding: 16px;
      }

      .bm-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .bm-song-title {
        font-weight: 650;
        font-size: 1.05rem;
      }

      .bm-artist {
        margin-top: 2px;
        opacity: 0.72;
        font-size: 0.95rem;
      }

      .bm-meta {
        display: flex;
        gap: 8px;
      }

      .bm-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(35, 78, 82, 0.08);
        font-size: 0.85rem;
      }

      .bm-pill-ic {
        font-size: 16px;
        opacity: 0.75;
      }
    `,
  ],
})
export class SongsPageComponent {
  readonly store = inject(SongsStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.store.songs();
    return this.store
      .songs()
      .filter((s) => (s.title + ' ' + s.artist + ' ' + (s.key ?? '')).toLowerCase().includes(q));
  });

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

  formatDuration(value: number | string | null | undefined): string {
    if (!value) return '';
    const seconds = Number(value);
    if (!seconds || seconds <= 0) return '';
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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
}
