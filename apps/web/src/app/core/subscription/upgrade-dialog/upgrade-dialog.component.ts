import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TIER_DISPLAY, type SubscriptionTier } from '@bandmate/shared';
import { SubscriptionStore } from '../subscription.store';

export interface UpgradeDialogData {
  feature: string;
  description: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
}

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="upgrade-dialog">
      <div class="upgrade-header">
        <div class="tier-badge">{{ tierInfo.icon }}</div>
        <h2>Upgrade to {{ tierInfo.label }}</h2>
      </div>

      <p class="feature-name">{{ data.feature }}</p>
      <p class="feature-desc">{{ data.description }}</p>

      <div class="pricing">
        @if (data.requiredTier === 'pro') {
          <div class="price">€4.99<span>/month</span></div>
        } @else {
          <div class="price">€9.99<span>/month</span></div>
        }
      </div>

      <div class="perks">
        @if (data.requiredTier === 'pro') {
          <div class="perk"><mat-icon>check_circle</mat-icon> Unlimited songs & setlists</div>
          <div class="perk"><mat-icon>check_circle</mat-icon> Advanced practice mode</div>
          <div class="perk"><mat-icon>check_circle</mat-icon> Gamification & streaks</div>
          <div class="perk"><mat-icon>check_circle</mat-icon> AI chord suggestions</div>
        } @else {
          <div class="perk"><mat-icon>check_circle</mat-icon> Everything in Pro</div>
          <div class="perk"><mat-icon>check_circle</mat-icon> Band management</div>
          <div class="perk"><mat-icon>check_circle</mat-icon> Events & ticketing</div>
          <div class="perk"><mat-icon>check_circle</mat-icon> Live synchronized mode</div>
        }
      </div>

      <div class="actions">
        <button
          mat-flat-button
          class="upgrade-btn"
          (click)="upgrade()"
          [disabled]="subscription.loading()"
        >
          @if (subscription.loading()) {
            <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
          } @else {
            Upgrade Now
          }
        </button>
        <button mat-button class="cancel-btn" (click)="close()" [disabled]="subscription.loading()">
          Maybe later
        </button>
      </div>
    </div>
  `,
  styles: `
    .upgrade-dialog {
      padding: 32px;
      text-align: center;
      font-family: 'Outfit', sans-serif;
    }
    .upgrade-header {
      margin-bottom: 20px;
    }
    .tier-badge {
      font-size: 3rem;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0;
      color: #c9a227;
    }
    .feature-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .feature-desc {
      opacity: 0.7;
      font-size: 0.95rem;
      margin-bottom: 20px;
    }
    .pricing {
      margin-bottom: 20px;
    }
    .price {
      font-size: 2.4rem;
      font-weight: 900;
      color: #c9a227;
    }
    .price span {
      font-size: 1rem;
      font-weight: 400;
      opacity: 0.6;
    }
    .perks {
      text-align: left;
      max-width: 280px;
      margin: 0 auto 24px;
    }
    .perk {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 0.95rem;
    }
    .perk mat-icon {
      color: #c9a227;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .upgrade-btn {
      height: 48px;
      border-radius: 14px;
      background: #c9a227;
      color: #0f1115;
      font-size: 1rem;
      font-weight: 700;
      position: relative;
    }
    .cancel-btn {
      opacity: 0.6;
      font-weight: 500;
    }
    .btn-spinner {
      margin: 0 auto;
    }
  `,
})
export class UpgradeDialogComponent {
  readonly tierInfo: { label: string; icon: string; color: string };
  readonly subscription = inject(SubscriptionStore);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpgradeDialogData,
    private dialogRef: MatDialogRef<UpgradeDialogComponent>,
  ) {
    this.tierInfo = TIER_DISPLAY[data.requiredTier];
  }

  upgrade() {
    this.subscription.createCheckoutSession(this.data.requiredTier as 'pro' | 'studio');
  }

  close() {
    this.dialogRef.close();
  }
}
