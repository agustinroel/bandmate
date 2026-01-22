import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateService } from './error-state.service';

@Component({
  standalone: true,
  selector: 'bm-error-boundary',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    @if (err(); as e) {
      <div class="bm-err-wrap" role="alert" aria-live="assertive">
        <mat-card class="bm-err-card">
          <div class="bm-err-left">
            <div class="bm-err-ic" aria-hidden="true">
              <mat-icon>error_outline</mat-icon>
            </div>

            <div class="bm-err-text">
              <div class="bm-err-title">Something went wrong</div>
              <div class="bm-err-sub">
                Bandmate hit an unexpected error. You can dismiss it, or reload if it keeps
                happening.
              </div>
            </div>
          </div>

          <div class="bm-err-actions">
            <button mat-stroked-button type="button" (click)="copy(e)">
              <mat-icon class="bm-btn-ic">content_copy</mat-icon>
              Copy
            </button>

            <button mat-stroked-button type="button" (click)="dismiss()">Dismiss</button>

            <button mat-flat-button color="primary" type="button" (click)="reload()">Reload</button>
          </div>

          <details class="bm-err-details">
            <summary>Details</summary>
            <pre>{{ pretty(e) }}</pre>
          </details>
        </mat-card>
      </div>
    }
  `,
  styles: [
    `
      .bm-err-overlay {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: start center;

        padding: 18px;
        padding-top: calc(var(--bm-app-header-h) + 18px);

        background: rgba(0, 0, 0, 0.28);
        z-index: 9999;
      }

      .bm-err-card {
        pointer-events: auto; /* solo la card es clickeable */
        width: min(860px, calc(100vw - 24px));
        border-radius: 16px;
        padding: 14px;
      }

      /* Sticky banner that doesn't block the app */
      .bm-err-wrap {
        position: sticky;
        top: 12px;
        z-index: 9999;
        padding: 0 12px;
        display: grid;
        place-items: center;
        pointer-events: none; /* only card is interactive */
      }

      .bm-err-card {
        width: min(980px, calc(100vw - 24px));
        border-radius: 16px;
        padding: 12px 12px 10px;
        border: 1px solid rgba(220, 53, 69, 0.22);
        background: rgba(220, 53, 69, 0.06);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
        pointer-events: auto;
      }

      .bm-err-left {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .bm-err-ic {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: rgba(220, 53, 69, 0.12);
        border: 1px solid rgba(220, 53, 69, 0.18);
        flex: 0 0 auto;
      }

      .bm-err-text {
        min-width: 0;
      }

      .bm-err-title {
        font-weight: 800;
        letter-spacing: -0.01em;
      }

      .bm-err-sub {
        opacity: 0.78;
        margin-top: 2px;
        font-size: 0.92rem;
      }

      .bm-err-actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .bm-btn-ic {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: 6px;
      }

      .bm-err-details {
        margin-top: 10px;
        opacity: 0.92;
      }

      .bm-err-details summary {
        cursor: pointer;
        opacity: 0.85;
        user-select: none;
      }

      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 8px 0 0;
        font-size: 12px;
        line-height: 1.35;
        opacity: 0.92;
      }

      @media (max-width: 520px) {
        .bm-err-actions {
          justify-content: stretch;
        }
        .bm-err-actions button {
          flex: 1 1 auto;
        }
      }
    `,
  ],
})
export class ErrorBoundaryComponent {
  private readonly errors = inject(ErrorStateService);
  readonly err = computed(() => this.errors.lastError());

  dismiss() {
    this.errors.clear();
  }

  reload() {
    location.reload();
  }

  pretty(e: any) {
    return JSON.stringify(e, null, 2);
  }

  async copy(e: any) {
    try {
      await navigator.clipboard.writeText(this.pretty(e));
    } catch {
      // silent fail
    }
  }
}
