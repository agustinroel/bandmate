import { Component, inject, ElementRef, viewChild, effect, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetronomeService } from '../../../features/practice/services/metronome.service';
import { AnimationService } from '../../../core/services/animation.service';
import gsap from 'gsap';

@Component({
  selector: 'bm-metronome-pulse',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (metronome.isPlaying()) {
      <div class="pulse-container d-flex align-items-center gap-1">
        @for (b of [1, 2, 3, 4]; track b) {
          <div
            #dots
            class="pulse-dot"
            [class.active]="metronome.beatInBar() === b"
            [class.downbeat]="b === 1"
          ></div>
        }
      </div>
    }
  `,
  styles: [
    `
      .pulse-container {
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--bm-border-subtle, rgba(255, 255, 255, 0.2));
        transition: background-color 0.1s ease;
      }
      .pulse-dot.active {
        background-color: var(--bm-burnt, #e76f51);
        box-shadow: 0 0 8px var(--bm-burnt, #e76f51);
      }
      .pulse-dot.downbeat.active {
        background-color: #2a9d8f;
        box-shadow: 0 0 10px #2a9d8f;
        transform: scale(1.2);
      }
    `,
  ],
})
export class MetronomePulseComponent {
  readonly metronome = inject(MetronomeService);
  private readonly animation = inject(AnimationService);

  constructor() {
    effect(() => {
      const b = this.metronome.beat();
      const beatInBar = this.metronome.beatInBar();
      if (b > 0) {
        // High-precision GSAP flash on the active beat synchronized via Tone.Transport
        const activeEl = document.querySelector('.pulse-dot.active');
        if (activeEl) {
          gsap.fromTo(
            activeEl,
            { scale: beatInBar === 1 ? 1.4 : 1.2 },
            { scale: 1, duration: 0.15, ease: 'power2.out' },
          );
        }
      }
    });
  }
}
