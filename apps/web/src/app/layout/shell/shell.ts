import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
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
import { ErrorBoundaryComponent } from '../../shared/errors/error-boundary.component';
import { TopbarComponent } from '../topbar/topbar';
import { environment } from '../../../environments/environment';
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
    ErrorBoundaryComponent,
    TopbarComponent,
  ],
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  @ViewChild('drawer') drawer?: MatSidenav;
  readonly bo = inject(BreakpointObserver);

  readonly router = inject(Router);

  readonly isHandset$ = this.bo.observe(Breakpoints.Handset).pipe(
    map((r) => r.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  nowYear = new Date().getFullYear();

  appName = 'Bandmate';
  version = environment.version;

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        // si está en over (handset), cerralo después de navegar
        if (this.drawer?.mode === 'over') this.drawer.close();
      });
  }

  onLogin() {
    console.log('login');
  }
  onLogout() {
    console.log('logout');
  }
  onUpgrade() {
    console.log('upgrade');
  }
}
