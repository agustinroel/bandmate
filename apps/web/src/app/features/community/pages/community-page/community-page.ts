import { Component, computed, effect, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
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
import { SongsStore } from '../../../songs/state/songs-store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { I18nService } from '../../../../core/services/i18n.service';
import { AuditionDialogComponent } from '../../ui/audition-dialog/audition-dialog.component';

export type FeedComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
};

export type FeedResponse = {
  posts: FeedPost[];
  page: number;
  total: number;
  hasMore: boolean;
};

export type FeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  authorInstruments: string[];
  authorTier?: string | null;
  authorBand?: string | null;
  isBandVerified?: boolean;
  repostedBy?: string | null;
  repostedByName?: string | null;
  type: 'status' | 'song_share' | 'riff' | 'looking_for_member' | 'gig';
  content: string;
  attachedSong?: {
    id: string;
    title: string;
    artist: string;
    key?: string;
    bpm?: number;
  } | null;
  tags: string[];
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isAuthorFollowed?: boolean;
  createdAt: string;
};

type ProfileDto = {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  instruments?: string[];
  genres?: string[];
  subscription_tier?: string | null;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
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
export class CommunityPageComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationsService);
  private animation = inject(AnimationService);
  private router = inject(Router);

  readonly eventsStore = inject(EventsStore);
  readonly bandsService = inject(BandsService);
  readonly sub = inject(SubscriptionStore);
  readonly songsStore = inject(SongsStore);
  readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);

  readonly currentUserAvatar = computed(() => {
    const u = this.authStore.user();
    const pic = u?.user_metadata?.['avatar_url'] || u?.user_metadata?.['picture'];
    return typeof pic === 'string' && pic ? pic : 'assets/brand/avatar-fallback.svg';
  });

  readonly currentUserLabel = computed(() => {
    const u = this.authStore.user();
    const name = u?.user_metadata?.['full_name'] || u?.user_metadata?.['name'];
    return typeof name === 'string' && name.trim() ? name : 'Músico';
  });

  /* ─── Tabs & Feed ─── */
  readonly activeTab = signal<'feed' | 'directory' | 'auditions'>('feed');
  readonly feedFilter = signal<'for_you' | 'following'>('for_you');
  readonly feedPosts = signal<FeedPost[]>([]);
  readonly feedLoading = signal(false);
  readonly feedPage = signal(1);
  readonly feedHasMore = signal(true);
  readonly feedLoadingMore = signal(false);

  /* ─── Search, Hashtags & Trends ─── */
  readonly searchQuery = signal('');
  readonly activeTag = signal<string | null>(null);
  readonly trends = signal<{ tag: string; count: number; category: string }[]>([]);
  readonly followedUserIds = signal<Set<string>>(new Set());

  readonly postContent = signal('');
  readonly selectedPostType = signal<'status' | 'song_share' | 'riff' | 'looking_for_member' | 'gig'>('status');
  readonly selectedSongAttachment = signal<{ id: string; title: string; artist: string; key?: string; bpm?: number } | null>(null);
  readonly isPosting = signal(false);

  /* ─── Comments state ─── */
  readonly openCommentsPostId = signal<string | null>(null);
  readonly commentsByPost = signal<Record<string, FeedComment[]>>({});
  readonly commentInputs = signal<Record<string, string>>({});
  readonly loadingComments = signal<Record<string, boolean>>({});
  readonly isSubmittingComment = signal<Record<string, boolean>>({});

  private scrollObserver?: IntersectionObserver;

  readonly auditionPosts = computed(() =>
    this.feedPosts().filter((p) => p.type === 'looking_for_member')
  );

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

  readonly whoToFollow = computed(() => {
    const currentId = this.authStore.user()?.id;
    return this.profiles()
      .filter((p) => p.id !== currentId && !this.followedUserIds().has(p.id))
      .slice(0, 4);
  });

  constructor() {
    this.loadFeed();
    this.loadTrends();
    this.loadProfiles();
    this.loadBands();
    this.loadActivities();
    this.loadInvitationsCount();
    this.initDiscovery();

    // Load user songs if not loaded for attachment picker
    if (this.songsStore.state() === 'idle') {
      this.songsStore.load();
    }

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

  ngAfterViewInit() {
    this.setupInfiniteScroll();
  }

  ngOnDestroy() {
    this.scrollObserver?.disconnect();
  }

  private setupInfiniteScroll() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.scrollObserver?.disconnect();
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting && this.feedHasMore() && !this.feedLoading() && !this.feedLoadingMore()) {
          this.loadMoreFeed();
        }
      },
      { rootMargin: '350px' }
    );

    const sentinel = document.getElementById('feedScrollSentinel');
    if (sentinel) {
      this.scrollObserver.observe(sentinel);
    }
  }

  /* ─── Feed Methods ─── */
  setTab(tab: 'feed' | 'directory' | 'auditions') {
    this.activeTab.set(tab);
    if (tab === 'feed') {
      setTimeout(() => {
        const posts = document.querySelectorAll('.feed-post-card');
        if (posts.length) this.animation.staggerList(Array.from(posts), 0.05, 0.15);
        this.setupInfiniteScroll();
      }, 60);
    }
  }

  setFeedFilter(f: 'for_you' | 'following') {
    this.feedFilter.set(f);
    this.loadFeed(true);
  }

  loadFeed(reset = true) {
    if (reset) {
      this.feedPage.set(1);
      this.feedHasMore.set(true);
      this.feedLoading.set(true);
    }

    const params: any = {
      filter: this.feedFilter(),
      page: this.feedPage(),
      limit: 10,
    };
    if (this.searchQuery().trim()) {
      params.search = this.searchQuery().trim();
    }
    if (this.activeTag()) {
      params.tag = this.activeTag();
    }

    this.http.get<FeedResponse>(`${environment.apiBaseUrl}/feed`, { params }).subscribe({
      next: (res) => {
        const items = res?.posts ?? [];
        if (reset) {
          this.feedPosts.set(items);
        } else {
          this.feedPosts.update((prev) => [...prev, ...items]);
        }
        this.feedHasMore.set(res?.hasMore ?? false);
        this.feedLoading.set(false);
        this.feedLoadingMore.set(false);

        setTimeout(() => this.setupInfiniteScroll(), 120);
      },
      error: () => {
        this.feedLoading.set(false);
        this.feedLoadingMore.set(false);
      },
    });
  }

  loadTrends() {
    this.http.get<{ trends: { tag: string; count: number; category: string }[] }>(
      `${environment.apiBaseUrl}/feed/trends`
    ).subscribe({
      next: (res) => {
        if (res?.trends) {
          this.trends.set(res.trends);
        }
      },
      error: () => {},
    });
  }

  filterByTag(tag: string) {
    this.activeTag.set(tag);
    this.activeTab.set('feed');
    this.loadFeed(true);
  }

  onSearchFeed(q?: string) {
    if (q !== undefined) {
      this.searchQuery.set(q);
    }
    this.loadFeed(true);
  }

  clearFeedFilter() {
    this.searchQuery.set('');
    this.activeTag.set(null);
    this.loadFeed(true);
  }

  toggleFollow(targetUserId: string, name?: string) {
    const currentUserId = this.authStore.user()?.id;
    if (!currentUserId) {
      this.notify.warning(this.i18n.t('community.followMustBeLoggedIn', 'Inicia sesión para seguir a otros músicos'));
      return;
    }
    if (targetUserId === currentUserId) {
      this.notify.warning(this.i18n.t('community.cannotFollowSelf', 'No puedes seguirte a ti mismo'));
      return;
    }

    this.http.post<{ isFollowing: boolean; followersCount: number }>(
      `${environment.apiBaseUrl}/community/follow/${targetUserId}`,
      {}
    ).subscribe({
      next: (res) => {
        this.followedUserIds.update((set) => {
          const next = new Set(set);
          if (res.isFollowing) next.add(targetUserId);
          else next.delete(targetUserId);
          return next;
        });

        this.feedPosts.update((posts) =>
          posts.map((p) =>
            p.authorId === targetUserId ? { ...p, isAuthorFollowed: res.isFollowing } : p
          )
        );

        this.profiles.update((profs) =>
          profs.map((p) =>
            p.id === targetUserId
              ? { ...p, isFollowing: res.isFollowing, followersCount: res.followersCount }
              : p
          )
        );

        const msg = res.isFollowing
          ? `Ahora sigues a ${name || 'este músico'}`
          : `Has dejado de seguir a ${name || 'este músico'}`;
        this.notify.success(msg, 'OK', 1500);

        if (this.feedFilter() === 'following') {
          this.loadFeed(true);
        }
      },
      error: () => {
        this.notify.error('No se pudo actualizar el seguimiento', 'OK', 2000);
      },
    });
  }

  isFollowing(targetUserId: string): boolean {
    return this.followedUserIds().has(targetUserId);
  }

  loadMoreFeed() {
    if (!this.feedHasMore() || this.feedLoading() || this.feedLoadingMore()) return;
    this.feedLoadingMore.set(true);
    this.feedPage.update((p) => p + 1);
    this.loadFeed(false);
  }

  submitPost() {
    const text = this.postContent().trim();
    if (!text) return;

    const user = this.authStore.user();
    const fullName = user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || 'Músico Bandmate';
    const username = user?.user_metadata?.['user_name'] || user?.email?.split('@')?.[0] || 'musico';
    const avatar = user?.user_metadata?.['avatar_url'] || user?.user_metadata?.['picture'] || null;
    const tier = this.sub.tier() || 'free';

    this.isPosting.set(true);
    this.http.post<FeedPost>(`${environment.apiBaseUrl}/feed`, {
      content: text,
      type: this.selectedPostType(),
      attachedSong: this.selectedSongAttachment(),
      authorName: fullName,
      authorUsername: username,
      authorAvatar: avatar,
      authorTier: tier,
    }).subscribe({
      next: (post) => {
        this.feedPosts.update((prev) => [post, ...prev]);
        this.postContent.set('');
        this.selectedSongAttachment.set(null);
        this.selectedPostType.set('status');
        this.isPosting.set(false);
        this.notify.success('¡Publicación compartida con la comunidad!', 'OK', 2000);
        this.loadTrends();
      },
      error: () => {
        this.notify.error('No se pudo publicar', 'OK', 2000);
        this.isPosting.set(false);
      },
    });
  }

  /* ─── Comments Interaction ─── */
  toggleComments(postId: string) {
    if (this.openCommentsPostId() === postId) {
      this.openCommentsPostId.set(null);
      return;
    }
    this.openCommentsPostId.set(postId);
    if (!this.commentsByPost()[postId]) {
      this.loadingComments.update((m) => ({ ...m, [postId]: true }));
      this.http.get<FeedComment[]>(`${environment.apiBaseUrl}/feed/${postId}/comments`).subscribe({
        next: (cmts) => {
          this.commentsByPost.update((m) => ({ ...m, [postId]: cmts || [] }));
          this.loadingComments.update((m) => ({ ...m, [postId]: false }));
        },
        error: () => {
          this.loadingComments.update((m) => ({ ...m, [postId]: false }));
        },
      });
    }
  }

  getCommentInput(postId: string): string {
    return this.commentInputs()[postId] || '';
  }

  setCommentInput(postId: string, text: string) {
    this.commentInputs.update((m) => ({ ...m, [postId]: text }));
  }

  submitComment(postId: string) {
    const text = (this.commentInputs()[postId] || '').trim();
    if (!text) return;

    this.isSubmittingComment.update((m) => ({ ...m, [postId]: true }));
    this.http.post<FeedComment>(`${environment.apiBaseUrl}/feed/${postId}/comments`, {
      content: text,
      authorName: 'Agustín Roel',
      authorUsername: 'agustinroel',
    }).subscribe({
      next: (newCmt) => {
        this.commentsByPost.update((m) => ({
          ...m,
          [postId]: [...(m[postId] || []), newCmt],
        }));
        this.commentInputs.update((m) => ({ ...m, [postId]: '' }));
        this.isSubmittingComment.update((m) => ({ ...m, [postId]: false }));

        this.feedPosts.update((posts) =>
          posts.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
        this.notify.success('Comentario publicado', 'OK', 1500);
      },
      error: () => {
        this.notify.error('No se pudo enviar el comentario', 'OK', 2000);
        this.isSubmittingComment.update((m) => ({ ...m, [postId]: false }));
      },
    });
  }

  copyPostLink(post: FeedPost) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
      this.notify.success('Enlace copiado al portapapeles', 'OK', 2000);
    }
  }

  playSong(songId: string) {
    this.router.navigate(['/songs', songId]);
  }

  toggleLike(post: FeedPost) {
    const nextState = !post.isLiked;
    post.isLiked = nextState;
    post.likesCount += nextState ? 1 : -1;

    this.http.post<{ isLiked: boolean; likesCount: number }>(
      `${environment.apiBaseUrl}/feed/${post.id}/like`,
      {}
    ).subscribe({
      next: (res) => {
        post.isLiked = res.isLiked;
        post.likesCount = res.likesCount;
      },
      error: () => {
        post.isLiked = !nextState;
        post.likesCount += nextState ? -1 : 1;
      },
    });
  }

  repost(post: FeedPost) {
    post.repostsCount += 1;
    const user = this.authStore.user();
    const fullName = user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || 'Músico Bandmate';
    const username = user?.user_metadata?.['user_name'] || user?.email?.split('@')?.[0] || 'musico';

    this.http.post<{ repostsCount: number; repostItem?: FeedPost }>(`${environment.apiBaseUrl}/feed/${post.id}/repost`, {
      authorName: fullName,
      authorUsername: username,
    }).subscribe({
      next: (res) => {
        post.repostsCount = res.repostsCount;
        if (res.repostItem) {
          this.feedPosts.update((prev) => [res.repostItem!, ...prev]);
        }
        this.notify.success('¡Has reposteado esta publicación!', 'OK', 1500);
      },
      error: () => {
        this.notify.error('No se pudo repostear', 'OK', 2000);
      },
    });
  }

  getInstrumentClass(inst: string): string {
    const s = (inst || '').toLowerCase();
    if (s.includes('guitar')) return 'cm-inst-guitar';
    if (s.includes('bass') || s.includes('bajo')) return 'cm-inst-bass';
    if (s.includes('drum') || s.includes('bater')) return 'cm-inst-drums';
    if (s.includes('key') || s.includes('piano') || s.includes('tecl')) return 'cm-inst-keys';
    if (s.includes('vocal') || s.includes('sing') || s.includes('voz') || s.includes('cant')) return 'cm-inst-vocals';
    if (s.includes('sax') || s.includes('tromp') || s.includes('brass')) return 'cm-inst-brass';
    return 'cm-inst-default';
  }

  getInstrumentIcon(inst: string): string {
    const s = (inst || '').toLowerCase();
    if (s.includes('guitar')) return '🎸';
    if (s.includes('bass') || s.includes('bajo')) return '🎸';
    if (s.includes('drum') || s.includes('bater')) return '🥁';
    if (s.includes('key') || s.includes('piano') || s.includes('tecl')) return '🎹';
    if (s.includes('vocal') || s.includes('sing') || s.includes('voz') || s.includes('cant')) return '🎤';
    if (s.includes('sax') || s.includes('tromp') || s.includes('brass')) return '🎷';
    return '🎵';
  }

  attachSong(song: any) {
    this.selectedSongAttachment.set({
      id: song.id,
      title: song.title,
      artist: song.artist,
      key: song.key,
      bpm: song.bpm ? Number(song.bpm) : undefined,
    });
  }

  removeAttachedSong() {
    this.selectedSongAttachment.set(null);
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
        const followed = new Set<string>();
        for (const p of data) {
          if (p.isFollowing) followed.add(p.id);
        }
        this.followedUserIds.set(followed);
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
  isInstrumentSelected(inst: string): boolean {
    return this.selectedInstruments().includes(inst);
  }

  openInviteMenu(profile: ProfileDto) {
    this.inviteToBand(profile.id);
  }

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

  openAuditionApply(post: any) {
    this.dialog.open(AuditionDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      data: {
        postId: post.id,
        postTitle: post.content.slice(0, 50),
        bandName: post.authorBand || post.authorName,
        mode: 'apply',
      },
    });
  }

  openAuditionDashboard(post: any) {
    this.dialog.open(AuditionDialogComponent, {
      width: '740px',
      maxWidth: '96vw',
      data: {
        postId: post.id,
        postTitle: post.content.slice(0, 50),
        bandName: post.authorBand || post.authorName,
        mode: 'review',
      },
    });
  }

  getAuditionCount(postId: string): number {
    const raw = localStorage.getItem(`bandmate_auditions_${postId}`);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
}
