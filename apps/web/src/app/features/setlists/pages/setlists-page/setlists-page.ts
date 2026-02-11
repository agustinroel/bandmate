import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SongsStore } from '../../../songs/state/songs-store';
import { SetlistsStore } from '../../../setlists/state/setlists.store';
import { NewSetlistDialogComponent } from '../../ui/new-setlist-dialog';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { take } from 'rxjs';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { AnimationService } from '../../../../core/services/animation.service';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './setlists-page.html',
  styleUrl: './setlists-page.scss',
})
export class SetlistsPageComponent {
  readonly store = inject(SetlistsStore);
  readonly songs = inject(SongsStore);
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);
  readonly animation = inject(AnimationService);

  readonly route = inject(ActivatedRoute);

  readonly notify = inject(NotificationsService);

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

    // Focus on a setlist when coming back from Practice: /setlists?focus=<id>
    this.route.queryParamMap.pipe(take(1)).subscribe((q) => {
      const focusId = q.get('focus');
      if (!focusId) return;

      // Ensure setlists are loaded (or wait until they are)
      const tryFocus = () => {
        const exists = this.store.items().some((s) => s.id === focusId);
        if (!exists) return false;

        this.store.select(focusId);

        // Scroll the item into view (best-effort)
        queueMicrotask(() => {
          const el = document.querySelector(`[data-setlist-id="${focusId}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        return true;
      };

      // If already loaded, focus immediately
      if (this.store.state() === 'ready' && tryFocus()) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { focus: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return;
      }

      // Otherwise, watch until setlists become ready
      const stop = effect(() => {
        if (this.store.state() !== 'ready') return;

        if (tryFocus()) {
          stop.destroy();

          // Clean the URL (optional but recommended)
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { focus: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });
    });

    // 1) Animate Sidebar Items
    effect(() => {
      const items = this.store.items();
      if (items.length > 0) {
        setTimeout(() => {
          const els = document.querySelectorAll('.sl-item-gsap');
          if (els.length > 0) {
            this.animation.staggerList(Array.from(els), 0.05, 0.1);
          }
        }, 120);
      }
    });

    // 2) Animate Editor List when setlist changes
    effect(() => {
      const selected = this.store.selected();
      if (selected) {
        setTimeout(() => {
          const els = document.querySelectorAll('.drag-row-gsap');
          if (els.length > 0) {
            this.animation.staggerList(Array.from(els), 0.04, 0.2);
          }
        }, 150);
      }
    });
  }

  // Nice: normalize error snack
  private toastError(err: any, fallback: string, duration = 3000) {
    this.notify.error(err?.message ?? fallback, 'OK', duration);
  }

  createSetlist() {
    const ref = this.dialog.open(NewSetlistDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.store.create(result).subscribe({
        next: () => this.notify.success('Setlist created', 'OK', 2000),
        error: (err) => this.toastError(err, 'Could not create setlist'),
      });
    });
  }

  // Should: rename setlist
  openRenameSetlist(id: string, currentName: string) {
    const ref = this.dialog.open(RenameSetlistDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data: { name: currentName },
    });

    ref.afterClosed().subscribe((result: { name: string } | null) => {
      const nextName = result?.name?.trim();
      if (!nextName || nextName === currentName) return;

      this.store.updateName(id, { name: nextName }).subscribe({
        next: () => this.notify.success('Setlist renamed', 'OK', 2000),
        error: (err) => this.toastError(err, 'Could not rename setlist'),
      });
    });
  }

  addSong(songId: string) {
    const sel = this.store.selected();
    if (!sel) return;

    if (sel.items.some((i) => i.songId === songId)) {
      this.notify.info('That song is already in the setlist', 'OK', 1500);
      return;
    }

    this.store.addSong(sel.id, songId).subscribe({
      next: () => this.notify.success('Added to setlist', 'OK', 1200),
      error: (err) => this.toastError(err, 'Could not add song', 2500),
    });
  }

  removeSong(songId: string) {
    const sel = this.store.selected();
    if (!sel) return;

    this.store.removeSong(sel.id, songId).subscribe({
      next: () => this.notify.success('Removed', 'OK', 1200),
      error: (err) => this.toastError(err, 'Could not remove'),
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
      next: () => this.notify.success('Order updated', 'OK', 1200),
      error: (err) => this.toastError(err, 'Could not reorder', 2500),
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
        next: () => this.notify.success('Setlist deleted', 'OK', 2000),
        error: (err) => this.toastError(err, 'Could not delete setlist'),
      });
    });
  }

  // Must: guard empty setlist (even if user triggers click somehow)
  startPractice() {
    const sel = this.store.selected();
    if (!sel) return;
    if (sel.items.length === 0) return;

    this.router.navigate(['/practice', sel.id]);
  }
}

/**
 * Minimal dialog for "Rename setlist" (Should)
 * Keep it colocated for copy-paste convenience.
 */
@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Rename setlist</h2>

    <div mat-dialog-content>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Name</mat-label>
        <input matInput [value]="name()" (input)="name.set($any($event.target).value)" />
      </mat-form-field>
      <div class="small opacity-75">Pick something you’ll recognize quickly before rehearsal.</div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(null)">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        [disabled]="!name().trim()"
        (click)="ref.close({ name: name().trim() })"
      >
        Save
      </button>
    </div>
  `,
})
export class RenameSetlistDialogComponent {
  readonly ref = inject(MatDialogRef<RenameSetlistDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as { name: string };

  readonly name = signal(this.data?.name ?? '');
}
