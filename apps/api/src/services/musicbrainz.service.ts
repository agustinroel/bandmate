export interface MBRecording {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  bpm?: number;
  key?: string;
  genre?: string;
}

export class MusicBrainzService {
  private readonly baseUrl = "https://musicbrainz.org/ws/2";
  private readonly userAgent = "Bandmate/1.0.0 ( https://bandmate.io )";

  /**
   * Search for a recording by title and artist.
   */
  async searchRecording(title: string, artist: string): Promise<MBRecording[]> {
    const queryParts = [];
    if (title.trim()) queryParts.push(`recording:"${title}"`);
    if (artist.trim()) queryParts.push(`artist:"${artist}"`);

    // If we only have artist, we might want to filter for albums/singles only to get better results
    const query = queryParts.join(" AND ");
    const url = `${this.baseUrl}/recording?query=${encodeURIComponent(query)}&limit=20&fmt=json`;
    console.log(`[MusicBrainz] Searching recording: ${url}`);

    const response = await fetch(url, {
      headers: { "User-Agent": this.userAgent },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const recordings = (data.recordings || []) as any[];

    return recordings
      .filter((r) => this.isSongRecording(r))
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        artist: r["artist-credit"]?.[0]?.name || artist,
        duration: r.length ? Math.round(r.length / 1000) : undefined,
        // Extract genre from tags in search results
        genre: this.extractTopGenre(r.genres, r.tags),
      }));
  }

  /**
   * Check if a recording is likely a real song (and not an interview, talk, or snippet).
   */
  private isSongRecording(r: any): boolean {
    const title = (r.title || "").toLowerCase();
    const excludeKeywords = [
      "interview",
      "talk",
      "speech",
      "commentary",
      "intro: ",
      "intro", // exact match or word match
      "dialogue",
      "discussion",
      "breaking the law", // example of specific unwanted meta-titles if needed
    ];

    // 1. Check title keywords
    if (excludeKeywords.some((k) => title.includes(k))) {
      return false;
    }

    // 2. Check length (exclude very short snippets < 30s as they are often intros/interviews)
    // Note: Some real songs are short, but in this context we prioritize quality.
    if (r.length && r.length < 30000) {
      return false;
    }

    return true;
  }

  /**
   * Fetch detailed metadata for a recording by MBID.
   * Includes genres and tags via the include parameters.
   */
  async getRecordingDetails(mbid: string): Promise<MBRecording | null> {
    // Include genres and tags in the API request
    const url = `${this.baseUrl}/recording/${mbid}?inc=artist-credits+releases+genres+tags&fmt=json`;
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

      // Extract the top genre from genres or tags (fallback)
      // Check top level first, then artist level
      let genre = this.extractTopGenre(r.genres, r.tags);

      if (!genre && r["artist-credit"]?.[0]?.artist) {
        const artist = r["artist-credit"][0].artist;
        genre = this.extractTopGenre(artist.genres, artist.tags);
      }

      return {
        id: r.id,
        title: r.title,
        artist: r["artist-credit"]?.[0]?.name || "Unknown",
        duration: r.length ? Math.round(r.length / 1000) : undefined,
        genre,
      };
    } catch (err) {
      console.error(`[MusicBrainz] Fetch exception for ${mbid}:`, err);
      throw err;
    }
  }

  /**
   * Extract the top genre from MusicBrainz genres or tags array.
   * Genres are preferred, but tags are used as fallback.
   * Items are sorted by count (votes), so we pick the highest voted one.
   */
  private extractTopGenre(
    genres: any[] | undefined,
    tags: any[] | undefined,
  ): string | undefined {
    // Try genres first
    if (genres && Array.isArray(genres) && genres.length > 0) {
      const sorted = genres
        .slice()
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
      const topGenre = sorted[0]?.name;
      if (topGenre) {
        return this.capitalizeGenre(topGenre);
      }
    }

    // Fallback to tags (filter to common music genres)
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const genreTags = tags.filter((t) => this.isGenreTag(t.name));
      if (genreTags.length > 0) {
        const sorted = genreTags
          .slice()
          .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
        const topTag = sorted[0]?.name;
        if (topTag) {
          return this.capitalizeGenre(topTag);
        }
      }
    }

    return undefined;
  }

  /**
   * Check if a tag name is likely a music genre.
   */
  private isGenreTag(tagName: string): boolean {
    const genreKeywords = [
      "rock",
      "pop",
      "jazz",
      "blues",
      "metal",
      "punk",
      "soul",
      "funk",
      "country",
      "folk",
      "classical",
      "reggae",
      "hip hop",
      "rap",
      "electronic",
      "disco",
      "house",
      "techno",
      "alternative",
      "indie",
      "grunge",
      "r&b",
      "latin",
      "salsa",
      "bossa",
      "swing",
      "gospel",
      "opera",
      "new wave",
      "progressive",
      "psychedelic",
      "hard rock",
      "soft rock",
      "classic rock",
      "britpop",
      "ska",
    ];
    const lower = (tagName || "").toLowerCase();
    return genreKeywords.some((g) => lower.includes(g));
  }

  /**
   * Capitalize genre name for display.
   */
  private capitalizeGenre(genre: string): string {
    return genre
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

export const musicBrainzService = new MusicBrainzService();
