export type SongId = string;

/**
 * Chord/lyrics line format (MVP):
 * - Anything inside [ ] is treated as a chord token.
 *   Example: "[Am]Hello [G]world"
 */
export type SongLineKind = "lyrics" | "comment" | "blank";

export type SongLine = {
  id: string;
  kind: SongLineKind;

  /**
   * For kind="lyrics":
   * Inline chord notation. Example: "[Am]Hello [G]world"
   */
  source?: string;

  /**
   * For kind="comment":
   * Free text. Example: "Let ring", "Build intensity"
   */
  text?: string;
};

export type SongSectionType =
  | "verse"
  | "chorus"
  | "bridge"
  | "intro"
  | "outro"
  | "prechorus"
  | "solo"
  | "other";

export type SongSection = {
  id: string;
  type: SongSectionType;
  name?: string; // "Verse 1", "Chorus", etc.
  order: number;
  lines: SongLine[];
  repeats?: number; // optional
};

/**
 * Keep your existing Song as "metadata" for lists, CRUD, etc.
 * We'll extend it for the full detail view.
 */
export type Song = {
  id: SongId;
  title: string;
  artist: string;

  /**
   * External Identifiers for Library Scaling
   */
  spotifyId?: string;
  musicbrainzId?: string;
  isImported?: boolean;

  /**
   * Legacy / compact representation of key. Example: "Gm", "C", "Am"
   * We'll keep it for now for compatibility.
   */
  key?: string;

  bpm?: number | string;
  durationSec?: number | string;
  notes?: string;
  links?: string[];
  sections?: SongSection[];
  createdAt: string;
  updatedAt: string;
  isSeed: boolean;
  ratingAvg?: number; // 1..5
  ratingCount?: number; // total votes
  workId?: string;
  originArrangementId?: string;
};

/**
 * Full/detail song model (MVP v0):
 * - Adds structured content: sections + lines with inline chords
 * - Adds optional versioning
 */
export type SongDetail = Song & {
  version: 1;
  sections: SongSection[];
  tags?: string[];
  isFavorite?: boolean;
  capo?: number;
  timeSignature?: string;
};

// =========================
// vNext: Work + Arrangement
// (additive, no breaking)
// =========================

export type SongWorkId = string;
export type ArrangementId = string;

export type RightsStatus =
  | "unknown"
  | "public-domain"
  | "copyrighted"
  | "licensed";
export type WorkSource = "musicbrainz" | "wikidata" | "user" | "import";
export type ArrangementSource = "community" | "official" | "public-domain";

export type SongWork = {
  id: SongWorkId;
  title: string;
  artist: string;

  musicbrainzId?: string;
  wikidataId?: string;

  rights: RightsStatus;
  rightsNotes?: string;

  createdAt: string;
  updatedAt: string;
  source: WorkSource;
};

export type Arrangement = {
  id: ArrangementId;
  workId: SongWorkId;

  authorUserId?: string | null;

  version: 1;
  sections: SongSection[];

  key?: string;
  bpm?: number | string;
  durationSec?: number | string;
  notes?: string;
  links?: string[];

  tags?: string[];
  capo?: number;
  timeSignature?: string;

  source: ArrangementSource;
  isSeed: boolean;

  ratingAvg?: number; // 1..5
  ratingCount?: number; // total votes

  createdAt: string;
  updatedAt: string;
};

export type SongDetailV2 = {
  work: SongWork;
  arrangements: Arrangement[];
  activeArrangement: Arrangement;
};
