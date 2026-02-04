import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ProfilesService } from '../profile/services/profile.service';

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
              <div class="bm-cb__logo" aria-hidden="true">♪</div>
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
              We’re finishing your login and getting things ready.
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
              <button mat-stroked-button type="button" (click)="goLogin()">
                <mat-icon>arrow_back</mat-icon>
                Back to login
              </button>

              <button
                mat-flat-button
                type="button"
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
          Secure auth callback
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bm-cb {
        min-height: calc(100vh - 64px);
        display: grid;
        place-items: center;
        padding: 24px 16px;
        background:
          radial-gradient(900px 480px at 20% 10%, rgba(201, 162, 39, 0.16), transparent 60%),
          radial-gradient(900px 480px at 80% 20%, rgba(22, 62, 63, 0.14), transparent 60%),
          rgba(0, 0, 0, 0.01);
      }

      .bm-cb__wrap {
        width: min(520px, 100%);
        display: grid;
        gap: 12px;
      }

      .bm-cb__card {
        border-radius: 20px;
        padding: 18px 18px 16px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.07);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.75));
        backdrop-filter: blur(10px);
      }

      .bm-cb__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .bm-cb__brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .bm-cb__logo {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        font-weight: 900;
        background: rgba(201, 162, 39, 0.14);
        border: 1px solid rgba(201, 162, 39, 0.22);
      }

      .bm-cb__name {
        font-weight: 900;
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
        color: #2e7d32;
      }

      .bm-cb__warn {
        color: #c62828;
      }

      .bm-cb__title {
        font-size: 1.1rem;
        font-weight: 900;
        letter-spacing: -0.01em;
        margin-bottom: 4px;
      }

      .bm-cb__sub {
        opacity: 0.78;
        line-height: 1.35;
      }

      .bm-cb__actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 14px;
        flex-wrap: wrap;
      }

      .bm-cb__foot {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
        opacity: 0.6;
        font-size: 12px;
      }

      .bm-cb__dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: rgba(22, 62, 63, 0.55);
      }
    `,
  ],
})
export class AuthCallbackPage {
  readonly auth = inject(AuthStore);
  readonly router = inject(Router);
  readonly profiles = inject(ProfilesService);

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
              await this.profiles.ensureForUser(user);
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
