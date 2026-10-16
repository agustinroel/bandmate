import {
  Component,
  computed,
  inject,
  signal,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="bm-login-wrap" #container>
      <!-- Premium Background elements -->
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>

      <div class="bm-login-container">
        <!-- Logo & Brand staggered entrance -->
        <div class="bm-brand-hero" #hero>
          <div class="logo-circle">
            <img
              src="../../../../../../assets/brand/transparent-gold.png"
              alt="Bandmate"
              class="bm-brand-logo"
            />
          </div>
          <h1 class="bm-main-title">Bandmate</h1>
          <p class="bm-main-tagline">Prep · Rehearse · Play</p>
        </div>

        <!-- Glassmorphism Studio Console Card -->
        <div class="bm-glass-card" #card>
          <div class="bm-card-content">
            <h2 class="card-title">Ready for the stage?</h2>
            <p class="card-desc">
              The complete studio &amp; stage workspace for musicians. Organize your ChordPro
              repertoire, lock in your timing, and synchronize live with your band.
            </p>

            <div class="bm-feature-pills" aria-label="Platform capabilities">
              <span class="bm-feature-pill">
                <mat-icon aria-hidden="true">library_music</mat-icon>
                ChordPro &amp; Transpose
              </span>
              <span class="bm-feature-pill">
                <mat-icon aria-hidden="true">graphic_eq</mat-icon>
                60 FPS Strobe Tuner
              </span>
              <span class="bm-feature-pill">
                <mat-icon aria-hidden="true">sensors</mat-icon>
                Live Band Sync
              </span>
            </div>

            <div class="bm-actions">
              <button
                mat-flat-button
                class="bm-google-btn"
                (click)="signIn()"
                [disabled]="busy()"
                #loginBtn
              >
                <div class="btn-inner">
                  @if (busy()) {
                    <mat-icon class="spinning">hourglass_top</mat-icon>
                    <span>Connecting to studio...</span>
                  } @else {
                    <svg class="google-logo" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  }
                </div>
              </button>
            </div>
          </div>
        </div>

        <footer class="bm-footer" #footer>
          <div class="bm-footer-tagline">Crafted with precision for every musician &amp; ensemble.</div>
          <div class="legal-links">
            <a routerLink="/privacy">Privacy Policy</a>
            <span class="sep" aria-hidden="true">·</span>
            <a routerLink="/terms">Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: `
    .bm-login-wrap {
      min-height: 100vh;
      width: 100%;
      background:
        radial-gradient(circle at 20% 15%, rgba(233, 196, 106, 0.14) 0%, transparent 45%),
        radial-gradient(circle at 80% 85%, rgba(42, 157, 143, 0.14) 0%, transparent 50%),
        #030712;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      font-family: var(--bm-font-sans, 'Manrope', system-ui, -apple-system, sans-serif);
    }

    /* Ambient studio lighting shapes */
    .bg-shape {
      position: absolute;
      filter: blur(90px);
      z-index: 1;
      border-radius: 50%;
      opacity: 0.28;
      pointer-events: none;
    }
    .bg-shape-1 {
      width: 380px;
      height: 380px;
      background: rgba(233, 196, 106, 0.35);
      top: -100px;
      left: -100px;
    }
    .bg-shape-2 {
      width: 460px;
      height: 460px;
      background: rgba(38, 70, 83, 0.45);
      bottom: -140px;
      right: -140px;
    }
    .bg-shape-3 {
      width: 280px;
      height: 280px;
      background: rgba(42, 157, 143, 0.22);
      top: 48%;
      left: 50%;
    }

    .bm-login-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 460px;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Brand Hero */
    .bm-brand-hero {
      margin-bottom: 32px;
    }
    .logo-circle {
      width: 76px;
      height: 76px;
      background: rgba(15, 23, 42, 0.85);
      border-radius: 22px;
      display: grid;
      place-items: center;
      margin: 0 auto 18px;
      border: 1px solid rgba(233, 196, 106, 0.35);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }
    .bm-brand-logo {
      width: 46px;
      height: 46px;
    }
    .bm-main-title {
      font-size: 2.8rem;
      font-weight: 850;
      letter-spacing: -0.035em;
      line-height: 1.08;
      margin: 0;
      color: #f8fafc;
    }
    .bm-main-tagline {
      font-family: var(--bm-font-mono, 'JetBrains Mono', monospace);
      font-size: 0.82rem;
      color: #e9c46a;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin-top: 8px;
      margin-bottom: 0;
    }

    /* Studio Console Card */
    .bm-glass-card {
      width: 100%;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow:
        0 24px 48px -12px rgba(0, 0, 0, 0.55),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    .card-title {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff;
      margin: 0 0 10px;
    }
    .card-desc {
      font-size: 0.96rem;
      color: #cbd5e1;
      line-height: 1.6;
      margin: 0 0 22px;
    }

    .bm-feature-pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 28px;
    }

    .bm-feature-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      font-family: var(--bm-font-mono, 'JetBrains Mono', monospace);
      font-size: 0.72rem;
      font-weight: 600;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #e9c46a;
      }
    }

    /* Actions */
    .bm-actions {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .bm-google-btn {
      height: 52px;
      border-radius: 14px;
      background: #f8fafc !important;
      color: #090d16 !important;
      font-size: 1rem;
      font-weight: 750;
      border: 1px solid rgba(255, 255, 255, 0.9);
      transition:
        transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1),
        background 200ms cubic-bezier(0.22, 1, 0.36, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bm-google-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(233, 196, 106, 0.22);
      background: #ffffff !important;
    }
    .btn-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #090d16;
    }
    .google-logo {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .spinning {
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .bm-footer {
      margin-top: 32px;
      font-size: 0.85rem;
      color: #94a3b8;
      text-align: center;
    }
    .bm-footer-tagline {
      color: #94a3b8;
      font-weight: 500;
    }
    .legal-links {
      margin-top: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .legal-links a {
      color: #cbd5e1;
      text-decoration: none;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 6px;
      transition: color 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .legal-links a:hover {
      color: #e9c46a;
      text-decoration: underline;
    }
    .sep {
      color: #64748b;
    }
  `,
})
export class LoginPageComponent implements AfterViewInit {
  @ViewChild('hero') hero!: ElementRef;
  @ViewChild('card') card!: ElementRef;
  @ViewChild('footer') footer!: ElementRef;
  @ViewChild('loginBtn') loginBtn!: ElementRef;
  @ViewChild('container') container!: ElementRef;

  readonly auth = inject(AuthStore);
  readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = computed<string | null>(() => null);

  constructor() {
    this.auth.ready.then(() => {
      if (this.auth.isAuthed()) {
        this.router.navigateByUrl('/songs');
      }
    });
  }

  ngAfterViewInit() {
    this.initAnimations();
  }

  private initAnimations() {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    gsap.to('.bg-shape-1', {
      x: 40,
      y: 24,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to('.bg-shape-2', {
      x: -32,
      y: -48,
      duration: 25,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to('.bg-shape-3', {
      x: 24,
      y: 32,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    tl.from(this.hero.nativeElement.children, {
      y: 20,
      opacity: 0,
      stagger: 0.12,
      duration: 0.65,
    })
      .from(
        this.card.nativeElement,
        {
          y: 24,
          opacity: 0,
          scale: 0.98,
          duration: 0.6,
        },
        '-=0.35',
      )
      .from(
        this.footer.nativeElement,
        {
          opacity: 0,
          duration: 0.5,
        },
        '-=0.3',
      );
  }

  async signIn() {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      await this.auth.signInWithGoogle();
    } catch (e) {
      console.error(e);
      this.busy.set(false);
    }
  }

  continueGuest() {
    this.router.navigateByUrl('/songs');
  }
}
