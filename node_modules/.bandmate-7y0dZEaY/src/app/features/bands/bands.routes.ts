import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const bandsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/bands-list-page/bands-list-page.component').then(
        (m) => m.BandsListPageComponent,
      ),
  },
  {
    path: 'join/:code',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/join-band-page/join-band-page').then((m) => m.JoinBandPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/band-detail-page/band-detail-page.component').then(
        (m) => m.BandDetailPageComponent,
      ),
  },
];
