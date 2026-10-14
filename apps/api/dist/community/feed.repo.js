import { readJson, writeJson } from '../persistance/json.store.js';
const POSTS_FILE = 'feed_posts.json';
const COMMENTS_FILE = 'feed_comments.json';
// In-memory cache + persistent backing
let cachedPosts = null;
let cachedComments = null;
const userLikes = new Set();
async function getStoredPosts() {
    if (cachedPosts === null) {
        // Only real user posts - starts empty in production
        cachedPosts = await readJson(POSTS_FILE, []);
    }
    return cachedPosts;
}
async function getStoredComments() {
    if (cachedComments === null) {
        cachedComments = await readJson(COMMENTS_FILE, []);
    }
    return cachedComments;
}
export async function getFeedPosts(filter = 'for_you', userId, page = 1, limit = 10) {
    const allPosts = await getStoredPosts();
    // Map likes for current user
    const formatted = allPosts.map((post) => ({
        ...post,
        isLiked: userId ? userLikes.has(`${userId}:${post.id}`) || post.isLiked : post.isLiked,
    }));
    // Sort chronological descending
    formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Filter if needed
    let filtered = formatted;
    if (filter === 'following' && userId) {
        // In future: filter by followed user IDs. For now, show active discussions
        filtered = formatted;
    }
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < filtered.length;
    return {
        posts: paginated,
        page,
        total: filtered.length,
        hasMore,
    };
}
export async function createFeedPost(userId, userProfile, postData) {
    const posts = await getStoredPosts();
    const newPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorId: userId,
        authorName: userProfile.full_name || userProfile.username || 'Musician',
        authorUsername: userProfile.username || 'musician',
        authorAvatar: userProfile.avatar_url || null,
        authorInstruments: userProfile.instruments || ['Guitar'],
        authorTier: userProfile.subscription_tier || 'free',
        type: postData.type || 'status',
        content: postData.content,
        attachedSong: postData.attachedSong || null,
        tags: postData.tags || [],
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
    }
    else {
        userLikes.add(key);
        post.likesCount += 1;
        post.isLiked = true;
    }
    await writeJson(POSTS_FILE, posts);
    return { isLiked: post.isLiked, likesCount: post.likesCount };
}
export async function repostPost(userId, postId) {
    const posts = await getStoredPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post)
        throw new Error('Post not found');
    post.repostsCount += 1;
    await writeJson(POSTS_FILE, posts);
    return { repostsCount: post.repostsCount };
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
    return newComment;
}
