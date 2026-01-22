import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <header class="bm-page-header">
      <div class="d-flex align-items-start gap-3">
        <div class="bm-mark" aria-hidden="true">
          <mat-icon>home</mat-icon>
        </div>

        <div class="flex-grow-1 min-w-0">
          <h2 class="m-0">Home</h2>
          <div class="small opacity-75 mt-1">Your rehearsal-ready workspace.</div>
        </div>
      </div>
    </header>

    <div class="bm-home-grid">
      <mat-card class="bm-card">
        <div class="bm-card-inner">
          <div class="bm-card-title">Songs</div>
          <div class="bm-card-sub small opacity-75">Create, edit and organize your library.</div>
          <div class="bm-card-actions">
            <a mat-stroked-button color="primary" routerLink="/songs">
              <mat-icon class="bm-btn-ic">music_note</mat-icon>
              Open songs
            </a>
            <a mat-button routerLink="/songs/new">New song</a>
          </div>
        </div>
      </mat-card>

      <mat-card class="bm-card">
        <div class="bm-card-inner">
          <div class="bm-card-title">Setlists</div>
          <div class="bm-card-sub small opacity-75">Group songs and order them for gigs.</div>
          <div class="bm-card-actions">
            <a mat-stroked-button color="primary" routerLink="/setlists">
              <mat-icon class="bm-btn-ic">queue_music</mat-icon>
              Open setlists
            </a>
          </div>
        </div>
      </mat-card>

      <mat-card class="bm-card">
        <div class="bm-card-inner">
          <div class="bm-card-title">Practice</div>
          <div class="bm-card-sub small opacity-75">Minimal practice tools (MVP placeholders).</div>
          <div class="bm-card-actions">
            <a mat-stroked-button color="primary" routerLink="/practice">
              <mat-icon class="bm-btn-ic">fitness_center</mat-icon>
              Open practice
            </a>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .bm-page-header {
        margin-bottom: 12px;
      }

      .bm-mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: rgba(201, 162, 39, 0.16);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .bm-home-grid {
        display: grid;
        gap: 14px;
      }

      @media (min-width: 900px) {
        .bm-home-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .bm-card {
        border-radius: 16px;
        overflow: hidden;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
      }

      .bm-card-inner {
        padding: 16px;
      }

      .bm-card-title {
        font-weight: 800;
        letter-spacing: 0.2px;
      }

      .bm-card-sub {
        margin-top: 4px;
      }

      .bm-card-actions {
        margin-top: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
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
export class HomePageComponent {}
