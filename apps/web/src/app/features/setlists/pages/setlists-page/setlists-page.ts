import { Component, computed, effect, inject, signal } from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SongsStore } from '../../../songs/state/songs-store';
import { SetlistsStore } from '../../../setlists/state/setlists.store';
import { NewSetlistDialogComponent } from '../../ui/new-setlist-dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  template: `
    <header class="d-flex align-items-start gap-3 mb-3">
      <div class="bm-mark" aria-hidden="true"><mat-icon>queue_music</mat-icon></div>
      <div class="flex-grow-1">
        <h2 class="m-0">Setlists</h2>
        <div class="small opacity-75 mt-1">Build an order you can trust before rehearsal.</div>
      </div>
      <button mat-stroked-button [style]="'margin-top: 20px'" (click)="createSetlist()">
        <mat-icon class="me-1">add</mat-icon>
        New setlist
      </button>
    </header>

    @if (store.error()) {
    <div class="alert alert-danger">{{ store.error() }}</div>
    }

    <div class="sl-layout mt-2">
      <!-- Left: setlists -->
      <mat-card class="sl-panel">
        <div class="sl-panel-inner">
          <div class="fw-semibold mb-2">Your setlists</div>

          @if (store.state() === 'loading') {
          <div class="small opacity-75 py-2">Loading…</div>
          } @else if (store.items().length === 0) {
          <div class="small opacity-75 py-2">No setlists yet.</div>
          } @else {
          <div class="sl-list">
            @for (s of store.items(); track s.id) {
            <button
              class="sl-item"
              [class.active]="store.selectedId() === s.id"
              (click)="store.select(s.id)"
              type="button"
            >
              <div class="sl-item-row">
                <div class="sl-item-main">
                  <div class="fw-semibold text-truncate">{{ s.name }}</div>
                  <div class="small opacity-75">{{ s.items.length }} song(s)</div>
                </div>

                <button
                  mat-icon-button
                  type="button"
                  matTooltip="Delete setlist"
                  (click)="askDeleteSetlist(s.id, s.name); $event.stopPropagation()"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </button>

            }
          </div>
          }
        </div>
      </mat-card>

      <!-- Right: editor -->
      <mat-card class="sl-panel">
        <div class="sl-panel-inner">
          @if (!store.selected()) {
          <div class="text-center py-5 opacity-75">
            Select a setlist on the left or create a new one.
          </div>
          } @else {
          <div class="d-flex align-items-start gap-2">
            <div class="sl-head">
              <div class="sl-head">
                <div class="sl-head-title">{{ store.selected()!.name }}</div>

                <div class="sl-head-meta">
                  <div class="sl-pill">
                    <mat-icon class="sl-pill-ic">schedule</mat-icon>
                    <span class="sl-pill-label">Total</span>
                    <span class="sl-pill-value">{{ totalDurationLabel() }}</span>
                  </div>

                  <div class="sl-pill">
                    <mat-icon class="sl-pill-ic">music_note</mat-icon>
                    <span class="sl-pill-label">Songs</span>
                    <span class="sl-pill-value">{{ store.selected()!.items.length }}</span>
                  </div>

                  <div class="sl-head-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="button"
                      (click)="startPractice()"
                    >
                      <mat-icon class="me-1">play_arrow</mat-icon>
                      Start practice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="sl-grid mt-3">
            <!-- Available songs -->
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="small fw-semibold">Add songs</div>
                <div class="small opacity-75">{{ filteredSongs().length }} available</div>
              </div>

              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Filter</mat-label>
                <input
                  matInput
                  [value]="songQuery()"
                  (input)="songQuery.set($any($event.target).value)"
                />
              </mat-form-field>

              <div class="sl-songs">
                @if (filteredSongs().length === 0) {
                <div class="sl-empty sl-empty-sm">
                  <mat-icon class="sl-empty-ic">check_circle</mat-icon>

                  @if (store.selected()?.items?.length) {
                  <div class="fw-semibold mt-2">All songs are already in this setlist</div>
                  <div class="small opacity-75 mt-1">
                    Remove a song from the right to make it available again.
                  </div>
                  } @else if (songQuery()) {
                  <div class="fw-semibold mt-2">No matches</div>
                  <div class="small opacity-75 mt-1">Try a different search.</div>
                  } @else {
                  <div class="fw-semibold mt-2">No songs available</div>
                  <div class="small opacity-75 mt-1">Add songs to your library first.</div>
                  }
                </div>
                } @else { @for (s of filteredSongs(); track s.id) {
                <button class="sl-add" type="button" (click)="addSong(s.id)">
                  <div class="text-truncate">
                    <span class="fw-semibold">{{ s.title }}</span>
                    <span class="opacity-75"> — {{ s.artist }}</span>
                  </div>
                  <mat-icon>add</mat-icon>
                </button>
                } }
              </div>
            </div>

            <!-- Current setlist -->
            <div>
              <div class="small fw-semibold mb-2">Order</div>

              @if (store.selected()!.items.length === 0) {
              <div class="sl-empty">
                <mat-icon class="sl-empty-ic">playlist_add</mat-icon>
                <div class="fw-semibold mt-2">Your setlist is empty</div>
                <div class="small opacity-75 mt-1">
                  Add songs on the left, then drag to shape the flow.
                </div>
              </div>
              } @else {
              <div cdkDropList class="sl-drop" (cdkDropListDropped)="drop($event)">
                @for (it of store.selected()!.items; track it.songId) {
                <div class="sl-row" cdkDrag [class.moved]="it.songId === lastMovedId()">
                  <mat-icon class="sl-grab">drag_indicator</mat-icon>

                  <div class="flex-grow-1 min-w-0">
                    <div class="text-truncate fw-semibold">{{ songTitle(it.songId) }}</div>
                    <div class="small opacity-75">
                      {{ songArtist(it.songId) }}
                      @if (songDuration(it.songId)) {
                      <span class="ms-2">• {{ songDuration(it.songId) }}</span>
                      }
                    </div>
                  </div>

                  <button mat-icon-button type="button" (click)="removeSong(it.songId)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                }
              </div>
              }
            </div>
          </div>
          }
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .bm-mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: rgba(201, 162, 39, 0.16);
        display: grid;
        place-items: center;
      }

      .sl-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px; /* mobile */
      }

      @media (min-width: 992px) {
        .sl-layout {
          margin-top: 20px;
          grid-template-columns: 340px 1fr;
          gap: 24px; /* desktop */
        }
      }

      .sl-panel-inner {
        padding: 18px;
      }

      @media (min-width: 992px) {
        .sl-panel-inner {
          padding: 22px;
        }
      }

      .sl-list {
        display: grid;
        gap: 8px;
      }
      .sl-item {
        position: relative;
        text-align: left;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.6);
        border-radius: 14px;
        padding: 12px 14px 12px 16px; /* un poco más de aire */
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
      }

      .sl-item:hover {
        transform: translateY(-1px);
      }

      .sl-item.active {
        background: rgba(201, 162, 39, 0.14);
        border-color: rgba(201, 162, 39, 0.45);
        font-weight: 650;
      }

      /* dot con aire */
      .sl-item.active::before {
        content: '';
        position: absolute;
        left: 12px;
        top: 50%;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        transform: translateY(-50%);
        background: rgba(201, 162, 39, 0.95);
        box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.18);
      }

      /* Para que el texto no quede pegado al dot */
      .sl-item > div {
        padding-left: 14px;
      }

      .sl-item-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sl-item-main {
        flex: 1;
        min-width: 0;
      }

      .sl-head {
        display: grid;
        gap: 12px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }

      .sl-head-title {
        font-size: 1.1rem;
        font-weight: 750;
        letter-spacing: -0.01em;
      }

      .sl-head-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .sl-head-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 6px;
      }

      .sl-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.65);
      }

      .sl-pill-ic {
        opacity: 0.6;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .sl-pill-label {
        font-size: 0.8rem;
        opacity: 0.65;
      }

      .sl-pill-value {
        font-weight: 750;
      }

      .sl-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr;
        margin-top: 14px;
      }
      @media (min-width: 992px) {
        .sl-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .sl-songs {
        display: grid;
        gap: 8px;
        max-height: 420px;
        overflow: auto;
        padding-right: 4px;
      }
      .sl-add {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.6);
        border-radius: 14px;
        padding: 10px 12px;
        cursor: pointer;
      }

      .sl-drop {
        display: grid;
        gap: 8px;
      }
      .sl-row {
        display: flex;
        align-items: center;
        cursor: grab;
        gap: 10px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.6);
        border-radius: 14px;
        padding: 10px 10px;
        transition: box-shadow 180ms ease, transform 180ms ease, background 180ms ease;
      }

      .sl-row.moved {
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
        background: rgba(201, 162, 39, 0.1);
        cursor: grabbing;
      }
      .sl-grab {
        opacity: 0.55;
      }
      .cdk-drag-preview {
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.14);
        border-radius: 14px;
      }

      .sl-empty {
        display: grid;
        place-items: center;
        text-align: center;
        padding: 26px 14px;
        border: 1px dashed rgba(0, 0, 0, 0.12);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.55);
      }

      .sl-empty-ic {
        opacity: 0.55;
        font-size: 44px;
        width: 44px;
        height: 44px;
      }

      .sl-empty-sm {
        padding: 18px 14px;
      }

      .sl-empty-sm .sl-empty-ic {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
    `,
  ],
})
export class SetlistsPageComponent {
  readonly store = inject(SetlistsStore);
  readonly songs = inject(SongsStore);
  readonly snack = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);

  readonly router = inject(Router);

  readonly songQuery = signal('');
  readonly lastMovedId = signal<string | null>(null);

  readonly filteredSongs = computed(() => {
    const q = this.songQuery().trim().toLowerCase();
    const all = this.songs.songs();

    const selected = this.store.selected();
    const already = new Set((selected?.items ?? []).map((i) => i.songId));

    const base = all.filter((s) => !already.has(s.id));

    if (!q) return base;

    return base.filter((s) => (s.title + ' ' + s.artist).toLowerCase().includes(q));
  });

  readonly totalDurationSec = computed(() => {
    const sel = this.store.selected();
    if (!sel) return 0;

    let total = 0;
    for (const it of sel.items) {
      const s = this.songs.getById(it.songId);
      const raw = s?.durationSec;
      const n = raw === undefined || raw === null || raw === '' ? 0 : Number(raw);
      if (Number.isFinite(n) && n > 0) total += n;
    }
    return total;
  });

  constructor() {
    effect(() => {
      if (this.songs.state() === 'idle') this.songs.load();
      if (this.store.state() === 'idle') this.store.load().subscribe();
    });
  }

  createSetlist() {
    const ref = this.dialog.open(NewSetlistDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.store.create(result).subscribe({
        next: () => this.snack.open('Setlist created', 'OK', { duration: 2000 }),
        error: () => this.snack.open('Could not create setlist', 'OK', { duration: 3000 }),
      });
    });
  }

  addSong(songId: string) {
    const sel = this.store.selected();
    if (!sel) return;

    if (sel.items.some((i) => i.songId === songId)) {
      this.snack.open('That song is already in the setlist', 'OK', { duration: 1500 });
      return;
    }

    this.store.addSong(sel.id, songId).subscribe({
      next: () => this.snack.open('Added to setlist', 'OK', { duration: 1200 }),
      error: () => this.snack.open('Could not add song', 'OK', { duration: 2500 }),
    });
  }

  removeSong(songId: string) {
    const sel = this.store.selected();
    if (!sel) return;

    this.store.removeSong(sel.id, songId).subscribe({
      next: () => this.snack.open('Removed', 'OK', { duration: 1200 }),
      error: (err) => this.snack.open(err?.message ?? 'Could not remove', 'OK', { duration: 3000 }),
    });
  }

  drop(ev: CdkDragDrop<unknown>) {
    const sel = this.store.selected();
    if (!sel) return;

    if (ev.previousIndex === ev.currentIndex) return;

    const ids = sel.items.map((i) => i.songId);
    const movedId = ids[ev.previousIndex];

    moveItemInArray(ids, ev.previousIndex, ev.currentIndex);

    // optimistic UI highlight
    this.lastMovedId.set(movedId);
    setTimeout(() => this.lastMovedId.set(null), 700);

    this.store.reorder(sel.id, ids).subscribe({
      next: () => this.snack.open('Order updated', 'OK', { duration: 1200 }),
      error: () => this.snack.open('Could not reorder', 'OK', { duration: 2500 }),
    });
  }

  songTitle(songId: string) {
    return this.songs.getById(songId)?.title ?? 'Unknown song';
  }

  songArtist(songId: string) {
    return this.songs.getById(songId)?.artist ?? '';
  }

  songDuration(songId: string) {
    const raw = this.songs.getById(songId)?.durationSec;
    const d = raw === undefined || raw === null || raw === '' ? 0 : Number(raw);
    if (!Number.isFinite(d) || d <= 0) return '';
    const m = Math.floor(d / 60);
    const s = d % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  totalDurationLabel() {
    const total = this.totalDurationSec();
    if (!total) return '—';
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  askDeleteSetlist(id: string, name: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete setlist',
        message: `Delete "${name}"? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.store.remove(id).subscribe({
        next: () => this.snack.open('Setlist deleted', 'OK', { duration: 2000 }),
        error: (err) =>
          this.snack.open(err?.message ?? 'Could not delete setlist', 'OK', { duration: 3000 }),
      });
    });
  }

  startPractice() {
    const sel = this.store.selected();
    if (!sel) return;
    this.router.navigate(['/practice', sel.id]);
  }
}
