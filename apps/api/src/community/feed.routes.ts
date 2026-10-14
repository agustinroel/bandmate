import { FastifyPluginAsync } from 'fastify';
import { getFeedPosts, createFeedPost, togglePostLike, repostPost } from './feed.repo.js';
import { getProfileById } from '../profiles/profiles.repo.js';

export const feedRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /feed
   * Query: { filter: 'for_you' | 'following' }
   */
  app.get('/feed', async (req: any, reply) => {
    const filter = (req.query?.filter as 'for_you' | 'following') || 'for_you';
    const userId = req.user?.id;
    const posts = await getFeedPosts(filter, userId);
    return posts;
  });

  /**
   * POST /feed
   * Body: { content: string, type?: string, attachedSong?: any, tags?: string[] }
   */
  app.post('/feed', async (req: any, reply) => {
    const userId = req.user?.id;
    if (!userId) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    const { content, type, attachedSong, tags } = req.body || {};
    if (!content || !content.trim()) {
      return reply.status(400).send({ message: 'Post content is required' });
    }

    let profile: any = null;
    try {
      profile = await getProfileById(userId);
    } catch {
      profile = { username: 'musician', full_name: 'Bandmate Artist' };
    }

    const post = await createFeedPost(userId, profile || {}, {
      content: content.trim(),
      type: type || 'status',
      attachedSong,
      tags: tags || [],
    });

    return reply.status(201).send(post);
  });

  /**
   * POST /feed/:id/like
   */
  app.post('/feed/:id/like', async (req: any, reply) => {
    const userId = req.user?.id || 'anon-musician';
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
    const userId = req.user?.id || 'anon-musician';
    const { id } = req.params;

    try {
      const res = await repostPost(userId, id);
      return res;
    } catch (err: any) {
      return reply.status(404).send({ message: err.message });
    }
  });
};
