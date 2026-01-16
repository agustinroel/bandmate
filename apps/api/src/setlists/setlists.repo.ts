import { randomUUID } from "node:crypto";
import type {
  Setlist,
  CreateSetlistDto,
  UpdateSetlistDto,
  AddSetlistItemDto,
  ReorderSetlistDto,
} from "@bandmate/shared";

const nowIso = () => new Date().toISOString();

export class SetlistsRepo {
  private map = new Map<string, Setlist>();

  list(): Setlist[] {
    return Array.from(this.map.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  get(id: string): Setlist | undefined {
    return this.map.get(id);
  }

  create(dto: CreateSetlistDto): Setlist {
    const s: Setlist = {
      id: randomUUID(),
      name: dto.name.trim(),
      notes: dto.notes?.trim() || undefined,
      items: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.map.set(s.id, s);
    return s;
  }

  update(id: string, dto: UpdateSetlistDto): Setlist | undefined {
    const s = this.map.get(id);
    if (!s) return undefined;

    const next: Setlist = {
      ...s,
      name: dto.name !== undefined ? dto.name.trim() : s.name,
      notes: dto.notes !== undefined ? dto.notes.trim() || undefined : s.notes,
      updatedAt: nowIso(),
    };
    this.map.set(id, next);
    return next;
  }

  remove(id: string): boolean {
    return this.map.delete(id);
  }

  addItem(id: string, dto: AddSetlistItemDto): Setlist | undefined {
    const s = this.map.get(id);
    if (!s) return undefined;

    // evitar duplicados
    if (s.items.some((i) => i.songId === dto.songId)) return s;

    const next: Setlist = {
      ...s,
      items: [...s.items, { songId: dto.songId }],
      updatedAt: nowIso(),
    };
    this.map.set(id, next);
    return next;
  }

  removeItem(id: string, songId: string): Setlist | undefined {
    const s = this.map.get(id);
    if (!s) return undefined;

    const next: Setlist = {
      ...s,
      items: s.items.filter((i) => i.songId !== songId),
      updatedAt: nowIso(),
    };

    this.map.set(id, next);
    return next;
  }

  reorder(id: string, dto: ReorderSetlistDto): Setlist | undefined {
    const s = this.map.get(id);
    if (!s) return undefined;

    const byId = new Map(s.items.map((i) => [i.songId, i]));
    const items = dto.songIds
      .map((songId) => byId.get(songId))
      .filter((x): x is NonNullable<typeof x> => !!x);

    // mantener cualquier item “nuevo” que no esté en songIds al final
    for (const i of s.items) {
      if (!dto.songIds.includes(i.songId)) items.push(i);
    }

    const next: Setlist = { ...s, items, updatedAt: nowIso() };
    this.map.set(id, next);
    return next;
  }
}
