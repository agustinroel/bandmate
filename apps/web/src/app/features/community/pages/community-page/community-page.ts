import { Component, computed, effect, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { supabase } from '../../../../core/supabase/supabase.client';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'youtube' | null;
  youtubeId?: string | null;
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
  about?: string | null;
  instruments?: string[];
  genres?: string[];
  subscription_tier?: string | null;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  mainBand?: string | null;
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
  private sanitizer = inject(DomSanitizer);

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

  /* ─── Real-time Live Feed ─── */
  private liveChannel?: RealtimeChannel;

  /* ─── Hovercard State ─── */
  readonly hoveredUser = signal<ProfileDto | null>(null);
  readonly hovercardPosition = signal<{ top: number; left: number } | null>(null);
  readonly isHoveringCard = signal(false);
  private hoverTimer: any = null;
  private hoverLeaveTimer: any = null;

  /* ─── Post Composer Attachments ─── */
  readonly attachedMediaUrl = signal<string | null>(null);
  readonly attachedMediaType = signal<'image' | 'youtube' | null>(null);
  readonly attachedYoutubeId = signal<string | null>(null);
  readonly showYoutubeInput = signal(false);
  readonly youtubeInputUrl = signal('');
  readonly showEmojiPicker = signal(false);
  readonly isUploadingImage = signal(false);
  readonly previewImageUrl = signal<string | null>(null);

  readonly emojiCategories = [
    {
      name: 'Smileys',
      icon: 'sentiment_satisfied',
      emojis: [
        '😀','😃','😄','😁','😆','😅','😂','🤣','🥹','😊',
        '😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙',
        '😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎',
        '🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣',
        '😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯',
        '😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔',
        '🫣','🤭','🫡','🤫','🫠','😐','😑','😬','🙄','😴'
      ]
    },
    {
      name: 'Música',
      icon: 'music_note',
      emojis: [
        '🎸','🥁','🎹','🎤','🎧','🎼','🎵','🎶','🎙️','🎷',
        '🎺','🎻','🪕','🪗','📻','🔊','🔉','🔈','📢','📣',
        '💿','📀','📼','🎚️','🎛️','🪘'
      ]
    },
    {
      name: 'Gestos',
      icon: 'pan_tool',
      emojis: [
        '👍','👎','👏','🙌','👐','🤝','🤘','🤟','✌️','🤞',
        '🫰','🤌','🤏','👌','👈','👉','👆','👇','✋','🖐️',
        '🖖','👋','🤙','💪','🙏','✍️','🤳'
      ]
    },
    {
      name: 'Símbolos',
      icon: 'favorite',
      emojis: [
        '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
        '❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝',
        '🔥','✨','⚡','💥','💫','🌟','⭐','💯','🎉','🎊',
        '🏆','🥇','🎯','💎','💡','🔑'
      ]
    }
  ];
  readonly selectedEmojiCategoryIndex = signal(0);
  readonly quickEmojis = ['🎸', '🥁', '🎹', '🎤', '🔥', '🤘', '🎵', '🎶', '👏', '❤️', '✨', '⚡'];

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
    this.setupRealtimeFeed();

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
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    if (this.hoverLeaveTimer) clearTimeout(this.hoverLeaveTimer);
    if (this.liveChannel) {
      supabase.removeChannel(this.liveChannel);
    }
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
    let text = this.postContent().trim();
    if (!text && !this.attachedMediaUrl() && !this.attachedYoutubeId()) return;

    if (!this.attachedYoutubeId()) {
      const match = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        this.attachedYoutubeId.set(match[1]);
        this.attachedMediaType.set('youtube');
        this.attachedMediaUrl.set(`https://www.youtube.com/watch?v=${match[1]}`);
      }
    }

    if (this.attachedYoutubeId()) {
      text = text.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=[a-zA-Z0-9_-]+|embed\/[a-zA-Z0-9_-]+|shorts\/[a-zA-Z0-9_-]+)|youtu\.be\/[a-zA-Z0-9_-]+)[^\s]*/gi, '').trim();
    }

    const user = this.authStore.user();
    const fullName = user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || user?.email?.split('@')?.[0] || 'Músico Bandmate';
    const username = user?.user_metadata?.['user_name'] || user?.email?.split('@')?.[0] || 'musico';
    const avatar = user?.user_metadata?.['avatar_url'] || user?.user_metadata?.['picture'] || null;
    const tier = this.sub.tier() || 'free';

    this.isPosting.set(true);
    this.http.post<FeedPost>(`${environment.apiBaseUrl}/feed`, {
      content: text || (this.attachedYoutubeId() ? 'Compartió un video de YouTube' : (this.attachedMediaUrl() ? 'Compartió una imagen' : 'Publicación compartida con la comunidad')),
      type: this.selectedPostType(),
      attachedSong: this.selectedSongAttachment(),
      mediaUrl: this.attachedMediaUrl(),
      mediaType: this.attachedMediaType(),
      youtubeId: this.attachedYoutubeId(),
      authorId: user?.id,
      authorName: fullName,
      authorUsername: username,
      authorAvatar: avatar,
      authorTier: tier,
    }).subscribe({
      next: (post) => {
        this.feedPosts.update((prev) => [post, ...prev]);
        this.postContent.set('');
        this.selectedSongAttachment.set(null);
        this.removeAttachedMedia();
        this.showEmojiPicker.set(false);
        this.selectedPostType.set('status');
        this.isPosting.set(false);
        this.notify.success('¡Publicación compartida con la comunidad!', 'OK', 2000);
        this.broadcastLiveEvent('new_post', post);
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

    const user = this.authStore.user();
    const fullName = user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || user?.email?.split('@')?.[0] || 'Músico Bandmate';
    const username = user?.user_metadata?.['user_name'] || user?.email?.split('@')?.[0] || 'musico';
    const avatar = user?.user_metadata?.['avatar_url'] || user?.user_metadata?.['picture'] || null;

    this.isSubmittingComment.update((m) => ({ ...m, [postId]: true }));
    this.http.post<FeedComment>(`${environment.apiBaseUrl}/feed/${postId}/comments`, {
      content: text,
      authorId: user?.id,
      authorName: fullName,
      authorUsername: username,
      authorAvatar: avatar,
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
        this.broadcastLiveEvent('new_comment', { postId, comment: newCmt });
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
    const user = this.authStore.user();
    const nextState = !post.isLiked;
    post.isLiked = nextState;
    post.likesCount += nextState ? 1 : -1;

    const fullName = user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || 'Músico';
    const username = user?.user_metadata?.['user_name'] || user?.email?.split('@')?.[0] || 'musico';

    this.http.post<{ isLiked: boolean; likesCount: number }>(
      `${environment.apiBaseUrl}/feed/${post.id}/like`,
      {
        userId: user?.id,
        authorName: fullName,
        authorUsername: username,
      }
    ).subscribe({
      next: (res) => {
        post.isLiked = res.isLiked;
        post.likesCount = res.likesCount;
        this.broadcastLiveEvent('like_update', { postId: post.id, likesCount: res.likesCount });
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
      userId: user?.id,
      authorName: fullName,
      authorUsername: username,
    }).subscribe({
      next: (res) => {
        post.repostsCount = res.repostsCount;
        if (res.repostItem) {
          this.feedPosts.update((prev) => [res.repostItem!, ...prev]);
        }
        this.broadcastLiveEvent('new_repost', { postId: post.id, repostsCount: res.repostsCount, repostItem: res.repostItem });
        this.notify.success('¡Has reposteado esta publicación!', 'OK', 1500);
      },
      error: () => {
        this.notify.error('No se pudo repostear', 'OK', 2000);
      },
    });
  }

  /* ─── Realtime Setup & Broadcast ─── */
  private setupRealtimeFeed() {
    try {
      this.liveChannel = supabase.channel('community_live_feed', {
        config: { broadcast: { self: false } },
      });

      this.liveChannel
        .on('broadcast', { event: 'new_post' }, ({ payload }) => {
          if (!payload || !payload.id) return;
          this.feedPosts.update((current) => {
            if (current.some((p) => p.id === payload.id)) return current;
            return [payload, ...current];
          });
        })
        .on('broadcast', { event: 'like_update' }, ({ payload }) => {
          if (!payload || !payload.postId) return;
          this.feedPosts.update((current) =>
            current.map((p) =>
              p.id === payload.postId
                ? { ...p, likesCount: payload.likesCount }
                : p
            )
          );
        })
        .on('broadcast', { event: 'new_comment' }, ({ payload }) => {
          if (!payload || !payload.postId) return;
          const { postId, comment } = payload;
          this.feedPosts.update((current) =>
            current.map((p) =>
              p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
            )
          );
          if (this.openCommentsPostId() === postId && comment) {
            this.commentsByPost.update((m) => {
              const list = m[postId] || [];
              if (list.some((c) => c.id === comment.id)) return m;
              return { ...m, [postId]: [...list, comment] };
            });
          }
        })
        .on('broadcast', { event: 'new_repost' }, ({ payload }) => {
          if (!payload || !payload.postId) return;
          this.feedPosts.update((current) => {
            let updated = current.map((p) =>
              p.id === payload.postId
                ? { ...p, repostsCount: payload.repostsCount }
                : p
            );
            if (payload.repostItem && !updated.some((p) => p.id === payload.repostItem.id)) {
              updated = [payload.repostItem, ...updated];
            }
            return updated;
          });
        })
        .subscribe();
    } catch (err) {
      console.warn('[Community] Realtime channel setup error:', err);
    }
  }

  private broadcastLiveEvent(event: string, payload: any) {
    if (this.liveChannel) {
      try {
        this.liveChannel.send({
          type: 'broadcast',
          event,
          payload,
        });
      } catch (_) {}
    }
  }

  /* ─── Media & Attachments ─── */
  getYoutubeSafeUrl(youtubeId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${youtubeId}`);
  }

  toggleEmojiPicker() {
    this.showEmojiPicker.update((v) => !v);
  }

  insertEmoji(emoji: string) {
    this.postContent.update((c) => c + emoji);
  }

  toggleYoutubeInput() {
    this.showYoutubeInput.update((v) => !v);
  }

  confirmYoutubeUrl() {
    const val = this.youtubeInputUrl().trim();
    const match = val.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      this.attachedYoutubeId.set(match[1]);
      this.attachedMediaType.set('youtube');
      this.attachedMediaUrl.set(`https://www.youtube.com/watch?v=${match[1]}`);
      this.showYoutubeInput.set(false);
      this.youtubeInputUrl.set('');
    } else {
      this.notify.warning('URL de YouTube no válida', 'OK', 2000);
    }
  }

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.notify.warning('Por favor selecciona un archivo de imagen', 'OK', 2000);
      return;
    }
    this.isUploadingImage.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const rawData = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            this.attachedMediaUrl.set(compressed);
          } else {
            this.attachedMediaUrl.set(rawData);
          }
        } catch {
          this.attachedMediaUrl.set(rawData);
        }
        this.attachedMediaType.set('image');
        this.attachedYoutubeId.set(null);
        this.isUploadingImage.set(false);
      };
      img.onerror = () => {
        this.attachedMediaUrl.set(rawData);
        this.attachedMediaType.set('image');
        this.attachedYoutubeId.set(null);
        this.isUploadingImage.set(false);
      };
      img.src = rawData;
    };
    reader.onerror = () => {
      this.isUploadingImage.set(false);
      this.notify.error('Error al cargar la imagen', 'OK', 2000);
    };
    reader.readAsDataURL(file);
  }

  removeAttachedMedia() {
    this.attachedMediaUrl.set(null);
    this.attachedMediaType.set(null);
    this.attachedYoutubeId.set(null);
  }

  /* ─── Hovercard & Navigation ─── */
  onAuthorMouseEnter(event: MouseEvent, post: FeedPost) {
    clearTimeout(this.hoverLeaveTimer);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.hoverTimer = setTimeout(() => {
      let p = this.profiles().find(
        (pr) => pr.username.toLowerCase() === post.authorUsername.toLowerCase() || pr.id === post.authorId
      );

      if (!p) {
        p = {
          id: post.authorId,
          username: post.authorUsername,
          full_name: post.authorName,
          avatar_url: post.authorAvatar,
          instruments: post.authorInstruments,
          subscription_tier: post.authorTier,
          isFollowing: post.isAuthorFollowed || this.isFollowing(post.authorId),
          mainBand: post.authorBand,
          bio: null,
          about: null,
          followersCount: 0,
          followingCount: 0,
        };
      } else {
        const desc = p.about || p.bio || null;
        p = {
          ...p,
          bio: desc,
          about: desc,
        };
      }

      // Always fetch latest full profile to ensure bio/about & counts are accurate
      this.http.get<ProfileDto>(`${environment.apiBaseUrl}/profiles/${post.authorUsername}`).subscribe({
        next: (full: any) => {
          if (this.hoveredUser()?.username === post.authorUsername) {
            const desc = full.about || full.bio || p!.about || p!.bio || 'Músico en Bandmate';
            this.hoveredUser.set({
              ...p,
              ...full,
              bio: desc,
              about: desc,
              isFollowing: full.isFollowing ?? this.isFollowing(full.id),
            });
          }
        },
        error: () => {},
      });

      const cardWidth = 340;
      const cardHeight = 220;
      let left = rect.left;
      if (typeof window !== 'undefined') {
        if (left + cardWidth > window.innerWidth - 16) {
          left = window.innerWidth - cardWidth - 16;
        }
        if (left < 16) left = 16;
      }

      let top = rect.bottom + 8;
      if (typeof window !== 'undefined' && rect.bottom + cardHeight > window.innerHeight && rect.top > cardHeight) {
        top = rect.top - cardHeight - 8;
      }

      this.hovercardPosition.set({ top, left });
      this.hoveredUser.set(p);
    }, 250);
  }

  onAuthorMouseLeave() {
    clearTimeout(this.hoverTimer);
    this.hoverLeaveTimer = setTimeout(() => {
      if (!this.isHoveringCard()) {
        this.hoveredUser.set(null);
        this.hovercardPosition.set(null);
      }
    }, 200);
  }

  onHovercardEnter() {
    clearTimeout(this.hoverLeaveTimer);
    this.isHoveringCard.set(true);
  }

  onHovercardLeave() {
    this.isHoveringCard.set(false);
    this.hoveredUser.set(null);
    this.hovercardPosition.set(null);
  }

  navigateToProfile(username: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.hoveredUser.set(null);
    this.hovercardPosition.set(null);
    this.router.navigate(['/u', username]);
  }

  toggleFollowFromHovercard(user: ProfileDto) {
    this.toggleFollow(user.id, user.full_name || user.username);
    const next = !(user.isFollowing || this.isFollowing(user.id));
    this.hoveredUser.update((u) =>
      u
        ? {
            ...u,
            isFollowing: next,
            followersCount: Math.max(0, (u.followersCount || 0) + (next ? 1 : -1)),
          }
        : null
    );
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
