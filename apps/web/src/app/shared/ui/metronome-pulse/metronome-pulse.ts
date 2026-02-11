import { Component, inject, computed, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetronomeService } from '../../../features/practice/services/metronome.service';
import { AnimationService } from '../../../core/services/animation.service';
import { effect } from '@angular/core';

@Component({
  selector: 'bm-metronome-pulse',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (metronome.isPlaying()) {
      <div class="pulse-container">
        <div #pulseDot class="pulse-dot"></div>
      </div>
    }
  `,
  styles: [
    `
      .pulse-container {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .pulse-dot {
        width: 12px;
        height: 12px;
        background-color: var(--bm-burnt);
        border-radius: 50%;
        box-shadow: 0 0 10px var(--bm-burnt);
        opacity: 0.8;
      }
    `,
  ],
})
export class MetronomePulseComponent {
  readonly metronome = inject(MetronomeService);
  private readonly animation = inject(AnimationService);
  private readonly pulseDot = viewChild<ElementRef>('pulseDot');

  constructor() {
    effect(() => {
      // React to beat changes
      const b = this.metronome.beat();
      const dot = this.pulseDot();
      if (dot && b > 0) {
        this.animation.pulse(dot, 0.15);
      }
    });
  }
}
