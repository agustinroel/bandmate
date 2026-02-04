import type { SongSection } from "./song.model.ts";

/**
 * DTOs:
 * Keep your existing DTOs for basic song creation/edit (metadata).
 * We'll add an optional `sections` for detail creation if you want
 * (you can ignore it until the editor exists).
 */
export type CreateSongDto = {
  title: string;
  artist: string;
  key?: string;
  bpm?: number | string;
  durationSec?: number | string;
  notes?: string;
  links?: string[];

  /**
   * Optional for when we create songs with content from the editor/import.
   */
  sections?: SongSection[];
};

export type UpdateSongDto = Partial<CreateSongDto>;
