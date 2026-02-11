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

        <!-- Glassmorphism Card -->
        <div class="bm-glass-card" #card>
          <div class="bm-card-content">
            <h2 class="card-title">Ready for the stage?</h2>
            <p class="card-desc">
              The ultimate workspace for musicians. Organize your repertoire, perfect your timing,
              and sync with your band.
            </p>

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
                    <span>One moment...</span>
                  } @else {
                    <svg class="google-logo" viewBox="0 0 24 24">
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
          <div>Built with ❤️ for every musician.</div>
          <div class="legal-links">
            <a routerLink="/privacy">Privacy Policy</a>
            <span class="sep">·</span>
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
      background: #0f1115;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      font-family: 'Outfit', sans-serif;
    }

    /* Animated background shapes */
    .bg-shape {
      position: absolute;
      filter: blur(80px);
      z-index: 1;
      border-radius: 50%;
      opacity: 0.4;
    }
    .bg-shape-1 {
      width: 400px;
      height: 400px;
      background: rgba(201, 162, 39, 0.4);
      top: -100px;
      left: -100px;
    }
    .bg-shape-2 {
      width: 500px;
      height: 500px;
      background: rgba(32, 82, 85, 0.4);
      bottom: -150px;
      right: -150px;
    }
    .bg-shape-3 {
      width: 300px;
      height: 300px;
      background: rgba(144, 44, 30, 0.3);
      top: 50%;
      left: 50%;
    }

    .bm-login-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 440px;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Brand Hero */
    .bm-brand-hero {
      margin-bottom: 40px;
    }
    .logo-circle {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      display: grid;
      place-items: center;
      margin: 0 auto 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .bm-brand-logo {
      width: 50px;
      height: 50px;
    }
    .bm-main-title {
      font-size: 3rem;
      font-weight: 900;
      letter-spacing: -0.04em;
      margin: 0;
      background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.6));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .bm-main-tagline {
      font-size: 1.1rem;
      opacity: 0.6;
      font-weight: 400;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-top: 5px;
    }

    /* Glass Card */
    .bm-glass-card {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 32px;
      padding: 40px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    .card-title {
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .card-desc {
      font-size: 1rem;
      opacity: 0.7;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    /* Actions */
    .bm-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .bm-google-btn {
      height: 56px;
      border-radius: 16px;
      background: #fff;
      color: #000;
      font-size: 1.05rem;
      font-weight: 700;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bm-google-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(255, 255, 255, 0.15);
      background: #f8f8f8;
    }
    .btn-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .google-logo {
      width: 22px;
      height: 22px;
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

    .bm-guest-link {
      height: 44px;
      font-weight: 600;
      opacity: 0.6;
      transition: opacity 0.3s;
    }
    .bm-guest-link:hover {
      opacity: 1;
    }

    .bm-footer {
      margin-top: 40px;
      font-size: 0.85rem;
      opacity: 0.4;
      text-align: center;
    }
    .legal-links {
      margin-top: 8px;
      display: flex;
      justify-content: center;
      gap: 6px;
    }
    .legal-links a {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: color 0.2s;
    }
    .legal-links a:hover {
      color: #c9a227;
    }
    .sep {
      opacity: 0.4;
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
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Background shapes slow drift
    gsap.to('.bg-shape-1', {
      x: 50,
      y: 30,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to('.bg-shape-2', {
      x: -40,
      y: -60,
      duration: 25,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to('.bg-shape-3', {
      x: 30,
      y: 40,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Entrance staggered
    tl.from(this.hero.nativeElement.children, {
      y: 30,
      opacity: 0,
      stagger: 0.2,
      duration: 1.2,
    })
      .from(
        this.card.nativeElement,
        {
          y: 40,
          opacity: 0,
          scale: 0.95,
          duration: 1,
        },
        '-=0.6',
      )
      .from(
        this.footer.nativeElement,
        {
          opacity: 0,
          duration: 1,
        },
        '-=0.4',
      );

    // Mouse move parallax effect (subtle)
    this.container.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20;
      const yPos = (clientY / window.innerHeight - 0.5) * 20;

      gsap.to(this.card.nativeElement, {
        x: xPos,
        y: yPos,
        duration: 2,
        ease: 'power2.out',
      });
    });
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
