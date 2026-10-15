import { FastifyPluginAsync } from 'fastify';
import {
  getFeedPosts,
  createFeedPost,
  togglePostLike,
  repostPost,
  getPostComments,
  createPostComment,
  getTrendingHashtags,
  createAuditionApplication,
  getAuditionApplications,
  updateAuditionApplication,
} from './feed.repo.js';
import { toggleFollow, getFollowStatus } from './follows.repo.js';
import { getProfileById } from '../profiles/profiles.repo.js';

export const feedRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /feed
   * Query: { filter: 'for_you' | 'following', page?: number, limit?: number, search?: string, tag?: string }
   */
  app.get('/feed', async (req: any, reply) => {
    const filter = (req.query?.filter as 'for_you' | 'following') || 'for_you';
    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit) || 10));
    const search = req.query?.search as string | undefined;
    const tag = req.query?.tag as string | undefined;
    const userId = req.user?.id;

    const result = await getFeedPosts(filter, userId, page, limit, search, tag);
    return result;
  });

  /**
   * GET /feed/trends
   */
  app.get('/feed/trends', async (_req, _reply) => {
    return await getTrendingHashtags();
  });

  /**
   * POST /community/follow/:id
   */
  app.post('/community/follow/:id', async (req: any, reply) => {
    const followerId = req.user?.id || req.body?.followerId || 'usr-agustin-roel';
    const { id: followedId } = req.params;

    try {
      const res = await toggleFollow(followerId, followedId);
      return res;
    } catch (err: any) {
      return reply.status(400).send({ message: err.message });
    }
  });

  /**
   * GET /community/follow/:id
   */
  app.get('/community/follow/:id', async (req: any, reply) => {
    const currentUserId = req.user?.id || (req.query?.followerId as string);
    const { id: targetUserId } = req.params;

    const res = await getFollowStatus(currentUserId, targetUserId);
    return res;
  });

  /**
   * POST /feed
   * Body: { content: string, type?: string, attachedSong?: any, tags?: string[] }
   */
  app.post('/feed', async (req: any, reply) => {
    let userId = req.user?.id;
    const body = req.body || {};

    // If userId not attached via token, fallback to client identity
    if (!userId) {
      userId = body.authorId || 'usr-agustin-roel';
    }

    const { content, type, attachedSong, tags, mediaUrl, mediaType, youtubeId } = body;
    if (!content || !content.trim()) {
      return reply.status(400).send({ message: 'Post content is required' });
    }

    let profile: any = null;
    try {
      if (userId && !userId.startsWith('usr-')) {
        profile = await getProfileById(userId);
      }
    } catch {
      // Fallback
    }

    const resolvedProfile = {
      username: profile?.username || body.authorUsername || (req.user?.email ? req.user.email.split('@')[0] : 'agustinroel'),
      full_name: profile?.full_name || body.authorName || 'Agustín Roel',
      avatar_url: profile?.avatar_url || body.authorAvatar || null,
      instruments: profile?.instruments || body.authorInstruments || ['Guitar'],
      subscription_tier: profile?.subscription_tier || 'pro',
    };

    const post = await createFeedPost(userId, resolvedProfile, {
      content: content.trim(),
      type: type || 'status',
      attachedSong,
      tags: tags || [],
      mediaUrl,
      mediaType,
      youtubeId,
    });

    return reply.status(201).send(post);
  });

  /**
   * POST /feed/:id/like
   */
  app.post('/feed/:id/like', async (req: any, reply) => {
    const userId = req.user?.id || req.body?.userId || 'anon-musician';
    const { id } = req.params;

    try {
      const res = await togglePostLike(userId, id);
      return res;
    } catch (err: any) {
      return reply.status(404).send({ message: err.message });
    }
  });

  /**
   * POST /feed/:id/repost
   */
  app.post('/feed/:id/repost', async (req: any, reply) => {
    let userId = req.user?.id || req.body?.userId || 'usr-agustin-roel';
    const { id } = req.params;

    let profile: any = null;
    try {
      if (userId && !userId.startsWith('usr-') && !userId.startsWith('anon-')) {
        profile = await getProfileById(userId);
      }
    } catch {
      // Fallback
    }

    const userProfile = {
      full_name: profile?.full_name || req.body?.authorName || 'Agustín Roel',
      username: profile?.username || req.body?.authorUsername || 'agustinroel',
    };

    try {
      const res = await repostPost(userId, userProfile, id);
      return res;
    } catch (err: any) {
      return reply.status(404).send({ message: err.message });
    }
  });

  /**
   * GET /feed/:id/comments
   */
  app.get('/feed/:id/comments', async (req: any, reply) => {
    const { id } = req.params;
    const comments = await getPostComments(id);
    return comments;
  });

  /**
   * POST /feed/:id/comments
   */
  app.post('/feed/:id/comments', async (req: any, reply) => {
    const { id } = req.params;
    const { content, authorName, authorUsername, authorAvatar } = req.body || {};

    if (!content || !content.trim()) {
      return reply.status(400).send({ message: 'Comment content is required' });
    }

    const userId = req.user?.id || req.body?.authorId || 'usr-agustin-roel';

    let profile: any = null;
    try {
      if (userId && !userId.startsWith('usr-')) {
        profile = await getProfileById(userId);
      }
    } catch {
      // Fallback
    }

    const resolvedProfile = {
      username: profile?.username || authorUsername || (req.user?.email ? req.user.email.split('@')[0] : 'agustinroel'),
      full_name: profile?.full_name || authorName || 'Agustín Roel',
      avatar_url: profile?.avatar_url || authorAvatar || null,
    };

    try {
      const comment = await createPostComment(id, userId, resolvedProfile, content.trim());
      return reply.status(201).send(comment);
    } catch (err: any) {
      return reply.status(404).send({ message: err.message });
    }
  });

  /**
   * POST /auditions/:postId/apply
   * Body: { instrument: string, experienceYears: number, mediaUrl?: string, message: string }
   */
  app.post('/auditions/:postId/apply', async (req: any, reply) => {
    const { postId } = req.params;
    const body = req.body || {};
    const userId = req.user?.id || body.musicianId || 'usr-agustin-roel';

    if (!body.instrument || !body.message) {
      return reply.status(400).send({ message: 'Instrument and message are required' });
    }

    let profile: any = null;
    try {
      if (userId && !userId.startsWith('usr-')) {
        profile = await getProfileById(userId);
      }
    } catch {
      // Fallback
    }

    const resolvedProfile = {
      username: profile?.username || body.musicianUsername || (req.user?.email ? req.user.email.split('@')[0] : 'agustinroel'),
      full_name: profile?.full_name || body.musicianName || 'Agustín Roel',
      avatar_url: profile?.avatar_url || body.musicianAvatar || null,
    };

    try {
      const application = await createAuditionApplication(postId, userId, resolvedProfile, {
        instrument: body.instrument,
        experienceYears: Number(body.experienceYears) || 1,
        mediaUrl: body.mediaUrl,
        message: body.message,
      });
      return reply.status(201).send(application);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message });
    }
  });

  /**
   * GET /auditions/:postId/applications
   */
  app.get('/auditions/:postId/applications', async (req: any, reply) => {
    const { postId } = req.params;
    const applications = await getAuditionApplications(postId);
    return applications;
  });

  /**
   * PATCH /auditions/applications/:applicationId
   * Body: { status?: 'pending' | 'shortlisted' | 'accepted' | 'rejected', privateNotes?: string }
   */
  app.patch('/auditions/applications/:applicationId', async (req: any, reply) => {
    const { applicationId } = req.params;
    const { status, privateNotes } = req.body || {};

    try {
      const updated = await updateAuditionApplication(applicationId, { status, privateNotes });
      return updated;
    } catch (err: any) {
      return reply.status(404).send({ message: err.message });
    }
  });
};
