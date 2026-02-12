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
          <mat-icon class="big-icon">music_off</mat-icon>
        </div>

        <h1>404</h1>
        <p class="subtitle">This page doesn't exist... yet 🎸</p>
        <p class="desc">Looks like this track hasn't been recorded. Let's get you back on stage.</p>

        <a mat-flat-button routerLink="/dashboard" class="home-btn">
          <mat-icon>grid_view</mat-icon>
          Back to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: `
    .not-found-page {
      min-height: 100vh;
      background: #0f1115;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      position: relative;
      overflow: hidden;
    }

    .bg-shape {
      position: absolute;
      filter: blur(80px);
      border-radius: 50%;
      opacity: 0.3;
    }
    .bg-shape-1 {
      width: 400px;
      height: 400px;
      background: rgba(201, 162, 39, 0.4);
      top: -100px;
      right: -100px;
    }
    .bg-shape-2 {
      width: 350px;
      height: 350px;
      background: rgba(144, 44, 30, 0.3);
      bottom: -80px;
      left: -80px;
    }

    .not-found-content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 40px 20px;
      max-width: 480px;
    }

    .icon-wrap {
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 28px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .big-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.6;
    }

    h1 {
      font-size: 5rem;
      font-weight: 900;
      letter-spacing: -0.04em;
      margin: 0;
      background: linear-gradient(135deg, #c9a227, rgba(201, 162, 39, 0.5));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 8px 0 16px;
      opacity: 0.9;
    }
    .desc {
      font-size: 1rem;
      opacity: 0.6;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .home-btn {
      height: 52px;
      border-radius: 16px;
      background: #c9a227;
      color: #0f1115;
      font-size: 1rem;
      font-weight: 700;
      padding: 0 28px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .home-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(201, 162, 39, 0.3);
    }
  `,
})
export class NotFoundPageComponent {}
