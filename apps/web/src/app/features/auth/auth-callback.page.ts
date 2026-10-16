import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ProfilesService } from '../profile/services/profile.service';
import { SubscriptionStore } from '../../core/subscription/subscription.store';
import type { SubscriptionTier } from '@bandmate/shared';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  template: `
    <div class="bm-cb">
      <div class="bm-cb__wrap">
        <mat-card class="bm-cb__card">
          <div class="bm-cb__top">
            <div class="bm-cb__brand">
              <div class="bm-cb__logo" aria-hidden="true">
                <mat-icon>graphic_eq</mat-icon>
              </div>
              <div class="bm-cb__name">Bandmate</div>
            </div>

            <div class="bm-cb__state">
              @if (state() === 'loading') {
                <mat-progress-spinner diameter="28" mode="indeterminate"></mat-progress-spinner>
              }
              @if (state() === 'ok') {
                <mat-icon class="bm-cb__ok">check_circle</mat-icon>
              }
              @if (state() === 'timeout') {
                <mat-icon class="bm-cb__warn">error</mat-icon>
              }
            </div>
          </div>

          <div class="bm-cb__title">
            @if (state() === 'loading') {
              Signing you in…
            }
            @if (state() === 'ok') {
              Signed in! Redirecting…
            }
            @if (state() === 'timeout') {
              Still waiting for sign-in…
            }
          </div>

          <div class="bm-cb__sub">
            @if (state() === 'loading') {
              We’re finishing your studio login and syncing your repertoire.
            }
            @if (state() === 'ok') {
              Taking you to your songs.
            }
            @if (state() === 'timeout') {
              If this takes too long, try going back and signing in again.
            }
          </div>

          @if (state() === 'timeout') {
            <div class="bm-cb__actions">
              <button mat-stroked-button type="button" class="touch-target-44" (click)="goLogin()">
                <mat-icon>arrow_back</mat-icon>
                Back to login
              </button>

              <button
                mat-flat-button
                color="primary"
                type="button"
                class="touch-target-44"
                (click)="goSongs()"
                [disabled]="!auth.isAuthed()"
              >
                <mat-icon>library_music</mat-icon>
                Go to songs
              </button>
            </div>
          }
        </mat-card>

        <div class="bm-cb__foot">
          <span class="bm-cb__dot"></span>
          Secure studio session handoff
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bm-cb {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px 16px;
        background:
          radial-gradient(900px 480px at 20% 10%, rgba(233, 196, 106, 0.14), transparent 60%),
          radial-gradient(900px 480px at 80% 20%, rgba(38, 70, 83, 0.12), transparent 60%),
          var(--bm-bg, #f9f7f0);
      }

      .bm-cb__wrap {
        width: min(520px, 100%);
        display: grid;
        gap: 14px;
      }

      .bm-cb__card {
        border-radius: 20px;
        padding: 24px;
        border: 1px solid var(--bm-border, rgba(38, 70, 83, 0.12));
        box-shadow: var(--bm-shadow-2, 0 10px 24px rgba(38, 48, 53, 0.08));
        background: var(--bm-surface, #ffffff);
      }

      .bm-cb__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .bm-cb__brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .bm-cb__logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: var(--bm-gradient-dark, #264653);
        color: var(--bm-accent, #e9c46a);
        border: 1px solid rgba(233, 196, 106, 0.25);
      }

      .bm-cb__name {
        font-weight: 850;
        font-size: 1.15rem;
        letter-spacing: -0.02em;
      }

      .bm-cb__state {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
      }

      .bm-cb__ok {
        color: var(--bm-teal, #2a9d8f);
      }

      .bm-cb__warn {
        color: var(--bm-burnt, #e76f51);
      }

      .bm-cb__title {
        font-size: 1.2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 6px;
      }

      .bm-cb__sub {
        color: var(--bm-muted, rgba(38, 70, 83, 0.72));
        line-height: 1.5;
      }

      .bm-cb__actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 18px;
        flex-wrap: wrap;
      }

      .bm-cb__foot {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
        color: var(--bm-muted, rgba(38, 70, 83, 0.7));
        font-family: var(--bm-font-mono, monospace);
        font-size: 12px;
      }

      .bm-cb__dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--bm-teal, #2a9d8f);
      }
    `,
  ],
})
export class AuthCallbackPage {
  readonly auth = inject(AuthStore);
  readonly router = inject(Router);
  readonly profiles = inject(ProfilesService);
  readonly subscription = inject(SubscriptionStore);

  readonly state = signal<'loading' | 'ok' | 'timeout'>('loading');

  private timeoutId: number | null = null;

  constructor() {
    // timeout “amigable”
    this.timeoutId = window.setTimeout(() => {
      if (!this.auth.isAuthed()) this.state.set('timeout');
    }, 3500);

    // navegación reactiva, sin setInterval
    effect(() => {
      if (this.auth.isAuthed()) {
        this.state.set('ok');
        if (this.timeoutId) window.clearTimeout(this.timeoutId);

        // pequeño delay para que el usuario vea el check
        window.setTimeout(async () => {
          // Ensure profile exists
          const user = this.auth.user();
          if (user) {
            try {
              const profile = await this.profiles.ensureForUser(user);
              this.subscription.setTier((profile.subscription_tier as SubscriptionTier) || 'free');
            } catch (e) {
              console.error('Profile sync failed', e);
            }
          }

          const returnUrl = localStorage.getItem('bm_return_url');
          if (returnUrl) {
            localStorage.removeItem('bm_return_url');
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigateByUrl('/songs');
          }
        }, 350);
      }
    });
  }

  goLogin() {
    this.router.navigateByUrl('/login');
  }

  goSongs() {
    this.router.navigateByUrl('/songs');
  }
}
