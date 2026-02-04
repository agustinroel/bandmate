import { Component, Input, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-achievement-toast',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (isVisible()) {
      <div class="bm-achievement-toast" [@slideInOut]>
        <div class="bm-achievement-gold-ring">
          <div class="bm-achievement-icon-wrapper">
            <mat-icon>{{ achievement?.icon || 'emoji_events' }}</mat-icon>
          </div>
        </div>
        <div class="bm-achievement-content">
          <div class="bm-achievement-label">LOGRO DESBLOQUEADO</div>
          <div class="bm-achievement-title">{{ achievement?.title }}</div>
          <div class="bm-achievement-desc">{{ achievement?.description }}</div>
        </div>
        <div class="bm-achievement-glint"></div>
      </div>
    }
  `,
  styles: `
    .bm-achievement-toast {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
      border: 1px solid rgba(233, 196, 106, 0.4);
      padding: 16px 20px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 300px;
      max-width: 400px;
      box-shadow:
        0 20px 48px -12px rgba(0, 0, 0, 0.5),
        0 0 20px rgba(233, 196, 106, 0.15);
      color: white;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        border: 2px solid transparent;
        background: linear-gradient(135deg, #e9c46a, #f4a261) border-box;
        -webkit-mask:
          linear-gradient(#fff 0 0) padding-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: destination-out;
        mask-composite: exclude;
      }
    }

    .bm-achievement-gold-ring {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e9c46a 0%, #f4a261 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      flex-shrink: 0;
      animation: bmRotateGlow 4s linear infinite;
    }

    .bm-achievement-icon-wrapper {
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: #e9c46a;
        font-size: 28px;
        width: 28px;
        height: 28px;
        filter: drop-shadow(0 0 8px rgba(233, 196, 106, 0.5));
      }
    }

    .bm-achievement-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-achievement-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #e9c46a;
      text-transform: uppercase;
    }

    .bm-achievement-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.01em;
    }

    .bm-achievement-desc {
      font-size: 0.85rem;
      opacity: 0.7;
      line-height: 1.3;
    }

    .bm-achievement-glint {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transform: skewX(-25deg);
      animation: bmGlint 3s infinite;
    }

    @keyframes bmRotateGlow {
      0% {
        box-shadow: 0 0 5px rgba(233, 196, 106, 0.2);
      }
      50% {
        box-shadow: 0 0 20px rgba(233, 196, 106, 0.4);
      }
      100% {
        box-shadow: 0 0 5px rgba(233, 196, 106, 0.2);
      }
    }

    @keyframes bmGlint {
      0% {
        left: -100%;
      }
      30% {
        left: 200%;
      }
      100% {
        left: 200%;
      }
    }

    @media (max-width: 600px) {
      .bm-achievement-toast {
        top: auto;
        bottom: 24px;
        right: 16px;
        left: 16px;
        min-width: 0;
      }
    }
  `,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(120%)', opacity: 0 }),
        animate(
          '500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ transform: 'translateX(0)', opacity: 1 }),
        ),
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ transform: 'translateX(120%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class AchievementToastComponent {
  achievement: Achievement | null = null;
  isVisible = signal(false);

  show(achievement: Achievement) {
    this.achievement = achievement;
    this.isVisible.set(true);
    setTimeout(() => this.isVisible.set(false), 5000);
  }
}
