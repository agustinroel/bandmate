import { readJson, writeJson } from '../persistance/json.store.js';
import { getFollowedUserIds } from './follows.repo.js';
import { supabase } from '../lib/supabase.js';

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

export interface FeedPost {
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
  mediaType?: 'image' | 'youtube' | null;
  youtubeId?: string | null;
  tags: string[];
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface AuditionApplication {
  id: string;
  postId: string;
  musicianId: string;
  musicianName: string;
  musicianUsername?: string;
  musicianAvatar?: string | null;
  instrument: string;
  experienceYears: number;
  mediaUrl?: string;
  message: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected';
  privateNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const POSTS_FILE = 'feed_posts.json';
const COMMENTS_FILE = 'feed_comments.json';
const APPLICATIONS_FILE = 'audition_applications.json';

// In-memory cache + persistent backing
let cachedPosts: FeedPost[] | null = null;
let cachedComments: FeedComment[] | null = null;
let cachedApplications: AuditionApplication[] | null = null;
const LIKES_FILE = 'feed_likes.json';
let cachedLikes: Set<string> | null = null;

async function getStoredLikes(): Promise<Set<string>> {
  if (cachedLikes === null) {
    cachedLikes = new Set<string>();
    try {
      if (supabase) {
        const { data, error } = await supabase.from('community_likes').select('user_id, post_id');
        if (!error && data && data.length > 0) {
          data.forEach((r: any) => cachedLikes!.add(`${r.user_id}:${r.post_id}`));
          await writeJson(LIKES_FILE, Array.from(cachedLikes));
          return cachedLikes;
        }
      }
    } catch (_) {}

    const stored = await readJson<string[]>(LIKES_FILE, []);
    stored.forEach((k) => cachedLikes!.add(k));
  }
  return cachedLikes;
}

async function getStoredPosts(): Promise<FeedPost[]> {
  if (cachedPosts === null) {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          cachedPosts = data.map((r: any) => ({
            id: r.id,
            authorId: r.author_id,
            authorName: r.author_name,
            authorUsername: r.author_username,
            authorAvatar: r.author_avatar,
            authorInstruments: r.author_instruments || [],
            authorTier: r.author_tier,
            authorBand: r.author_band,
            isBandVerified: r.is_band_verified,
            repostedBy: r.reposted_by,
            repostedByName: r.reposted_by_name,
            type: r.type,
            content: r.content,
            attachedSong: r.attached_song,
            mediaUrl: r.media_url,
            mediaType: r.media_type,
            youtubeId: r.youtube_id,
            tags: r.tags || [],
            likesCount: r.likes_count ?? 0,
            repostsCount: r.reposts_count ?? 0,
            commentsCount: r.comments_count ?? 0,
            createdAt: r.created_at,
          }));
          await writeJson(POSTS_FILE, cachedPosts);
          return cachedPosts;
        }
      }
    } catch {
      // Fallback
    }

    cachedPosts = await readJson<FeedPost[]>(POSTS_FILE, []);
  }
  return cachedPosts;
}

async function getStoredComments(): Promise<FeedComment[]> {
  if (cachedComments === null) {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('community_comments')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          cachedComments = data.map((r: any) => ({
            id: r.id,
            postId: r.post_id,
            authorId: r.author_id,
            authorName: r.author_name,
            authorUsername: r.author_username,
            authorAvatar: r.author_avatar,
            content: r.content,
            createdAt: r.created_at,
          }));
          await writeJson(COMMENTS_FILE, cachedComments);
          return cachedComments;
        }
      }
    } catch {
      // Fallback
    }

    cachedComments = await readJson<FeedComment[]>(COMMENTS_FILE, []);
  }
  return cachedComments;
}

async function getStoredApplications(): Promise<AuditionApplication[]> {
  if (cachedApplications === null) {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('audition_applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          cachedApplications = data.map((r: any) => ({
            id: r.id,
            postId: r.post_id,
            musicianId: r.musician_id,
            musicianName: r.musician_name,
            musicianUsername: r.musician_username,
            musicianAvatar: r.musician_avatar,
            instrument: r.instrument,
            experienceYears: r.experience_years ?? 0,
            mediaUrl: r.media_url,
            message: r.message,
            status: r.status,
            privateNotes: r.private_notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
          await writeJson(APPLICATIONS_FILE, cachedApplications);
          return cachedApplications;
        }
      }
    } catch {
      // Fallback
    }

    cachedApplications = await readJson<AuditionApplication[]>(APPLICATIONS_FILE, []);
  }
  return cachedApplications;
}

