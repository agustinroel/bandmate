import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Achievement } from '../achievement-toast/achievement-toast.component';

@Component({
  selector: 'app-achievement-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bm-achievement-card">
      <div class="bm-achievement-gold-ring">
        <div class="bm-achievement-icon-wrapper">
          <mat-icon>{{ achievement.icon }}</mat-icon>
        </div>
      </div>
      <div class="bm-achievement-content">
        <div class="bm-achievement-title">{{ achievement.title }}</div>
        <div class="bm-achievement-desc">{{ achievement.description }}</div>
      </div>
      <div class="bm-achievement-glint"></div>
    </div>
  `,
  styles: `
    .bm-achievement-card {
      background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
      border: 1px solid rgba(233, 196, 106, 0.2);
      padding: 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      cursor: default;

      &:hover {
        transform: translateY(-4px) scale(1.02);
        border-color: rgba(233, 196, 106, 0.5);
        box-shadow:
          0 20px 48px -12px rgba(0, 0, 0, 0.5),
          0 0 20px rgba(233, 196, 106, 0.2);

        .bm-achievement-gold-ring {
          animation: bmRotateGlow 2s linear infinite;
        }

        .bm-achievement-glint {
          animation: bmGlint 1.5s infinite;
        }
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        border: 1.5px solid transparent;
        background: linear-gradient(135deg, #e9c46a, #f4a261) border-box;
        -webkit-mask:
          linear-gradient(#fff 0 0) padding-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: destination-out;
        mask-composite: exclude;
        opacity: 0.4;
      }
    }

    .bm-achievement-gold-ring {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e9c46a 0%, #f4a261 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      flex-shrink: 0;
      transition: all 0.3s ease;
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
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .bm-achievement-content {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .bm-achievement-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.01em;
    }

    .bm-achievement-desc {
      font-size: 0.75rem;
      opacity: 0.6;
      line-height: 1.2;
      color: #f4f1de;
    }

    .bm-achievement-glint {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
      transform: skewX(-25deg);
    }

    @keyframes bmRotateGlow {
      0% {
        box-shadow: 0 0 5px rgba(233, 196, 106, 0.2);
      }
      50% {
        box-shadow: 0 0 15px rgba(233, 196, 106, 0.4);
      }
      100% {
        box-shadow: 0 0 5px rgba(233, 196, 106, 0.2);
      }
    }

    @keyframes bmGlint {
      0% {
        left: -100%;
      }
      100% {
        left: 200%;
      }
    }
  `,
})
export class AchievementCardComponent {
  @Input({ required: true }) achievement!: Achievement;
}
