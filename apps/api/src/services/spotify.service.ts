
export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  durationMs: number;
  previewUrl?: string;
}

export class SpotifyService {
  private readonly baseUrl = 'https://api.spotify.com/v1';

  /**
   * Fetch tracks from a specific playlist.
   */
  async getPlaylistTracks(accessToken: string, playlistId: string): Promise<SpotifyTrack[]> {
    const url = `${this.baseUrl}/playlists/${playlistId}/tracks?fields=items(track(id,name,artists,album(name),duration_ms,preview_url))`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return (data.items || []).map((item: any) => {
      const t = item.track;
      return {
        id: t.id,
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
        album: t.album?.name || 'Unknown',
        durationMs: t.duration_ms,
        previewUrl: t.preview_url
      };
    });
  }

  /**
   * Search for a track by name and artist.
   */
  async searchTrack(accessToken: string, query: string): Promise<SpotifyTrack[]> {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=track&limit=10`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) return [];

    const data = await response.json() as any;
    return (data.tracks?.items || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      album: t.album?.name || 'Unknown',
      durationMs: t.duration_ms,
      previewUrl: t.preview_url
    }));
  }
}

export const spotifyService = new SpotifyService();
