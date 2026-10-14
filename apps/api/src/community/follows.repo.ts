import { readJson, writeJson } from '../persistance/json.store.js';

export interface FollowRecord {
  followerId: string;
  followedId: string;
  createdAt: string;
}

const FOLLOWS_FILE = 'feed_follows.json';
let cachedFollows: FollowRecord[] | null = null;

async function getStoredFollows(): Promise<FollowRecord[]> {
  if (cachedFollows === null) {
    cachedFollows = await readJson<FollowRecord[]>(FOLLOWS_FILE, []);
  }
  return cachedFollows;
}

export async function toggleFollow(
  followerId: string,
  followedId: string
): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
  if (followerId === followedId) {
    throw new Error('You cannot follow yourself');
  }

  const follows = await getStoredFollows();
  const index = follows.findIndex(
    (f) => f.followerId === followerId && f.followedId === followedId
  );

  let isFollowing: boolean;
  if (index >= 0) {
    // Unfollow
    follows.splice(index, 1);
    isFollowing = false;
  } else {
    // Follow
    follows.push({
      followerId,
      followedId,
      createdAt: new Date().toISOString(),
    });
    isFollowing = true;
  }

  cachedFollows = follows;
  await writeJson(FOLLOWS_FILE, follows);

  const followersCount = follows.filter((f) => f.followedId === followedId).length;
  const followingCount = follows.filter((f) => f.followerId === followerId).length;

  return { isFollowing, followersCount, followingCount };
}

export async function getFollowStatus(
  currentUserId: string | undefined,
  targetUserId: string
): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
  const follows = await getStoredFollows();
  const followersCount = follows.filter((f) => f.followedId === targetUserId).length;
  const followingCount = follows.filter((f) => f.followerId === targetUserId).length;
  const isFollowing = currentUserId
    ? follows.some((f) => f.followerId === currentUserId && f.followedId === targetUserId)
    : false;

  return { isFollowing, followersCount, followingCount };
}

export async function getFollowedUserIds(userId: string): Promise<string[]> {
  const follows = await getStoredFollows();
  return follows.filter((f) => f.followerId === userId).map((f) => f.followedId);
}

export async function getMultipleFollowStats(
  userIds: string[],
  currentUserId?: string
): Promise<Record<string, { isFollowing: boolean; followersCount: number; followingCount: number }>> {
  const follows = await getStoredFollows();
  const result: Record<string, { isFollowing: boolean; followersCount: number; followingCount: number }> = {};

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
