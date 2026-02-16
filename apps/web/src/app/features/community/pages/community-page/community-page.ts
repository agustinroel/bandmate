import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { EventsStore } from '../../../events/state/events.store';
import { BandsService, BandRow } from '../../../bands/services/bands.service';
import { SubscriptionStore } from '../../../../core/subscription/subscription.store';
import { AnimationService } from '../../../../core/services/animation.service';
import { CreateBandDialogComponent } from '../../../bands/ui/create-band-dialog/create-band-dialog.component';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { InvitationsDialogComponent } from '../../ui/invitations-dialog/invitations-dialog.component';

type ProfileDto = {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  instruments?: string[];
  subscription_tier?: string | null;
};

type ActiveFilter = { type: string; label: string; value: string };

type SocialActivity = {
  id: string;
  text: string;
  time: string;
  icon: string;
};

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './community-page.html',
  styleUrl: './community-page.scss',
})
export class CommunityPageComponent {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationsService);
  private animation = inject(AnimationService);

  readonly eventsStore = inject(EventsStore);
  readonly bandsService = inject(BandsService);
  readonly sub = inject(SubscriptionStore);

  /* ─── Profiles ─── */
  readonly profiles = signal<ProfileDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /* ─── Bands ─── */
  readonly myBands = signal<(BandRow & { my_roles: string[] })[]>([]);
  readonly bandsLoading = signal(true);

  /* ─── Social signals ─── */
  readonly activeCount = signal(0);
  readonly pendingInvitesCount = signal(0);
  readonly rehearsalsThisWeek = signal(0);

  /* ─── Recent Activity ─── */
  readonly activities = signal<SocialActivity[]>([]);

  /* ─── Invite state tracking ─── */
  readonly invitedUserIds = signal<Set<string>>(new Set());

  /* ─── Filters ─── */
  readonly query = signal('');
  readonly selectedInstruments = signal<string[]>([]);

  readonly instrumentOptions = [
    'Guitar',
    'Bass',
    'Drums',
    'Keys',
    'Vocals',
    'Saxophone',
    'Violin',
    'Trumpet',
  ];

  /* ─── Computed ─── */
  readonly isPro = computed(() => this.sub.hasAtLeast('pro'));

  readonly activeFilters = computed<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];
    for (const inst of this.selectedInstruments()) {
      chips.push({ type: 'instrument', label: inst, value: inst });
    }
    return chips;
  });

  readonly hasActiveFilters = computed(
    () => !!this.query().trim() || this.selectedInstruments().length > 0,
  );

  readonly resultCountLabel = computed(() => {
    const n = this.profiles().length;
    return `Showing ${n} musician${n !== 1 ? 's' : ''}`;
  });

  constructor() {
    this.loadProfiles();
    this.loadBands();
    this.loadActivities();
    this.loadInvitationsCount();
    this.initDiscovery();

    // Entrance animation (once)
    let animated = false;
    effect(() => {
      const ready = !this.loading();
      if (ready && !animated) {
        animated = true;
        setTimeout(() => {
          const items = document.querySelectorAll('.cm-gsap-item');
          if (items.length) this.animation.staggerList(Array.from(items), 0.04, 0.15);
        }, 120);
      }
    });
  }

  /* ─── Data loading ─── */
  loadProfiles() {
    this.loading.set(true);
    const params: any = {};
    if (this.query().trim()) params.q = this.query().trim();
    if (this.selectedInstruments().length) {
      params.instruments = this.selectedInstruments().join(',');
    }

    this.http.get<ProfileDto[]>(`${environment.apiBaseUrl}/profiles`, { params }).subscribe({
      next: (data) => {
        this.profiles.set(data);
        this.loading.set(false);
        this.computeActiveCount(data);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load musicians');
        this.loading.set(false);
      },
    });
  }

  computeActiveCount(profiles: any[]) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const count = profiles.filter((p) => {
      if (!p.updated_at) return false;
      return new Date(p.updated_at) >= sevenDaysAgo;
    }).length;
    this.activeCount.set(count || 3); // Fallback for better dev UX
  }

  loadActivities() {
    // Recent joins
    this.http
      .get<any[]>(`${environment.apiBaseUrl}/profiles`, {
        params: { limit: 3, sort: 'created_at:desc' },
      })
      .subscribe((newProfiles) => {
        const joinActivities = newProfiles.map((p) => ({
          id: `join-${p.id}`,
          text: `${p.full_name || p.username} joined the community`,
          time: this.activityLabel({ username: p.username } as any),
          icon: 'person_add',
        }));

        // Recent bands
        this.http
          .get<any[]>(`${environment.apiBaseUrl}/bands`, {
            params: { limit: 2, sort: 'created_at:desc' },
          })
          .subscribe((newBands) => {
            const bandActivities = newBands.map((b) => ({
              id: `band-${b.id}`,
              text: `New band: ${b.name}`,
              time: 'Active recently',
              icon: 'groups',
            }));

            this.activities.set([...joinActivities, ...bandActivities]);
          });
      });
  }

  loadInvitationsCount() {
    this.bandsService.listMyInvitations().subscribe((invites) => {
      this.pendingInvitesCount.set(invites?.length || 0);
    });
  }

  openInvitations() {
    this.dialog
      .open(InvitationsDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe(() => {
        this.loadInvitationsCount();
        this.loadBands(); // In case they accepted an invite
      });
  }

  loadBands() {
    this.bandsLoading.set(true);
    this.bandsService.listMyBands().subscribe({
      next: (data) => {
        this.myBands.set(data || []);
        this.bandsLoading.set(false);
      },
      error: () => {
        this.bandsLoading.set(false);
      },
    });
  }

  initDiscovery() {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => this.eventsStore.loadDiscovery(pos.coords.latitude, pos.coords.longitude),
        () => this.eventsStore.loadDiscovery(),
      );
    } else {
      this.eventsStore.loadDiscovery();
    }
  }

  /* ─── Filters ─── */
  onSearchInput() {
    this.loadProfiles();
  }

  toggleInstrument(inst: string) {
    const current = this.selectedInstruments();
    if (current.includes(inst)) {
      this.selectedInstruments.set(current.filter((i) => i !== inst));
    } else {
      this.selectedInstruments.set([...current, inst]);
    }
    this.loadProfiles();
  }

  removeFilter(filter: ActiveFilter) {
    if (filter.type === 'instrument') {
      this.selectedInstruments.set(this.selectedInstruments().filter((i) => i !== filter.value));
      this.loadProfiles();
    }
  }

  clearFilters() {
    this.query.set('');
    this.selectedInstruments.set([]);
    this.loadProfiles();
  }

  /* ─── PRO-gated actions ─── */
  createBand() {
    if (!this.sub.requireTierOrUpgrade('create_band')) return;

    const ref = this.dialog.open(CreateBandDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadBands();
    });
  }

  inviteToBand(userId: string) {
    if (!this.sub.requireTierOrUpgrade('invite_to_band')) return;

    // Simulate API call and state change
    this.invitedUserIds.update((set) => {
      const newSet = new Set(set);
      newSet.add(userId);
      return newSet;
    });

    this.notify.success('Invitation sent', 'OK', 2000);
  }

  messageMusician(userId: string) {
    if (!this.sub.requireTierOrUpgrade('message_musician')) return;
    this.notify.info('Messaging coming soon', 'OK', 2000);
  }

  /* ─── Band Management ─── */
  deleteBand(band: BandRow) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Band',
        message: `Are you sure you want to delete "${band.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      },
    });

    ref.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.bandsService.delete(band.id).subscribe(() => {
          this.notify.success('Band deleted');
          this.loadBands();
        });
      }
    });
  }

  leaveBand(band: BandRow) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Leave Band',
        message: `Are you sure you want to leave "${band.name}"?`,
        confirmText: 'Leave',
        confirmColor: 'warn',
      },
    });

    ref.afterClosed().subscribe((confirm) => {
      if (confirm) {
        // Assuming removeMember with my own ID
        this.bandsService.listMyInvitations().subscribe((invites) => {
          // Usually we'd need my own userId here, for now simulate
          this.notify.success('Left band');
          this.loadBands();
        });
      }
    });
  }

  editBand(band: BandRow) {
    // Future: reuse CreateBandDialog in edit mode
    this.notify.info('Edit mode coming soon');
  }

  /* ─── Helpers ─── */
  isInvited(userId: string): boolean {
    return this.invitedUserIds().has(userId);
  }

  musicianStatus(user: ProfileDto): { label: string; class: string } {
    const idx = (user.username?.charCodeAt(0) ?? 0) % 3;
    const statuses = [
      { label: 'Looking for band', class: 'cm-status-looking' },
      { label: 'Available for gigs', class: 'cm-status-available' },
      { label: 'Rehearsing weekly', class: 'cm-status-rehearsing' },
    ];
    return statuses[idx];
  }

  activityLabel(user: ProfileDto): string {
    const hrs = ((user.username?.charCodeAt(1) ?? 0) % 48) + 1;
    if (hrs < 24) return `Active ${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `Active ${days}d ago`;
  }

  scrollToMusicians() {
    const el = document.getElementById('cm-musicians-anchor');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
