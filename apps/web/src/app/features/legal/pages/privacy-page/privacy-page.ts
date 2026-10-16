import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="legal-page">
      <div class="legal-container">
        <div class="legal-nav">
          <a mat-stroked-button routerLink="/dashboard" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            Back to Bandmate
          </a>
        </div>

        <article class="legal-card">
          <h1>Privacy Policy</h1>
          <p class="last-updated">Last updated: February 12, 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to <strong>Bandmate</strong> ("we", "us", "our"). We respect your privacy and
              are committed to protecting your personal data. This privacy policy explains how we
              collect, use, and share information when you use our web and mobile applications.
            </p>
          </section>

          <section>
            <h2>2. Data We Collect</h2>
            <ul>
              <li>
                <strong>Account data:</strong> Email, name, and profile picture provided via Google
                OAuth.
              </li>
              <li>
                <strong>Profile data:</strong> Instruments, genres, bio, and other information you
                choose to add.
              </li>
              <li>
                <strong>Content data:</strong> Songs, setlists, arrangements, and practice sessions
                you create.
              </li>
              <li>
                <strong>Usage data:</strong> Pages visited, features used, and interaction patterns
                (anonymized).
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Data</h2>
            <ul>
              <li>To provide and maintain the Bandmate service.</li>
              <li>To authenticate your identity and keep your account secure.</li>
              <li>To enable social features (public profiles, band management, community).</li>
              <li>To improve our service through anonymized analytics.</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Sharing</h2>
            <p>We do <strong>not</strong> sell your personal data. We share data only with:</p>
            <ul>
              <li><strong>Supabase</strong> – Database and authentication provider.</li>
              <li><strong>Stripe</strong> – Payment processing (only if you make purchases).</li>
              <li><strong>Google</strong> – OAuth authentication provider.</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              We retain your data as long as your account is active. You can request deletion of your
              account and all associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2>6. Your Rights (GDPR)</h2>
            <p>Under the General Data Protection Regulation, you have the right to:</p>
            <ul>
              <li>Access your personal data.</li>
              <li>Rectify inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Export your data in a portable format.</li>
              <li>Object to processing of your data.</li>
            </ul>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>
              Bandmate uses essential cookies for authentication only. We do not use tracking cookies
              or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p>
              For any privacy-related questions, contact us at
              <a href="mailto:privacy&#64;bandmate.app">privacy&#64;bandmate.app</a>.
            </p>
          </section>
        </article>
      </div>
    </div>
  `,
  styles: `
    .legal-page {
      min-height: 100vh;
      background: #030712;
      color: #f8fafc;
      font-family: var(--bm-font-sans, 'Manrope', system-ui, -apple-system, sans-serif);
      padding: 40px 20px 64px;
    }
    .legal-container {
      max-width: 760px;
      margin: 0 auto;
    }
    .legal-nav {
      margin-bottom: 24px;
    }
    .back-btn {
      min-height: 44px;
      border-radius: 12px;
      color: #f8fafc !important;
      border-color: rgba(255, 255, 255, 0.18) !important;
      font-weight: 700;
    }
    .back-btn:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(233, 196, 106, 0.45) !important;
    }
    .legal-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 40px 44px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    }
    @media (max-width: 640px) {
      .legal-card {
        padding: 24px 20px;
      }
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 850;
      letter-spacing: -0.035em;
      color: #ffffff;
      margin: 0 0 6px;
    }
    .last-updated {
      color: #94a3b8;
      font-family: var(--bm-font-mono, 'JetBrains Mono', monospace);
      font-size: 0.85rem;
      margin-bottom: 36px;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 750;
      letter-spacing: -0.015em;
      color: #e9c46a;
      margin-top: 32px;
      margin-bottom: 12px;
    }
    p,
    li {
      line-height: 1.7;
      color: #cbd5e1;
      max-width: 68ch;
    }
    strong {
      color: #f8fafc;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    a {
      color: #e9c46a;
      font-weight: 600;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    section {
      margin-bottom: 24px;
    }
  `,
})
export class PrivacyPageComponent {}
