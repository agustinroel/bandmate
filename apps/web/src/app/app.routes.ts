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
    canActivateChild: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home-page/home-page').then((m) => m.HomePageComponent),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: 'u/:username',
        loadComponent: () =>
          import('./features/profile/pages/public-profile-page/public-profile-page').then(
            (m) => m.PublicProfilePageComponent,
          ),
      },

      { path: 'songs', component: SongsPageComponent },
      { path: 'songs/new', component: SongEditorPageComponent },
      { path: 'songs/:id', component: SongEditorPageComponent },

      {
        path: 'setlists',
        loadComponent: () =>
          import('./features/setlists/pages/setlists-page/setlists-page').then(
            (m) => m.SetlistsPageComponent,
          ),
      },

      {
        path: 'practice',
        canMatch: [() => import('./features/practice/practice.guard').then((m) => m.practiceGuard)],
        loadComponent: () =>
          import('./features/practice/pages/practice-page/practice-page').then(
            (m) => m.PracticePageComponent,
          ),
      },
      {
        path: 'practice/:setlistId',
        loadComponent: () =>
          import('./features/practice/pages/practice-page/practice-page').then(
            (m) => m.PracticePageComponent,
          ),
      },

      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page/settings-page').then(
            (m) => m.SettingsPageComponent,
          ),
      },

      {
        path: 'import',
        loadComponent: () => import('./features/import/pages/import-page/import-page').then(m => m.ImportPageComponent)
      },
      // TOOLS
      {
        path: 'tools',
        children: [
           { path: 'tuner', loadComponent: () => import('./features/tools/tuner/tuner-page').then(m => m.TunerPageComponent) },
           { path: '', redirectTo: 'tuner', pathMatch: 'full' }
        ]
      },

      // ✅ LIBRARY
      {
        path: 'library',
        children: [
          {
            path: ':workId/arrangements/:arrangementId',
            loadComponent: () =>
              import('./features/library/pages/arrangement-view/arrangement-view').then(
                (m) => m.ArrangementViewPageComponent,
              ),
          },
          {
            path: ':workId',
            loadComponent: () =>
              import('./features/library/pages/library-work-page/library-work-page').then(
                (m) => m.LibraryWorkPageComponent,
              ),
          },
          // opcional: /library => redirect (si querés)
          { path: '', pathMatch: 'full', redirectTo: '/songs' },
        ],
      },

      {
        path: 'community',
        loadComponent: () =>
          import('./features/community/pages/community-page/community-page').then(
            (m) => m.CommunityPageComponent
          ),
      },

      {
        path: 'bands',
        loadChildren: () => import('./features/bands/bands.routes').then(m => m.bandsRoutes)
      },

      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
