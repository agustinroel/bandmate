import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';
import { SongsPageComponent } from './features/songs/songs-page/songs-page';
import { SongEditorPageComponent } from './features/songs/song-editor/song-editor';

export const routes: Routes = [
  // auth fuera del shell
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page/login-page').then((m) => m.LoginPageComponent),
  },

  // app
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home-page/home-page').then((m) => m.HomePageComponent),
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

      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
