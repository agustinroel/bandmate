import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, finalize, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { CreateSongDto, UpdateSongDto, SongDetail, SongPolicy } from '@bandmate/shared';
import { TitleCasePipe } from '@angular/common';
import { GuitarChordDiagramComponent } from '../../../shared/ui/guitar-chord-diagram/guitar-chord-diagram';
import { SongsStore } from '../../songs/state/songs-store';
import { SongFormComponent } from '../../songs/features/songs/components/song-form/song-form';
import { ChordLyricLayout, ChordPlacement, toChordLyricLayout } from '../utils/chord-inline';
import { toSignal } from '@angular/core/rxjs-interop';
import { parseChord, chordNotes } from '../../songs/utils/chords'; // ajustá path
import { getGuitarShapes } from '../../songs/utils/guitar-shapes';
import { MatDialog } from '@angular/material/dialog';
import { AddSectionDialogComponent } from '../components/add-section-dialog/add-section.dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { useSkeletonUx } from '../../../shared/utils/skeleton-ux';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';

type SongMetaSnapshot = {
  title: string;
  artist: string;
  key: string | null;
  bpm: string | number | null;
  durationSec: string | number | null;
  notes: string | null;
  links: any | null; // o tipalo mejor si lo tenés
};

type SaveUiState = 'idle' | 'saving' | 'saved' | 'error';

type ViewMode = 'view' | 'edit';

function stableStringify(value: any): string {
  // stringify estable (ordenando keys) para comparar objetos sin falsos positivos
  const seen = new WeakSet();
  return JSON.stringify(value, function (key, val) {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return;
      seen.add(val);

      if (Array.isArray(val)) return val;

      return Object.keys(val)
        .sort()
        .reduce((acc: any, k) => {
          acc[k] = (val as any)[k];
          return acc;
        }, {});
    }
    return val;
  });
}

function metaSnapshotOf(d: SongDetail): SongMetaSnapshot {
  return {
    title: (d.title ?? '').trim(),
    artist: (d.artist ?? '').trim(),
    key: (d.key ?? '').toString().trim() || null,
    bpm: d.bpm ?? null,
    durationSec: d.durationSec ?? null,
    notes: (d.notes ?? '').trim() || null,
    links: d.links ?? null,
  };
}

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    SongFormComponent,
    TitleCasePipe,
    MatMenuModule,
    GuitarChordDiagramComponent,
  ],
  templateUrl: './song-editor.html',
  styleUrl: './song-editor.scss',
})
export class SongEditorPageComponent {
  @ViewChild('scrollHost', { read: ElementRef }) scrollHost?: ElementRef<HTMLElement>;

  SongPolicy = SongPolicy;
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly store = inject(SongsStore);

  readonly dialog = inject(MatDialog);

  readonly notify = inject(NotificationsService);

  readonly saving = signal(false);

  readonly transpose = signal(0);
  readonly viewMode = computed<ViewMode>(() => {
    // ✅ CREATE: siempre edit
    if (this.isCreate()) return 'edit';
    // ✅ EDIT: respeta toggle manual
    return this.manualViewMode();
  });

  readonly manualViewMode = signal<ViewMode>('view'); // solo para EDIT

  // ✅ id solo si NO es create
  readonly songId = computed(() =>
    this.isCreate() ? null : this.route.snapshot.paramMap.get('id'),
  );

  // ✅ modo único para template/UX
  readonly mode = computed(() => (this.isCreate() ? 'create' : 'edit'));

  readonly isCreate = computed(() => this.route.snapshot.routeConfig?.path === 'songs/new');

  readonly isView = computed(() => this.viewMode() === 'view');
  readonly isEditing = computed(() => this.viewMode() === 'edit');

  readonly hoveredChord = signal<string | null>(null);

  readonly selectedChord = signal<string | null>(null);

  readonly chordShapeIndex = signal(0);

