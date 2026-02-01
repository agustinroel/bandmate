
import { Component, signal, effect, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { SongsStore } from '../../songs/state/songs-store';
import { SEED_SONGS } from '../../songs/data/seed-songs.data';


@Component({
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePageComponent {
  private readonly auth = inject(AuthStore);
  private readonly songsStore = inject(SongsStore);
  private readonly router = inject(Router);
  readonly showOnboarding = signal(false);

  constructor() {
    // Check localStorage on init
    const dismissed = localStorage.getItem('bm_hero_dismissed_v2');
    if (!dismissed) {
      this.showOnboarding.set(true);
    }
  }

  dismissOnboarding() {
    this.showOnboarding.set(false);
    localStorage.setItem('bm_hero_dismissed_v2', 'true');
  }

  createSong() {
    this.router.navigate(['/songs/new']);
  }

  seedLibrary() {
    this.songsStore.seed(SEED_SONGS);
  }
}
