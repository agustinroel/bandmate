import { Component, computed, effect, inject, DestroyRef } from '@angular/core';
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

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <header class="d-flex align-items-start gap-3 mb-3">
      <div class="bm-mark" aria-hidden="true">
        <mat-icon>sports_guitar</mat-icon>
      </div>

      <div class="flex-grow-1">
        <h2 class="m-0">Practice</h2>

        @if (p.setlist()) {
        <div class="small opacity-75 mt-1">
          {{ p.setlist()!.name }} • <span class="fw-semibold">{{ p.progressLabel() }}</span>
        </div>

        <div class="p-top-meta small mt-1">
          <span class="p-pill">
            <mat-icon class="p-pill-ic">schedule</mat-icon>
            Total: <span class="fw-semibold">{{ p.totalLabel() }}</span>
          </span>

          <span class="p-pill">
            <mat-icon class="p-pill-ic">trending_up</mat-icon>
            Elapsed: <span class="fw-semibold">{{ p.elapsedLabel() }}</span>
          </span>

          <span class="p-pill">
            <mat-icon class="p-pill-ic">hourglass_bottom</mat-icon>
            Remaining: <span class="fw-semibold">{{ p.remainingLabel() }}</span>
          </span>

          <div class="small opacity-75 mt-2">
            Hotkeys: <span class="fw-semibold">Space</span>/<span class="fw-semibold">→</span> next,
            <span class="fw-semibold">←</span> prev, <span class="fw-semibold">Esc</span> exit
          </div>
        </div>
        } @else if (hasId()) {
        <div class="small opacity-75 mt-1">Loading setlist…</div>
        } @else {
        <div class="small opacity-75 mt-1">Select a setlist to start.</div>
        }
      </div>

      <button mat-stroked-button class="exit-button" type="button" (click)="exit()">
        <mat-icon class="me-1">close</mat-icon>
        Exit
      </button>
    </header>

    @if (!hasId()) {
    <mat-card class="p-card">
      <div class="p-empty">
        <mat-icon class="p-empty-ic">queue_music</mat-icon>
        <div class="fw-semibold mt-2">Choose a setlist to practice</div>
        <div class="small opacity-75 mt-1">Go to Setlists and press “Start practice”.</div>
        <button mat-raised-button color="primary" class="mt-3" (click)="goSetlists()">
          Go to setlists
        </button>
      </div>
    </mat-card>
    } @else if (notFound()) {
    <mat-card class="p-card">
      <div class="p-empty">
        <mat-icon class="p-empty-ic">search_off</mat-icon>
        <div class="fw-semibold mt-2">Setlist not found</div>
        <div class="small opacity-75 mt-1">It may have been deleted or the link is wrong.</div>
        <button mat-raised-button color="primary" class="mt-3" (click)="goSetlists()">
          Go to setlists
        </button>
      </div>
    </mat-card>
    } @else if (!p.setlist()) {
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    } @else if (p.count() === 0) {
    <mat-card class="p-card">
      <div class="p-empty">
        <mat-icon class="p-empty-ic">playlist_add</mat-icon>
        <div class="fw-semibold mt-2">This setlist is empty</div>
        <div class="small opacity-75 mt-1">Add songs first, then start practice.</div>
        <button mat-raised-button color="primary" class="mt-3" (click)="goSetlists()">
          Go to setlists
        </button>
      </div>
    </mat-card>
    } @else {
    <div class="p-grid">
      <!-- NOW -->
      <mat-card class="p-card p-now">
        <div class="p-kicker">NOW PLAYING</div>

        <div class="p-swap" [@slideSwap]="p.index()">
          @if (p.currentSong()) {
          <div class="p-title">{{ p.currentSong()!.title }}</div>
          <div class="p-sub opacity-75">{{ p.currentSong()!.artist }}</div>

          <div class="p-meta mt-3">
            @if (p.currentSong()!.key) {
            <span class="p-chip">Key: {{ p.currentSong()!.key }}</span>
            } @if (p.currentSong()!.bpm) {
            <span class="p-chip">BPM: {{ p.currentSong()!.bpm }}</span>
            } @if (durationLabel(p.currentSong()!.durationSec)) {
            <span class="p-chip">Dur: {{ durationLabel(p.currentSong()!.durationSec) }}</span>
            }
          </div>

          @if (p.currentSong()!.notes) {
          <div class="p-notes mt-3">
            <div class="small fw-semibold mb-1">Notes</div>
            <div class="small opacity-75">{{ p.currentSong()!.notes }}</div>
          </div>
          } }
        </div>

        <div class="p-controls mt-4">
          <button mat-stroked-button type="button" (click)="p.prev()" [disabled]="!p.prevSongId()">
            <mat-icon class="me-1">skip_previous</mat-icon>
            Prev
          </button>

          <button
            mat-raised-button
            color="primary"
            type="button"
            (click)="p.next()"
            [disabled]="!p.nextSongId()"
          >
            Next
            <mat-icon class="ms-1">skip_next</mat-icon>
          </button>
        </div>
      </mat-card>

      <!-- NEXT -->
      <mat-card class="p-card p-next">
        <div class="p-kicker">UP NEXT</div>
        <div class="p-swap" [@slideSwap]="p.index()">
          @if (p.nextSong()) {
          <div class="p-title-sm">{{ p.nextSong()!.title }}</div>
          <div class="small opacity-75">{{ p.nextSong()!.artist }}</div>

          <div class="small opacity-75 mt-2">
            @if (durationLabel(p.nextSong()!.durationSec)) {
            <span>Duration: {{ durationLabel(p.nextSong()!.durationSec) }}</span>
            } @else {
            <span>Duration: —</span>
            }
          </div>
          } @else {
          <div class="p-done">
            <mat-icon class="p-done-ic">task_alt</mat-icon>
            <div class="fw-semibold mt-2">End of setlist</div>
            <div class="small opacity-75 mt-1">You made it. Want to run it again?</div>
            <button mat-stroked-button class="mt-3" (click)="p.jumpTo(0)">Restart</button>
          </div>
          }
        </div>
      </mat-card>
    </div>
    }
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

      .p-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
        margin-top: 14px;
      }

      @media (min-width: 992px) {
        .p-grid {
          grid-template-columns: 1.3fr 0.7fr;
          gap: 24px;
          align-items: start;
        }
      }

      .p-card {
        border-radius: 16px;
        overflow: hidden;
        padding: 18px;
        margin-top: 14px;
      }

      .p-kicker {
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        opacity: 0.65;
        font-weight: 700;
      }

      .p-title {
        font-size: 1.6rem;
        font-weight: 850;
        letter-spacing: -0.02em;
        margin-top: 8px;
        line-height: 1.1;
      }

      .p-title-sm {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        margin-top: 10px;
        line-height: 1.15;
      }

      .p-sub {
        margin-top: 6px;
      }

      .p-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }

      .p-chip {
        display: inline-flex;
        align-items: center;
        padding: 8px 10px;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.65);
        font-size: 0.85rem;
      }

      .p-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
      }

      .p-notes {
        margin-top: 14px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        padding-top: 14px;
      }

      .p-empty,
      .p-done {
        display: grid;
        place-items: center;
        text-align: center;
        padding: 22px 10px;
      }

      .p-empty-ic,
      .p-done-ic {
        opacity: 0.55;
        font-size: 46px;
        width: 46px;
        height: 46px;
      }

      .exit-button {
        margin-top: 14px;
      }

      .p-top-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .p-pill {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.65);
      }

      .p-pill-ic {
        opacity: 0.6;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .p-swap {
        will-change: transform, opacity;
      }
    `,
  ],
  animations: [
    trigger('slideSwap', [
      // Avanzar (Next)
      transition(':increment', [
        style({ opacity: 0, transform: 'translateX(14px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),

      // Retroceder (Prev)
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

  destroyRef = inject(DestroyRef);
  readonly paramMapSig = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly id = computed(() => this.paramMapSig().get('setlistId') ?? '');

  readonly hasId = computed(() => !!this.id());

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

      // Esperar a que exista el setlist en memoria
      const exists = this.setlists.items().some((s) => s.id === setlistId);
      if (!exists) return;

      this.p.start(setlistId);
    });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((e) => !e.repeat),
        filter((e) => !this.isTypingTarget(e))
      )
      .subscribe((e) => {
        // Escape: salir siempre
        if (e.key === 'Escape') {
          e.preventDefault();
          this.exit();
          return;
        }

        // Prev
        if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
          e.preventDefault();
          this.p.prev();
          return;
        }

        // Next
        if (e.key === 'ArrowRight' || e.code === 'Space') {
          e.preventDefault();
          this.p.next();
          return;
        }

        // Restart (solo si estás al final, opcional)
        if ((e.key === 'r' || e.key === 'R') && !this.p.nextSongId() && this.p.count() > 0) {
          e.preventDefault();
          this.p.jumpTo(0);
        }
      });
  }

  exit() {
    const id = this.id();
    this.router.navigate(['/setlists'], { queryParams: { focus: id } });
  }

  goSetlists() {
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

    // Si algún overlay/dialog está abierto, mejor no interceptar
    const hasOverlay = document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
    if (hasOverlay) return true;

    return false;
  }
}
