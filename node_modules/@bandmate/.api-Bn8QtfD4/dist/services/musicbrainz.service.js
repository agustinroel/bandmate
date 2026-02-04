export class MusicBrainzService {
    baseUrl = 'https://musicbrainz.org/ws/2';
    userAgent = 'Bandmate/1.0.0 ( https://bandmate.io )';
    /**
     * Search for a recording by title and artist.
     */
    async searchRecording(title, artist) {
        const query = `recording:"${title}" AND artist:"${artist}"`;
        const url = `${this.baseUrl}/recording?query=${encodeURIComponent(query)}&fmt=json`;
        const response = await fetch(url, {
            headers: { 'User-Agent': this.userAgent }
        });
        if (!response.ok) {
            throw new Error(`MusicBrainz API error: ${response.statusText}`);
        }
        const data = await response.json();
        return (data.recordings || []).map((r) => ({
            id: r.id,
            title: r.title,
            artist: r['artist-credit']?.[0]?.name || artist,
            duration: r.length ? Math.round(r.length / 1000) : undefined
        }));
    }
    /**
     * Fetch detailed metadata for a recording by MBID.
     */
    async getRecordingDetails(mbid) {
        const url = `${this.baseUrl}/recording/${mbid}?inc=artists+annotations&fmt=json`;
        const response = await fetch(url, {
            headers: { 'User-Agent': this.userAgent }
        });
        if (!response.ok)
            return null;
        const r = await response.json();
        return {
            id: r.id,
            title: r.title,
            artist: r['artist-credit']?.[0]?.name || 'Unknown',
            duration: r.length ? Math.round(r.length / 1000) : undefined
        };
    }
}
export const musicBrainzService = new MusicBrainzService();
