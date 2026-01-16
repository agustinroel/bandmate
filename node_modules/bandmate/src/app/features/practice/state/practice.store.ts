import { Injectable, computed, signal } from '@angular/core';
import type { Setlist } from '@bandmate/shared';
import { SongsStore } from '../../songs/state/songs-store';
import { SetlistsStore } from '../../setlists/state/setlists.store';

@Injectable({ providedIn: 'root' })
export class PracticeStore {
  private _setlistId = signal<string | null>(null);
  private _index = signal<number>(0);

  readonly setlistId = computed(() => this._setlistId());
  readonly index = computed(() => this._index());

  constructor(private setlists: SetlistsStore, private songs: SongsStore) {}

  readonly setlist = computed<Setlist | null>(() => {
    const id = this._setlistId();
    if (!id) return null;
    return this.setlists.items().find((s) => s.id === id) ?? null;
  });

  readonly songIds = computed(() => this.setlist()?.items.map((i) => i.songId) ?? []);

  readonly currentSongId = computed(() => this.songIds()[this._index()] ?? null);
  readonly nextSongId = computed(() => this.songIds()[this._index() + 1] ?? null);
  readonly prevSongId = computed(() => this.songIds()[this._index() - 1] ?? null);

  readonly currentSong = computed(() => {
    const id = this.currentSongId();
    return id ? this.songs.getById(id) ?? null : null;
  });

  readonly nextSong = computed(() => {
    const id = this.nextSongId();
    return id ? this.songs.getById(id) ?? null : null;
  });

  readonly prevSong = computed(() => {
    const id = this.prevSongId();
    return id ? this.songs.getById(id) ?? null : null;
  });

  readonly count = computed(() => this.songIds().length);

  readonly progressLabel = computed(() => {
    const total = this.count();
    if (!total) return '—';
    return `${this._index() + 1} / ${total}`;
  });

  readonly durations = computed(() => {
    const ids = this.songIds();
    return ids.map((id) => this.asNumber(this.songs.getById(id)?.durationSec));
  });

  readonly totalSeconds = computed(() => this.durations().reduce((a, b) => a + b, 0));

  readonly elapsedSeconds = computed(() => {
    const idx = this._index();
    const durs = this.durations();
    // elapsed incluye la canción actual completa? En ensayo suele ser "hasta la actual (incluida)"
    // Yo lo haría "hasta la actual inclusive" porque es más útil para planificar.
    const inclusive = durs.slice(0, idx + 1).reduce((a, b) => a + b, 0);
    return inclusive;
  });

  readonly remainingSeconds = computed(() => {
    const total = this.totalSeconds();
    const elapsed = this.elapsedSeconds();
    return Math.max(0, total - elapsed);
  });

  readonly totalLabel = computed(() => this.formatDuration(this.totalSeconds()));
  readonly elapsedLabel = computed(() => this.formatDuration(this.elapsedSeconds()));
  readonly remainingLabel = computed(() => this.formatDuration(this.remainingSeconds()));

  start(setlistId: string) {
    this._setlistId.set(setlistId);
    this._index.set(0);
  }

  stop() {
    this._setlistId.set(null);
    this._index.set(0);
  }

  next() {
    const total = this.count();
    if (!total) return;
    this._index.set(Math.min(this._index() + 1, total - 1));
  }

  prev() {
    const total = this.count();
    if (!total) return;
    this._index.set(Math.max(this._index() - 1, 0));
  }

  jumpTo(i: number) {
    const total = this.count();
    if (!total) return;
    this._index.set(Math.max(0, Math.min(i, total - 1)));
  }

  private asNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private formatDuration(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
