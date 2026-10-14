// In-memory feed store with persistent seed content (and Supabase integration where tables exist)
const inMemoryPosts = [
    {
        id: 'post-1',
        authorId: 'usr-jimi',
        authorName: 'Jimi V.',
        authorUsername: 'stratmaster',
        authorAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
        authorInstruments: ['Guitar', 'Vocals'],
        authorTier: 'pro',
        type: 'song_share',
        content: 'Acabo de rearmonizar este clásico en Mi menor para tocar en directo este fin de semana. ¡Prueben la sección del solo en el visor de Bandmate! 🎸🔥 #rock #live #stage',
        attachedSong: {
            id: 'seed-stand-by-me',
            title: 'Stand By Me',
            artist: 'Ben E. King',
            key: 'A',
            bpm: 118,
        },
        tags: ['rock', 'live', 'stage'],
        likesCount: 38,
        repostsCount: 12,
        commentsCount: 6,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
        id: 'post-2',
        authorId: 'usr-charly',
        authorName: 'Charly B.',
        authorUsername: 'groovebassist',
        authorAvatar: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=150',
        authorInstruments: ['Bass'],
        authorTier: 'band',
        type: 'looking_for_member',
        content: '🚨 ¡BUSCAMOS BATERISTA en Madrid para banda de Funk/Soul progresivo! Ensayamos 2 veces por semana. Tenemos setlist cerrado de 12 temas en Bandmate y bolos programados para mayo. DM abierto 🥁⚡ #audition #madrid #funk',
        attachedSong: {
            id: 'seed-house-of-the-rising-sun',
            title: 'House of the Rising Sun',
            artist: 'The Animals',
            key: 'Am',
            bpm: 116,
        },
        tags: ['audition', 'madrid', 'funk'],
        likesCount: 64,
        repostsCount: 29,
        commentsCount: 14,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
        id: 'post-3',
        authorId: 'usr-elena',
        authorName: 'Elena Rostova',
        authorUsername: 'elenakeys',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        authorInstruments: ['Keys', 'Vocals'],
        authorTier: 'pro',
        type: 'riff',
        content: 'Practicando el cambio modal de G a Cm en Creep con el nuevo modo de 2 columnas de Bandmate en mi iPad. Cero scroll, una gozada para las manos en el teclado 🎹✨ #practice #neosoft',
        attachedSong: {
            id: 'seed-creep',
            title: 'Creep',
            artist: 'Radiohead',
            key: 'G',
            bpm: 92,
        },
        tags: ['practice', 'piano'],
        likesCount: 92,
        repostsCount: 18,
        commentsCount: 9,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
        id: 'post-4',
        authorId: 'usr-oasis-fan',
        authorName: 'Liam Gallagher Tribute',
        authorUsername: 'manchester_sound',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorInstruments: ['Guitar', 'Vocals'],
        authorTier: 'free',
        type: 'song_share',
        content: 'Comparto los acordes exactos con Capo 2 para Wonderwall importados directo desde Ultimate Guitar con el Smart Importer. ¡Quedó perfecto en 2 segundos! ⚡🇬🇧',
        attachedSong: {
            id: 'seed-wonderwall',
            title: 'Wonderwall',
            artist: 'Oasis',
            key: 'Em',
            bpm: 87,
        },
        tags: ['oasis', 'acoustic', 'britpop'],
        likesCount: 142,
        repostsCount: 45,
        commentsCount: 21,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 840).toISOString(),
    },
];
// Track user likes
const userLikes = new Set();
export async function getFeedPosts(filter = 'for_you', userId) {
    // Sort chronological descending
    const posts = inMemoryPosts.map((post) => ({
        ...post,
        isLiked: userId ? userLikes.has(`${userId}:${post.id}`) || post.isLiked : post.isLiked,
    }));
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return posts;
}
export async function createFeedPost(userId, userProfile, postData) {
    const newPost = {
        id: `post-${Date.now()}`,
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
    inMemoryPosts.unshift(newPost);
    return newPost;
}
export async function togglePostLike(userId, postId) {
    const post = inMemoryPosts.find((p) => p.id === postId);
    if (!post)
        throw new Error('Post not found');
    const key = `${userId}:${postId}`;
    if (userLikes.has(key)) {
        userLikes.delete(key);
        post.likesCount = Math.max(0, post.likesCount - 1);
        post.isLiked = false;
        return { isLiked: false, likesCount: post.likesCount };
    }
    else {
        userLikes.add(key);
        post.likesCount += 1;
        post.isLiked = true;
        return { isLiked: true, likesCount: post.likesCount };
    }
}
export async function repostPost(userId, postId) {
    const post = inMemoryPosts.find((p) => p.id === postId);
    if (!post)
        throw new Error('Post not found');
    post.repostsCount += 1;
    return { repostsCount: post.repostsCount };
}
