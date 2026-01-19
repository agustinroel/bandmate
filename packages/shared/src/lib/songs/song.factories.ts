import { CreateSongDto } from "./song.dto.js";
import type { SongDetail, SongSection, SongLine } from "./song.model.ts";

/**
 * Small helpers to create safe defaults for MVP.
 * These are optional, but super useful to avoid "undefined" headaches.
 */

export function createEmptySongDto(): CreateSongDto {
  return {
    title: "",
    artist: "",
    key: undefined,
    bpm: undefined,
    durationSec: undefined,
    notes: undefined,
    links: [],
    sections: [],
  };
}

export function createEmptySections(): SongSection[] {
  return [
    {
      id: cryptoRandomId(),
      type: "verse",
      name: "Verse 1",
      order: 1,
      lines: [{ id: cryptoRandomId(), kind: "lyrics", source: "" }],
    },
    {
      id: cryptoRandomId(),
      type: "chorus",
      name: "Chorus",
      order: 2,
      lines: [{ id: cryptoRandomId(), kind: "lyrics", source: "" }],
    },
  ];
}

export function createDraftSongDetail(base: {
  id?: string;
  title: string;
  artist: string;
  key?: string;
  bpm?: number | string;
  durationSec?: number | string;
  notes?: string;
  links?: string[];
  sections?: SongSection[];
}): SongDetail {
  const now = new Date().toISOString();

  return {
    id: base.id ?? `draft_${cryptoRandomId()}`,
    title: base.title,
    artist: base.artist,
    key: base.key,
    bpm: base.bpm,
    durationSec: base.durationSec,
    notes: base.notes,
    links: base.links ?? [],
    createdAt: now,
    updatedAt: now,

    version: 1,
    sections: base.sections ?? [],
  };
}

export function createSection(
  params?: Partial<Omit<SongSection, "lines">> & { lines?: SongLine[] },
): SongSection {
  return {
    id: params?.id ?? cryptoRandomId(),
    type: (params?.type as any) ?? "verse",
    name: params?.name,
    order: params?.order ?? 1,
    lines: params?.lines ?? [],
    repeats: params?.repeats,
  };
}

export function createLine(params?: Partial<SongLine>): SongLine {
  return {
    id: params?.id ?? cryptoRandomId(),
    kind: (params?.kind as any) ?? "lyrics",
    source: params?.source,
    text: params?.text,
  };
}

export function cryptoRandomId(): string {
  // Works in modern browsers; good enough for MVP.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