  private _autosaveTimer: any = null;
  private _autosaveInFlight = false;
  readonly _lastSavedBody = signal<string>(''); // stringify estable de sections
  private _autosaveBodyTimer: any = null;
  private _autosaveBodyInFlight = false;

  // último snapshot guardado (enviado al backend con éxito)
  readonly _lastSavedMeta = signal<string>(''); // guardamos stringify estable
  // último snapshot visto (para resetear "saved" cuando vuelve a editar)
  readonly _lastSeenMeta = signal<string>('');

  readonly saveUi = signal<SaveUiState>('idle');

  readonly autoScrollOn = signal(false);

  // px por segundo (tuneable)
  readonly autoScrollSpeed = signal(28);

  private _rafId: number | null = null;
  private _lastTs: number | null = null;
  private _scrollCarry = 0;
  private _autoScrollCleanup: (() => void) | null = null;

  // ---- Auto-scroll fine tune ----
  readonly autoScrollSpeedMin = 8;
  readonly autoScrollSpeedMax = 90;
  readonly autoScrollSpeedStep = 2;

  // opcional: para “acelerar” el ajuste si el user gira fuerte
  private _fineTuneCarry = 0;

  private _showSavingTimer: any = null;
  private _hideSavedTimer: any = null;

  readonly canAutoScroll = computed(() => !this.isEditing() && !!this.currentDetail());

  readonly displayKey = computed(() => {
    const k = (this.currentDetail()?.key ?? '').toString().trim();
    if (!k) return null;
    const t = this.transpose();
    return t ? transposeChordSymbol(k, t) : k;
  });

  isChordSelected = (ch: string) => computed(() => this.selectedChord() === ch);
  isChordHovered = (ch: string) => computed(() => this.hoveredChord() === ch);

  private _lastModeKey = '';

  readonly _currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly id = computed(() => {
    const url = (this._currentUrl() ?? '').split('?')[0].split('#')[0]; // strip qs/hash

    // ejemplos:
    // /songs/new
    // /songs/s20
    // /songs/s20/edit
    const parts = url.split('/').filter(Boolean);

    const songsIdx = parts.indexOf('songs');
    if (songsIdx === -1) return null;

    const maybeId = parts[songsIdx + 1] ?? null;
    return maybeId;
  });

  readonly isEdit = computed(() => !this.isCreate());
  canEditBody = computed(
    () => this.viewMode() === 'edit' && SongPolicy.canEdit(this.currentDetail()),
  );

  /**
   * Single source of truth for what's being edited/viewed.
   * - edit existing: store.selected()
   * - new: draft (created once) in store.selected()
   */
  readonly currentDetail = computed<SongDetail | null>(() => this.store.selected());

  readonly isDetailLoading = useSkeletonUx({
    isActive: this.isEdit,
    isLoading: computed(() => {
      const st = this.store.detailState();
      return st === 'loading' || st === 'idle';
    }),
    showDelayMs: 120,
    minVisibleMs: 280,
  });

  readonly chordInfo = computed(() => {
    const raw = this.selectedChord();
    if (!raw) return null;

    const parsed = parseChord(raw);
    if (!parsed) return { raw, notes: [], shapes: [] };

    return {
      raw: parsed.raw,
      root: parsed.root,
      quality: parsed.quality,
      notes: chordNotes(parsed),
      shapes: getGuitarShapes(parsed.raw),
    };
  });

