export class SpotifyService {
    baseUrl = 'https://api.spotify.com/v1';
    /**
     * Fetch tracks from a specific playlist.
     */
    async getPlaylistTracks(accessToken, playlistId) {
        const url = `${this.baseUrl}/playlists/${playlistId}/tracks?fields=items(track(id,name,artists,album(name),duration_ms,preview_url))`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.statusText}`);
        }
        const data = await response.json();
        return (data.items || []).map((item) => {
            const t = item.track;
            return {
                id: t.id,
                name: t.name,
                artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
                album: t.album?.name || 'Unknown',
                durationMs: t.duration_ms,
                previewUrl: t.preview_url
            };
        });
    }
    /**
     * Search for a track by name and artist.
     */
    async searchTrack(accessToken, query) {
        const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok)
            return [];
        const data = await response.json();
        return (data.tracks?.items || []).map((t) => ({
            id: t.id,
            name: t.name,
            artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
            album: t.album?.name || 'Unknown',
            durationMs: t.duration_ms,
            previewUrl: t.preview_url
        }));
    }
}
export const spotifyService = new SpotifyService();
