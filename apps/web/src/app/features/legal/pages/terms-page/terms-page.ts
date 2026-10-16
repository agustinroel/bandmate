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
          <h1>Terms of Service</h1>
          <p class="last-updated">Last updated: February 12, 2026</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>Bandmate</strong> ("the Service"), you agree to be bound
              by these Terms of Service. If you do not agree, you may not use the Service.
            </p>
          </section>

          <section>
            <h2>2. The Service</h2>
            <p>
              Bandmate is a platform for musicians to organize their repertoire, practice songs,
              manage setlists, collaborate with bands, and discover other musicians. We offer free and
              paid subscription tiers.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <ul>
              <li>You must sign in using a valid Google account.</li>
              <li>You are responsible for all activity under your account.</li>
              <li>You must not share your account credentials.</li>
            </ul>
          </section>

          <section>
            <h2>4. User Content</h2>
            <ul>
              <li>You retain ownership of all songs, setlists, and arrangements you create.</li>
              <li>
                By publishing content to the community, you grant Bandmate a license to display it
                within the platform.
              </li>
              <li>You must not upload copyrighted content that you do not have rights to.</li>
            </ul>
          </section>

          <section>
            <h2>5. Subscriptions &amp; Payments</h2>
            <ul>
              <li>Free tier: Limited songs and setlists with basic features.</li>
              <li>Pro tier: Unlimited songs/setlists, advanced practice, gamification.</li>
              <li>Studio tier: All Pro features plus bands, events, and live mode.</li>
              <li>Payments are processed by Stripe. Refunds follow our cancellation policy.</li>
            </ul>
          </section>

          <section>
            <h2>6. Prohibited Use</h2>
            <ul>
              <li>Do not use the Service for any illegal purpose.</li>
              <li>Do not attempt to gain unauthorized access to other accounts or systems.</li>
              <li>Do not abuse, harass, or threaten other users.</li>
              <li>Do not use automated bots or scrapers against the Service.</li>
            </ul>
          </section>

          <section>
            <h2>7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms.
              You may delete your account at any time from the Settings page.
            </p>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>
              Bandmate is provided "as is" without warranties of any kind. We are not liable for any
              data loss, service interruptions, or damages arising from the use of the Service.
            </p>
          </section>

          <section>
            <h2>9. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              have been published constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>
              For questions about these terms, contact us at
              <a href="mailto:legal&#64;bandmate.app">legal&#64;bandmate.app</a>.
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
export class TermsPageComponent {}
