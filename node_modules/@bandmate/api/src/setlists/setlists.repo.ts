import type {
  AddSetlistItemDto,
  CreateSetlistDto,
  ReorderSetlistDto,
  Setlist,
  SetlistItem,
  UpdateSetlistDto,
} from "@bandmate/shared";
import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "../persistance/json.store.js";

const FILE = "setlists.json";
const nowIso = () => new Date().toISOString();

export async function listSetlists(): Promise<Setlist[]> {
  const items = await readJson<Setlist[]>(FILE, []);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSetlist(id: string): Promise<Setlist | null> {
  const items = await readJson<Setlist[]>(FILE, []);
  return items.find((s) => s.id === id) ?? null;
}

export async function createSetlist(dto: CreateSetlistDto): Promise<Setlist> {
  const items = await readJson<Setlist[]>(FILE, []);

  const setlist: Setlist = {
    id: randomUUID(),
    name: dto.name.trim(),
    notes: dto.notes?.trim() || undefined,
    items: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  items.push(setlist);
  await writeJson(FILE, items);
  return setlist;
}

export async function updateSetlist(
  id: string,
  dto: UpdateSetlistDto
): Promise<Setlist | null> {
  const items = await readJson<Setlist[]>(FILE, []);
  const idx = items.findIndex((s) => s.id === id);
  if (idx < 0) return null;

  const current = items[idx];

  const updated: Setlist = {
    ...current,
    name: dto.name?.trim() ?? current.name,
    notes:
      dto.notes === undefined ? current.notes : dto.notes?.trim() || undefined,
    updatedAt: nowIso(),
  };

  items[idx] = updated;
  await writeJson(FILE, items);
  return updated;
}

export async function deleteSetlist(id: string): Promise<boolean> {
  const items = await readJson<Setlist[]>(FILE, []);
  const before = items.length;
  const next = items.filter((s) => s.id !== id);
  if (next.length === before) return false;

  await writeJson(FILE, next);
  return true;
}

/**
 * Agrega un item al final, SIN duplicados.
 * Devuelve null si no existe setlist.
 * Devuelve { error: 'duplicate' } si ya existe.
 */
export async function addSetlistItem(
  setlistId: string,
  dto: AddSetlistItemDto
): Promise<Setlist | { error: "duplicate" } | null> {
  const items = await readJson<Setlist[]>(FILE, []);
  const idx = items.findIndex((s) => s.id === setlistId);
  if (idx < 0) return null;

  const current = items[idx];

  const exists = current.items.some((i) => i.songId === dto.songId);
  if (exists) return { error: "duplicate" };

  const nextItems: SetlistItem[] = [...current.items, { songId: dto.songId }];

  const updated: Setlist = {
    ...current,
    items: nextItems,
    updatedAt: nowIso(),
  };

  items[idx] = updated;
  await writeJson(FILE, items);
  return updated;
}

export async function removeSetlistItem(
  setlistId: string,
  songId: string
): Promise<Setlist | null> {
  const items = await readJson<Setlist[]>(FILE, []);
  const idx = items.findIndex((s) => s.id === setlistId);
  if (idx < 0) return null;

  const current = items[idx];
  const before = current.items.length;
  const nextItems = current.items.filter((i) => i.songId !== songId);

  if (nextItems.length === before) {
    // no-op (pero devolvemos setlist actual)
    return current;
  }

  const updated: Setlist = {
    ...current,
    items: nextItems,
    updatedAt: nowIso(),
  };

  items[idx] = updated;
  await writeJson(FILE, items);
  return updated;
}

export async function reorderSetlist(
  setlistId: string,
  dto: ReorderSetlistDto
): Promise<Setlist | null> {
  const items = await readJson<Setlist[]>(FILE, []);
  const idx = items.findIndex((s) => s.id === setlistId);
  if (idx < 0) return null;

  const current = items[idx];
  const currentIds = current.items.map((i) => i.songId);

  // Aceptamos solo si contiene EXACTAMENTE los mismos IDs (sin extras)
  const newIds = dto.songIds ?? [];
  const sameSize = newIds.length === currentIds.length;
  const sameSet =
    sameSize &&
    newIds.every((id) => currentIds.includes(id)) &&
    currentIds.every((id) => newIds.includes(id));

  if (!sameSet) {
    // si querés, podrías throw, pero lo manejamos en routes con 400
    return null;
  }

  const nextItems: SetlistItem[] = newIds.map((songId) => {
    // preservar title/artist/durationSec si los estabas guardando (opcional)
    const existing = current.items.find((i) => i.songId === songId);
    return existing ? { ...existing, songId } : { songId };
  });

  const updated: Setlist = {
    ...current,
    items: nextItems,
    updatedAt: nowIso(),
  };

  items[idx] = updated;
  await writeJson(FILE, items);
  return updated;
}