export async function getFeedPosts(
  filter: 'for_you' | 'following' = 'for_you',
  userId?: string,
  page = 1,
  limit = 10,
  search?: string,
  tag?: string
): Promise<{ posts: FeedPost[]; page: number; total: number; hasMore: boolean }> {
  const allPosts = await getStoredPosts();
  const likes = await getStoredLikes();

  // Map likes for current user strictly
  let formatted = allPosts.map((post) => ({
    ...post,
    isLiked: userId ? likes.has(`${userId}:${post.id}`) : false,
  }));

  // Filter by following if requested
  if (filter === 'following' && userId) {
    const followedIds = await getFollowedUserIds(userId);
    // Show posts from people user follows + their own posts
    formatted = formatted.filter((p) => p.authorId === userId || followedIds.includes(p.authorId));
  }

  // Filter by search keyword
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    formatted = formatted.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.authorUsername.toLowerCase().includes(q) ||
        (p.attachedSong && (p.attachedSong.title.toLowerCase().includes(q) || p.attachedSong.artist.toLowerCase().includes(q)))
    );
  }

  // Filter by hashtag
  if (tag && tag.trim()) {
    const clean = tag.trim().replace(/^#/, '').toLowerCase();
    formatted = formatted.filter(
      (p) =>
        (p.tags || []).some((t) => t.toLowerCase() === clean) ||
        p.content.toLowerCase().includes('#' + clean)
    );
  }

  // X.com-style ranking algorithm for "For you" / "Para ti"
  if (filter === 'for_you') {
    const now = Date.now();
    formatted.sort((a, b) => {
      // Recency decay (hours elapsed)
      const aHours = Math.max(0.05, (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
      const bHours = Math.max(0.05, (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60));

      // Tier boost
      const aTier = (a.authorTier || '').toLowerCase();
      const bTier = (b.authorTier || '').toLowerCase();
      const aTierBonus = aTier === 'studio' || aTier === 'band' ? 25 : aTier === 'pro' ? 15 : 0;
      const bTierBonus = bTier === 'studio' || bTier === 'band' ? 25 : bTier === 'pro' ? 15 : 0;

      // Engagement score: likes * 3 + reposts * 5 + comments * 4 + songAttached (10)
      const aEng = a.likesCount * 3 + a.repostsCount * 5 + a.commentsCount * 4 + (a.attachedSong ? 10 : 0);
      const bEng = b.likesCount * 3 + b.repostsCount * 5 + b.commentsCount * 4 + (b.attachedSong ? 10 : 0);

      // Gravity decay formula: Score = (Engagement + TierBonus + 1) / (Hours + 2)^1.25
      const aScore = (aEng + aTierBonus + 1) / Math.pow(aHours + 2, 1.25);
      const bScore = (bEng + bTierBonus + 1) / Math.pow(bHours + 2, 1.25);

      return bScore - aScore;
    });
  } else {
    // Chronological descending for 'following'
    formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const offset = (page - 1) * limit;
  const paginated = formatted.slice(offset, offset + limit);
  const hasMore = offset + limit < formatted.length;

  return {
    posts: paginated,
    page,
    total: formatted.length,
    hasMore,
  };
}

export async function getTrendingHashtags(): Promise<{ tag: string; count: number; category: string }[]> {
  const posts = await getStoredPosts();
  const counts: Record<string, number> = {};

  for (const post of posts) {
    const postTags = new Set<string>();
    // Tags array
    (post.tags || []).forEach((t) => postTags.add(t.toLowerCase().replace(/^#/, '')));
    // Extracted from content
    const inText = post.content.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g) || [];
    inText.forEach((t) => postTags.add(t.slice(1).toLowerCase()));

    for (const tag of postTags) {
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  // Pre-seed with vibrant music community trends if needed
  const defaultTrends: { tag: string; count: number; category: string }[] = [
    { tag: 'StandByMe', count: 84, category: 'Canciones populares' },
    { tag: 'Wonderwall', count: 112, category: 'Clásicos de fogón' },
    { tag: 'BuscoBaterista', count: 37, category: 'Audiciones' },
    { tag: 'SoloGuitarra', count: 52, category: 'Riffs & Jams' },
    { tag: 'RockArgentino', count: 96, category: 'Comunidad' },
    { tag: 'StageMode', count: 43, category: 'Bandmate Live' },
  ];

  const sortedReal = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count, category: 'Tendencia en Bandmate' }));

  const merged = [...sortedReal];
  for (const dt of defaultTrends) {
    if (!merged.some((m) => m.tag.toLowerCase() === dt.tag.toLowerCase())) {
      merged.push(dt);
    }
  }

  return merged.slice(0, 8);
}

export async function createFeedPost(
  userId: string,
  userProfile: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    instruments?: string[] | null;
    subscription_tier?: string | null;
    primary_band?: string | null;
    is_band_verified?: boolean;
  },
  postData: {
    type?: FeedPost['type'];
    content: string;
    attachedSong?: FeedPost['attachedSong'];
    mediaUrl?: string | null;
    mediaType?: 'image' | 'youtube' | null;
    youtubeId?: string | null;
    tags?: string[];
  }
): Promise<FeedPost> {
  const posts = await getStoredPosts();

  // Extract hashtags from content
  const regex = /#([a-zA-Z0-9_\u00C0-\u017F]+)/g;
  const inTextTags = (postData.content.match(regex) || []).map((t) => t.slice(1).toLowerCase());
  const allTags = Array.from(new Set([...(postData.tags || []), ...inTextTags]));

  // Auto-detect YouTube URL if not explicitly specified
  let mediaType = postData.mediaType || null;
  let mediaUrl = postData.mediaUrl || null;
  let youtubeId = postData.youtubeId || null;

  if (!youtubeId) {
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const ytMatch = (postData.content || '').match(ytRegex) || (mediaUrl || '').match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      youtubeId = ytMatch[1];
      mediaType = 'youtube';
      if (!mediaUrl) mediaUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    }
  }

  // Clean raw YouTube link from user content so only user commentary is shown
  let postContent = postData.content;
  if (youtubeId) {
    const ytUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=[a-zA-Z0-9_-]+|embed\/[a-zA-Z0-9_-]+|shorts\/[a-zA-Z0-9_-]+)|youtu\.be\/[a-zA-Z0-9_-]+)(?:&[a-zA-Z0-9_=&%-]*)?/gi;
    const stripped = postContent.replace(ytUrlRegex, '').trim();
    if (stripped.length > 0) {
      postContent = stripped;
    }
  }

  if (mediaUrl && !mediaType) {
    mediaType = mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || mediaUrl.startsWith('data:image/') ? 'image' : null;
  }

  const newPost: FeedPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    authorId: userId,
    authorName: userProfile.full_name || userProfile.username || 'Musician',
    authorUsername: userProfile.username || 'musician',
    authorAvatar: userProfile.avatar_url || null,
    authorInstruments: userProfile.instruments || ['Guitar'],
    authorTier: userProfile.subscription_tier || 'free',
    authorBand: userProfile.primary_band || null,
    isBandVerified: userProfile.is_band_verified || false,
    type: postData.type || 'status',
    content: postContent,
    attachedSong: postData.attachedSong || null,
    mediaUrl,
    mediaType,
    youtubeId,
    tags: allTags,
    likesCount: 0,
    repostsCount: 0,
    commentsCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
  };

  posts.unshift(newPost);
  cachedPosts = posts;
  await writeJson(POSTS_FILE, posts);

  // Supabase PostgreSQL permanent persistence
  try {
    if (supabase) {
      await supabase.from('community_posts').insert({
        id: newPost.id,
        author_id: newPost.authorId,
        author_name: newPost.authorName,
        author_username: newPost.authorUsername,
        author_avatar: newPost.authorAvatar,
        author_instruments: newPost.authorInstruments,
        author_tier: newPost.authorTier,
        author_band: newPost.authorBand,
        is_band_verified: newPost.isBandVerified,
        reposted_by: newPost.repostedBy,
        reposted_by_name: newPost.repostedByName,
        type: newPost.type,
        content: newPost.content,
        attached_song: newPost.attachedSong,
        media_url: newPost.mediaUrl,
        media_type: newPost.mediaType,
        youtube_id: newPost.youtubeId,
        tags: newPost.tags,
        likes_count: newPost.likesCount,
        reposts_count: newPost.repostsCount,
        comments_count: newPost.commentsCount,
        created_at: newPost.createdAt,
      });
    }
  } catch (e) {
    console.warn('[feed.repo] Supabase post insert warning:', e);
  }

  return newPost;
}