  constructor() {
    // 1) Load / route changes
    effect(() => {
      const id = this.id();
      if (!id) return;

      // reset UI + snapshots on song change
      this._lastSavedMeta.set('');
      this._lastSeenMeta.set('');
      this.saveUi.set('idle');

      // NEW route: no autosave
      if (id === 'new') {
        this.store.clearSelected();
        this.store.createDraftDetail({ title: '', artist: '', sections: [] } as any);
        return;
      }

      // EDIT route: load detail
      this.store.loadDetail(id);

      // cleanup debounce timer on route changes
      return () => {
        if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
        this._autosaveTimer = null;
        this._autosaveInFlight = false;
      };
    });

    // 2) Init snapshots once detail is ready (prevents autosave without user changes)
    effect(() => {
      if (!this.isEdit()) return;

      const st = this.store.detailState();
      if (st !== 'ready') return;

      const d = this.store.selected();
      if (!d) return;

      const key = stableStringify(metaSnapshotOf(d));

      const bodyKey = stableStringify(bodySnapshotOf(d));

      if (!this._lastSavedBody()) {
        this._lastSavedBody.set(bodyKey);
      }
      // only first time per song load
      if (!this._lastSavedMeta()) {
        this._lastSavedMeta.set(key);
        this._lastSeenMeta.set(key);
        this.saveUi.set('idle');
      }
    });

    // 3) Smart autosave - debounced + no-op if unchanged
    effect(() => {
      const id = this.id();
      if (!id || id === 'new') return;
      if (!this.isEdit()) return;

      // Solo si realmente puede editar el body (no seed, etc.)
      if (!this.canEditBody()) return;

      const st = this.store.detailState();
      if (st === 'loading' || st === 'idle') return;

      const detail = this.store.selected();
      if (!detail) return;

      const bodyKey = stableStringify(bodySnapshotOf(detail));
      const lastSaved = this._lastSavedBody();

      if (lastSaved && lastSaved === bodyKey) return; // no cambió => no guardar

      if (this._autosaveBodyTimer) clearTimeout(this._autosaveBodyTimer);

      this._autosaveBodyTimer = setTimeout(() => {
        const idNow = this.id();
        if (!idNow || idNow === 'new') return;

        const dNow = this.store.selected();
        if (!dNow) return;

        const bodyNow = stableStringify(bodySnapshotOf(dNow));
        const lastNow = this._lastSavedBody();
        if (lastNow && lastNow === bodyNow) return;
        if (this._autosaveBodyInFlight) return;

        this._autosaveBodyInFlight = true;

        // ⚠️ IMPORTANTE: acá mandamos sections
        const dto: UpdateSongDto = {
          sections: dNow.sections,
        } as any;

        this.store
          .update(idNow, dto)
          .pipe(finalize(() => (this._autosaveBodyInFlight = false)))
          .subscribe({
            next: () => this._lastSavedBody.set(bodyNow),
            error: () => {
              // opcional: notify, o dejalo silencioso
              this.notify.error('Could not save song body', 'OK', 2400);
            },
          });
      }, 700);

      return () => {
        if (this._autosaveBodyTimer) clearTimeout(this._autosaveBodyTimer);
        this._autosaveBodyTimer = null;
      };
    });

    // 4) Global cleanup (timers)
    effect((onCleanup) => {
      onCleanup(() => {
        if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
        if (this._showSavingTimer) clearTimeout(this._showSavingTimer);
        if (this._hideSavedTimer) clearTimeout(this._hideSavedTimer);
      });
    });

    // si el user cambia a Edit, apagamos auto-scroll
    effect(() => {
      if (this.isEditing() && this.autoScrollOn()) {
        this.stopAutoScroll();
      }
    });
  }

  toggleMode() {
    if (this.isCreate()) return; // no se toggilea en create
    this.manualViewMode.set(this.manualViewMode() === 'view' ? 'edit' : 'view');
  }

