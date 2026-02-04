export interface MBRecording {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  bpm?: number;
  key?: string;
}

export class MusicBrainzService {
  private readonly baseUrl = "https://musicbrainz.org/ws/2";
  private readonly userAgent = "Bandmate/1.0.0 ( https://bandmate.io )";

  /**
   * Search for a recording by title and artist.
   */
  async searchRecording(title: string, artist: string): Promise<MBRecording[]> {
    const query = `recording:"${title}" AND artist:"${artist}"`;
    const url = `${this.baseUrl}/recording?query=${encodeURIComponent(query)}&fmt=json`;
    console.log(`[MusicBrainz] Searching recording: ${url}`);

    const response = await fetch(url, {
      headers: { "User-Agent": this.userAgent },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return (data.recordings || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      artist: r["artist-credit"]?.[0]?.name || artist,
      duration: r.length ? Math.round(r.length / 1000) : undefined,
    }));
  }

  /**
   * Fetch detailed metadata for a recording by MBID.
   */
  async getRecordingDetails(mbid: string): Promise<MBRecording | null> {
    const url = `${this.baseUrl}/recording/${mbid}?inc=artist-credits+releases&fmt=json`;
    console.log(`[MusicBrainz] Fetching recording details: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `[MusicBrainz] API error: ${response.status} ${response.statusText}`,
          errorBody,
        );
        return null;
      }

      const r = (await response.json()) as any;

      if (!r || !r.id) {
        console.error("[MusicBrainz] Unexpected null/invalid response body");
        return null;
      }

      return {
        id: r.id,
        title: r.title,
        artist: r["artist-credit"]?.[0]?.name || "Unknown",
        duration: r.length ? Math.round(r.length / 1000) : undefined,
      };
    } catch (err) {
      console.error(`[MusicBrainz] Fetch exception for ${mbid}:`, err);
      throw err;
    }
  }
}

export const musicBrainzService = new MusicBrainzService();
