import {
  Component,
  computed,
  effect,
  inject,
  DestroyRef,
  signal,
  NgZone,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatMenuModule } from '@angular/material/menu';
import { PracticeStore } from '../../state/practice.store';
import { SetlistsStore } from '../../../setlists/state/setlists.store';
import { SongsStore } from '../../../songs/state/songs-store';
import { MetronomeService } from '../../services/metronome.service';
import { WakeLockService } from '../../services/wake-lock.service';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { DOCUMENT, TitleCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SongViewerComponent } from '../../../songs/ui/song-viewer/song-viewer.component';
import { TransposeBarComponent } from '../../../../shared/ui/transpose-bar/transpose-bar';
import { PracticeSessionService } from '../../../../core/services/practice-session.service';

@Component({
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSliderModule,
    MatMenuModule,
    SongViewerComponent,
    TransposeBarComponent,
    TitleCasePipe,
  ],
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
  readonly metronome = inject(MetronomeService);
  readonly wakeLock = inject(WakeLockService);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly sessionService = inject(PracticeSessionService);

  private destroyRef = inject(DestroyRef);

  readonly paramMapSig = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly id = computed(() => this.paramMapSig().get('setlistId') ?? '');
  readonly hasId = computed(() => !!this.id());

  // Must: avoid re-starting practice for the same setlistId due to effect re-runs
  private startedForId = signal<string | null>(null);

  readonly transpose = signal(0);
  readonly isScrolling = signal(false);
  readonly isStageMode = signal(false);

  // Mobile toolbar visibility (show/hide on swipe)
  readonly isToolbarVisible = signal(true);
  private _touchStartY = 0;
  private _touchStartTime = 0;
  private readonly SWIPE_THRESHOLD = 50; // px

  // Sections for navigation
  readonly currentSections = computed(() => {
    const detail = this.songs.selected();
    const currentId = this.p.currentSongId();

    // Ensure the detail matches the current practice song
    if (!detail || !currentId || detail.id !== currentId) return [];

    // Filter out empty sections if desired, or show all
    return detail.sections || [];
  });

  readonly notFound = computed(() => {
    const id = this.id();
    if (!id) return false;

    const st = this.setlists.state();
    if (st === 'idle' || st === 'loading') return false;

    return !this.setlists.items().some((s) => s.id === id);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.wakeLock.disable());

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

      this.wakeLock.enable();
      this.p.start(setlistId);

      // Start tracking practice session
      this.sessionService.startSession(setlistId);
    });

    // Track individual song views
    effect(() => {
      const currentId = this.p.currentSongId();
      if (currentId) {
        this.sessionService.recordSongStart(currentId);
      }
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

        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.toggleScroll();
        }
      });

    // Listen for fullscreen changes (ESC key interaction)
    fromEvent(document, 'fullscreenchange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const isFullscreen = !!this.document.fullscreenElement;
        // Only update if different (avoid loop)
        if (this.isStageMode() !== isFullscreen) {
          this.isStageMode.set(isFullscreen);
        }
      });

    // Touch swipe detection for toolbar visibility on mobile
    fromEvent<TouchEvent>(document, 'touchstart', { passive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        this._touchStartY = e.touches[0].clientY;
        this._touchStartTime = Date.now();
      });

    fromEvent<TouchEvent>(document, 'touchend', { passive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        const deltaY = e.changedTouches[0].clientY - this._touchStartY;
        const deltaTime = Date.now() - this._touchStartTime;

        // Quick swipe detection (< 300ms, > threshold px)
        if (deltaTime < 300 && Math.abs(deltaY) > this.SWIPE_THRESHOLD) {
          if (deltaY > 0) {
            // Swipe DOWN -> show toolbar
            this.isToolbarVisible.set(true);
          } else {
            // Swipe UP -> hide toolbar
            this.isToolbarVisible.set(false);
          }
        }
      });
  }

  exit() {
    const id = this.id();
    // nice/should: stop practice state when leaving
    this.wakeLock.disable();
    this.p.stop();
    this.stopScroll();

    // End practice session tracking
    const isCompleted = !this.p.nextSongId(); // Completed if at last song
    this.sessionService.endSession(isCompleted);

    // Should: send focus id back to Setlists
    this.router.navigate(['/setlists'], { queryParams: { focus: id } });
  }

  goSetlists() {
    // nice/should: stop practice state when leaving
    this.wakeLock.disable();
    this.p.stop();

    // End practice session (not completed since exiting early)
    this.sessionService.endSession(false);

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

  // ---- Auto-scroll (RAF based) ----
  readonly autoScrollSpeed = signal(28); // px/sec
  readonly autoScrollSpeedMin = 10;
  readonly autoScrollSpeedMax = 150;

  private _rafId: number | null = null;
  private _lastTs: number | null = null;
  private _scrollCarry = 0;
  private _autoScrollCleanup: (() => void) | null = null;

  toggleScroll() {
    if (this.isScrolling()) {
      this.stopScroll();
    } else {
      this.startScroll();
    }
  }

  startScroll() {
    if (this.isScrolling()) return;

    // Must have a current song to scroll
    if (!this.p.currentSong()) return;

    this.isScrolling.set(true);
    this._lastTs = null;
    this._scrollCarry = 0;

    // Bind interruption (wheel/touch)
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = this._bindAutoScrollInterruption(() => this.stopScroll());

    this.zone.runOutsideAngular(() => {
      const step = (ts: number) => {
        if (!this.isScrolling()) return; // stop

        if (this._lastTs === null) this._lastTs = ts;
        const dtMs = ts - this._lastTs;
        this._lastTs = ts;

        // Cap dt to avoid huge jumps if tab was backgrounded
        const dt = Math.min(dtMs, 64) / 1000;

        const speed = this.autoScrollSpeed();
        const dyFloat = speed * dt;

        this._scrollCarry += dyFloat;
        const dy = Math.trunc(this._scrollCarry);

        if (dy !== 0) {
          this._scrollCarry -= dy;

          // Target the scrollable container
          // In Stage Mode, the scrollable element is the fixed card (.p-now)
          let container = this.isStageMode()
            ? document.querySelector('.stage-mode-active .p-now')
            : document.querySelector('.app-main');

          if (container) {
            container.scrollBy(0, dy);

            // Check end using container metrics
            // Allow a small buffer (2px)
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
              this.zone.run(() => this.stopScroll());
              return;
            }
          } else {
            // Fallback just in case layout changes
            window.scrollBy(0, dy);
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
              this.zone.run(() => this.stopScroll());
              return;
            }
          }
        }

        this._rafId = requestAnimationFrame(step);
      };

      this._rafId = requestAnimationFrame(step);
    });
  }

  stopScroll() {
    // Cancel RAF FIRST to prevent any pending frame from continuing
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    this.isScrolling.set(false);
    this._lastTs = null;
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = null;
  }

  setScrollSpeed(val: number) {
    this.autoScrollSpeed.set(val);
  }

  readonly el = inject(ElementRef);

  toggleStageMode() {
    const isStage = this.isStageMode();
    const doc = this.document;

    if (!isStage) {
      // Enter fullscreen on the host component to include toolbar/rail
      const host = this.el.nativeElement;
      if (host.requestFullscreen) {
        host.requestFullscreen().catch((err: any) => {
          console.warn('Error attempting to enable fullscreen:', err);
          this.isStageMode.set(true); // Fallback
        });
      } else {
        this.isStageMode.set(true);
      }
    } else {
      // Exit fullscreen
      if (doc.exitFullscreen && doc.fullscreenElement) {
        doc.exitFullscreen().catch((err) => console.warn('Error exit fullscreen:', err));
      }
      this.isStageMode.set(false);
    }
  }

  // ---- Section Navigation ----
  scrollToSection(sectionId: string) {
    const el = document.getElementById('sec-' + sectionId);
    if (el) {
      const headerOffset = 180; // approximate header height
      const container = document.querySelector('.app-main') || window;

      // Calculate offset relative to the container if possible
      // But simpler: el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // is easier but we have a sticky header/toolbar.

      // Manual calc:
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Or if we want precise offset:
      // const headerOffset = 100;
      // const elementPosition = el.getBoundingClientRect().top;
      // const offsetPosition = elementPosition + container.scrollTop - headerOffset;
      // container.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }

  private _bindAutoScrollInterruption(onInterrupt: () => void) {
    // Stop on manual interaction, BUT scrollbar drag might trigger 'scroll' event which is noisy.
    // Better to listen to 'wheel', 'touchstart', 'keydown' (up/down).

    // We bind to window/document
    const target = window;
    const opts: AddEventListenerOptions = { passive: true };

    const onWheel = (e: WheelEvent) => {
      if (!this.isScrolling()) return;
      // Optional: Allow Shift+Wheel to speed up? For now just stop.
      onInterrupt();
    };

    const onTouch = () => {
      if (this.isScrolling()) onInterrupt();
    };

    const onKey = (e: KeyboardEvent) => {
      if (!this.isScrolling()) return;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        onInterrupt();
      }
    };

    target.addEventListener('wheel', onWheel, opts);
    target.addEventListener('touchstart', onTouch, opts);
    target.addEventListener('keydown', onKey);

    return () => {
      target.removeEventListener('wheel', onWheel, opts);
      target.removeEventListener('touchstart', onTouch, opts);
      target.removeEventListener('keydown', onKey);
    };
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
