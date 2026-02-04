import { Component, signal, effect, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../core/auth/auth.store';
import { SongsStore } from '../../songs/state/songs-store';
import { SEED_SONGS } from '../../songs/data/seed-songs.data';
import { PracticeSessionService } from '../../../core/services/practice-session.service';
import { AchievementService } from '../../../core/services/achievement.service';
import { AchievementCardComponent } from '../../../shared/ui/achievement-card/achievement-card.component';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AchievementCardComponent,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePageComponent implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly songsStore = inject(SongsStore);
  private readonly router = inject(Router);
  readonly practiceStats = inject(PracticeSessionService);
  readonly achievements = inject(AchievementService);

  readonly showOnboarding = signal(false);

  constructor() {
    // Check localStorage on init
    const dismissed = localStorage.getItem('bm_hero_dismissed_v2');
    if (!dismissed) {
      this.showOnboarding.set(true);
    }
  }

  ngOnInit() {
    // Load practice stats when component initializes
    this.practiceStats.loadStats();
    this.achievements.loadUserAchievements();
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
