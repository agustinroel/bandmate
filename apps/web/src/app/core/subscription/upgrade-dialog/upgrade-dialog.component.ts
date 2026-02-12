import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TIER_DISPLAY, type SubscriptionTier } from '@bandmate/shared';
import { SubscriptionStore } from '../subscription.store';
import { CommonModule } from '@angular/common';

export interface UpgradeDialogData {
  feature: string;
  description: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="bm-premium-dialog" [class.studio-mode]="selectedTier() === 'studio'">
      <!-- Decoration -->
      <div class="premium-glow"></div>

      <button mat-icon-button class="close-btn" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>

      <div class="upgrade-content">
        <h2 class="premium-title">
          Upgrade to
          <span class="tier-text">{{ selectedTier() === 'pro' ? 'PRO' : 'STUDIO' }}</span>
        </h2>

        <p class="generic-intro">
          {{
            selectedTier() === 'pro'
              ? 'Unlock the full power of your individual practice.'
              : 'The ultimate toolkit for bands and synchronized rehearsals.'
          }}
        </p>

        <!-- Tier Selector -->
        <div class="tier-selector">
          <div
            class="tier-option"
            [class.active]="selectedTier() === 'pro'"
            (click)="selectTier('pro')"
          >
            <div class="tier-name">PRO</div>
            <div class="tier-price">€4.99</div>
          </div>
          <div
            class="tier-option studio-option"
            [class.active]="selectedTier() === 'studio'"
            (click)="selectTier('studio')"
          >
            <div class="tier-name">STUDIO</div>
            <div class="tier-price">€9.99</div>
          </div>
        </div>

        <div class="pricing-card">
          <div class="feature-list">
            @if (selectedTier() === 'pro') {
              <div class="perk-item">
                <mat-icon>check_circle</mat-icon> Unlimited songs & setlists
              </div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> Advanced practice tools</div>
              <div class="perk-item">
                <mat-icon>check_circle</mat-icon> Gamification & analytics
              </div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> AI Chord Suggestions</div>
            } @else {
              <div class="perk-item">
                <mat-icon>check_circle</mat-icon> <strong>Everything in PRO</strong>
              </div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> Unlimited Bands</div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> Live Sync Mode</div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> Shared Repertoire</div>
            }
          </div>
        </div>

        <div class="premium-actions">
          <button
            mat-flat-button
            class="bm-premium-btn"
            (click)="upgrade()"
            [disabled]="subscription.loading()"
          >
            @if (subscription.loading()) {
              <mat-spinner diameter="24" class="inline-spinner"></mat-spinner>
            } @else {
              Upgrade to {{ selectedTier() === 'pro' ? 'PRO' : 'STUDIO' }}
            }
          </button>

          <div class="stripe-badge">
            <span class="powered-by">Powered by</span>
            <span class="stripe-logo">stripe</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .bm-premium-dialog {
      background: #0f1115;
      color: #ffffff;
      padding: 48px 32px 32px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(233, 196, 106, 0.2);
      border-radius: 28px;
      min-width: 380px;
      max-width: 440px;
      text-align: center;
      transition: border-color 0.3s ease;

      &.studio-mode {
        border-color: rgba(199, 125, 255, 0.3);

        .premium-glow {
          background: radial-gradient(circle, rgba(199, 125, 255, 0.2) 0%, transparent 70%);
        }

        .tier-text {
          background: linear-gradient(135deg, #ff4d4d 0%, #c77dff 50%, #4d96ff 100%);
          -webkit-background-clip: text;
        }

        .bm-premium-btn {
          background: linear-gradient(135deg, #ff4d4d 0%, #c77dff 50%, #4d96ff 100%) !important;
          color: white !important;
          box-shadow: 0 10px 30px rgba(199, 125, 255, 0.3);
        }
      }
    }

    .premium-glow {
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(233, 196, 106, 0.15) 0%, transparent 70%);
      pointer-events: none;
      transition: background 0.5s ease;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      color: rgba(255, 255, 255, 0.4);
      z-index: 10;
    }

    .premium-title {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.05em;
      margin-bottom: 8px;
      line-height: 1.1;
    }

    .tier-text {
      font-size: 2.2rem;
      color: #e9c46a;
      background: linear-gradient(90deg, #e9c46a, #f4a261);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      transition: all 0.3s ease;
    }

    .generic-intro {
      opacity: 0.7;
      font-size: 0.95rem;
      margin-bottom: 32px;
      min-height: 2.8em;
    }

    /* Selector */
    .tier-selector {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 4px;
      margin-bottom: 32px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tier-option {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0.6;

      &:hover {
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.05);
      }

      &.active {
        opacity: 1;
        background: #e9c46a;
        color: #0f1115;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

        .tier-price {
          color: #0f1115;
          opacity: 0.8;
        }
      }

      .tier-name {
        font-weight: 900;
        font-size: 0.9rem;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      }
      .tier-price {
        font-size: 0.85rem;
        font-weight: 600;
        opacity: 0.7;
      }
    }

    /* Studio Option Active Overrides */
    .tier-option.studio-option.active {
      background: linear-gradient(135deg, #ff4d4d 0%, #c77dff 50%, #4d96ff 100%);
      color: white;

      .tier-price {
        color: white;
        opacity: 0.9;
      }
    }

    .pricing-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }

    .perk-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      mat-icon {
        color: #e9c46a;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .studio-mode .perk-item mat-icon {
      color: #c77dff;
    }

    .premium-actions {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .bm-premium-btn {
      height: 56px;
      border-radius: 18px;
      background: #e9c46a !important;
      color: #0f1115 !important;
      font-size: 1.1rem;
      font-weight: 800;
      box-shadow: 0 10px 20px rgba(233, 196, 106, 0.2);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 30px rgba(233, 196, 106, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        background: rgba(255, 255, 255, 0.1) !important;
        color: rgba(255, 255, 255, 0.3) !important;
      }
    }

    .stripe-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      opacity: 0.6;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.9;
      }

      .powered-by {
        font-size: 0.7rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: rgba(255, 255, 255, 0.7);
      }

      .stripe-logo {
        font-weight: 900;
        font-size: 0.95rem;
        letter-spacing: -0.02em;
        font-family: 'Inter', sans-serif;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 2px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          margin-left: 2px;
        }
      }
    }

    .inline-spinner {
      margin: 0 auto;
    }
  `,
})
export class UpgradeDialogComponent {
  readonly subscription = inject(SubscriptionStore);

  // Signal to track user selection
  readonly selectedTier = signal<'pro' | 'studio'>('pro');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpgradeDialogData,
    private dialogRef: MatDialogRef<UpgradeDialogComponent>,
  ) {
    if (!this.data) {
      this.data = {
        feature: 'Premium Access',
        description: 'Scale your music to the next level.',
        requiredTier: 'pro',
        currentTier: 'free',
      };
    }

    // Auto-select tier if one is required
    if (this.data.requiredTier === 'studio') {
      this.selectedTier.set('studio');
    }
  }

  selectTier(tier: 'pro' | 'studio') {
    this.selectedTier.set(tier);
  }

  upgrade() {
    this.subscription.createCheckoutSession(this.selectedTier());
  }

  close() {
    this.dialogRef.close();
  }
}
