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
import { MatBadgeModule } from '@angular/material/badge';
import { UserNotificationsService } from '../../features/notifications/services/user-notifications.service';
import { MatListModule } from '@angular/material/list';
import { DatePipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatListModule,
    DatePipe,
  ],
  selector: 'bm-topbar',
  template: `
    <header class="bm-topbar">
      <div class="bm-topbar-inner">
        <!-- ... Left ... -->
        <div class="bm-slot bm-slot--left">
          <!-- same content -->
          @if (isHandset) {
            <div class="bm-left">
              <button
                mat-icon-button
                class="bm-burger"
                type="button"
                aria-label="Menu"
                (click)="toggleMenu()"
              >
                <mat-icon>menu</mat-icon>
              </button>

              <a class="bm-brand" routerLink="/songs" aria-label="Bandmate home">
                <img
                  class="bm-brand-logo"
                  src="assets/brand/transparent-gold.png"
                  alt=""
                  aria-hidden="true"
                />
                <div class="bm-brand-text">
                  <div class="bm-brand-name">Bandmate</div>
                  <div class="bm-brand-sub">Prep · Rehearse · Play</div>
                </div>
              </a>
            </div>
          }
        </div>

        <div class="bm-slot bm-slot--center">
          <nav class="bm-nav" aria-label="Primary">
            <!-- same content -->
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

            <a class="bm-nav-link" routerLink="/community" routerLinkActive="active">
              <mat-icon class="bm-nav-ic">groups</mat-icon>
              Community
            </a>
          </nav>
        </div>

        <div class="bm-slot bm-slot--right">
          <div class="bm-right">
            @if (isAuthed()) {
              <!-- Notifications Bell -->
              <button mat-icon-button [matMenuTriggerFor]="notifMenu" matTooltip="Notifications">
                <mat-icon
                  [matBadge]="notifService.unreadCount()"
                  [matBadgeHidden]="notifService.unreadCount() === 0"
                  matBadgeColor="warn"
                >
                  notifications
                </mat-icon>
              </button>

              <mat-menu #notifMenu="matMenu" xPosition="before" class="bm-notif-menu-panel">
                <div
                  class="d-flex align-items-center justify-content-between px-3 py-2 border-bottom overflow-hidden"
                >
                  <span class="fw-bold small">Notifications</span>
                  @if (notifService.unreadCount() > 0) {
                    <button mat-button class="small-btn" (click)="notifService.markAllRead()">
                      Mark all read
                    </button>
                  }
                </div>

                <div
                  class="bm-notif-list"
                  style="max-height: 400px; overflow-y: auto; width: 400px;"
                >
                  @if (notifService.notifications().length === 0) {
                    <div class="p-4 text-center opacity-50 small">No notifications</div>
                  } @else {
                    @for (n of notifService.notifications(); track n.id) {
                      <div class="bm-notif-item p-3 border-bottom" [class.bg-light]="!n.is_read">
                        <div class="d-flex align-items-start gap-2 mb-1">
                          <mat-icon class="text-primary icon-sm mt-1">
                            {{ n.type === 'band_invite' ? 'mail' : 'info' }}
                          </mat-icon>
                          <div class="flex-grow-1">
                            <div class="fw-semibold text-dark" style="font-size: 0.9rem">
                              {{ n.title }}
                            </div>
                            <div class="text-secondary small mb-2">{{ n.message }}</div>

                            @if (n.type === 'band_invite' && n.data?.inviteId) {
                              <div class="d-flex gap-2">
                                <button
                                  mat-stroked-button
                                  color="primary"
                                  class="small-btn"
                                  (click)="accept(n); $event.stopPropagation()"
                                >
                                  Accept
                                </button>
                                <button
                                  mat-stroked-button
                                  color="warn"
                                  class="small-btn"
                                  (click)="reject(n); $event.stopPropagation()"
                                >
                                  Reject
                                </button>
                              </div>
                            }
                          </div>
                          @if (!n.is_read) {
                            <div class="p-1 rounded-circle bg-primary"></div>
                          }
                        </div>
                        <div class="text-end opacity-50" style="font-size: 0.7rem">
                          {{ n.created_at | date: 'short' }}
                        </div>
                      </div>
                    }
                  }
                </div>
              </mat-menu>

              <button
                class="bm-user"
                type="button"
                [matMenuTriggerFor]="userMenu"
                matTooltip="Account"
              >
                <img class="bm-avatar" [src]="avatarUrl()" alt="" referrerpolicy="no-referrer" />
                <span class="bm-user-name">{{ userLabel() }}</span>
                <mat-icon class="bm-caret">expand_more</mat-icon>
              </button>

              <!-- User Menu -->
              <mat-menu #userMenu="matMenu" xPosition="before">
                <!-- ... same ... -->
                <div class="bm-menu-head" mat-menu-item disabled>
                  <div class="bm-menu-title">You’re in 🎶</div>
                  <div class="bm-menu-sub">{{ emailLabel() }}</div>
                </div>

                <button mat-menu-item type="button" (click)="goProfile()">
                  <mat-icon>manage_accounts</mat-icon>
                  Profile
                </button>

                <button mat-menu-item type="button" routerLink="/tickets">
                  <mat-icon>confirmation_number</mat-icon>
                  My Tickets
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
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      /* ... existing styles ... */
      .bm-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        padding: 12px 14px;
        background: linear-gradient(180deg, rgba(38, 70, 83, 0.98), rgba(28, 52, 62, 0.95));
        color: rgba(255, 255, 255, 0.92);
        border-bottom: 1px solid rgba(233, 196, 106, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      ::ng-deep .bm-notif-menu-panel {
        min-width: 360px !important;
        max-width: 90vw !important;
        overflow: hidden !important;

        &.mat-mdc-menu-panel {
          max-width: none !important;
          overflow: hidden !important;
        }

        .mat-mdc-menu-content {
          overflow: hidden !important;
        }
      }

      .small-btn {
        line-height: 24px;
        padding: 0 12px;
        font-size: 12px;
        min-height: 24px;
      }
      .bm-notif-item {
        transition: background 0.2s;
        cursor: default;
      }
      .bm-notif-item:hover {
        background: rgba(0, 0, 0, 0.02);
      }
      /* Reuse existing */
      .bm-topbar-inner {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 14px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .bm-slot {
        min-width: 0;
      }
      .bm-slot--left {
        justify-self: start;
      }
      .bm-slot--center {
        justify-self: center;
      }
      .bm-slot--right {
        justify-self: end;
      }
      .bm-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .bm-burger {
        color: rgba(255, 255, 255, 0.85);
      }
      .bm-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
      }
      .bm-brand-logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(233, 196, 106, 0.15);
        padding: 5px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      }
      .bm-brand-name {
        font-weight: 850;
        letter-spacing: -0.03em;
        line-height: 1;
        color: #ffffff;
        font-size: 1.1rem;
      }
      .bm-brand-sub {
        font-size: 0.7rem;
        opacity: 0.65;
        line-height: 1;
        color: #ffffff;
      }
      .bm-nav {
        display: none;
        align-items: center;
        gap: 8px;
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
        padding: 8px 16px;
        border-radius: 999px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.75);
        font-size: 13.5px;
        font-weight: 700;
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .bm-nav-link:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-1px);
      }
      .bm-nav-link.active {
        background: var(--bm-accent);
        color: var(--bm-primary);
        box-shadow: 0 4px 12px rgba(233, 196, 106, 0.3);
      }
      .bm-nav-ic {
        font-size: 18px;
        width: 18px;
        height: 18px;
        opacity: 0.8;
      }
      .bm-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .bm-user {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 5px 12px 5px 5px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.95);
        cursor: pointer;
        transition: all 0.2s;
      }
      .bm-user:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(233, 196, 106, 0.3);
        transform: translateY(-1px);
      }
      .bm-avatar {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 1.5px solid rgba(233, 196, 106, 0.4);
        object-fit: cover;
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
        opacity: 0.7;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .app-upgrade {
        border-radius: 999px;
        padding: 6px 12px;
        border: 1px solid rgba(233, 196, 106, 0.8);
        background: linear-gradient(180deg, rgba(255, 232, 160, 0.15), rgba(201, 162, 39, 0.1));
        color: var(--bm-accent);
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
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
  readonly notifService = inject(UserNotificationsService);
  readonly el = inject(ElementRef<HTMLElement>);

  readonly isAuthed = this.auth.isAuthed;

  // ... computed props ...
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
    return typeof pic === 'string' && pic ? pic : 'assets/brand/avatar-fallback.svg';
  });

  ngAfterViewInit() {
    this.setTopbarHeightVar();
  }

  // ... methods ...
  goLogin() {
    this.router.navigateByUrl('/login');
  }

  goProfile() {
    this.router.navigateByUrl('/profile');
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

  accept(n: any) {
    // Optimistic remove
    this.notifService.notifications.update((list) => list.filter((item) => item.id !== n.id));

    this.notifService.respondToInvite(n, true)?.subscribe({
      next: () => {
        this.notifService.markRead(n.id);
        // No need to reload immediately if we want it gone
      },
      error: () => this.notifService.load(), // Revert on error
    });
  }

  reject(n: any) {
    this.notifService.notifications.update((list) => list.filter((item) => item.id !== n.id));

    this.notifService.respondToInvite(n, false)?.subscribe({
      next: () => {
        this.notifService.markRead(n.id);
      },
      error: () => this.notifService.load(),
    });
  }
}
