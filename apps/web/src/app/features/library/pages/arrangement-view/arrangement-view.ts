import { Component, computed, effect, inject, signal, ElementRef, NgZone } from '@angular/core';
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
import { WakeLockService } from '../../../practice/services/wake-lock.service';

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
  host: {
    '[class.bm-stage-mode]': 'isPracticeMode()',
  },
})
export class ArrangementViewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly wakeLock = inject(WakeLockService);

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
    effect((onCleanup) => {
      const handleFs = () => {
        const isFs = !!document.fullscreenElement;
        this.isPracticeMode.set(isFs);
      };

      document.addEventListener('fullscreenchange', handleFs);
      onCleanup(() => {
        document.removeEventListener('fullscreenchange', handleFs);
        this.stopAutoScroll();
        this.wakeLock.disable();
      });
    });
  }

  enterPracticeMode() {
    this.isPracticeMode.set(true);
    this.wakeLock.enable();
    const el = this.el.nativeElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((err: any) => {
        console.warn('Fullscreen fallback to stage mode:', err);
      });
    }
  }

  goBack() {
    if (this.isPracticeMode()) {
      this.isPracticeMode.set(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.warn(err));
      }
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
    return Math.round(a);
  }

  toggleAutoScroll() {
    if (this.autoScrollOn()) this.stopAutoScroll();
    else this.startAutoScroll();
  }

  setAutoScrollSpeed(pxPerSec: number) {
    const next = Math.max(this.autoScrollSpeedMin, Math.min(this.autoScrollSpeedMax, Number(pxPerSec) || 28));
    this.autoScrollSpeed.set(next);
  }

  adjustAutoScrollSpeed(delta: number) {
    this.setAutoScrollSpeed(this.autoScrollSpeed() + delta);
  }

  startAutoScroll() {
    if (!this.canAutoScroll()) return;
    if (this.autoScrollOn()) return;

    const initialTarget = this._getScrollTarget();
    if (initialTarget && this._isAtBottom(initialTarget)) {
      initialTarget.scrollTop = 0;
    }

    this.autoScrollOn.set(true);
    this.wakeLock.enable();
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = this._bindAutoScrollUserInterruption(() => this.stopAutoScroll());
    this._lastTs = null;
    this._scrollCarry = 0;

    this.zone.runOutsideAngular(() => {
      const step = (ts: number) => {
        if (!this.autoScrollOn()) return;

        if (this._lastTs === null) {
          this._lastTs = ts;
          this._rafId = requestAnimationFrame(step);
          return;
        }

        const dtMs = ts - this._lastTs;
        this._lastTs = ts;

        const dt = Math.min(Math.max(dtMs, 0), 64) / 1000;
        const speed = this.autoScrollSpeed();
        const dyFloat = speed * dt;

        this._scrollCarry += dyFloat;
        const dy = Math.trunc(this._scrollCarry);
        if (dy !== 0) {
          this._scrollCarry -= dy;
          const targetEl = this._getScrollTarget();
          targetEl.style.scrollBehavior = 'auto';
          targetEl.scrollTop += dy;

          if (this._isAtBottom(targetEl)) {
            this.zone.run(() => this.stopAutoScroll());
            return;
          }
        }

        this._rafId = requestAnimationFrame(step);
      };

      this._rafId = requestAnimationFrame(step);
    });
  }

  stopAutoScroll() {
    this._scrollCarry = 0;
    if (!this.autoScrollOn()) return;

    this.autoScrollOn.set(false);
    if (!this.isPracticeMode()) {
      this.wakeLock.disable();
    }
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastTs = null;
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = null;
  }

  _getScrollTarget(): HTMLElement {
    const fsEl = document.fullscreenElement as HTMLElement | null;
    if (fsEl && fsEl.scrollHeight > fsEl.clientHeight + 2) {
      return fsEl;
    }
    const hostEl = this.el.nativeElement as HTMLElement | null;
    if (this.isPracticeMode() && hostEl && hostEl.scrollHeight > hostEl.clientHeight + 2) {
      return hostEl;
    }
    const main = document.querySelector('.app-main') as HTMLElement | null;
    if (main && main.scrollHeight > main.clientHeight + 2) {
      return main;
    }
    const candidates = [
      fsEl,
      hostEl,
      main,
      document.scrollingElement as HTMLElement,
      document.documentElement,
    ].filter((c): c is HTMLElement => !!c);

    const best = candidates.reduce((prev, curr) => {
      const prevRange = prev.scrollHeight - prev.clientHeight;
      const currRange = curr.scrollHeight - curr.clientHeight;
      return currRange > prevRange ? curr : prev;
    }, candidates[0]);

    return best || document.documentElement;
  }

  private _isAtBottom(el: HTMLElement = this._getScrollTarget()): boolean {
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 2) return false;
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
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape'].includes(ev.key)) {
        onInterrupt();
      }
    };

    const wheelOpts: AddEventListenerOptions = { passive: false };
    window.addEventListener('wheel', onWheel as any, wheelOpts);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel', onWheel as any, wheelOpts);
      window.removeEventListener('keydown', onKey);
    };
  }
}
