import type { Song, CreateSongDto, UpdateSongDto } from "@bandmate/shared";
import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "../persistance/json.store.js";

const FILE = "songs.json";
const nowIso = () => new Date().toISOString();

export async function listSongs(): Promise<Song[]> {
  const songs = await readJson<Song[]>(FILE, []);
  // orden newest first
  return songs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSong(id: string): Promise<Song | null> {
  const songs = await readJson<Song[]>(FILE, []);
  return songs.find((s) => s.id === id) ?? null;
}

export async function createSong(dto: CreateSongDto): Promise<Song> {
  const songs = await readJson<Song[]>(FILE, []);

  const song: Song = {
    id: randomUUID(),
    title: dto.title.trim(),
    artist: dto.artist.trim(),
    key: dto.key,
    bpm: dto.bpm,
    durationSec: dto.durationSec,
    notes: dto.notes,
    links: dto.links ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  songs.push(song);
  await writeJson(FILE, songs);
  return song;
}

export async function updateSong(
  id: string,
  dto: UpdateSongDto
): Promise<Song | null> {
  const songs = await readJson<Song[]>(FILE, []);
  const idx = songs.findIndex((s) => s.id === id);
  if (idx < 0) return null;

  const current = songs[idx];

  const updated: Song = {
    ...current,
    ...dto,
    title: dto.title?.trim() ?? current.title,
    artist: dto.artist?.trim() ?? current.artist,
    links: dto.links ?? current.links,
    updatedAt: nowIso(),
  };

  songs[idx] = updated;
  await writeJson(FILE, songs);
  return updated;
}

export async function deleteSong(id: string): Promise<boolean> {
  const songs = await readJson<Song[]>(FILE, []);
  const before = songs.length;
  const next = songs.filter((s) => s.id !== id);
  if (next.length === before) return false;

  await writeJson(FILE, next);
  return true;
}
