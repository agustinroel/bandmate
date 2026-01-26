import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  Input,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '../../core/auth/auth.store';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  selector: 'bm-topbar',
  template: `
    <header class="bm-topbar">
      <div class="bm-left">
        @if (isHandset) {
          <button
            mat-icon-button
            class="bm-burger"
            type="button"
            aria-label="Menu"
            (click)="toggleMenu()"
            [class.is-hidden]="!isHandset"
          >
            <mat-icon>menu</mat-icon>
          </button>
        }

        <a class="bm-brand" routerLink="/songs" aria-label="Bandmate home">
          <img
            class="bm-brand-logo"
            src="../../../assets/brand/Bandmate logo gold transparent.png"
            alt=""
            aria-hidden="true"
          />
          <div class="bm-brand-text">
            <div class="bm-brand-name">Bandmate</div>
            <div class="bm-brand-sub">Prep · Rehearse · Play</div>
          </div>
        </a>
      </div>

      <nav class="bm-nav" aria-label="Primary">
        <a class="bm-nav-link" routerLink="/songs" routerLinkActive="active">
          <mat-icon class="bm-nav-ic">library_music</mat-icon>
          Songs
        </a>

        <a class="bm-nav-link" routerLink="/setlists" routerLinkActive="active">
          <mat-icon class="bm-nav-ic">queue_music</mat-icon>
          Setlists
        </a>

        <a class="bm-nav-link" routerLink="/practice" routerLinkActive="active">
          <mat-icon class="bm-nav-ic">sports_guitar</mat-icon>
          Practice
        </a>
      </nav>

      <div class="bm-right">
        <!-- <button
          mat-stroked-button
          class="app-upgrade d-none d-md-inline-flex"
          type="button"
          (click)="onUpgrade()"
          matTooltip="Upgrade (placeholder)"
        >
          <mat-icon class="me-1">workspace_premium</mat-icon>
          Upgrade
        </button> -->

        @if (isAuthed()) {
          <button class="bm-user" type="button" [matMenuTriggerFor]="userMenu" matTooltip="Account">
            <img class="bm-avatar" [src]="avatarUrl()" alt="" referrerpolicy="no-referrer" />
            <span class="bm-user-name">{{ userLabel() }}</span>
            <mat-icon class="bm-caret">expand_more</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="bm-menu-head" mat-menu-item disabled>
              <div class="bm-menu-title">You’re in 🎶</div>
              <div class="bm-menu-sub">{{ emailLabel() }}</div>
            </div>

            <button mat-menu-item type="button" (click)="goProfile()">
              <mat-icon>manage_accounts</mat-icon>
              Profile
            </button>

            <button mat-menu-item type="button" (click)="signOut()">
              <mat-icon>logout</mat-icon>
              Sign out
            </button>
          </mat-menu>
        } @else {
          <button mat-raised-button color="primary" type="button" (click)="goLogin()">
            <mat-icon class="me-1">login</mat-icon>
            Sign in
          </button>
        }
      </div>
    </header>
  `,
  styles: [
    `
      .bm-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 14px;
        background: linear-gradient(180deg, rgba(22, 62, 63, 0.98), rgba(22, 62, 63, 0.92));
        color: rgba(255, 255, 255, 0.92);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(8px);
      }

      .bm-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .bm-burger {
        color: rgba(255, 255, 255, 0.92);
      }

      .bm-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: inherit;
        min-width: 0;
      }

      .bm-brand-logo {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: rgba(201, 162, 39, 0.14);
        padding: 6px;
      }

      .bm-brand-text {
        display: grid;
        gap: 1px;
        min-width: 0;
      }

      .bm-brand-name {
        font-weight: 850;
        letter-spacing: -0.02em;
        line-height: 1.05;
      }

      .bm-brand-sub {
        font-size: 0.78rem;
        opacity: 0.75;
        line-height: 1.05;
      }

      .bm-nav {
        display: none;
        align-items: center;
        gap: 6px;
        flex: 1;
        justify-content: center;
      }

      @media (min-width: 992px) {
        .bm-nav {
          display: flex;
        }
      }

      .bm-nav-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.88);
        transition:
          background 120ms ease,
          color 120ms ease,
          transform 120ms ease;
      }

      .bm-nav-link:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-1px);
      }

      .bm-nav-link.active {
        background: rgba(201, 162, 39, 0.18);
        color: rgba(255, 255, 255, 0.96);
      }

      .bm-nav-ic {
        opacity: 0.9;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .bm-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* User chip */
      .bm-user {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px 6px 6px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.92);
        cursor: pointer;
        transition:
          background 120ms ease,
          transform 120ms ease,
          border-color 120ms ease;
      }

      .bm-user:hover {
        background: rgba(255, 255, 255, 0.09);
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .bm-avatar {
        width: 30px;
        height: 30px;
        border-radius: 999px;
        object-fit: cover;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
      }

      .bm-user-name {
        font-weight: 650;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: none;
      }

      @media (min-width: 992px) {
        .bm-user-name {
          display: inline;
        }
      }

      .bm-caret {
        opacity: 0.85;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Upgrade button (tu shine premium) */
      .app-upgrade {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        border-radius: 999px;
        padding: 6px 12px;
        line-height: 1;
        margin-right: 8px;
        border: 1px solid rgba(213, 179, 98, 0.9);
        background: linear-gradient(180deg, rgba(255, 232, 160, 0.55), rgba(201, 162, 39, 0.35));
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
      }
    `,
  ],
})
export class TopbarComponent implements AfterViewInit {
  @Input() drawer?: MatSidenav;
  @Input() isHandset = false;

  @HostListener('window:resize')
  onResize() {
    this.setTopbarHeightVar();
  }
  readonly auth = inject(AuthStore);
  readonly router = inject(Router);

  readonly el = inject(ElementRef<HTMLElement>);

  readonly isAuthed = this.auth.isAuthed;

  readonly userLabel = computed(() => {
    const u = this.auth.user();
    const name = u?.user_metadata?.['full_name'] || u?.user_metadata?.['name'];
    return typeof name === 'string' && name.trim() ? name : 'Account';
  });

  readonly emailLabel = computed(() => {
    const u = this.auth.user();
    return u?.email ?? '—';
  });

  readonly avatarUrl = computed(() => {
    const u = this.auth.user();
    const pic = u?.user_metadata?.['avatar_url'] || u?.user_metadata?.['picture'];
    return typeof pic === 'string' && pic ? pic : 'assets/brand/avatar-fallback.png';
  });

  ngAfterViewInit() {
    this.setTopbarHeightVar();
  }

  goLogin() {
    this.router.navigateByUrl('/login');
  }

  goProfile() {
    // placeholder: cuando exista /profile lo conectamos
    this.router.navigateByUrl('/songs');
  }

  async signOut() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  onUpgrade() {
    console.log('upgrade');
  }

  toggleMenu() {
    if (this.isHandset) this.drawer?.toggle();
  }

  private setTopbarHeightVar() {
    const h = this.el.nativeElement.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--bm-topbar-h', `${Math.ceil(h)}px`);
  }
}
