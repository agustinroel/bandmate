import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map, shareReplay } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorBoundaryComponent } from '../../shared/errors/error-boundary.component';
import { TopbarComponent } from '../topbar/topbar';
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
  private bo = inject(BreakpointObserver);

  readonly isHandset$ = this.bo.observe(Breakpoints.Handset).pipe(
    map((r) => r.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  appName = 'Bandmate';
  version = 'v0.1';

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
