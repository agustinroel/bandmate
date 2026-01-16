import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';
import { SongsPageComponent } from './features/songs/songs-page/songs-page';
import { SongEditorPageComponent } from './features/songs/song-editor/song-editor';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'songs', component: SongsPageComponent },
      { path: 'songs/new', component: SongEditorPageComponent },
      { path: 'songs/:id', component: SongEditorPageComponent },

      // placeholders para lo próximo
      {
        path: 'setlists',
        loadComponent: () =>
          import('./features/setlists/pages/setlists-page/setlists-page').then(
            (m) => m.SetlistsPageComponent
          ),
      },
      {
        path: 'practice',
        canMatch: [() => import('./features/practice/practice.guard').then((m) => m.practiceGuard)],
        loadComponent: () =>
          import('./features/practice/pages/practice-page/practice-page').then(
            (m) => m.PracticePageComponent
          ),
      },
      {
        path: 'practice/:setlistId',
        loadComponent: () =>
          import('./features/practice/pages/practice-page/practice-page').then(
            (m) => m.PracticePageComponent
          ),
      },

      { path: '', pathMatch: 'full', redirectTo: 'songs' },
    ],
  },
  { path: '**', redirectTo: 'songs' },
];
