import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';
import { SongsPageComponent } from './features/songs/songs-page/songs-page';
import { SongEditorPageComponent } from './features/songs/song-editor/song-editor';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // auth fuera del shell
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page/login-page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback.page').then((m) => m.AuthCallbackPage),
  },

  // app
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/home/home-page/home-page').then((m) => m.HomePageComponent),
      },

      { path: 'songs', canActivate: [authGuard], component: SongsPageComponent },
      { path: 'songs/new', canActivate: [authGuard], component: SongEditorPageComponent },
      { path: 'songs/:id', canActivate: [authGuard], component: SongEditorPageComponent },

      {
        path: 'setlists',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/setlists/pages/setlists-page/setlists-page').then(
            (m) => m.SetlistsPageComponent,
          ),
      },

      {
        path: 'practice',
        canActivate: [authGuard],
        canMatch: [() => import('./features/practice/practice.guard').then((m) => m.practiceGuard)],
        loadComponent: () =>
          import('./features/practice/pages/practice-page/practice-page').then(
            (m) => m.PracticePageComponent,
          ),
      },
      {
        path: 'practice/:setlistId',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/practice/pages/practice-page/practice-page').then(
            (m) => m.PracticePageComponent,
          ),
      },

      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/settings/settings-page/settings-page').then(
            (m) => m.SettingsPageComponent,
          ),
      },

      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
