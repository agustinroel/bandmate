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
import { AnimationService } from '../../../core/services/animation.service';

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
  private readonly animation = inject(AnimationService);

  readonly showOnboarding = signal(false);

  // Animation guards to prevent redundant triggers
  private animatedSections = new Set<string>();

  constructor() {
    // Check localStorage on init
    const dismissed = localStorage.getItem('bm_hero_dismissed_v2');
    if (!dismissed) {
      this.showOnboarding.set(true);
    }

    // Consolidated Animation Trigger
    effect(() => {
      const statsLoading = this.practiceStats.isLoading();
      const achievementsList = this.achievements.userAchievements();

      // Core sequence (Run once)
      if (!this.animatedSections.has('core')) {
        this.animatedSections.add('core');
        setTimeout(() => {
          const onboardingEl = document.querySelector('.bm-fr');
          const header = document.querySelector('.bm-page-header');
          const cards = document.querySelectorAll('.bm-card-gsap');

          if (onboardingEl) this.animation.fadeIn(onboardingEl, 0);
          if (header) this.animation.fadeIn(header, 0.1);
          if (cards.length > 0) this.animation.staggerList(Array.from(cards), 0.05, 0.2);
        }, 300);
      }

      // Stats sequence (Run once when data is ready)
      if (!statsLoading && !this.animatedSections.has('stats')) {
        this.animatedSections.add('stats');
        setTimeout(() => {
          const section = document.querySelector('.bm-stats-section');
          const statCards = document.querySelectorAll('.bm-stat-card-gsap');
          const topSongs = document.querySelectorAll('.bm-top-song-gsap');
          if (section) this.animation.fadeIn(section, 0.1); // Slightly lower delay since we are already triggered late
          if (statCards.length > 0) this.animation.staggerList(Array.from(statCards), 0.04, 0.2);
          if (topSongs.length > 0) this.animation.staggerList(Array.from(topSongs), 0.03, 0.3);
        }, 100);
      }

      // Achievements sequence (Run once when data is ready)
      if (achievementsList.length > 0 && !this.animatedSections.has('achievements')) {
        this.animatedSections.add('achievements');
        setTimeout(() => {
          const els = document.querySelectorAll('.bm-achievement-gsap');
          if (els.length > 0) this.animation.staggerList(Array.from(els), 0.05, 0.1);
        }, 100);
      }
    });
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
