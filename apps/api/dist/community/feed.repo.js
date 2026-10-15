import { readJson, writeJson } from '../persistance/json.store.js';
import { getFollowedUserIds } from './follows.repo.js';
import { supabase } from '../lib/supabase.js';
const POSTS_FILE = 'feed_posts.json';
const COMMENTS_FILE = 'feed_comments.json';
const APPLICATIONS_FILE = 'audition_applications.json';
// In-memory cache + persistent backing
let cachedPosts = null;
let cachedComments = null;
let cachedApplications = null;
const userLikes = new Set();
async function getStoredPosts() {
    if (cachedPosts === null) {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('community_posts')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data && data.length > 0) {
                    cachedPosts = data.map((r) => ({
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
        }
        catch {
            // Fallback
        }
        cachedPosts = await readJson(POSTS_FILE, []);
    }
    return cachedPosts;
}
async function getStoredComments() {
    if (cachedComments === null) {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('community_comments')
                    .select('*')
                    .order('created_at', { ascending: true });
                if (!error && data && data.length > 0) {
                    cachedComments = data.map((r) => ({
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
        }
        catch {
            // Fallback
        }
        cachedComments = await readJson(COMMENTS_FILE, []);
    }
    return cachedComments;
}
async function getStoredApplications() {
    if (cachedApplications === null) {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('audition_applications')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data && data.length > 0) {
                    cachedApplications = data.map((r) => ({
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
        }
        catch {
            // Fallback
        }
        cachedApplications = await readJson(APPLICATIONS_FILE, []);
    }
    return cachedApplications;
}
export async function getFeedPosts(filter = 'for_you', userId, page = 1, limit = 10, search, tag) {
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
        formatted = formatted.filter((p) => p.content.toLowerCase().includes(q) ||
            p.authorName.toLowerCase().includes(q) ||
            p.authorUsername.toLowerCase().includes(q) ||
            (p.attachedSong && (p.attachedSong.title.toLowerCase().includes(q) || p.attachedSong.artist.toLowerCase().includes(q))));
    }
    // Filter by hashtag
    if (tag && tag.trim()) {
        const clean = tag.trim().replace(/^#/, '').toLowerCase();
        formatted = formatted.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === clean) ||
            p.content.toLowerCase().includes('#' + clean));
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
    }
    else {
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
export async function getTrendingHashtags() {
    const posts = await getStoredPosts();
    const counts = {};
    for (const post of posts) {
        const postTags = new Set();
        // Tags array
        (post.tags || []).forEach((t) => postTags.add(t.toLowerCase().replace(/^#/, '')));
        // Extracted from content
        const inText = post.content.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g) || [];
        inText.forEach((t) => postTags.add(t.slice(1).toLowerCase()));
        for (const tag of postTags) {
            if (tag)
                counts[tag] = (counts[tag] || 0) + 1;
        }
    }
    // Pre-seed with vibrant music community trends if needed
    const defaultTrends = [
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
export async function createFeedPost(userId, userProfile, postData) {
    const posts = await getStoredPosts();
    // Extract hashtags from content
    const regex = /#([a-zA-Z0-9_\u00C0-\u017F]+)/g;
    const inTextTags = (postData.content.match(regex) || []).map((t) => t.slice(1).toLowerCase());
    const allTags = Array.from(new Set([...(postData.tags || []), ...inTextTags]));
    const newPost = {
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
                tags: newPost.tags,
                likes_count: newPost.likesCount,
                reposts_count: newPost.repostsCount,
                comments_count: newPost.commentsCount,
                created_at: newPost.createdAt,
            });
        }
    }
    catch (e) {
        console.warn('[feed.repo] Supabase post insert warning:', e);
    }
    return newPost;
}
export async function togglePostLike(userId, postId) {
    const posts = await getStoredPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post)
        throw new Error('Post not found');
    const key = `${userId}:${postId}`;
    if (userLikes.has(key)) {
        userLikes.delete(key);
        post.likesCount = Math.max(0, post.likesCount - 1);
        post.isLiked = false;
        // Supabase DB delete like
        try {
            if (supabase) {
                await supabase.from('community_likes').delete().eq('user_id', userId).eq('post_id', postId);
                await supabase.from('community_posts').update({ likes_count: post.likesCount }).eq('id', postId);
            }
        }
        catch (e) {
            console.warn('[feed.repo] Supabase like delete warning:', e);
        }
    }
    else {
        userLikes.add(key);
        post.likesCount += 1;
        post.isLiked = true;
        // Supabase DB insert like
        try {
            if (supabase) {
                await supabase.from('community_likes').insert({ user_id: userId, post_id: postId });
                await supabase.from('community_posts').update({ likes_count: post.likesCount }).eq('id', postId);
            }
        }
        catch (e) {
            console.warn('[feed.repo] Supabase like insert warning:', e);
        }
    }
    await writeJson(POSTS_FILE, posts);
    return { isLiked: post.isLiked, likesCount: post.likesCount };
}
export async function repostPost(userId, userProfile, postId) {
    const posts = await getStoredPosts();
    const original = posts.find((p) => p.id === postId);
    if (!original)
        throw new Error('Post not found');
    original.repostsCount = (original.repostsCount || 0) + 1;
    // Create a repost feed entry visible in the feed with reposter attribution
    const reposterName = userProfile.full_name || userProfile.username || 'Un músico';
    const repostItem = {
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
export async function getPostComments(postId) {
    const comments = await getStoredComments();
    return comments.filter((c) => c.postId === postId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
export async function createPostComment(postId, userId, userProfile, content) {
    const posts = await getStoredPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post)
        throw new Error('Post not found');
    const comments = await getStoredComments();
    const newComment = {
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
    }
    catch (e) {
        console.warn('[feed.repo] Supabase comment insert warning:', e);
    }
    return newComment;
}
export async function createAuditionApplication(postId, musicianId, userProfile, data) {
    const posts = await getStoredPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post)
        throw new Error('Audition post not found');
    const applications = await getStoredApplications();
    // Check if musician already applied
    const existing = applications.find((a) => a.postId === postId && a.musicianId === musicianId);
    if (existing) {
        throw new Error('Ya has enviado una solicitud para esta audición');
    }
    const now = new Date().toISOString();
    const application = {
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
    }
    catch (e) {
        console.warn('[feed.repo] Supabase audition application insert warning:', e);
    }
    return application;
}
export async function getAuditionApplications(postId) {
    const applications = await getStoredApplications();
    return applications.filter((a) => a.postId === postId);
}
export async function updateAuditionApplication(applicationId, updates) {
    const applications = await getStoredApplications();
    const app = applications.find((a) => a.id === applicationId);
    if (!app)
        throw new Error('Application not found');
    if (updates.status)
        app.status = updates.status;
    if (updates.privateNotes !== undefined)
        app.privateNotes = updates.privateNotes;
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
    }
    catch (e) {
        console.warn('[feed.repo] Supabase audition application update warning:', e);
    }
    return app;
}
