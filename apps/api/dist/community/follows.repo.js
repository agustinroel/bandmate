import { readJson, writeJson } from '../persistance/json.store.js';
import { supabase } from '../lib/supabase.js';
const FOLLOWS_FILE = 'feed_follows.json';
let cachedFollows = null;
async function getStoredFollows() {
    if (cachedFollows === null) {
        // Try Supabase first if configured
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('community_follows')
                    .select('follower_id, followed_id, created_at');
                if (!error && data) {
                    cachedFollows = data.map((r) => ({
                        followerId: r.follower_id,
                        followedId: r.followed_id,
                        createdAt: r.created_at,
                    }));
                    await writeJson(FOLLOWS_FILE, cachedFollows);
                    return cachedFollows;
                }
            }
        }
        catch {
            // Fallback
        }
        cachedFollows = await readJson(FOLLOWS_FILE, []);
    }
    return cachedFollows;
}
export async function toggleFollow(followerId, followedId) {
    if (followerId === followedId) {
        throw new Error('You cannot follow yourself');
    }
    const follows = await getStoredFollows();
    const index = follows.findIndex((f) => f.followerId === followerId && f.followedId === followedId);
    let isFollowing;
    const now = new Date().toISOString();
    if (index >= 0) {
        // Unfollow
        follows.splice(index, 1);
        isFollowing = false;
        // Supabase DB delete
        try {
            if (supabase) {
                await supabase
                    .from('community_follows')
                    .delete()
                    .eq('follower_id', followerId)
                    .eq('followed_id', followedId);
            }
        }
        catch (e) {
            console.warn('[follows.repo] Supabase delete warning:', e);
        }
    }
    else {
        // Follow
        follows.push({
            followerId,
            followedId,
            createdAt: now,
        });
        isFollowing = true;
        // Supabase DB insert
        try {
            if (supabase) {
                await supabase.from('community_follows').insert({
                    follower_id: followerId,
                    followed_id: followedId,
                    created_at: now,
                });
            }
        }
        catch (e) {
            console.warn('[follows.repo] Supabase insert warning:', e);
        }
    }
    cachedFollows = follows;
    await writeJson(FOLLOWS_FILE, follows);
    const followersCount = follows.filter((f) => f.followedId === followedId).length;
    const followingCount = follows.filter((f) => f.followerId === followerId).length;
    return { isFollowing, followersCount, followingCount };
}
export async function getFollowStatus(currentUserId, targetUserId) {
    const follows = await getStoredFollows();
    const followersCount = follows.filter((f) => f.followedId === targetUserId).length;
    const followingCount = follows.filter((f) => f.followerId === targetUserId).length;
    const isFollowing = currentUserId
        ? follows.some((f) => f.followerId === currentUserId && f.followedId === targetUserId)
        : false;
    return { isFollowing, followersCount, followingCount };
}
export async function getFollowedUserIds(userId) {
    const follows = await getStoredFollows();
    return follows.filter((f) => f.followerId === userId).map((f) => f.followedId);
}
export async function getMultipleFollowStats(userIds, currentUserId) {
    const follows = await getStoredFollows();
    const result = {};
    for (const id of userIds) {
        const followersCount = follows.filter((f) => f.followedId === id).length;
        const followingCount = follows.filter((f) => f.followerId === id).length;
        const isFollowing = currentUserId
            ? follows.some((f) => f.followerId === currentUserId && f.followedId === id)
            : false;
        result[id] = { isFollowing, followersCount, followingCount };
    }
    return result;
}
