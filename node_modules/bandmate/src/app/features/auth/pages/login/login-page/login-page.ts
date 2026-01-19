import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bm-login-wrap">
      <mat-card class="bm-login-card">
        <div class="bm-login-inner">
          <div class="bm-login-brand">
            <div class="bm-logo" aria-hidden="true">BM</div>
            <div>
              <div class="bm-title">Bandmate</div>
              <div class="small opacity-75">Less chaos. More music.</div>
            </div>
          </div>

          <div class="bm-login-body">
            <div class="fw-semibold">Login</div>
            <div class="small opacity-75 mt-1">
              Placeholder page. We’ll add Google OAuth / JWT later.
            </div>

            <div class="bm-login-actions">
              <button mat-raised-button color="primary" type="button" disabled>
                <mat-icon class="bm-btn-ic">login</mat-icon>
                Sign in with Google
              </button>

              <a mat-button routerLink="/home">Continue without login</a>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .bm-login-wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.02);
      }

      .bm-login-card {
        width: min(520px, 100%);
        border-radius: 18px;
        overflow: hidden;
      }

      .bm-login-inner {
        padding: 18px;
      }

      .bm-login-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }

      .bm-logo {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        font-weight: 900;
        background: rgba(201, 162, 39, 0.18);
      }

      .bm-title {
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .bm-login-body {
        padding-top: 14px;
      }

      .bm-login-actions {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .bm-btn-ic {
        font-size: 18px;
        height: 18px;
        width: 18px;
        margin-right: 6px;
      }
    `,
  ],
})
export class LoginPageComponent {}
