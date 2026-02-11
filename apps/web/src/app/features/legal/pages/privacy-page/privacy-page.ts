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
        <button mat-icon-button routerLink="/login" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>

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
      </div>
    </div>
  `,
  styles: `
    .legal-page {
      min-height: 100vh;
      background: #0f1115;
      color: #e0e0e0;
      font-family: 'Outfit', sans-serif;
      padding: 40px 20px;
    }
    .legal-container {
      max-width: 720px;
      margin: 0 auto;
    }
    .back-btn {
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 20px;
    }
    .back-btn:hover {
      color: #fff;
    }
    h1 {
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.6));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }
    .last-updated {
      opacity: 0.5;
      font-size: 0.9rem;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #c9a227;
      margin-top: 32px;
      margin-bottom: 12px;
    }
    p,
    li {
      line-height: 1.7;
      opacity: 0.85;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    a {
      color: #c9a227;
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