  save = (dto: CreateSongDto) => {
    this.saving.set(true);

    const current = this.currentDetail();

    // 🔥 Merge: lo que viene del form + lo que ya tenés en el editor (sections/version)
    const merged: any = {
      ...dto,
      links: dto.links ?? current?.links ?? [],
      sections: current?.sections ?? dto.sections ?? [],
      version: (current as any)?.version ?? (dto as any)?.version ?? 1,
    };

    const id = this.id();

    const req$ =
      id && id !== 'new'
        ? this.store.update(id, merged as UpdateSongDto)
        : this.store.create(merged as CreateSongDto);

    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notify.success('Song saved', 'OK', 2000);
        this.router.navigate(['/songs']);
      },
      error: () => this.notify.error('Could not save song', 'OK', 3000),
    });
  };

  goBack = () => this.router.navigate(['/songs']);

  addSection() {
    const ref = this.dialog.open(AddSectionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'bm-dialog',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.store.addSection(result); // { type, name? }
    });
  }

  editSection(sec: any) {
    const ref = this.dialog.open(AddSectionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'bm-dialog',
      data: {
        mode: 'edit',
        initialType: sec.type,
        initialName: sec.name ?? '',
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.store.updateSection(sec.id, result);
    });
  }

  deleteSection(sectionId: string) {
    const section = this.store.selected()?.sections.find((s) => s.id === sectionId);

    this.confirm({
      title: 'Delete section',
      message: `Delete "${section?.name ?? 'this section'}" and all its lines?`,
      confirmText: 'Delete section',
      cancelText: 'Cancel',
      tone: 'danger',
    }).subscribe((ok) => {
      if (!ok) return;
      this.store.removeSection(sectionId);
    });
  }

  deleteLine(sectionId: string, lineId: string) {
    this.confirm({
      title: 'Delete line',
      message: 'This will remove the line content. You can’t undo this yet (MVP).',
      confirmText: 'Delete',
      cancelText: 'Keep',
      tone: 'danger',
    }).subscribe((ok) => {
      if (!ok) return;
      this.store.removeLine(sectionId, lineId); // tu método nuevo
    });
  }

  addLine(sectionId: string) {
    this.store.addLine(sectionId);
  }

  onLineInput(sectionId: string, lineId: string, value: string) {
    this.store.updateLine(sectionId, lineId, { source: value });
  }

  buildLayout(source: string): ChordLyricLayout {
    return toChordLyricLayout(source);
  }

  /**
   * We render chords in a monospace line; each chord is a button.
   * To keep exact alignment, we add padding-left in "ch" units based on
   * how many characters to advance since the previous chord.
   */
  chPad(pos: number, index: number, all: ChordPlacement[]): number {
    const prev = all[index - 1];
    const prevEnd = prev ? prev.pos + prev.chord.length : 0;

    const delta = Math.max(0, pos - prevEnd);
    return delta;
  }

  transposeSong(step: number) {
    const d = this.currentDetail();
    if (!d) return;

    // visual-only
    this.transpose.update((n) => n + step);

    this.notify.info(
      `Transposed ${this.transpose() >= 0 ? '+' : ''}${this.transpose()}`,
      'OK',
      1000,
    );
  }

  transposeInlineChords(source: string, step: number): string {
    // replace [Chord] tokens
    return source.replace(/\[([^\]]+)\]/g, (_m, raw) => {
      const chord = String(raw ?? '').trim();
      if (!chord) return '[]';
      return `[${transposeChordSymbol(chord, step)}]`;
    });
  }

  resetTranspose() {
    this.transpose.set(0);
  }

  private confirm(data: ConfirmDialogData) {
    return this.dialog
      .open(ConfirmDialogComponent, {
        data,
        width: '360px',
        autoFocus: false,
        restoreFocus: true,
      })
      .afterClosed(); // Observable<boolean>
  }

  prevShape(total: number) {
    if (total <= 1) return;
    this.chordShapeIndex.update((i) => (i - 1 + total) % total);
  }

  nextShape(total: number) {
    if (total <= 1) return;
    this.chordShapeIndex.update((i) => (i + 1) % total);
  }

  shapeAt<T>(arr: T[], index: number): T {
    const i = Math.max(0, Math.min(index, arr.length - 1));
    return arr[i];
  }

  onMetaDraftChange = (patch: Partial<CreateSongDto>) => {
    // aplicalo localmente al selected sin tocar sections/updatedAt si no querés
    const sel = this.store.selected();
    if (!sel) return;

    this.store.patchSelectedMeta(patch); // te dejo el método abajo
  };

  private setSavingUi() {
    // evita flicker: si guarda muy rápido, no mostramos "Saving"
    if (this._showSavingTimer) clearTimeout(this._showSavingTimer);
    this._showSavingTimer = setTimeout(() => this.saveUi.set('saving'), 150);
  }

  private setSavedUi() {
    if (this._showSavingTimer) clearTimeout(this._showSavingTimer);
    this.saveUi.set('saved');

    if (this._hideSavedTimer) clearTimeout(this._hideSavedTimer);
    this._hideSavedTimer = setTimeout(() => this.saveUi.set('idle'), 1400);
  }

  private setErrorUi() {
    if (this._showSavingTimer) clearTimeout(this._showSavingTimer);
    if (this._hideSavedTimer) clearTimeout(this._hideSavedTimer);
    this.saveUi.set('error');

    // se va solo (o lo dejás hasta próxima edición)
    this._hideSavedTimer = setTimeout(() => this.saveUi.set('idle'), 2200);
  }

  durationLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const totalSeconds = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';

    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  toggleAutoScroll() {
    if (this.autoScrollOn()) this.stopAutoScroll();
    else this.startAutoScroll();
  }

  setAutoScrollSpeed(pxPerSec: number) {
    const next = Math.max(this.autoScrollSpeedMin, Math.min(this.autoScrollSpeedMax, pxPerSec));
    this.autoScrollSpeed.set(next);
  }

  adjustAutoScrollSpeed(delta: number) {
    this.setAutoScrollSpeed(this.autoScrollSpeed() + delta);
  }

  startAutoScroll() {
    if (!this.canAutoScroll()) return;

    // Respeta reduced motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    if (this.autoScrollOn()) return;
    this.autoScrollOn.set(true);

    // Si el usuario scrollea/toca, pausamos
    this._autoScrollCleanup?.();
    this._autoScrollCleanup = this._bindAutoScrollUserInterruption(() => this.stopAutoScroll());

    this._lastTs = null;

    const step = (ts: number) => {
      if (!this.autoScrollOn()) return;

      if (this._lastTs === null) this._lastTs = ts;
      const dtMs = ts - this._lastTs;
      this._lastTs = ts;

      // dt clamp (si tab estuvo en background)
      const dt = Math.min(dtMs, 64) / 1000;

      const speed = this.autoScrollSpeed(); // px/s
      const dyFloat = speed * dt;

      // acumulamos scroll fraccional
      this._scrollCarry += dyFloat;

      // scrolleamos cuando acumulamos >= 1px
      const dy = Math.trunc(this._scrollCarry);
      if (dy !== 0) this._scrollCarry -= dy;

      const host = this.scrollHost?.nativeElement;
      if (!host) {
        this._rafId = requestAnimationFrame(step);
        return;
      }

      const before = host.scrollTop;

      // si dy es 0, igual seguimos loop hasta acumular
      if (dy !== 0) host.scrollTop = before + dy;

      const after = host.scrollTop;
      const atBottom = Math.ceil(after + host.clientHeight) >= host.scrollHeight;

      // si no pudo scrollear (porque no hay overflow), o llegó al final, paramos
      if (atBottom || (dy !== 0 && after === before)) {
        this.stopAutoScroll();
        return;
      }

      this._rafId = requestAnimationFrame(step);
    };

    this._rafId = requestAnimationFrame(step);
  }

  stopAutoScroll() {
    this._scrollCarry = 0;
    if (!this.autoScrollOn()) return;

    this.autoScrollOn.set(false);

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastTs = null;

    this._autoScrollCleanup?.();
    this._autoScrollCleanup = null;
  }

  /** pausa auto-scroll ante actividad del usuario */
  /** pausa auto-scroll ante actividad del usuario (pero permite fine-tune con Shift+Wheel) */
  private _bindAutoScrollUserInterruption(onInterrupt: () => void) {
    const hostEl = this.scrollHost?.nativeElement;

    const onWheel = (ev: WheelEvent) => {
      if (!this.autoScrollOn()) return;

      // ✅ Fine tune: Shift + wheel => ajusta velocidad, NO pausa
      if (ev.shiftKey) {
        ev.preventDefault(); // para que no scrollee “manual” mientras ajustás
        ev.stopPropagation();

        // wheel up suele ser deltaY negativo
        const dir = ev.deltaY > 0 ? -1 : 1;

        // acumulador por si trackpad manda micro deltas
        this._fineTuneCarry += Math.abs(ev.deltaY);

        // cada “umbral” aplica un step (tuneable)
        const threshold = 40; // más bajo = más sensible
        let steps = 0;
        while (this._fineTuneCarry >= threshold) {
          this._fineTuneCarry -= threshold;
          steps++;
        }

        const amount = (steps || 1) * this.autoScrollSpeedStep * dir;
        this.adjustAutoScrollSpeed(amount);
        return;
      }

      // wheel normal => el usuario quiere controlar => pausamos
      onInterrupt();
    };

    const onTouch = () => {
      if (this.autoScrollOn()) onInterrupt();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (!this.autoScrollOn()) return;

      // ✅ Fine tune con teclado (opcional pero re cómodo)
      if (ev.key === '+' || ev.key === '=') {
        // =
        ev.preventDefault();
        this.adjustAutoScrollSpeed(this.autoScrollSpeedStep);
        return;
      }
      if (ev.key === '-' || ev.key === '_') {
        ev.preventDefault();
        this.adjustAutoScrollSpeed(-this.autoScrollSpeedStep);
        return;
      }

      // cualquier otra tecla => pausamos
      onInterrupt();
    };

    // IMPORTANTE: wheel no puede ser passive si vamos a preventDefault()
    const wheelOpts: AddEventListenerOptions = { passive: false };

    const target: EventTarget = hostEl ?? window;

    target.addEventListener('wheel', onWheel as any, wheelOpts);
    target.addEventListener('touchstart', onTouch as any, { passive: true });
    window.addEventListener('keydown', onKey);

    return () => {
      target.removeEventListener('wheel', onWheel as any, wheelOpts as any);
      target.removeEventListener('touchstart', onTouch as any);
      window.removeEventListener('keydown', onKey);
    };
  }
}

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function parseChordRoot(chord: string): { root: string; rest: string } | null {
  // root: A-G with optional #/b
  // examples: Am, Bbmaj7, F#7, C/G (we’ll handle slash bass separately)
  const m = chord.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return null;
  const root = `${m[1]}${m[2] ?? ''}`;
  const rest = m[3] ?? '';
  return { root, rest };
}

function transposeRoot(root: string, step: number): string {
  // decide whether to keep flat style if input uses flats
  const useFlats = root.includes('b');
  const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;

  // find index in either array (try both)
  let idx = (NOTES_SHARP as readonly string[]).indexOf(root);
  if (idx === -1) idx = (NOTES_FLAT as readonly string[]).indexOf(root);
  if (idx === -1) return root;

  const nextIdx = mod(idx + step, 12);
  return scale[nextIdx];
}

function transposeChordSymbol(symbol: string, step: number): string {
  // handle slash chords: D/F#
  const parts = symbol.split('/');
  const main = parts[0];
  const bass = parts[1];

  const mainParsed = parseChordRoot(main);
  if (!mainParsed) return symbol;

  const mainNext = transposeRoot(mainParsed.root, step) + mainParsed.rest;

  if (!bass) return mainNext;

  const bassParsed = parseChordRoot(bass);
  if (!bassParsed) return `${mainNext}/${bass}`;

  const bassNext = transposeRoot(bassParsed.root, step) + bassParsed.rest;
  return `${mainNext}/${bassNext}`;
}

function bodySnapshotOf(d: SongDetail): any {
  // Solo lo que querés persistir del body
  return d.sections ?? [];
}
