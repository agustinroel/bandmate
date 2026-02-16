import { computed, inject, Injectable, signal } from '@angular/core';
import {
  SubscriptionTier,
  tierAtLeast,
  TIER_LIMITS,
  TIER_DISPLAY,
  getGateForFeature,
} from '@bandmate/shared';
import { MatDialog } from '@angular/material/dialog';
import { UpgradeDialogComponent } from './upgrade-dialog/upgrade-dialog.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubscriptionStore {
  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly apiBaseUrl = environment.apiBaseUrl;

  /** Current tier pulled from profile */
  readonly tier = signal<SubscriptionTier>('free');

  /** Display info for the tier badge */
  readonly display = computed(() => TIER_DISPLAY[this.tier()]);

  /** Current limits */
  readonly limits = computed(() => TIER_LIMITS[this.tier()]);

  /** Whether the user has at least a given tier */
  hasAtLeast(requiredTier: SubscriptionTier): boolean {
    return tierAtLeast(this.tier(), requiredTier);
  }

  /**
   * Sets the tier (called from profile load on app init).
   */
  setTier(tier: SubscriptionTier) {
    this.tier.set(tier);
  }

  /**
   * Fetches the current user's profile to sync the tier.
   */
  async loadCurrentTier() {
    this.loading.set(true);
    try {
      // Fetch own profile from API
      // We can use a special "me" endpoint or just get the current user session
      this.http.get<any>(`${this.apiBaseUrl}/profiles/me`).subscribe({
        next: (profile) => {
          if (profile?.subscription_tier) {
            this.setTier(profile.subscription_tier as SubscriptionTier);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load current tier', err);
          this.loading.set(false);
        },
      });
    } catch (e) {
      console.error(e);
      this.loading.set(false);
    }
  }

  /**
   * Show the upgrade dialog. Returns true if the user already has access.
   * If the user doesn't, it opens the upgrade popup and returns false.
   */
  requireTierOrUpgrade(feature: string): boolean {
    const gate = getGateForFeature(feature);
    if (!gate) return true; // No gate → allow

    if (this.hasAtLeast(gate.requiredTier)) return true;

    this.dialog.open(UpgradeDialogComponent, {
      data: {
        feature: gate.label,
        description: gate.description,
        requiredTier: gate.requiredTier,
        currentTier: this.tier(),
      },
      width: '440px',
      panelClass: 'bm-upgrade-dialog',
    });

    return false;
  }

  /**
   * Called from HTTP interceptor when a 403/LimitReached is received.
   */
  handleLimitError(error: any): boolean {
    if (error?.error?.error === 'LimitReached' || error?.error?.error === 'SubscriptionRequired') {
      this.dialog.open(UpgradeDialogComponent, {
        data: {
          feature: error.error.message,
          description: `Upgrade to ${error.error.requiredTier} to unlock this feature.`,
          requiredTier: error.error.requiredTier,
          currentTier: error.error.currentTier,
        },
        width: '440px',
        panelClass: 'bm-upgrade-dialog',
      });
      return true;
    }
    return false;
  }

  /**
   * Creates a checkout session via API and redirects to Stripe.
   */
  async createCheckoutSession(tier: 'pro' | 'studio') {
    this.loading.set(true);
    try {
      this.http
        .post<{ url: string }>(`${this.apiBaseUrl}/subscriptions/checkout`, { tier })
        .subscribe({
          next: (res) => {
            if (res.url) {
              window.location.href = res.url;
            }
          },
          error: (err) => {
            console.error('Checkout failed', err);
            this.loading.set(false);
          },
        });
    } catch (e) {
      console.error(e);
      this.loading.set(false);
    }
  }
}
