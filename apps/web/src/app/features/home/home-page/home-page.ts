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

  constructor() {
    // Check localStorage on init
    const dismissed = localStorage.getItem('bm_hero_dismissed_v2');
    if (!dismissed) {
      this.showOnboarding.set(true);
    }

    // 1) Animate Onboarding
    effect(() => {
      if (this.showOnboarding()) {
        setTimeout(() => {
          const el = document.querySelector('.bm-fr');
          if (el) this.animation.fadeIn(el, 0.1);
        }, 120);
      }
    });

    // 2) Animate Home Grid
    effect(() => {
      setTimeout(() => {
        const header = document.querySelector('.bm-page-header');
        const cards = document.querySelectorAll('.bm-card-gsap');
        if (header) this.animation.fadeIn(header, 0);
        if (cards.length > 0) {
          this.animation.staggerList(Array.from(cards), 0.05, 0.1);
        }
      }, 150);
    });

    // 3) Animate Stats when ready
    effect(() => {
      const loading = this.practiceStats.isLoading();
      if (!loading) {
        setTimeout(() => {
          const section = document.querySelector('.bm-stats-section');
          const cards = document.querySelectorAll('.bm-stat-card-gsap');
          const songs = document.querySelectorAll('.bm-top-song-gsap');
          if (section) this.animation.fadeIn(section, 0);
          if (cards.length > 0) this.animation.staggerList(Array.from(cards), 0.04, 0.1);
          if (songs.length > 0) this.animation.staggerList(Array.from(songs), 0.03, 0.2);
        }, 200);
      }
    });

    // 4) Animate Achievements
    effect(() => {
      const list = this.achievements.userAchievements();
      if (list.length > 0) {
        setTimeout(() => {
          const els = document.querySelectorAll('.bm-achievement-gsap');
          if (els.length > 0) this.animation.staggerList(Array.from(els), 0.05, 0.2);
        }, 250);
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
