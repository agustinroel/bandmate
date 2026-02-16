import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProfileRow, ProfilesService } from '../../services/profile.service';
import { BandsService } from '../../../bands/services/bands.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SubscriptionStore } from '../../../../core/subscription/subscription.store';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InviteBandDialogComponent } from '../../../bands/ui/invite-band-dialog/invite-band-dialog.component';

export type UserActivity = {
  id: string;
  text: string;
  count?: number;
  icon: string;
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './public-profile-page.html',
  styleUrl: './public-profile-page.scss',
})
export class PublicProfilePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profilesService = inject(ProfilesService);
  private readonly bandsService = inject(BandsService);
  private readonly authStore = inject(AuthStore);
  private readonly sub = inject(SubscriptionStore);
  private readonly titleService = inject(Title);
  public readonly notify = inject(NotificationsService);
  private readonly dialog = inject(MatDialog);

  readonly usernameParam = signal('');
  readonly state = signal<'idle' | 'loading' | 'loaded' | 'error' | 'not-found'>('idle');
  readonly profile = signal<ProfileRow | null>(null);
  readonly bands = signal<any[]>([]);
  readonly activities = signal<UserActivity[]>([]);

  readonly isPro = computed(() => {
    const p = this.profile();
    return p?.subscription_tier === 'pro';
  });

  readonly isStudio = computed(() => {
    const p = this.profile();
    return p?.subscription_tier === 'studio';
  });

  readonly isPremium = computed(() => {
    const p = this.profile();
    return p?.subscription_tier === 'pro' || p?.subscription_tier === 'studio';
  });

  readonly isViewerPro = computed(() => this.sub.hasAtLeast('pro'));
  readonly isViewerStudio = computed(() => this.sub.hasAtLeast('studio'));

  readonly availabilityLabel = computed(() => {
    const a = this.profile()?.availability;
    if (a === 'gigs') return 'Available for gigs';
    if (a === 'band') return 'Looking for band';
    return 'Not available';
  });

  readonly availabilityClass = computed(() => {
    const a = this.profile()?.availability;
    return `status-${a || 'none'}`;
  });

  readonly isOwnProfile = computed(() => {
    const user = this.authStore.user();
    const p = this.profile();
    return user && p && user.id === p.id;
  });

  // ... (rest of simple props)

  openInviteDialog() {
    if (!this.authStore.isAuthed()) {
      this.notify.info('You must be logged in to invite users.', 'Login');
      this.router.navigate(['/login']);
      return;
    }

    const p = this.profile();
    if (!p) return;

    this.dialog.open(InviteBandDialogComponent, {
      data: { userId: p.id, userName: p.full_name || p.username },
      width: '400px',
    });
  }

  readonly isPrivate = computed(() => {
    const p = this.profile();
    return p && !p.is_public;
  });

  // Display Helpers
  readonly displayName = computed(() => this.profile()?.username || this.usernameParam());

  // Note: We don't have public avatars yet unless we fetch from a public bucket or gravatar.
  // For now, we'll use a placeholder.
  readonly avatarUrl = computed(() => null);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const u = params.get('username');
      if (u) {
        this.usernameParam.set(u);
        this.loadProfile(u);
      }
    });

    effect(() => {
      const u = this.usernameParam();
      if (u) {
        this.titleService.setTitle(`${u} | Bandmate`);
      }
    });
  }

  readonly lastActiveLabel = computed(() => {
    const p = this.profile();
    if (!p?.last_active_at) return 'Recently';
    const date = new Date(p.last_active_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Active today';
    if (days === 1) return 'Active yesterday';
    return `Last active ${days}d ago`;
  });

  async loadProfile(username: string) {
    this.state.set('loading');
    try {
      const p = await this.profilesService.getByUsername(username);
      if (!p) {
        this.state.set('not-found');
        return;
      }
      this.profile.set(p);
      this.loadActivities(p.id);

      // Load bands
      try {
        const userBands = await this.bandsService.listUserBands(p.id).toPromise();
        this.bands.set(userBands || []);
      } catch (e) {
        console.error('Failed to load bands for user', e);
      }

      this.state.set('loaded');
    } catch (err) {
      console.error(err);
      this.state.set('error');
    }
  }

  async loadActivities(userId: string) {
    // Generate some interesting activity based on real stats
    // In a real app we'd fetch these from a dedicated activity table or aggregate counts
    const acts: UserActivity[] = [];

    // Mocking some variation for the demo/premium feel
    acts.push({
      id: 'practice',
      text: 'Practiced 5 sessions this week',
      icon: 'music_note',
    });

    acts.push({
      id: 'arrangements',
      text: 'Created 2 arrangements this month',
      icon: 'library_music',
    });

    this.activities.set(acts);
  }

  viewSongs() {
    const p = this.profile();
    if (p) {
      // Redirect to a public songs view for this user
      // Assuming a route like /u/[username]/songs exists or we can filter the main songs page
      this.router.navigate(['/songs'], { queryParams: { user: p.username } });
      this.notify.info(`Viewing songs by ${p.username}`);
    }
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.notify.success('Link copied to clipboard', 'OK', 2000);
    } catch (err) {
      this.notify.error('Could not copy link', 'Close');
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  handleAvatarError() {
    const p = this.profile();
    if (p) {
      this.profile.set({ ...p, avatar_url: null });
    }
  }
}
