import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-page">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>

      <div class="not-found-content">
        <div class="icon-wrap">
          <mat-icon class="big-icon" aria-hidden="true">music_off</mat-icon>
        </div>

        <h1>404</h1>
        <p class="subtitle">Uncharted Measure</p>
        <p class="desc">
          Looks like this track hasn't been recorded yet. Let's get you back to the main console.
        </p>

        <div class="not-found-actions">
          <a mat-flat-button routerLink="/dashboard" class="home-btn">
            <mat-icon>grid_view</mat-icon>
            Back to Dashboard
          </a>
          <a mat-stroked-button routerLink="/songs" class="songs-btn">
            <mat-icon>library_music</mat-icon>
            Open Repertoire
          </a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .not-found-page {
      min-height: 100vh;
      background: #030712;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--bm-font-sans, 'Manrope', system-ui, -apple-system, sans-serif);
      position: relative;
      overflow: hidden;
    }

    .bg-shape {
      position: absolute;
      filter: blur(90px);
      border-radius: 50%;
      opacity: 0.25;
      pointer-events: none;
    }
    .bg-shape-1 {
      width: 400px;
      height: 400px;
      background: rgba(233, 196, 106, 0.35);
      top: -100px;
      right: -100px;
    }
    .bg-shape-2 {
      width: 350px;
      height: 350px;
      background: rgba(42, 157, 143, 0.28);
      bottom: -80px;
      left: -80px;
    }

    .not-found-content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 44px 32px;
      max-width: 500px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
    }

    .icon-wrap {
      width: 84px;
      height: 84px;
      margin: 0 auto 20px;
      background: rgba(233, 196, 106, 0.12);
      border-radius: 24px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(233, 196, 106, 0.35);
    }
    .big-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #e9c46a;
    }

    h1 {
      font-family: var(--bm-font-mono, 'JetBrains Mono', monospace);
      font-size: 4.5rem;
      font-weight: 850;
      letter-spacing: -0.04em;
      line-height: 1;
      margin: 0;
      color: #e9c46a;
      font-variant-numeric: tabular-nums;
    }

    .subtitle {
      font-size: 1.4rem;
      font-weight: 800;
      margin: 10px 0 12px;
      color: #ffffff;
    }
    .desc {
      font-size: 1rem;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .not-found-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .home-btn {
      height: 48px;
      border-radius: 14px;
      background: #e9c46a !important;
      color: #090d16 !important;
      font-size: 0.96rem;
      font-weight: 750;
      padding: 0 24px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition:
        transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .home-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(233, 196, 106, 0.28);
    }

    .songs-btn {
      height: 48px;
      border-radius: 14px;
      color: #f8fafc !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      font-weight: 700;
      padding: 0 20px;
    }
  `,
})
export class NotFoundPageComponent {}
