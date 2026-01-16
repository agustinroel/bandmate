import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, tap, throwError } from 'rxjs';
import type { CreateSongDto, Song, UpdateSongDto } from '@bandmate/shared';
import { SongsApiService } from '../data/songs-api.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class SongsStore {
  private api = inject(SongsApiService);

  private _state = signal<LoadState>('idle');
  private _songs = signal<Song[]>([]);
  private _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly songs = this._songs.asReadonly();
  readonly error = this._error.asReadonly();

  readonly count = computed(() => this._songs().length);

  load() {
    this._state.set('loading');
    this._error.set(null);

    this.api
      .list()
      .pipe(
        tap((songs) => this._songs.set(songs)),
        finalize(() => {
          // si hubo error, state lo setea en el error handler
          if (this._state() !== 'error') this._state.set('ready');
        })
      )
      .subscribe({
        error: (err) => {
          this._state.set('error');
          this._error.set(err?.message ?? 'Failed to load songs');
        },
      });
  }

  loadOne(id: string) {
    this._error.set(null);
    return this.api.get(id);
  }

  getById(id: string) {
    return this._songs().find((s) => s.id === id) ?? null;
  }

  create(dto: CreateSongDto) {
    this._error.set(null);
    return this.api.create(dto).pipe(tap((song) => this._songs.set([song, ...this._songs()])));
  }

  update(id: string, dto: UpdateSongDto) {
    this._error.set(null);
    return this.api.update(id, dto).pipe(
      tap((updated) => {
        this._songs.set(this._songs().map((s) => (s.id === id ? updated : s)));
      })
    );
  }

  remove(id: string) {
    const prev = this._songs();
    this._songs.set(prev.filter((s) => s.id !== id));

    return this.api.remove(id).pipe(
      catchError((err) => {
        this._songs.set(prev); // rollback
        return throwError(() => err);
      })
    );
  }
}
