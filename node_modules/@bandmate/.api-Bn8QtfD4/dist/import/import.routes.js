import { spotifyService } from '../services/spotify.service.js';
import { musicBrainzService } from '../services/musicbrainz.service.js';
import { createSongForUser } from '../songs/songs.repo.js';
export const importRoutes = async (app) => {
    /**
     * GET /import/spotify/playlist/:id
     * Fetch tracks from a Spotify playlist for preview.
     */
    app.get('/import/spotify/playlist/:id', async (req, reply) => {
        const { id } = req.params;
        const token = req.headers['x-spotify-token']; // Simplified for now
        if (!token) {
            return reply.status(401).send({ message: 'Missing Spotify Access Token' });
        }
        try {
            const tracks = await spotifyService.getPlaylistTracks(token, id);
            return tracks;
        }
        catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    });
    /**
     * POST /import/spotify/sync
     * Import selected tracks into the user's library.
     */
    app.post('/import/spotify/sync', async (req, reply) => {
        const { tracks } = req.body; // Array of Spotify tracks
        const userId = req.user.id;
        const results = [];
        for (const st of tracks) {
            try {
                // 1. Check MusicBrainz for high-fidelity duration/metadata
                const mbMatches = await musicBrainzService.searchRecording(st.name, st.artist);
                const mbId = mbMatches[0]?.id;
                const duration = mbMatches[0]?.duration || Math.round(st.durationMs / 1000);
                // 2. Create the song in Bandmate
                const song = await createSongForUser(userId, {
                    title: st.name,
                    artist: st.artist,
                    duration_sec: duration,
                    spotify_id: st.id,
                    musicbrainz_id: mbId,
                    is_imported: true,
                    notes: `Imported from Spotify album: ${st.album}`,
                    sections: [],
                    links: [`https://open.spotify.com/track/${st.id}`]
                });
                results.push({ id: st.id, success: true, songId: song.id });
            }
            catch (err) {
                results.push({ id: st.id, success: false, error: err.message });
            }
        }
        return results;
    });
};
