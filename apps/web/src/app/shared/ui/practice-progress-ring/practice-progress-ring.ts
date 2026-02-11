import {
  Component,
  input,
  computed,
  effect,
  signal,
  inject,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import gsap from 'gsap';
import { AnimationService } from '../../../core/services/animation.service';

@Component({
  selector: 'bm-practice-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ring-container">
      <svg
        [attr.width]="size()"
        [attr.height]="size()"
        [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
        class="ring-svg"
      >
        <!-- Background track -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke-width]="strokeWidth()"
          class="ring-bg"
        />
        <!-- Progress arc -->
        <circle
          #progressCircle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke-width]="strokeWidth()"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="circumference()"
          stroke-linecap="round"
          class="ring-progress"
          [class.ring-complete]="fraction() >= 1"
        />
      </svg>

      <!-- Center content -->
      <div class="ring-label">
        <span class="ring-current">{{ current() }}</span>
        <span class="ring-sep">/</span>
        <span class="ring-total">{{ total() }}</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .ring-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .ring-svg {
      transform: rotate(-90deg);
    }

    .ring-bg {
      stroke: rgba(0, 0, 0, 0.08);
    }

    .ring-progress {
      stroke: var(--bm-teal, #2a9d8f);
      transition: stroke 0.3s ease;
    }

    .ring-progress.ring-complete {
      stroke: var(--bm-gold, #e9c46a);
    }

    .ring-label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      font-family: var(--bm-font-sans, 'Inter', system-ui, sans-serif);
      font-weight: 800;
      pointer-events: none;
    }

    .ring-current {
      font-size: 1.1em;
      color: var(--bm-wood, #264653);
    }

    .ring-sep {
      font-size: 0.75em;
      opacity: 0.4;
    }

    .ring-total {
      font-size: 0.85em;
      opacity: 0.6;
    }
  `,
})
export class PracticeProgressRingComponent {
  private readonly animation = inject(AnimationService);

  /** Current song index (1-based) */
  readonly current = input.required<number>();
  /** Total songs in the setlist */
  readonly total = input.required<number>();

  /** Visual size in px */
  readonly size = input(56);
  /** Ring thickness */
  readonly strokeWidth = input(5);

  readonly progressCircle = viewChild<ElementRef<SVGCircleElement>>('progressCircle');

  readonly center = computed(() => this.size() / 2);
  readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly fraction = computed(() => {
    const t = this.total();
    if (t <= 0) return 0;
    return Math.min(this.current() / t, 1);
  });

  private prevFraction = 0;

  constructor() {
    // Animate the stroke-dashoffset whenever the fraction changes
    effect(() => {
      const frac = this.fraction();
      const circ = this.circumference();
      const circle = this.progressCircle();

      if (!circle) return;

      const targetOffset = circ * (1 - frac);

      gsap.to(circle.nativeElement, {
        strokeDashoffset: targetOffset,
        duration: 0.8,
        ease: 'power2.out',
      });

      this.prevFraction = frac;
    });
  }
}