export async function togglePostLike(
  userId: string,
  postId: string,
  userProfile?: { full_name?: string | null; username?: string | null }
): Promise<{ isLiked: boolean; likesCount: number }> {
  const posts = await getStoredPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  const likes = await getStoredLikes();
  const key = `${userId}:${postId}`;
  let isLiked: boolean;

  if (likes.has(key)) {
    likes.delete(key);
    post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
    isLiked = false;

    // Supabase DB delete like
    try {
      if (supabase) {
        await supabase.from('community_likes').delete().eq('user_id', userId).eq('post_id', postId);
        await supabase.from('community_posts').update({ likes_count: post.likesCount }).eq('id', postId);
      }
    } catch (e) {
      console.warn('[feed.repo] Supabase like delete warning:', e);
    }
  } else {
    likes.add(key);
    post.likesCount = (post.likesCount || 0) + 1;
    isLiked = true;

    // Supabase DB insert like
    try {
      if (supabase) {
        await supabase.from('community_likes').insert({ user_id: userId, post_id: postId });
        await supabase.from('community_posts').update({ likes_count: post.likesCount }).eq('id', postId);
      }
    } catch (e) {
      console.warn('[feed.repo] Supabase like insert warning:', e);
    }

    // Trigger notification to post author when someone else likes it
    const isSelfLike = post.authorId === userId || (userProfile?.username && post.authorUsername === userProfile.username);
    if (post.authorId && !isSelfLike) {
      try {
        const { createNotification } = await import('../notifications/notifications.repo.js');
        const likerName = userProfile?.full_name || userProfile?.username || 'Un músico';
        await createNotification(
          post.authorId,
          'like',
          'Nuevo me gusta en tu publicación',
          `${likerName} ha indicado que le gusta tu publicación.`,
          { postId, likerId: userId }
        );
      } catch (notifErr) {
        console.warn('[feed.repo] Like notification warning:', notifErr);
      }
    }
  }

  await writeJson(LIKES_FILE, Array.from(likes));
  await writeJson(POSTS_FILE, posts);
  return { isLiked, likesCount: post.likesCount };
}

