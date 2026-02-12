import { Component, computed, effect, inject, signal, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe, NgClass, Location } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { ChordLineViewComponent } from '../../../../shared/ui/chord-line-view/chord-line-view';
import { TransposeBarComponent } from '../../../../shared/ui/transpose-bar/transpose-bar';

const base = environment.apiBaseUrl;

type WorkDto = {
  id: string;
  title: string;
  artist: string;
  rights?: string | null;
  rightsNotes?: string | null;
  updatedAt?: string | null;
};

type ArrangementDto = {
  id: string;
  workId: string;
  version?: number | null;
  sections?: any[] | null;

  key?: string | null;
  bpm?: string | number | null;
  durationSec?: number | null;
  notes?: string | null;

  ratingAvg?: number | null;
  ratingCount?: number | null;

  updatedAt?: string | null;
  createdAt?: string | null;
  authorName?: string | null;
};

type WorkWithArrangementsDto = {
  work: WorkDto;
  arrangements: ArrangementDto[];
};

@Component({
  standalone: true,
  imports: [
    RouterModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    FormsModule,
    ChordLineViewComponent,
    TransposeBarComponent,
  ],
  templateUrl: './arrangement-view.html',
  styleUrl: './arrangement-view.scss',
})
export class ArrangementViewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  readonly workId = signal<string>('');
  readonly arrangementId = signal<string>('');

  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly error = signal<string | null>(null);

  readonly work = signal<WorkDto | null>(null);
  readonly arrangements = signal<ArrangementDto[]>([]);

  readonly arrangement = computed(() => {
    const id = this.arrangementId();
    const list = this.arrangements();
    return list.find((a) => a.id === id) ?? null;
  });

  readonly transpose = signal<number>(0);
  readonly isPracticeMode = signal(false);

  // AutoScroll
  readonly autoScrollOn = signal(false);
  readonly autoScrollSpeed = signal(28); // px/s
  readonly canAutoScroll = computed(() => this.state() === 'ready');

  private _rafId: number | null = null;
  private _lastTs: number | null = null;
  private _scrollCarry = 0;
  private _autoScrollCleanup: (() => void) | null = null;

  readonly autoScrollSpeedMin = 8;
  readonly autoScrollSpeedMax = 90;
  readonly autoScrollSpeedStep = 2;
  private _fineTuneCarry = 0;

  private readonly el = inject(ElementRef);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  constructor() {
    // params
    effect(() => {
      const workId = this.route.snapshot.paramMap.get('workId') ?? '';
      const arrangementId = this.route.snapshot.paramMap.get('arrangementId') ?? '';
      this.workId.set(workId);
      this.arrangementId.set(arrangementId);

      if (workId && arrangementId) this.load();
    });

    // Fullscreen listener
    // Fullscreen listener
    effect((onCleanup) => {
      const handleFs = () => {
        const isFs = !!document.fullscreenElement;
        this.isPracticeMode.set(isFs);
        if (!isFs && this.autoScrollOn()) {
          this.stopAutoScroll();
        }
      };

      document.addEventListener('fullscreenchange', handleFs);
      onCleanup(() => {
        document.removeEventListener('fullscreenchange', handleFs);
        this.stopAutoScroll();
      });
    });
  }

  enterPracticeMode() {
    const el = this.el.nativeElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((err: any) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    }
  }

  goBack() {
    if (this.isPracticeMode()) {
      document.exitFullscreen().catch((err) => console.warn(err));
    } else {
      this.router.navigate(['/library', this.workId()]);
    }
  }

  load() {
    const workId = this.workId();
    if (!workId) return;

    this.state.set('loading');
    this.error.set(null);

    this.http.get<WorkWithArrangementsDto>(`${base}/works/${workId}`).subscribe({
      next: (res) => {
        this.work.set(res.work ?? null);
        this.arrangements.set(res.arrangements ?? []);
        this.state.set('ready');
      },
      error: (err) => {
        this.state.set('error');
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to load work');
      },
    });
  }

  readonly setTranspose = (next: number) => {
    this.transpose.set(next);
  };

  durationLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const totalSeconds = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  ratingLabel(avg?: number | null, count?: number | null) {
    const a = Number(avg ?? 0);
    const c = Number(count ?? 0);
    if (!c) return 'Not rated yet';
    return `${a.toFixed(1)} (${c})`;
  }

  rate(value: number) {
    const arrangementId = this.arrangementId();
    if (!arrangementId) return;

    this.http
      .post<ArrangementDto>(`${base}/arrangements/${arrangementId}/rate`, { rating: value })
      .subscribe({
        next: (updated) => {
          // update local list
          const list = this.arrangements();
          const nextList = list.map((a) => (a.id === arrangementId ? { ...a, ...updated } : a));
          this.arrangements.set(nextList);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? err?.message ?? 'Failed to rate arrangement');
        },
      });
  }

  stars(avg?: number | null) {
    const a = Number(avg ?? 0);
    // redondeo al entero más cercano para pintar estrellas llenas
    return Math.round(a);
  }

  toggleAutoScroll() {
    if (this.autoScrollOn()) this.stopAutoScroll();
    else this.startAutoScroll();
  }

  setAutoScrollSpeed(pxPerSec: number) {
    const next = Math.max(this.autoScrollSpeedMin, Math.min(this.autoScrollSpeedMax, pxPerSec));
    this.autoScrollSpeed.set(next);
  }

  adjustAutoScrollSpeed(delta: number) {
    this.setAutoScrollSpeed(this.autoScrollSpeed() + delta);
  }

  startAutoScroll() {
    if (!this.canAutoScroll()) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (this.autoScrollOn()) return;

    this.autoScrollOn.set(true);
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = this._bindAutoScrollUserInterruption(() => this.stopAutoScroll());
    this._lastTs = null;

    const step = (ts: number) => {
      if (!this.autoScrollOn()) return;

      if (this._lastTs === null) this._lastTs = ts;
      const dtMs = ts - this._lastTs;
      this._lastTs = ts;

      const dt = Math.min(dtMs, 64) / 1000;
      const speed = this.autoScrollSpeed();
      const dyFloat = speed * dt;

      this._scrollCarry += dyFloat;
      const dy = Math.trunc(this._scrollCarry);
      if (dy !== 0) this._scrollCarry -= dy;

      if (dy !== 0) {
        const targetEl = this._getScrollTarget();
        const beforeTop = targetEl.scrollTop;

        targetEl.scrollTop += dy;

        const afterTop = targetEl.scrollTop;

        if (afterTop === beforeTop || this._isAtBottom()) {
          this.stopAutoScroll();
          return;
        }
      } else if (this._isAtBottom()) {
        this.stopAutoScroll();
        return;
      }

      this._rafId = requestAnimationFrame(step);
    };

    this._rafId = requestAnimationFrame(step);
  }

  stopAutoScroll() {
    this._scrollCarry = 0;
    if (!this.autoScrollOn()) return;

    this.autoScrollOn.set(false);
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastTs = null;
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = null;
  }

  private _getScrollTarget(): HTMLElement {
    if (this.isPracticeMode()) {
      return this.el.nativeElement;
    }
    // In our layout, .app-main is the specific scroll container
    const main = document.querySelector('.app-main');
    return (main as HTMLElement) || document.documentElement;
  }

  // No _scrollBy helper needed if we just do scrollTop += dy,
  // ensuring we always have an element.

  private _isAtBottom(): boolean {
    const el = this._getScrollTarget();
    // Tolerance of 2px
    return Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 2;
  }

  private _bindAutoScrollUserInterruption(onInterrupt: () => void) {
    const onWheel = (ev: WheelEvent) => {
      if (!this.autoScrollOn()) return;

      if (ev.shiftKey) {
        ev.preventDefault();
        ev.stopPropagation();
        const dir = ev.deltaY > 0 ? -1 : 1;
        this._fineTuneCarry += Math.abs(ev.deltaY);

        const threshold = 40;
        let steps = 0;
        while (this._fineTuneCarry >= threshold) {
          this._fineTuneCarry -= threshold;
          steps++;
        }
        const amount = (steps || 1) * this.autoScrollSpeedStep * dir;
        this.adjustAutoScrollSpeed(amount);
        return;
      }
      onInterrupt();
    };

    const onTouch = () => {
      if (this.autoScrollOn()) onInterrupt();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (!this.autoScrollOn()) return;
      if (ev.key === '+' || ev.key === '=') {
        ev.preventDefault();
        this.adjustAutoScrollSpeed(this.autoScrollSpeedStep);
        return;
      }
      if (ev.key === '-' || ev.key === '_') {
        ev.preventDefault();
        this.adjustAutoScrollSpeed(-this.autoScrollSpeedStep);
        return;
      }
      onInterrupt();
    };

    const wheelOpts: AddEventListenerOptions = { passive: false };

    // Listen on the scroll target
    const target = this._getScrollTarget();

    target.addEventListener('wheel', onWheel as any, wheelOpts);
    target.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('keydown', onKey);

    return () => {
      target.removeEventListener('wheel', onWheel as any, wheelOpts);
      target.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKey);
    };
  }
}
