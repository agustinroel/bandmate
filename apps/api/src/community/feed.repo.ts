import { readJson, writeJson } from '../persistance/json.store.js';
import { getFollowedUserIds } from './follows.repo.js';

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
const userLikes = new Set<string>();

async function getStoredPosts(): Promise<FeedPost[]> {
  if (cachedPosts === null) {
    cachedPosts = await readJson<FeedPost[]>(POSTS_FILE, []);
  }
  return cachedPosts;
}

async function getStoredComments(): Promise<FeedComment[]> {
  if (cachedComments === null) {
    cachedComments = await readJson<FeedComment[]>(COMMENTS_FILE, []);
  }
  return cachedComments;
}

async function getStoredApplications(): Promise<AuditionApplication[]> {
  if (cachedApplications === null) {
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

  // Map likes for current user
  let formatted = allPosts.map((post) => ({
    ...post,
    isLiked: userId ? userLikes.has(`${userId}:${post.id}`) || post.isLiked : post.isLiked,
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
    tags?: string[];
  }
): Promise<FeedPost> {
  const posts = await getStoredPosts();

  // Extract hashtags from content
  const regex = /#([a-zA-Z0-9_\u00C0-\u017F]+)/g;
  const inTextTags = (postData.content.match(regex) || []).map((t) => t.slice(1).toLowerCase());
  const allTags = Array.from(new Set([...(postData.tags || []), ...inTextTags]));

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
    content: postData.content,
    attachedSong: postData.attachedSong || null,
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

  return newPost;
}

export async function togglePostLike(
  userId: string,
  postId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  const posts = await getStoredPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error('Post not found');

  const key = `${userId}:${postId}`;
  if (userLikes.has(key)) {
    userLikes.delete(key);
    post.likesCount = Math.max(0, post.likesCount - 1);
    post.isLiked = false;
  } else {
    userLikes.add(key);
    post.likesCount += 1;
    post.isLiked = true;
  }

  await writeJson(POSTS_FILE, posts);
  return { isLiked: post.isLiked, likesCount: post.likesCount };
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

  return app;
}