export async function repostPost(
  userId: string,
  userProfile: { full_name?: string | null; username?: string | null },
  postId: string
): Promise<{ repostsCount: number; repostItem?: FeedPost }> {
  const posts = await getStoredPosts();
  const original = posts.find((p) => p.id === postId);
  if (!original) throw new Error('Post not found');

  original.repostsCount = (original.repostsCount || 0) + 1;

  // Create a repost feed entry visible in the feed with reposter attribution
  const reposterName = userProfile.full_name || userProfile.username || 'Un músico';
  const repostItem: FeedPost = {
    ...original,
    id: `repost-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    repostedBy: userId,
    repostedByName: reposterName,
    createdAt: new Date().toISOString(),
  };

  posts.unshift(repostItem);
  cachedPosts = posts;
  await writeJson(POSTS_FILE, posts);

  // Notify original author
  if (original.authorId && original.authorId !== userId) {
    try {
      const { createNotification } = await import('../notifications/notifications.repo.js');
      await createNotification(
        original.authorId,
        'repost',
        'Tu publicación ha sido republicada',
        `${reposterName} ha compartido tu publicación en la comunidad.`,
        { postId, reposterId: userId }
      );
    } catch (notifErr) {
      console.warn('[feed.repo] Repost notification warning:', notifErr);
    }
  }

  return { repostsCount: original.repostsCount, repostItem };
}

export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const comments = await getStoredComments();
  return comments.filter((c) => c.postId === postId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function createPostComment(
  postId: string,
  userId: string,
  userProfile: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  },
  content: string
): Promise<FeedComment> {
  const posts = await getStoredPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  const comments = await getStoredComments();

  const newComment: FeedComment = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    postId,
    authorId: userId,
    authorName: userProfile.full_name || userProfile.username || 'Musician',
    authorUsername: userProfile.username || 'musician',
    authorAvatar: userProfile.avatar_url || null,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  cachedComments = comments;
  post.commentsCount = (post.commentsCount || 0) + 1;

  await writeJson(COMMENTS_FILE, comments);
  await writeJson(POSTS_FILE, posts);

  // Supabase PostgreSQL permanent persistence for comment
  try {
    if (supabase) {
      await supabase.from('community_comments').insert({
        id: newComment.id,
        post_id: newComment.postId,
        author_id: newComment.authorId,
        author_name: newComment.authorName,
        author_username: newComment.authorUsername,
        author_avatar: newComment.authorAvatar,
        content: newComment.content,
        created_at: newComment.createdAt,
      });
      await supabase
        .from('community_posts')
        .update({ comments_count: post.commentsCount })
        .eq('id', postId);
    }
  } catch (e) {
    console.warn('[feed.repo] Supabase comment insert warning:', e);
  }

  // Notify post author
  const isSelfComment = post.authorId === userId || (userProfile.username && post.authorUsername === userProfile.username);
  if (post.authorId && !isSelfComment) {
    try {
      const { createNotification } = await import('../notifications/notifications.repo.js');
      const snippet = newComment.content.length > 50 ? newComment.content.slice(0, 50) + '...' : newComment.content;
      await createNotification(
        post.authorId,
        'comment',
        'Nuevo comentario en tu publicación',
        `${newComment.authorName} comentó: "${snippet}"`,
        { postId, commentId: newComment.id, authorId: userId }
      );
    } catch (notifErr) {
      console.warn('[feed.repo] Comment notification warning:', notifErr);
    }
  }

  return newComment;
}

export async function createAuditionApplication(
  postId: string,
  musicianId: string,
  userProfile: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  },
  data: {
    instrument: string;
    experienceYears: number;
    mediaUrl?: string;
    message: string;
  }
): Promise<AuditionApplication> {
  const posts = await getStoredPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Audition post not found');

  const applications = await getStoredApplications();

  // Check if musician already applied
  const existing = applications.find(
    (a) => a.postId === postId && a.musicianId === musicianId
  );
  if (existing) {
    throw new Error('Ya has enviado una solicitud para esta audición');
  }

  const now = new Date().toISOString();
  const application: AuditionApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    postId,
    musicianId,
    musicianName: userProfile.full_name || userProfile.username || 'Músico',
    musicianUsername: userProfile.username || 'musico',
    musicianAvatar: userProfile.avatar_url || null,
    instrument: data.instrument,
    experienceYears: data.experienceYears,
    mediaUrl: data.mediaUrl?.trim() || undefined,
    message: data.message.trim(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  applications.push(application);
  cachedApplications = applications;
  await writeJson(APPLICATIONS_FILE, applications);

  // Supabase DB insert for audition application
  try {
    if (supabase) {
      await supabase.from('audition_applications').insert({
        id: application.id,
        post_id: application.postId,
        musician_id: application.musicianId,
        musician_name: application.musicianName,
        musician_username: application.musicianUsername,
        musician_avatar: application.musicianAvatar,
        instrument: application.instrument,
        experience_years: application.experienceYears,
        media_url: application.mediaUrl,
        message: application.message,
        status: application.status,
        created_at: application.createdAt,
        updated_at: application.updatedAt,
      });
    }
  } catch (e) {
    console.warn('[feed.repo] Supabase audition application insert warning:', e);
  }

  return application;
}

export async function getAuditionApplications(postId: string): Promise<AuditionApplication[]> {
  const applications = await getStoredApplications();
  return applications.filter((a) => a.postId === postId);
}

export async function updateAuditionApplication(
  applicationId: string,
  updates: {
    status?: AuditionApplication['status'];
    privateNotes?: string;
  }
): Promise<AuditionApplication> {
  const applications = await getStoredApplications();
  const app = applications.find((a) => a.id === applicationId);
  if (!app) throw new Error('Application not found');

  if (updates.status) app.status = updates.status;
  if (updates.privateNotes !== undefined) app.privateNotes = updates.privateNotes;
  app.updatedAt = new Date().toISOString();

  cachedApplications = applications;
  await writeJson(APPLICATIONS_FILE, applications);

  // Supabase DB update for audition application
  try {
    if (supabase) {
      await supabase
        .from('audition_applications')
        .update({
          status: app.status,
          private_notes: app.privateNotes,
          updated_at: app.updatedAt,
        })
        .eq('id', applicationId);
    }
  } catch (e) {
    console.warn('[feed.repo] Supabase audition application update warning:', e);
  }

  return app;
}
