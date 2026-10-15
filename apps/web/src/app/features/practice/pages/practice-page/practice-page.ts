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
import gsap from 'gsap';
import { PracticeStore } from '../../state/practice.store';
import { SetlistsStore } from '../../../setlists/state/setlists.store';
import { SongsStore } from '../../../songs/state/songs-store';
import { MetronomeService } from '../../services/metronome.service';
import { WakeLockService } from '../../services/wake-lock.service';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DOCUMENT, TitleCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SongViewerComponent } from '../../../songs/ui/song-viewer/song-viewer.component';
import { TransposeBarComponent } from '../../../../shared/ui/transpose-bar/transpose-bar';
import { PracticeSessionService } from '../../../../core/services/practice-session.service';
import { AnimationService } from '../../../../core/services/animation.service';
import { PracticeProgressRingComponent } from '../../../../shared/ui/practice-progress-ring/practice-progress-ring';
import { PedalListenerService } from '../../../../core/services/pedal-listener.service';
import { LoopTrainerService } from '../../services/loop-trainer.service';
import { LiveBandSyncService, StageRole } from '../../../../core/services/live-band-sync.service';

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
    PracticeProgressRingComponent,
  ],
  templateUrl: './practice-page.html',
  styleUrl: './practice-page.scss',
})
export class PracticePageComponent {
  readonly p = inject(PracticeStore);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly setlists = inject(SetlistsStore);
  readonly songs = inject(SongsStore);
  readonly metronome = inject(MetronomeService);
  readonly wakeLock = inject(WakeLockService);
  readonly pedal = inject(PedalListenerService);
  readonly loopTrainer = inject(LoopTrainerService);
  readonly liveSync = inject(LiveBandSyncService);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly sessionService = inject(PracticeSessionService);
  private readonly animation = inject(AnimationService);

  private destroyRef = inject(DestroyRef);

  readonly paramMapSig = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly id = computed(() => this.paramMapSig().get('setlistId') ?? '');
  readonly hasId = computed(() => !!this.id());

  // Must: avoid re-starting practice for the same setlistId due to effect re-runs
  private startedForId = signal<string | null>(null);

  // Ley 4: Aislamiento tonal independiente por canción de sesión (no contamina otros temas ni catálogo)
  readonly currentSongTranspose = signal(0);
  private readonly _sessionTranspositions = signal<Record<string, number>>({});
  readonly transpose = computed(() => this.currentSongTranspose());

  readonly isScrolling = signal(false);
  readonly isStageMode = signal(false);

  // Live Band Stage Sync State
  readonly sessionCode = signal('');
  readonly selectedRole = signal<StageRole>('follower');
  readonly selectedInstrument = signal('Guitarra');
  readonly customCueText = signal('');
  private lastBroadcastScrollTs = 0;

  // Floating mini-control for autoscroll (Touch/Swipe-up overlay with 1-second auto-hide)
  readonly scrollOverlayVisible = signal(false);
  private _overlayTimeout: any = null;

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
    this.destroyRef.onDestroy(() => {
      this.wakeLock.disable();
      this.metronome.stop();
      this.loopTrainer.stopLoop();
      this.liveSync.leaveSession();
      this.stopScroll();
      if (this._overlayTimeout) clearTimeout(this._overlayTimeout);
    });

    this.loopTrainer.registerLoopScrollHandler((secId) => {
      this.scrollToSection(secId);
    });

    // Realtime stage sync: Follower receives leader song switch
    effect(() => {
      const remoteSong = this.liveSync.remoteSongChange();
      if (remoteSong && !this.liveSync.isLeader()) {
        if (typeof remoteSong.index === 'number') {
          this.p.jumpTo(remoteSong.index);
        }
      }
    });

