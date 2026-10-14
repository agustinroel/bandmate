import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  NgZone,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SongsStore } from '../../state/songs-store';
import { ChordLineViewComponent } from '../../../../shared/ui/chord-line-view/chord-line-view';
import { WakeLockService } from '../../../practice/services/wake-lock.service';
import { MetronomeService } from '../../../practice/services/metronome.service';
import { MetronomePulseComponent } from '../../../../shared/ui/metronome-pulse/metronome-pulse';
import { TunerCompactComponent } from '../../../../shared/ui/tuner-compact/tuner-compact';
import { AnimationService } from '../../../../core/services/animation.service';
import { PedalListenerService, PedalAction } from '../../../../core/services/pedal-listener.service';

@Component({
  selector: 'app-song-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatTooltipModule,
    MatMenuModule,
    ChordLineViewComponent,
    MetronomePulseComponent,
    TunerCompactComponent,
  ],
  templateUrl: './song-viewer.component.html',
  styleUrl: './song-viewer.component.scss',
})
export class SongViewerComponent implements OnDestroy {
  readonly songId = input.required<string>();
  readonly inputTranspose = input<number>(0, { alias: 'transpose' });
  readonly hideToolbar = input<boolean>(false);
  readonly hideHeader = input(false);

  readonly store = inject(SongsStore);
  readonly metronome = inject(MetronomeService);
  readonly pedal = inject(PedalListenerService);
  private readonly animation = inject(AnimationService);
  private readonly wakeLock = inject(WakeLockService);
  private readonly zone = inject(NgZone);

  // Stage & View State
  readonly internalTranspose = signal(0);
  readonly isScrolling = signal(false);
  readonly scrollSpeed = signal(28); // px/sec
  readonly twoColumns = signal(false);
  readonly isOledDark = signal(false);
  readonly fontScale = signal(1.0); // 0.8 to 1.5

  // Tap Tempo state
  private tapTimestamps: number[] = [];

  private scrollTween: gsap.core.Tween | null = null;

  // Tool Visibility
  readonly showTuner = signal(false);

  readonly detail = computed(() => {
    const s = this.store.selected();
    if (s?.id === this.songId()) return s;
    return null;
  });

  readonly loading = computed(() => {
    const st = this.store.detailState();
    return st === 'loading' && !this.detail();
  });

  readonly error = computed(() => {
    return this.store.detailState() === 'error' ? this.store.error() : null;
  });

  // Auto-scroll internals
  private _rafId: number | null = null;
  private _lastTs: number | null = null;
  private _scrollCarry = 0;

  constructor() {
    // Synchronize initial transpose from input
    effect(
      () => {
        this.internalTranspose.set(this.inputTranspose());
      },
      { allowSignalWrites: true },
    );

    // Sync BPM when song loads
    effect(
      () => {
        const d = this.detail();
        if (d?.bpm) {
          this.metronome.setBpm(Number(d.bpm));
        }
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      const id = this.songId();
      if (id) {
        this.store.loadDetail(id);
        this.wakeLock.enable();
      }
    });

    // Subscribe to Bluetooth Pedal actions
    this.pedal.actions$.subscribe((action: PedalAction) => {
      if (action === 'scroll-down') {
        this.pedalPageScroll(1);
      } else if (action === 'scroll-up') {
        this.pedalPageScroll(-1);
      } else if (action === 'toggle-scroll') {
        this.toggleScroll();
      }
    });
  }

  ngOnDestroy() {
    this.stopScroll();
    this.wakeLock.disable();
    this.metronome.stop();
  }

  pedalPageScroll(direction: 1 | -1) {
    const container = document.querySelector('.app-main') as HTMLElement | null;
    if (!container) return;
    const pageJump = window.innerHeight * 0.65 * direction;
    container.scrollBy({ top: pageJump, behavior: 'smooth' });
  }

  toggleTwoColumns() {
    this.twoColumns.update((v) => !v);
  }

  toggleOledDark() {
    this.isOledDark.update((v) => !v);
  }

  adjustFontScale(delta: number) {
    this.fontScale.update((v) => Math.min(1.8, Math.max(0.7, +(v + delta).toFixed(1))));
  }

  onTapTempo() {
    const now = Date.now();
    this.tapTimestamps = this.tapTimestamps.filter((t) => now - t < 2500);
    this.tapTimestamps.push(now);

    if (this.tapTimestamps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.tapTimestamps.length; i++) {
        intervals.push(this.tapTimestamps[i] - this.tapTimestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      if (bpm >= 40 && bpm <= 260) {
        this.metronome.setBpm(bpm);
      }
    }
  }

  // ---- Transpose Actions ----
  adjTranspose(delta: number) {
    this.internalTranspose.update((v) => v + delta);
  }

  resetTranspose() {
    this.internalTranspose.set(0);
  }

  // ---- Scrolling Logic ----
  toggleScroll() {
    if (this.isScrolling()) {
      this.stopScroll();
    } else {
      this.startScroll();
    }
  }

  toggleTuner() {
    this.showTuner.update((v) => !v);
  }

  toggleMetronome() {
    this.metronome.toggle();
  }

  startScroll() {
    if (this.isScrolling()) return;

    const container = document.querySelector('.app-main');
    if (!container) return;

    this.isScrolling.set(true);

    this.zone.runOutsideAngular(() => {
      const currentScroll = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const remaining = maxScroll - currentScroll;

      if (remaining <= 0) {
        this.zone.run(() => this.stopScroll());
        return;
      }

      const duration = remaining / this.scrollSpeed();

      this.scrollTween = gsap.to(container, {
        scrollTo: { y: maxScroll },
        duration,
        ease: 'none',
        onComplete: () => {
          this.zone.run(() => this.stopScroll());
        },
      });
    });
  }

  stopScroll() {
    if (this.scrollTween) {
      this.scrollTween.kill();
      this.scrollTween = null;
    }
    this.isScrolling.set(false);
  }

  updateScrollSpeed(val: number | null) {
    if (val !== null) {
      this.scrollSpeed.set(val);
      if (this.isScrolling()) {
        // Restart with new speed
        this.stopScroll();
        this.startScroll();
      }
    }
  }

  // ---- Navigation ----
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    // Ignore if typing in an input (though viewer usually doesn't have them)
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key;
    if (/^[1-9]$/.test(key)) {
      const index = parseInt(key) - 1;
      this.scrollToSection(index);
    }
  }

  scrollToSection(index: number) {
    const sections = this.detail()?.sections || [];
    if (index >= 0 && index < sections.length) {
      const secId = sections[index].id;
      const el = document.getElementById(`sec-${secId}`);
      const container = document.querySelector('.app-main');
      if (el && container) {
        this.animation.smoothScrollTo(container as HTMLElement, el, 0.4);
      }
    }
  }
}
