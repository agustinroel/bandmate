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
  ],
  template: `
    <header class="bm-page-header">
      <div class="d-flex align-items-start gap-3">
        <div class="bm-mark" aria-hidden="true">
          <mat-icon>graphic_eq</mat-icon>
        </div>

        <div class="flex-grow-1 min-w-0">
          <h2 class="m-0">Songs</h2>
          <div class="small opacity-75 mt-1">
            Your library for keys, BPM, notes — ready before rehearsal.
            <span class="ms-1">({{ store.count() }} total)</span>
          </div>
        </div>

        <div class="bm-header-actions">
          <button mat-raised-button color="primary" (click)="goNew()">
            <mat-icon class="me-1">add</mat-icon>
            Add song
          </button>
        </div>
      </div>
    </header>

    @if (store.state() === 'loading') {
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <section class="bm-search">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Search</mat-label>
        <mat-icon matPrefix class="me-2">search</mat-icon>
        <input
          matInput
          [value]="query()"
          (input)="query.set($any($event.target).value)"
          placeholder="Title, artist, key..."
        />
        @if (query()) {
        <button mat-icon-button matSuffix (click)="query.set('')" aria-label="Clear">
          <mat-icon>close</mat-icon>
        </button>
        }
      </mat-form-field>

      @if (query()) {
      <div class="small opacity-75 mt-2">
        Showing {{ filtered().length }} result(s) for “{{ query() }}”
      </div>
      }
    </section>

    @if (store.error()) {
    <div class="alert alert-danger mt-2">
      {{ store.error() }}
    </div>
    } @if (store.state() !== 'loading' && filtered().length === 0) {
    <section class="text-center py-5">
      <mat-icon style="font-size: 56px; height: 56px; width: 56px" class="opacity-50">
        music_off
      </mat-icon>

      <div class="mt-3 fw-semibold">No songs found</div>

      <div class="small opacity-75 mb-3">
        @if (store.count() === 0) { Add your first song and keep everything in one place. } @else {
        Try a different search. }
      </div>

      @if (store.count() === 0) {
      <button mat-stroked-button color="primary" (click)="goNew()">Add your first song</button>
      }
    </section>
    } @if (filtered().length > 0) {
    <section class="bm-cards">
      @for (s of filtered(); track s.id) {
      <mat-card class="bm-song-card" (click)="goEdit(s.id)">
        <div class="bm-card-inner">
          <div class="d-flex align-items-start gap-3">
            <div class="flex-grow-1 min-w-0">
              <div class="bm-title-row">
                <div class="bm-song-title text-truncate">{{ s.title }}</div>
                @if (s.key) {
                <span class="bm-pill">Key {{ s.key }}</span>
                }
              </div>

              <div class="bm-artist text-truncate">{{ s.artist }}</div>

              @if (s.bpm || s.durationSec) {
              <div class="bm-meta mt-2">
                @if (s.bpm) {
                <span class="bm-pill">
                  <mat-icon class="bm-pill-ic">speed</mat-icon>
                  {{ s.bpm }} BPM
                </span>
                } @if (s.durationSec) {
                <span class="bm-pill">
                  <mat-icon class="bm-pill-ic">schedule</mat-icon>
                  {{ formatDuration(s.durationSec) }}
                </span>
                }
              </div>
              }
            </div>

            <div class="bm-actions d-flex gap-1">
              <button
                mat-icon-button
                (click)="goEdit(s.id); $event.stopPropagation()"
                matTooltip="Edit"
              >
                <mat-icon>edit</mat-icon>
              </button>

              <button
                mat-icon-button
                (click)="askDelete(s.id, s.title); $event.stopPropagation()"
                matTooltip="Delete"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-card>
      }
    </section>
    }
  `,
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
}
