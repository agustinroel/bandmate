import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <header class="bm-page-header">
      <div class="d-flex align-items-start gap-3">
        <div class="bm-mark" aria-hidden="true">
          <mat-icon>settings</mat-icon>
        </div>

        <div class="flex-grow-1 min-w-0">
          <h2 class="m-0">Settings</h2>
          <div class="small opacity-75 mt-1">Preferences and account (placeholder).</div>
        </div>
      </div>
    </header>

    <mat-card class="bm-card">
      <div class="bm-card-inner">
        <div class="fw-semibold">Coming soon</div>
        <div class="small opacity-75 mt-1">
          Theme, language, chord display preferences, account & auth.
        </div>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .bm-page-header {
        margin-bottom: 12px;
      }


      .bm-card {
        border-radius: 16px;
        overflow: hidden;
      }

      .bm-card-inner {
        padding: 16px;
      }
    `,
  ],
})
export class SettingsPageComponent {}
