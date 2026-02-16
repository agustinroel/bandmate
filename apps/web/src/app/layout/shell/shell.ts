import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, inject, ViewChild, AfterViewInit, effect } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, shareReplay } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TopbarComponent } from '../topbar/topbar';
import { AchievementToastComponent } from '../../shared/ui/achievement-toast/achievement-toast.component';
import { AchievementService } from '../../core/services/achievement.service';
import { environment } from '../../../environments/environment';
import { SubscriptionStore } from '../../core/subscription/subscription.store';
import { AuthStore } from '../../core/auth/auth.store';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UpgradeDialogComponent } from '../../core/subscription/upgrade-dialog/upgrade-dialog.component';

@Component({
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    TopbarComponent,
    AchievementToastComponent,
    MatDialogModule,
  ],
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent implements AfterViewInit {
  @ViewChild('drawer') drawer?: MatSidenav;
  @ViewChild(AchievementToastComponent) achievementToast?: AchievementToastComponent;

  readonly bo = inject(BreakpointObserver);
  readonly achievementService = inject(AchievementService);
  readonly subscriptionStore = inject(SubscriptionStore);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  readonly router = inject(Router);

  constructor() {
    // Sync subscription tier on auth/init
    effect(() => {
      if (this.authStore.isAuthed()) {
        this.subscriptionStore.loadCurrentTier();
      }
    });

    // Sidebar auto-close on navigation
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.drawer?.mode === 'over') this.drawer.close();
      });
  }

  readonly isHandset$ = this.bo.observe(Breakpoints.Handset).pipe(
    map((r) => r.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  nowYear = new Date().getFullYear();
  appName = 'Bandmate';
  version = environment.version;

  ngAfterViewInit() {
    if (this.achievementToast) {
      this.achievementService.registerToast(this.achievementToast);
    }
  }

  onLogin() {
    console.log('login');
  }
  onLogout() {
    console.log('logout');
  }
  onUpgrade() {
    this.dialog.open(UpgradeDialogComponent, {
      maxWidth: '90vw',
      panelClass: 'bm-upgrade-dialog-container',
      data: {
        feature: 'Premium Access',
        description: 'Scale your music to the next level.',
        requiredTier: 'pro',
        currentTier: this.subscriptionStore.tier(),
      },
    });
  }

  onBandsClick(event: Event) {
    if (this.subscriptionStore.tier() === 'free') {
      event.preventDefault();
      this.dialog.open(UpgradeDialogComponent, {
        maxWidth: '90vw',
        panelClass: 'bm-upgrade-dialog-container',
        data: {
          feature: 'Band Management',
          description: 'Rehearse and perform together with your band members.',
          requiredTier: 'pro',
          currentTier: 'free',
        },
      });
    } else {
      this.router.navigate(['/bands']);
    }
  }
}
