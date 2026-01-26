import { Component, computed, effect, inject, DestroyRef, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PracticeStore } from '../../state/practice.store';
import { SetlistsStore } from '../../../setlists/state/setlists.store';
import { SongsStore } from '../../../songs/state/songs-store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './practice-page.html',
  styleUrl: './practice-page.scss',
  animations: [
    trigger('slideSwap', [
      transition(':increment', [
        style({ opacity: 0, transform: 'translateX(14px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':decrement', [
        style({ opacity: 0, transform: 'translateX(-14px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class PracticePageComponent {
  readonly p = inject(PracticeStore);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly setlists = inject(SetlistsStore);
  readonly songs = inject(SongsStore);

  private destroyRef = inject(DestroyRef);

  readonly paramMapSig = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly id = computed(() => this.paramMapSig().get('setlistId') ?? '');
  readonly hasId = computed(() => !!this.id());

  // Must: avoid re-starting practice for the same setlistId due to effect re-runs
  private startedForId = signal<string | null>(null);

  readonly notFound = computed(() => {
    const id = this.id();
    if (!id) return false;

    const st = this.setlists.state();
    if (st === 'idle' || st === 'loading') return false;

    return !this.setlists.items().some((s) => s.id === id);
  });

  constructor() {
    effect(() => {
      if (this.songs.state() === 'idle') this.songs.load();
      if (this.setlists.state() === 'idle') this.setlists.load().subscribe();

      const setlistId = this.id();
      if (!setlistId) return;

      // Wait until setlists are in memory
      const exists = this.setlists.items().some((s) => s.id === setlistId);
      if (!exists) return;

      if (this.startedForId() === setlistId) return;
      this.startedForId.set(setlistId);

      this.p.start(setlistId);
    });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((e) => !e.repeat),
        filter((e) => !this.isTypingTarget(e)),
      )
      .subscribe((e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.exit();
          return;
        }

        // Should: remove Backspace as prev to avoid browser-ish behavior surprises
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.p.prev();
          return;
        }

        if (e.key === 'ArrowRight' || e.code === 'Space') {
          e.preventDefault();
          this.p.next();
          return;
        }

        if ((e.key === 'r' || e.key === 'R') && !this.p.nextSongId() && this.p.count() > 0) {
          e.preventDefault();
          this.p.jumpTo(0);
        }
      });
  }

  exit() {
    const id = this.id();
    // nice/should: stop practice state when leaving
    this.p.stop();

    // Should: send focus id back to Setlists
    this.router.navigate(['/setlists'], { queryParams: { focus: id } });
  }

  goSetlists() {
    // nice/should: stop practice state when leaving
    this.p.stop();
    this.router.navigate(['/setlists']);
  }

  durationLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const total = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(total) || total <= 0) return '';
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  private isTypingTarget(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;

    const tag = target.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (target.isContentEditable) return true;

    // If any overlay/dialog is open, don't intercept
    const hasOverlay = document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
    if (hasOverlay) return true;

    return false;
  }
}
