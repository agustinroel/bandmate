import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, finalize, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { CreateSongDto, UpdateSongDto, SongDetail, SongPolicy } from '@bandmate/shared';
import { TitleCasePipe } from '@angular/common';
import { GuitarChordDiagramComponent } from '../../../shared/ui/guitar-chord-diagram/guitar-chord-diagram';
import { SongsStore } from '../../songs/state/songs-store';
import { SongFormComponent } from '../../songs/features/songs/components/song-form/song-form';
import { ChordPlacement } from '../../../shared/utils/music/chord-inline';
import { toSignal } from '@angular/core/rxjs-interop';
import { parseChord, chordNotes } from '../../../shared/utils/music/chords';
import { getGuitarShapes } from '../../../shared/utils/music/guitar-shapes';
import { MatDialog } from '@angular/material/dialog';
import { AddSectionDialogComponent } from '../components/add-section-dialog/add-section.dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { useSkeletonUx } from '../../../shared/utils/skeleton-ux';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';
import { ChordLineViewComponent } from '../../../shared/ui/chord-line-view/chord-line-view';
import { TransposeBarComponent } from '../../../shared/ui/transpose-bar/transpose-bar';

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

type FlowToken = { chord: string | null; text: string };

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
    MatTooltipModule,
    SongFormComponent,
    TitleCasePipe,
    MatMenuModule,
    ChordLineViewComponent,
    TransposeBarComponent,
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
  readonly userRating = signal(0); // local state for UI feedback

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



  publish() {
    const id = this.songId();
    if (!id) return;

    this.confirm({
      title: 'Publish to Community',
      message: 'This will create a public version of your arrangement for everyone to see. You can continue editing your private copy.',
      confirmText: 'Publish',
      cancelText: 'Cancel',
    }).subscribe((ok) => {
      if (!ok) return;

      this.store.publish(id).subscribe({
        next: () => {
          this.notify.success('Published to community!', 'OK', 3000);
          // Optional: navigate to work page to see it?
          // this.router.navigate(['/library', this.currentDetail()?.workId]);
        },
        error: (err) => this.notify.error('Failed to publish', 'OK', 3000),
      });
    });
  }

  rate(value: number) {
    const id = this.songId();
    if (!id) return;

    // Optimistic UI
    this.userRating.set(value);

    // Call service (assume we need to add rate method later to store if not exists, 
    // but for now let's assume direct call or add it to api service)
    // Actually songs-store doesn't have rate yet, so I should add it or call API directly.
    // Let's call store.rate() which I need to add.
    this.store.rate(id, value).subscribe({
      next: () => this.notify.success('Rated!', 'OK', 1500),
      error: () => this.notify.error('Could not submit rating', 'OK', 3000)
    });
  }


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

  readonly setTranspose = (next: number) => {
    this.transpose.set(next);
  };

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

  /** Returns the element that actually scrolls in current layout.
   *  - Desktop: the card (scrollHost) has overflow:auto + height constraint
   *  - Mobile: the card is overflow:visible => page scrolls (window)
   */
  private _getScrollTarget(): { kind: 'host'; el: HTMLElement } | { kind: 'window' } {
    const host = this.scrollHost?.nativeElement;
    if (host && host.scrollHeight > host.clientHeight + 1) {
      return { kind: 'host', el: host };
    }
    return { kind: 'window' };
  }

  private _scrollBy(dy: number) {
    const target = this._getScrollTarget();

    if (target.kind === 'host') {
      target.el.scrollTop += dy;
    } else {
      // mobile: page scroll
      window.scrollTo({ top: window.scrollY + dy, behavior: 'auto' });
    }
  }

  private _isAtBottom(): boolean {
    const target = this._getScrollTarget();

    if (target.kind === 'host') {
      const el = target.el;
      return Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    }

    const doc = document.scrollingElement || document.documentElement;
    return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight;
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

    queueMicrotask(() => {
      this.scrollHost?.nativeElement?.focus?.();
    });

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

      // si dy es 0, seguimos acumulando
      if (dy !== 0) {
        const beforeWin = window.scrollY;
        const beforeHost = this.scrollHost?.nativeElement?.scrollTop ?? 0;

        this._scrollBy(dy);

        const afterWin = window.scrollY;
        const afterHost = this.scrollHost?.nativeElement?.scrollTop ?? 0;

        // si no pudo scrollear (no overflow / llegó al final)
        const noMove =
          (this._getScrollTarget().kind === 'window' && afterWin === beforeWin) ||
          (this._getScrollTarget().kind === 'host' && afterHost === beforeHost);

        if (noMove || this._isAtBottom()) {
          this.stopAutoScroll();
          return;
        }
      } else {
        // aunque no movamos, si ya estamos al final, frenamos
        if (this._isAtBottom()) {
          this.stopAutoScroll();
          return;
        }
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

    const target: EventTarget =
      this._getScrollTarget().kind === 'host'
        ? (this.scrollHost!.nativeElement as EventTarget)
        : window;

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

function bodySnapshotOf(d: SongDetail): any {
  // Solo lo que querés persistir del body
  return d.sections ?? [];
}
