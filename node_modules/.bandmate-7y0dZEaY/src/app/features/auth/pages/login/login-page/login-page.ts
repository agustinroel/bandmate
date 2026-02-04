import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../../core/auth/auth.store';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bm-login-wrap">
      <mat-card class="bm-login-card">
        <div class="bm-login-inner">
          <!-- Brand -->
          <div class="bm-login-brand">
            <img
              src="../../../../../../assets/brand/transparent-gold.png"
              alt="Bandmate"
              class="bm-brand-logo"
            />

            <div class="bm-brand-text">
              <div class="bm-title">Bandmate</div>
              <div class="bm-tagline">Prep · Rehearse · Play</div>
            </div>
          </div>

          <!-- Hero -->
          <div class="bm-login-hero">
            <h2>Everything ready before the first note.</h2>
            <p>
              Organize songs, shape your setlists and focus on playing — not on what comes next.
            </p>
          </div>

          <!-- Actions -->
          <div class="bm-login-actions">
            <button mat-raised-button class="bm-google-btn" (click)="signIn()" [disabled]="busy()">
              <mat-icon>
                @if (busy()) {
                  hourglass_top
                } @else {
                  login
                }
              </mat-icon>
              @if (busy()) {
                Taking you to Google…
              } @else {
                Start rehearsing with Google
              }
            </button>

            @if (busy()) {
              <div class="small opacity-75">One sec — we’re tuning things up…</div>
            }

            <button mat-button class="bm-ghost" (click)="continueGuest()">
              Take a quick look first
            </button>

            <div class="bm-login-foot">Built by musicians, for musicians.</div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .bm-login-card {
        width: min(520px, 100%);
        border-radius: 22px;
        overflow: hidden;
      }

      .bm-login-inner {
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      /* Brand */
      .bm-login-brand {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }

      .bm-logo {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: rgba(201, 162, 39, 0.2);
        color: #6b5a1e;
      }

      .bm-title {
        font-weight: 900;
        letter-spacing: -0.02em;
        font-size: 1.2rem;
      }

      .bm-tagline {
        font-size: 0.8rem;
        opacity: 0.7;
      }

      /* Hero */
      .bm-login-hero h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 850;
        letter-spacing: -0.02em;
      }

      .bm-login-hero p {
        margin: 6px 0 0;
        font-size: 0.95rem;
        opacity: 0.75;
        line-height: 1.4;
      }

      /* Actions */
      .bm-login-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
      }

      .bm-google-btn {
        height: 44px;
        font-weight: 600;
      }

      .bm-btn-ic {
        margin-right: 6px;
      }

      .bm-ghost {
        opacity: 0.75;
      }

      .bm-login-foot {
        margin-top: 8px;
        font-size: 0.75rem;
        opacity: 0.6;
        text-align: center;
      }

      .bm-brand-logo {
        width: 48px;
        height: 48px;
      }

      .bm-brand-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .bm-login-wrap {
        height: 100dvh; /* clave */
        display: grid;
        place-items: center;
        padding: 24px;
        overflow: hidden; /* también */
        min-height: 100dvh;
        overflow: hidden;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(900px 400px at 15% 10%, rgba(201, 162, 39, 0.25), transparent 40%),
          radial-gradient(700px 300px at 85% 90%, rgba(32, 82, 85, 0.25), transparent 45%), #f7f6f2;
      }
    `,
  ],
})
export class LoginPageComponent {
  readonly auth = inject(AuthStore);
  readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = computed<string | null>(() => null);

  constructor() {
    this.auth.ready.then(() => {
      if (this.auth.isAuthed()) {
        this.router.navigateByUrl('/songs');
      }
    });
  }

  async signIn() {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      await this.auth.signInWithGoogle();
    } catch (e) {
      console.error(e);
      this.busy.set(false);
    }
  }

  continueGuest() {
    this.router.navigateByUrl('/songs');
  }
}
