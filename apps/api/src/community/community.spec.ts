import { describe, it, expect } from 'vitest';
import { toggleFollow, getFollowStatus, getFollowedUserIds, getMultipleFollowStats } from './follows.repo.js';
import {
  createFeedPost,
  getFeedPosts,
  togglePostLike,
  createPostComment,
  getPostComments,
  deleteFeedPost,
} from './feed.repo.js';

describe('Community Repository Tests', { timeout: 25000 }, () => {
  const testFollower = `test-usr-${Date.now()}-1`;
  const testFollowed = `test-usr-${Date.now()}-2`;

  it('should toggle follow and unfollow between users', async () => {
    // 1. Follow
    const followResult = await toggleFollow(testFollower, testFollowed);
    expect(followResult.isFollowing).toBe(true);
    expect(followResult.followersCount).toBeGreaterThanOrEqual(1);

    // Verify follow status
    const status = await getFollowStatus(testFollower, testFollowed);
    expect(status.isFollowing).toBe(true);

    const followedIds = await getFollowedUserIds(testFollower);
    expect(followedIds).toContain(testFollowed);

    // 2. Unfollow
    const unfollowResult = await toggleFollow(testFollower, testFollowed);
    expect(unfollowResult.isFollowing).toBe(false);

    const statusAfter = await getFollowStatus(testFollower, testFollowed);
    expect(statusAfter.isFollowing).toBe(false);
  });

  it('should prevent user from following themselves', async () => {
    await expect(toggleFollow(testFollower, testFollower)).rejects.toThrow('You cannot follow yourself');
  });

  it('should get multiple follow stats in batch', async () => {
    const stats = await getMultipleFollowStats([testFollowed], testFollower);
    expect(stats[testFollowed]).toBeDefined();
    expect(typeof stats[testFollowed].followersCount).toBe('number');
    expect(typeof stats[testFollowed].isFollowing).toBe('boolean');
  });

  it('should create post, filter by hashtag, like it, persist comments, and clean up', async () => {
    // Create post
    const post = await createFeedPost(
      testFollower,
      { username: 'testuser', full_name: 'Test Musician' },
      { content: 'Testing permanent community persistence #vitest' }
    );

    try {
      expect(post.id).toBeDefined();
      expect(post.content).toContain('permanent community persistence');
      expect(post.tags).toContain('vitest');

      // Filter by hashtag
      const byTag = await getFeedPosts('for_you', testFollower, 1, 20, undefined, 'vitest');
      expect(byTag.posts.some((p) => p.id === post.id)).toBe(true);

      // Like post
      const likeRes = await togglePostLike(testFollower, post.id);
      expect(likeRes.isLiked).toBe(true);
      expect(likeRes.likesCount).toBe(1);

      // Comment on post
      const comment = await createPostComment(
        post.id,
        testFollowed,
        { username: 'commenter', full_name: 'Commenter Musician' },
        'Awesome riff!'
      );

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Awesome riff!');

      // Retrieve comments
      const comments = await getPostComments(post.id);
      expect(comments.length).toBeGreaterThanOrEqual(1);
      expect(comments.some((c) => c.id === comment.id)).toBe(true);
    } finally {
      await deleteFeedPost(post.id);
    }
  });
});

