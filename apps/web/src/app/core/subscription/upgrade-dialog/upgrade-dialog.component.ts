import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TIER_DISPLAY, type SubscriptionTier } from '@bandmate/shared';
import { SubscriptionStore } from '../subscription.store';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

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
          {{ i18n.t('subscription.upgrade_to', { tier: '' }) }}
          <span class="tier-text">{{ selectedTier() === 'pro' ? 'PRO' : 'STUDIO' }}</span>
        </h2>

        <p class="generic-intro">
          {{
            selectedTier() === 'pro'
              ? i18n.t('subscription.pro_desc', 'Unlock the full power of your individual practice.')
              : i18n.t('subscription.studio_desc', 'The ultimate toolkit for bands and synchronized rehearsals.')
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
                <mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_unlimited_songs', 'Unlimited songs & setlists') }}
              </div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_practice_tools', 'Advanced practice tools') }}</div>
              <div class="perk-item">
                <mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_gamification', 'Gamification & analytics') }}
              </div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_ai_chords', 'AI Chord Suggestions') }}</div>
            } @else {
              <div class="perk-item">
                <mat-icon>check_circle</mat-icon> <strong>{{ i18n.t('subscription.perk_everything_pro', 'Everything in PRO') }}</strong>
              </div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_unlimited_bands', 'Unlimited Bands') }}</div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_live_sync', 'Live Sync Mode') }}</div>
              <div class="perk-item"><mat-icon>check_circle</mat-icon> {{ i18n.t('subscription.perk_shared_repertoire', 'Shared Repertoire') }}</div>
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
              {{ i18n.t('subscription.upgrade_to', { tier: selectedTier() === 'pro' ? 'PRO' : 'STUDIO' }) }}
            }
          </button>

          <div class="stripe-badge">
            <span class="powered-by">{{ i18n.t('subscription.powered_by', 'Powered by') }}</span>
            <img
              src="assets/stripe/Stripe_Logo,_revised_2016.svg.png"
              alt="Stripe"
              class="stripe-logo-img"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .bm-premium-dialog {
      background: #16181c;
      color: #f8fafc;
      padding: 48px 32px 32px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(233, 196, 106, 0.25);
      border-radius: 24px;
      min-width: 380px;
      max-width: 440px;
      text-align: center;
      transition: border-color 0.25s var(--bm-ease-out, cubic-bezier(0.22, 1, 0.36, 1));

      &.studio-mode {
        border-color: rgba(46, 196, 182, 0.35);

        .premium-glow {
          background: radial-gradient(circle, rgba(46, 196, 182, 0.18) 0%, transparent 70%);
        }

        .tier-text {
          color: #2ec4b6;
        }

        .bm-premium-btn {
          background: linear-gradient(135deg, #2ec4b6 0%, #0f766e 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 10px 26px rgba(46, 196, 182, 0.28);
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
      transition: background 0.4s ease;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      color: rgba(255, 255, 255, 0.5);
      z-index: 10;
    }

    .premium-title {
      font-family: var(--bm-font-display, 'Space Grotesk', sans-serif);
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      margin-bottom: 8px;
      line-height: 1.1;
    }

    .tier-text {
      font-size: 2.15rem;
      color: #f5c84b;
      transition: color 0.25s ease;
    }

    .generic-intro {
      opacity: 0.75;
      font-size: 0.95rem;
      margin-bottom: 28px;
      min-height: 2.8em;
    }

    /* Selector */
    .tier-selector {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 28px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .tier-option {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s var(--bm-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
      opacity: 0.65;

      &:hover {
        opacity: 0.9;
        background: rgba(255, 255, 255, 0.05);
      }

      &.active {
        opacity: 1;
        background: #e9c46a;
        color: #16181c;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

        .tier-price {
          color: #16181c;
          opacity: 0.85;
        }
      }

      .tier-name {
        font-family: var(--bm-font-mono, 'JetBrains Mono', monospace);
        font-weight: 800;
        font-size: 0.88rem;
        letter-spacing: 0.06em;
        margin-bottom: 2px;
      }
      .tier-price {
        font-family: var(--bm-font-mono, 'JetBrains Mono', monospace);
        font-size: 0.85rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        opacity: 0.75;
      }
    }

    /* Studio Option Active Overrides */
    .tier-option.studio-option.active {
      background: linear-gradient(135deg, #2ec4b6 0%, #0f766e 100%);
      color: white;

      .tier-price {
        color: white;
        opacity: 0.92;
      }
    }

    .pricing-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 28px;
      text-align: left;
    }

    .perk-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      opacity: 0.92;
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
      color: #2ec4b6;
    }

    .premium-actions {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .bm-premium-btn {
      height: 52px;
      border-radius: 14px;
      background: #e9c46a !important;
      color: #16181c !important;
      font-size: 1.05rem;
      font-weight: 800;
      box-shadow: 0 10px 20px rgba(233, 196, 106, 0.2);
      transition: all 0.25s var(--bm-ease-out, cubic-bezier(0.22, 1, 0.36, 1));

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(233, 196, 106, 0.3);
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
      opacity: 0.65;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.9;
      }

      .powered-by {
        font-size: 0.72rem;
        font-family: var(--bm-font-sans, 'Plus Jakarta Sans', sans-serif);
        color: rgba(255, 255, 255, 0.7);
      }

      .stripe-logo-img {
        height: 22px;
        width: auto;
        opacity: 0.9;
        filter: brightness(0) invert(1); /* Make logo white to match text */
        margin-left: 2px;
      }
    }

    .inline-spinner {
      margin: 0 auto;
    }
  `,
})
export class UpgradeDialogComponent {
  readonly i18n = inject(I18nService);
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
