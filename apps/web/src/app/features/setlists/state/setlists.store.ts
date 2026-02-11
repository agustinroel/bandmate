import { Injectable, PLATFORM_ID, computed, inject, signal, effect } from '@angular/core';
import { from, catchError, tap, throwError } from 'rxjs';
import type { Setlist } from '@bandmate/shared';
import { SetlistsApi } from '../data/setlists.api';
import { isPlatformBrowser } from '@angular/common';
import { supabase } from '../../../core/supabase/supabase.client';
import { RealtimeChannel } from '@supabase/supabase-js';

import { AuthStore } from '../../../core/auth/auth.store';

@Injectable({ providedIn: 'root' })
export class SetlistsStore {
  SELECTED_KEY = 'bandmate.selectedSetlistId';

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private storageGet(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private storageSet(key: string, value: string) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  private storageRemove(key: string) {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  readonly api = inject(SetlistsApi);
  readonly auth = inject(AuthStore);

  readonly _items = signal<Setlist[]>([]);
  readonly _state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly _error = signal<string | null>(null);
  readonly _selectedId = signal<string | null>(null);

  readonly items = computed(() => this._items());
  readonly state = computed(() => this._state());
  readonly error = computed(() => this._error());
  readonly selectedId = computed(() => this._selectedId());

  readonly selected = computed(() => {
    const id = this._selectedId();
    if (!id) return null;
    return this._items().find((s) => s.id === id) ?? null;
  });

  constructor() {
    const saved = this.storageGet(this.SELECTED_KEY);
    if (saved) this._selectedId.set(saved);

    effect(() => {
      if (this.auth.session()) {
        this._initRealtime();
      }
    });
  }

  private _realtime?: RealtimeChannel;
  private _initRealtime() {
    if (this._realtime || !this.isBrowser) return;

    this._realtime = supabase
      .channel('setlists_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setlists' }, () =>
        this.reload(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setlist_items' }, () =>
        this.reload(),
      )
      .subscribe();
  }

  load(silent = false) {
    if (!silent) {
      this._state.set('loading');
    }
    this._error.set(null);
    // Realtime init moved to effect
    // this._initRealtime();

    return from(this.api.list()).pipe(
      tap((items) => {
        this._items.set(items);
        if (!silent) {
          this._state.set('ready');
        }

        const current = this._selectedId();
        const exists = current && items.some((s) => s.id === current);

        if (!exists) {
          const next = items[0]?.id ?? null;
          this._selectedId.set(next);
          if (next) this.storageSet(this.SELECTED_KEY, next);
          else this.storageRemove(this.SELECTED_KEY);
        }

        if (!this._selectedId() && items.length) this._selectedId.set(items[0].id);
      }),
      catchError((err) => {
        if (!silent) {
          this._state.set('error');
          this._error.set(err?.message ?? 'Failed to load setlists');
        }
        return throwError(() => err);
      }),
    );
  }

  private reload() {
    // Silent reload triggered by realtime event
    this.api
      .list()
      .then((items) => {
        this._items.set(items);
        const current = this._selectedId();
        if (current && !items.find((s) => s.id === current)) {
          // Current setlist was deleted
          this._selectedId.set(items[0]?.id ?? null);
        }
      })
      .catch(console.error);
  }

  select(id: string) {
    this._selectedId.set(id);
    this.storageSet(this.SELECTED_KEY, id);
  }

  create(dto: { name: string; notes?: string }) {
    return from(this.api.create(dto)).pipe(
      tap((created) => {
        this._items.set([created, ...this._items()]);
        this._selectedId.set(created.id);
        this.storageSet(this.SELECTED_KEY, created.id);
      }),
    );
  }

  addSong(setlistId: string, songId: string) {
    return from(this.api.addItem(setlistId, { songId })).pipe(
      tap((updated) => this.replace(updated)),
    );
  }

  removeSong(setlistId: string, songId: string) {
    return from(this.api.removeItem(setlistId, songId)).pipe(
      tap((updated) => this.replace(updated)),
    );
  }

  remove(id: string) {
    return from(this.api.remove(id)).pipe(
      tap(() => {
        const nextItems = this._items().filter((s) => s.id !== id);
        this._items.set(nextItems);

        const selected = this._selectedId();
        if (selected === id) {
          const next = nextItems[0]?.id ?? null;
          this._selectedId.set(next);
          if (next) this.storageSet(this.SELECTED_KEY, next);
          else this.storageRemove(this.SELECTED_KEY);
        }
      }),
    );
  }

  reorder(setlistId: string, songIds: string[]) {
    return from(this.api.reorder(setlistId, { songIds })).pipe(
      tap((updated) => this.replace(updated)),
    );
  }

  private replace(updated: Setlist) {
    this._items.set(this._items().map((s) => (s.id === updated.id ? updated : s)));
  }

  updateName(setlistId: string, dto: { name: string }) {
    return from(this.api.update(setlistId, dto)).pipe(tap((updated) => this.replace(updated)));
  }

  createJamToday() {
    const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const name = `Jam ${today}`;

    // 1. Check if exists
    const existing = this._items().find((s) => s.name === name);
    if (existing) {
      this._selectedId.set(existing.id);
      this.storageSet(this.SELECTED_KEY, existing.id);
      return from([existing]);
    }

    // 2. Create new
    return this.create({ name, notes: 'Automated Jam Session' });
  }
}