    // Realtime stage sync: Follower receives section jump
    effect(() => {
      const secJump = this.liveSync.remoteSectionJump();
      if (secJump && !this.liveSync.isLeader()) {
        const el = document.getElementById('sec-' + secJump.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    // Realtime stage sync: Leader broadcasts song change
    effect(() => {
      const currentId = this.p.currentSongId();
      const currentSong = this.p.currentSong();
      if (currentId && this.liveSync.isConnected() && this.liveSync.isLeader()) {
        this.liveSync.broadcastSongChange({
          songId: currentId,
          title: currentSong?.title,
          artist: currentSong?.artist,
          bpm: Number(currentSong?.bpm) || undefined,
          key: currentSong?.key,
          index: this.p.index(),
        });
      }
    });

    // Realtime stage sync: Follower receives leader scroll
    effect(() => {
      const scroll = this.liveSync.remoteScroll();
      if (
        scroll &&
        this.liveSync.isConnected() &&
        !this.liveSync.isLeader() &&
        !this.isScrolling()
      ) {
        const container = this.getScrollContainer();
        if (container) {
          const maxScroll = container.scrollHeight - container.clientHeight;
          const targetTop =
            scroll.scrollRatio > 0 && maxScroll > 0
              ? scroll.scrollRatio * maxScroll
              : scroll.scrollTop;
          container.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }
    });

    // Realtime stage sync: Leader broadcasts throttled scroll on document/container scroll
    fromEvent(this.document, 'scroll', { passive: true, capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        if (!this.liveSync.isConnected() || !this.liveSync.isLeader()) return;
        const container = this.getScrollContainer();
        if (!container) return;
        const target = e.target;
        if (
          target === container ||
          target === this.document ||
          target === (this.document as any).defaultView
        ) {
          this.broadcastCurrentScroll(container);
        }
      });

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

    // Mantener sincronizado el mapa de transposiciones de sesión
    effect(() => {
      const val = this.currentSongTranspose();
      const currentId = this.p.currentSongId();
      if (currentId) {
        this._sessionTranspositions.update((map) => {
          if (map[currentId] === val) return map;
          return { ...map, [currentId]: val };
        });
      }
    });

    // Track individual song views, aislar transposición por tema y sincronizar BPM del metrónomo
    effect(() => {
      const currentId = this.p.currentSongId();
      if (currentId) {
        this.sessionService.recordSongStart(currentId);
        // Sync with SongsStore to ensure detail is loaded (sections/chords)
        this.songs.loadDetail(currentId);

        // 1. Cargar transposición aislada de esta canción en la sesión (por defecto 0)
        const saved = this._sessionTranspositions()[currentId] ?? 0;
        this.currentSongTranspose.set(saved);

        // 2. Ley 2: Sincronizar automáticamente BPM de la nueva canción con Tone.Transport
        const song = this.p.currentSong();
        if (song?.bpm) {
          const bpm = Number(song.bpm) || 120;
          this.metronome.setBpm(bpm);
        }

        // 3. Detener scroll anterior, bucle y ocultar overlay al cambiar de canción
        this.stopScroll();
        this.closeScrollOverlay();
        this.loopTrainer.stopLoop();
      }
    });

    // 3) GSAP Swap Animation
    effect(() => {
      const idx = this.p.index();
      // Wait for DOM to update
      setTimeout(() => {
        const containers = document.querySelectorAll('.p-swap-gsap');
        if (containers.length > 0) {
          this.animation.staggerList(Array.from(containers), 0, 0);
        }
      }, 50);
    });

    // 4) Celebration effect when setlist is completed (last song, no next)
    effect(() => {
      const idx = this.p.index();
      const total = this.p.count();
      // Trigger only when we reach the very last song
      if (total > 0 && idx === total - 1) {
        setTimeout(() => {
          const doneCard = document.querySelector('.p-next .p-done');
          if (doneCard) {
            this.animation.celebrate(doneCard, 35);
          }
        }, 300);
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

    // Listen to Bluetooth Pedal actions
    this.pedal.actions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((action) => {
      if (action === 'scroll-down') {
        const container = this.isStageMode()
          ? document.querySelector('.stage-mode-active .p-now')
          : document.querySelector('.app-main');
        container?.scrollBy({ top: window.innerHeight * 0.65, behavior: 'smooth' });
      } else if (action === 'scroll-up') {
        const container = this.isStageMode()
          ? document.querySelector('.stage-mode-active .p-now')
          : document.querySelector('.app-main');
        container?.scrollBy({ top: -window.innerHeight * 0.65, behavior: 'smooth' });
      } else if (action === 'toggle-scroll') {
        this.toggleScroll();
      } else if (action === 'next-song') {
        this.p.next();
      } else if (action === 'prev-song') {
        this.p.prev();
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

    // Touch detection & swipe detection for toolbar visibility on mobile and autoscroll overlay
    fromEvent<TouchEvent>(document, 'touchstart', { passive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        this._touchStartY = e.touches[0].clientY;
        this._touchStartTime = Date.now();

        // Al tocar la pantalla con autoscroll activo, NO detenerlo y abrir el mini-control
        if (this.isScrolling()) {
          this.openScrollOverlay();
        } else if (this.scrollOverlayVisible()) {
          this.resetOverlayTimer();
        }
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
            // Swipe UP -> hide toolbar and open autoscroll mini-control on mobile
            this.isToolbarVisible.set(false);
            this.openScrollOverlay();
          }
        }
      });
  }

  exit() {
    const id = this.id();
    this.wakeLock.disable();
    this.metronome.stop();
    this.loopTrainer.stopLoop();
    this.liveSync.leaveSession();
    this.p.stop();
    this.stopScroll();
    this.closeScrollOverlay();

    // End practice session tracking
    const isCompleted = !this.p.nextSongId(); // Completed if at last song
    this.sessionService.endSession(isCompleted);

    this.router.navigate(['/setlists'], { queryParams: { focus: id } });
  }

  goSetlists() {
    this.wakeLock.disable();
    this.metronome.stop();
    this.loopTrainer.stopLoop();
    this.liveSync.leaveSession();
    this.p.stop();
    this.stopScroll();
    this.closeScrollOverlay();

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
  private scrollTween: gsap.core.Tween | null = null;

  toggleScroll() {
    if (this.isScrolling()) {
      this.stopScroll();
    } else {
      this.startScroll();
    }
  }

  openScrollOverlay() {
    this.scrollOverlayVisible.set(true);
    this.resetOverlayTimer();
  }

  closeScrollOverlay() {
    if (this._overlayTimeout) {
      clearTimeout(this._overlayTimeout);
      this._overlayTimeout = null;
    }
    this.scrollOverlayVisible.set(false);
  }

  resetOverlayTimer() {
    if (this._overlayTimeout) {
      clearTimeout(this._overlayTimeout);
    }
    this._overlayTimeout = setTimeout(() => {
      this.zone.run(() => {
        this.scrollOverlayVisible.set(false);
      });
    }, 1000);
  }

  adjustSpeed(delta: number) {
    const next = Math.min(
      this.autoScrollSpeedMax,
      Math.max(this.autoScrollSpeedMin, this.autoScrollSpeed() + delta),
    );
    this.setScrollSpeed(next);
  }

  setScrollSpeed(val: number) {
    this.autoScrollSpeed.set(val);
    if (this.isScrolling()) {
      this._updateScrollTweenSpeed();
    }
  }

  private _updateScrollTweenSpeed() {
    this.zone.runOutsideAngular(() => {
      // Target the scrollable container
      // In Stage Mode, the scrollable element is the fixed card (.p-now)
      const container = this.isStageMode()
        ? document.querySelector('.stage-mode-active .p-now')
        : document.querySelector('.app-main');

      if (!container) {
        this.zone.run(() => this.stopScroll());
        return;
      }

      const currentScroll = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const remaining = maxScroll - currentScroll;

      if (remaining <= 0) {
        this.zone.run(() => this.stopScroll());
        return;
      }

      const duration = remaining / this.autoScrollSpeed();

      if (this.scrollTween) {
        this.scrollTween.kill();
      }

      this.scrollTween = gsap.to(container, {
        scrollTo: { y: maxScroll },
        duration,
        ease: 'none',
        onUpdate: () => {
          if (this.liveSync.isConnected() && this.liveSync.isLeader()) {
            this.broadcastCurrentScroll(container as HTMLElement);
          }
        },
        onComplete: () => {
          this.zone.run(() => this.stopScroll());
        },
      });
    });
  }

  startScroll() {
    if (this.isScrolling()) return;
    if (!this.p.currentSong()) return;

    this.isScrolling.set(true);

    // Bind interruption (wheel/keys, touch will NOT stop scroll)
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = this._bindAutoScrollInterruption(() => this.stopScroll());

    this._updateScrollTweenSpeed();
  }

  stopScroll() {
    if (this.scrollTween) {
      this.scrollTween.kill();
      this.scrollTween = null;
    }
    this.isScrolling.set(false);
    this._lastTs = null;
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = null;
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
    if (this.liveSync.isConnected() && this.liveSync.isLeader()) {
      this.liveSync.broadcastSectionJump(sectionId);
    }
    const el = document.getElementById('sec-' + sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    const onKey = (e: KeyboardEvent) => {
      if (!this.isScrolling()) return;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        onInterrupt();
      }
    };

    target.addEventListener('wheel', onWheel, opts);
    target.addEventListener('keydown', onKey);

    return () => {
      target.removeEventListener('wheel', onWheel, opts);
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

  // ---- Loop Trainer Event Handlers ----
  onSelectSectionA(event: Event) {
    const val = (event.target as HTMLSelectElement).value || null;
    this.loopTrainer.setSectionA(val);
  }

  onSelectSectionB(event: Event) {
    const val = (event.target as HTMLSelectElement).value || null;
    this.loopTrainer.setSectionB(val);
  }

  onBarsChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.loopTrainer.setBarsPerLoop(val);
  }

  toggleSpeedTrainer(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.loopTrainer.setSpeedTrainer(checked);
  }

  onInitialBpmChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.loopTrainer.setInitialBpm(val);
  }

  onTargetBpmChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.loopTrainer.setTargetBpm(val);
  }

  onIncrementChange(event: Event) {
    const val = Number((event.target as HTMLSelectElement).value);
    this.loopTrainer.setBpmIncrement(val);
  }

  onRepsPerIncrementChange(event: Event) {
    const val = Number((event.target as HTMLSelectElement).value);
    this.loopTrainer.setRepsPerIncrement(val);
  }

  // ---- Live Band Mesh Synchronization ----
  getScrollContainer(): HTMLElement | null {
    if (this.isStageMode()) {
      return (
        this.document.querySelector('.stage-mode-active .p-now') ||
        this.document.querySelector('.p-now')
      );
    }
    return (
      this.document.querySelector('.app-main') ||
      (this.document.scrollingElement as HTMLElement) ||
      this.document.documentElement
    );
  }

  broadcastCurrentScroll(container: HTMLElement) {
    if (!this.liveSync.isConnected() || !this.liveSync.isLeader()) return;
    const now = Date.now();
    if (now - this.lastBroadcastScrollTs < 80) return;
    this.lastBroadcastScrollTs = now;

    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
    this.liveSync.broadcastScroll(scrollTop, scrollRatio);
  }

  getDefaultSessionId(): string {
    const currentSetlist = this.p.setlist();
    return (currentSetlist as any)?.bandId || currentSetlist?.id || 'live-stage-session';
  }

  joinLiveSession() {
    const code = this.sessionCode().trim() || this.getDefaultSessionId();
    this.liveSync.joinSession(code, this.selectedRole(), this.selectedInstrument());
  }

  toggleLiveSession() {
    if (this.liveSync.isConnected()) {
      this.liveSync.leaveSession();
    } else {
      this.joinLiveSession();
    }
  }

  sendCue(text: string, type: 'solo' | 'repeat' | 'ending' | 'next' | 'custom' = 'custom') {
    this.liveSync.broadcastStageCue(text, type);
  }

  sendCustomCue() {
    const text = this.customCueText().trim();
    if (!text) return;
    this.sendCue(text, 'custom');
    this.customCueText.set('');
  }
}
