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
          <div class="small opacity-75 mt-1">Customize your Bandmate experience.</div>
        </div>
      </div>
    </header>

    <mat-card class="settings-card">
      <div class="settings-section">
        <h3 class="section-title">
          <mat-icon class="section-icon">palette</mat-icon>
          Appearance
        </h3>
        <p class="section-desc">Theme, dark mode, and display preferences.</p>
        <div class="coming-badge">Coming Soon</div>
      </div>

      <div class="section-divider"></div>

      <div class="settings-section">
        <h3 class="section-title">
          <mat-icon class="section-icon">music_note</mat-icon>
          Chord Display
        </h3>
        <p class="section-desc">Default instrument, notation style, and transposition.</p>
        <div class="coming-badge">Coming Soon</div>
      </div>

      <div class="section-divider"></div>

      <div class="settings-section">
        <h3 class="section-title">
          <mat-icon class="section-icon">language</mat-icon>
          Language & Region
        </h3>
        <p class="section-desc">Interface language and date/time format.</p>
        <div class="coming-badge">Coming Soon</div>
      </div>

      <div class="section-divider"></div>

      <div class="settings-section">
        <h3 class="section-title">
          <mat-icon class="section-icon">account_circle</mat-icon>
          Account
        </h3>
        <p class="section-desc">Email, password, and linked accounts.</p>
        <div class="coming-badge">Coming Soon</div>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .bm-page-header {
        margin-bottom: 16px;
      }

      .settings-card {
        border-radius: 20px;
        overflow: hidden;
        padding: 0;
      }

      .settings-section {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1rem;
        font-weight: 700;
        margin: 0;
        color: var(--bm-text-main);
      }

      .section-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--bm-primary);
      }

      .section-desc {
        font-size: 0.9rem;
        color: var(--bm-text-muted);
        margin: 0;
        padding-left: 30px;
      }

      .section-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.06);
        margin: 0;
      }

      .coming-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        background: rgba(233, 196, 106, 0.15);
        color: var(--bm-gold);
        border: 1px solid rgba(233, 196, 106, 0.3);
        margin-top: 8px;
        margin-left: 30px;
        width: fit-content;
      }
    `,
  ],
})
export class SettingsPageComponent {}
