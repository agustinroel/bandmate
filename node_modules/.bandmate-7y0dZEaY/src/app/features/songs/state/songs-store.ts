import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, tap, throwError } from 'rxjs';
import type {
  CreateSongDto,
  Song,
  SongDetail,
  SongDetailV2,
  SongSection,
  UpdateSongDto,
} from '@bandmate/shared';
import { SongPolicy, toLegacySongDetail } from '@bandmate/shared';
import { SongsApiService } from '../data/songs-api';
import { LibraryApiService, LibraryWorkListItem } from '../data/library-api';
import { AchievementService } from '../../../core/services/achievement.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class SongsStore {
  readonly api = inject(SongsApiService);
  readonly libraryApi = inject(LibraryApiService);
  private readonly achievements = inject(AchievementService);

  readonly _state = signal<LoadState>('idle');
  readonly _songs = signal<Song[]>([]);
  readonly _error = signal<string | null>(null);

  // NEW: detail state (for Song detail page / editor)
  readonly _detailState = signal<LoadState>('idle');
  readonly _selected = signal<SongDetail | null>(null);
  readonly _selectedError = signal<string | null>(null);

  readonly _detailDirtyTick = signal(0);

  readonly _libraryState = signal<LoadState>('idle');
  readonly _library = signal<LibraryWorkListItem[]>([]);
  readonly _libraryError = signal<string | null>(null);

  readonly libraryState = this._libraryState.asReadonly();
  readonly library = this._library.asReadonly();
  readonly libraryError = this._libraryError.asReadonly();

  readonly state = this._state.asReadonly();
  readonly songs = this._songs.asReadonly();
  readonly error = this._error.asReadonly();
  readonly count = computed(() => this._songs().length);

  // NEW: readonly detail signals
  readonly detailDirtyTick = this._detailDirtyTick.asReadonly();

  private markDetailDirty() {
    this._detailDirtyTick.update((n) => n + 1);
  }
  readonly detailState = this._detailState.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly selectedError = this._selectedError.asReadonly();

  load() {
    this._state.set('loading');
    this._error.set(null);

    this.api
      .list()
      .pipe(
        tap((rows) => {
          const songs = (rows ?? []).map((x: any) => this.normalizeToListSong(x));
          this._songs.set(songs);
        }),
        finalize(() => {
          if (this._state() !== 'error') this._state.set('ready');
        }),
      )
      .subscribe({
        error: (err) => {
          this._state.set('error');
          this._error.set(err?.message ?? 'Failed to load songs');
        },
      });
  }

  loadLibrary() {
    this._libraryState.set('loading');
    this._libraryError.set(null);

    this.libraryApi
      .listWorks()
      .pipe(
        tap((rows) => this._library.set(rows ?? [])),
        finalize(() => {
          if (this._libraryState() !== 'error') this._libraryState.set('ready');
        }),
      )
      .subscribe({
        error: (err) => {
          this._libraryState.set('error');
          this._libraryError.set(err?.message ?? 'Failed to load library');
        },
      });
  }

  /**
   * Kept for compatibility (returns Observable from API).
   * Note: this likely returns Song today, not SongDetail.
   */
  loadOne(id: string) {
    this._error.set(null);
    return this.api.get(id);
  }

  getById(id: string) {
    return this._songs().find((s) => s.id === id) ?? null;
  }

  create(dto: CreateSongDto) {
    this._error.set(null);
    return this.api.create(dto).pipe(
      tap((song) => {
        this._songs.set([song, ...this._songs()]);
        // ✅ Achievement Trigger
        this.achievements.unlock('first_song_created');
      }),
    );
  }

  update(id: string, dto: UpdateSongDto) {
    this._error.set(null);
    return this.api.update(id, dto).pipe(
      tap((updated) => {
        this._songs.set(this._songs().map((s) => (s.id === id ? updated : s)));

        // If we have selected detail for same song, reflect metadata updates there too
        const sel = this._selected();
        if (sel?.id === id) {
          this._selected.set({
            ...sel,
            ...updated,
            updatedAt: (updated as any)?.updatedAt ?? sel.updatedAt,
          });
        }
      }),
    );
  }

  remove(id: string) {
    const prev = this._songs();
    this._songs.set(prev.filter((s) => s.id !== id));

    return this.api.remove(id).pipe(
      tap(() => {
        // If deleting the selected song, clear detail selection
        if (this._selected()?.id === id) {
          this._selected.set(null);
          this._detailState.set('idle');
          this._selectedError.set(null);
        }
      }),
      catchError((err) => {
        this._songs.set(prev); // rollback
        return throwError(() => err);
      }),
    );
  }

  seed(dtos: CreateSongDto[]) {
    // Simple serial or parallel creation
    // For MVP, just fire and forget loop or simple concat
    dtos.forEach((dto) => {
      this.create(dto).subscribe();
    });
  }

  /**
   * Forks a work/arrangement into a user's personal song library.
   */
  createFromWork(work: any, arrangement?: any) {
    // 1) Construct the new song payload based on the work + arrangement
    const base = arrangement ?? {};

    // Explicitly cast or construct the DTO to match what the API expects
    // Note: The API repo we just updated looks for workId / work_id
    const dto: any = {
      title: work.title,
      artist: work.artist,

      // Metrics from arrangement
      key: base.key ?? undefined,
      bpm: base.bpm ?? undefined,
      durationSec: base.durationSec ?? undefined,

      // Content
      sections: base.sections ?? [], // copy sections
      notes: base.notes ?? undefined,
      links: base.links ?? undefined,

      // Linkage (THE IMPORTANT PART)
      workId: work.id,
      originArrangementId: base.id ?? undefined,

      isSeed: false, // Explicitly user owned
      version: 1,
    };

    // 2) Create call via API
    return this.create(dto).pipe(
      tap(() => {
        // ✅ Achievement Trigger
        this.achievements.unlock('first_arrangement');
      }),
    );
  }

  // -------------------------
  // NEW: Detail (SongDetail)
  // -------------------------

  loadDetail(id: string) {
    this._detailState.set('loading');
    this._selectedError.set(null);

    // 1) Pintamos rápido desde local si existe (solo si NO es seed)
    const local = loadDetailFromLocal(id);
    if (local) {
      const normalized = this.normalizeToDetail(local);

      // si es seed, ignoramos local (como ya hacías)
      if (!((normalized as any)?.is_seed || (normalized as any)?.isSeed)) {
        this._selected.set(normalized);
        // ojo: NO retornamos, igual refrescamos desde API
        this._detailState.set('ready');
      }
    }

    // 2) Siempre refrescamos desde API (source of truth)
    this.api
      .get(id)
      .pipe(
        tap((result) => {
          const detail = this.normalizeToDetail(result);
          this._selected.set(detail);

          // cache solo si NO es seed
          if (!detail.isSeed) {
            saveDetailToLocal(id, detail);
          }
        }),
        finalize(() => {
          if (this._detailState() !== 'error') this._detailState.set('ready');
        }),
      )
      .subscribe({
        error: (err) => {
          this._detailState.set('error');
          this._selectedError.set(err?.message ?? 'Failed to load song detail');
        },
      });
  }

  clearSelected() {
    this._selected.set(null);
    this._detailState.set('idle');
    this._selectedError.set(null);
  }

  rateSong(id: string, value: number) {
    this._error.set(null);

    return this.api.rateSong(id, value).pipe(
      tap((updated) => {
        // ✅ patch list
        this._songs.set(this._songs().map((s) => (s.id === id ? { ...s, ...updated } : s)));

        // ✅ patch selected si coincide
        const sel = this._selected();
        if (sel?.id === id) {
          this._selected.set({ ...sel, ...updated });
        }
      }),
    );
  }

  publish(songId: string) {
    return this.api.publish(songId);
  }

  rate(songId: string, value: number) {
    return this.api.rate(songId, value);
  }

  /**
   * Local-only update for sections (useful for editor/autosave later).
   * If you don’t have backend support yet, this still lets UI render/edit.
   */
  setSelectedSections(sections: SongSection[]) {
    const sel = this._selected();
    if (!sel) return;

    this._selected.set({
      ...sel,
      sections,
      updatedAt: new Date().toISOString(),
    });
    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  addSection(partial?: { type?: any; name?: string }) {
    const sel = this._selected();
    if (!sel) return;

    const nextOrder =
      sel.sections.length === 0 ? 1 : Math.max(...sel.sections.map((s) => s.order)) + 1;

    const type = partial?.type ?? 'verse';

    const existingSameType = sel.sections.filter((s) => s.type === type).length;

    const defaultName =
      type === 'chorus'
        ? 'Chorus'
        : `${type.charAt(0).toUpperCase() + type.slice(1)} ${existingSameType + 1}`;

    const name = partial?.name?.trim() || defaultName;

    const newSection = {
      id: cryptoRandomId(),
      type: type,
      name: name,
      order: nextOrder,
      lines: [{ id: cryptoRandomId(), kind: 'lyrics' as const, source: '' }],
    };

    this._selected.set({
      ...sel,
      sections: [...sel.sections, newSection],
      updatedAt: new Date().toISOString(),
    });

    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  updateSection(sectionId: string, patch: { type?: any; name?: string; repeats?: number }) {
    const sel = this._selected();
    if (!sel) return;

    const sections = sel.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        ...patch,
        name: patch.name?.trim() || sec.name,
      };
    });

    this._selected.set({ ...sel, sections, updatedAt: new Date().toISOString() });
    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  removeSection(sectionId: string) {
    const sel = this._selected();
    if (!sel) return;

    const sections = sel.sections.filter((s) => s.id !== sectionId);

    // opcional: reordenar "order" para que quede prolijo (1..n)
    const normalized = sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({ ...s, order: i + 1 }));

    this._selected.set({ ...sel, sections: normalized, updatedAt: new Date().toISOString() });
    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  removeLine(sectionId: string, lineId: string) {
    const sel = this._selected();
    if (!sel) return;

    const sections = sel.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, lines: sec.lines.filter((ln) => ln.id !== lineId) };
    });

    this._selected.set({ ...sel, sections, updatedAt: new Date().toISOString() });
    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  addLine(sectionId: string) {
    const sel = this._selected();
    if (!sel) return;

    const sections = sel.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        lines: [...sec.lines, { id: cryptoRandomId(), kind: 'lyrics' as const, source: '' }],
      };
    });

    this._selected.set({ ...sel, sections, updatedAt: new Date().toISOString() });
    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  updateLine(sectionId: string, lineId: string, patch: { source?: string; text?: string }) {
    const sel = this._selected();
    if (!sel) return;

    const sections = sel.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const lines = sec.lines.map((ln) => (ln.id === lineId ? { ...ln, ...patch } : ln));
      return { ...sec, lines };
    });

    this._selected.set({ ...sel, sections, updatedAt: new Date().toISOString() });
    const updated = this._selected();
    if (updated) saveDetailToLocal(updated.id, updated);
    this.markDetailDirty();
  }

  /**
   * Helper to create a minimal SongDetail draft locally (no API call).
   * Useful when you click "Create song" and want to jump to editor immediately.
   */
  createDraftDetail(dto: CreateSongDto): SongDetail {
    const now = new Date().toISOString();

    const base: Song = {
      id: `draft_${cryptoRandomId()}`,
      title: dto.title,
      artist: dto.artist,
      key: dto.key,
      bpm: dto.bpm,
      durationSec: dto.durationSec,
      notes: dto.notes,
      links: dto.links,

      createdAt: now,
      updatedAt: now,
      isSeed: false,
    };

    const detail: SongDetail = {
      ...base,
      version: 1,
      sections: dto.sections ?? createEmptySections(),
    };

    this._selected.set(detail);
    this._detailState.set('ready');
    this._selectedError.set(null);

    return detail;
  }

  /**
   * If API returns SongDetail, use it; if it returns Song, wrap it.
   */
  private normalizeToDetail(input: Song | SongDetail | SongDetailV2): SongDetail {
    // ✅ v2 payload: { work, arrangements, activeArrangement }
    if ('work' in input && 'activeArrangement' in input) {
      return this.mergeV2ToLegacyDetail(input as SongDetailV2);
    }

    // ✅ If it already has sections/version, assume it's SongDetail
    if ('sections' in input && Array.isArray((input as SongDetail).sections)) {
      return input as SongDetail;
    }

    // ✅ Otherwise wrap metadata into a SongDetail skeleton
    return {
      ...(input as Song),
      version: 1,
      sections: [],
    };
  }

  private normalizeToListSong(input: any): Song {
    const now = new Date().toISOString();

    // ✅ v2 work item (si tu backend lista works):
    // { id, title, artist, rights?, source?, ratingAvg?, ratingCount?, topArrangement?, updatedAt? ... }
    if (input?.rights !== undefined || input?.musicbrainzId || input?.wikidataId) {
      return {
        id: input.id,
        title: input.title ?? 'Untitled',
        artist: input.artist ?? 'Unknown',
        key: input.key ?? undefined,
        bpm: input.bpm ?? undefined,
        durationSec: input.durationSec ?? undefined,
        notes: input.notes ?? undefined,
        links: input.links ?? undefined,

        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,

        // ⚡ Importante: que caiga en Library
        isSeed: true,
        ratingAvg: input.ratingAvg ?? input.rating_avg ?? 0,
        ratingCount: input.ratingCount ?? input.rating_count ?? 0,
      };
    }

    // ✅ legacy Song
    return {
      id: input.id,
      title: input.title ?? 'Untitled',
      artist: input.artist ?? 'Unknown',
      key: input.key ?? undefined,
      bpm: input.bpm ?? undefined,
      durationSec: input.durationSec ?? undefined,
      notes: input.notes ?? undefined,
      links: input.links ?? undefined,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      isSeed: !!input.isSeed,
      ratingAvg: input.ratingAvg ?? input.rating_avg ?? 0,
      ratingCount: input.ratingCount ?? input.rating_count ?? 0,
      workId: input.workId ?? input.work_id,
      originArrangementId: input.originArrangementId ?? input.origin_arrangement_id,
    };
  }

  private mergeV2ToLegacyDetail(v2: SongDetailV2): SongDetail {
    const now = new Date().toISOString();

    const work = v2.work;
    const a = v2.activeArrangement;

    // “Legacy SongDetail” para que TODO tu editor/view siga andando
    return {
      id: a.id, // ⚠️ importante: tu UI actual navega por /songs/:id -> acá será arrangementId (por ahora)
      title: work.title,
      artist: work.artist,

      key: a.key,
      bpm: a.bpm,
      durationSec: a.durationSec,
      notes: a.notes,
      links: a.links,

      sections: a.sections ?? [],
      version: 1,

      createdAt: a.createdAt ?? now,
      updatedAt: a.updatedAt ?? now,

      // Para que se vea “tipo seed” y no lo trates como “user-owned”
      isSeed: a.isSeed ?? true,
    };
  }

  patchSelectedMeta(patch: Partial<CreateSongDto>) {
    const sel = this._selected();
    if (!sel) return;

    // OJO: NO toco updatedAt acá para que no te genere ruido.
    // Si querés, updatedAt solo cuando realmente guardó backend.
    this._selected.set({
      ...sel,
      title: patch.title ?? sel.title,
      artist: patch.artist ?? sel.artist,
      key: (patch.key as any) ?? sel.key,
      bpm: (patch.bpm as any) ?? sel.bpm,
      durationSec: (patch.durationSec as any) ?? sel.durationSec,
      notes: (patch.notes as any) ?? sel.notes,
      links: (patch.links as any) ?? sel.links,
    });
  }
}

// -------------------------
// Helpers (local)
// -------------------------

function createEmptySections(): SongSection[] {
  return [
    {
      id: cryptoRandomId(),
      type: 'verse',
      name: 'Verse 1',
      order: 1,
      lines: [{ id: cryptoRandomId(), kind: 'lyrics', source: '' }],
    },
    {
      id: cryptoRandomId(),
      type: 'chorus',
      name: 'Chorus',
      order: 2,
      lines: [{ id: cryptoRandomId(), kind: 'lyrics', source: '' }],
    },
  ];
}

function cryptoRandomId(): string {
  // Works in modern browsers; good enough for MVP.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const LS_PREFIX = 'bm_song_detail_';

function loadDetailFromLocal(id: string) {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDetailToLocal(id: string, detail: any) {
  try {
    localStorage.setItem(`${LS_PREFIX}${id}`, JSON.stringify(detail));
  } catch {
    // ignore quota / private mode errors for MVP
  }
}
