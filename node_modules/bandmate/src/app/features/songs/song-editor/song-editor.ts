import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, finalize, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import type { CreateSongDto, UpdateSongDto, SongDetail } from '@bandmate/shared';
import { TitleCasePipe } from '@angular/common';
import { GuitarChordDiagramComponent } from '../../../shared/ui/guitar-chord-diagram/guitar-chord-diagram';
import { SongsStore } from '../../songs/state/songs-store';
import { SongFormComponent } from '../../songs/features/songs/components/song-form/song-form';
import { ChordLyricLayout, ChordPlacement, toChordLyricLayout } from '../utils/chord-inline';
import { toSignal } from '@angular/core/rxjs-interop';
import { parseChord, chordNotes } from '../../songs/utils/chords'; // ajustá path
import { getGuitarShapes } from '../../songs/utils/guitar-shapes';

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
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snack = inject(MatSnackBar);

  readonly store = inject(SongsStore);

  readonly saving = signal(false);
  readonly viewMode = signal<'edit' | 'view'>('edit');
  readonly selectedChord = signal<string | null>(null);

  readonly chordShapeIndex = signal(0);
  readonly _openedChord = signal<string | null>(null);

  readonly displayKey = computed(
    () => (this.store.selected()?.key ?? '').toString().trim() || null,
  );

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

  readonly isEdit = computed(() => !!this.id() && this.id() !== 'new');

  /**
   * Single source of truth for what's being edited/viewed.
   * - edit existing: store.selected()
   * - new: draft (created once) in store.selected()
   */
  readonly currentDetail = computed<SongDetail | null>(() => this.store.selected());

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
    effect(() => {
      const id = this.id();
      console.log('ID:', id);

      if (!id) return;

      if (id === 'new') {
        this.store.clearSelected();
        this.store.createDraftDetail({ title: '', artist: '', sections: [] } as any);
        return;
      }

      this.store.loadDetail(id);
    });
  }

  toggleMode() {
    this.viewMode.set(this.viewMode() === 'edit' ? 'view' : 'edit');
  }

  save = (dto: CreateSongDto) => {
    this.saving.set(true);

    const id = this.id();
    const req$ =
      id && id !== 'new' ? this.store.update(id, dto as UpdateSongDto) : this.store.create(dto);

    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snack.open('Song saved', 'OK', { duration: 2000 });
        this.router.navigate(['/songs']);
      },
      error: () => this.snack.open('Could not save song', 'OK', { duration: 3000 }),
    });
  };

  goBack = () => this.router.navigate(['/songs']);

  addSection() {
    this.store.addSection({ type: 'verse', name: 'Verse' });
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
    const sel = this.store.selected();
    if (!sel) return;

    const sections = sel.sections.map((sec) => ({
      ...sec,
      lines: sec.lines.map((ln) => {
        if (ln.kind !== 'lyrics') return ln;
        const source = ln.source ?? '';
        return { ...ln, source: transposeInlineChords(source, step) };
      }),
    }));

    // Update key too (best-effort)
    const nextKey = sel.key ? transposeChordSymbol(sel.key, step) : sel.key;

    this.store.setSelectedSections(sections);

    if (sel.id && sel.key !== nextKey) {
      // keep it local for now; backend later
      this.store.update(sel.id, { key: nextKey } as any).subscribe?.(); // if your update returns Observable
    }

    this.snack.open(`Transposed song ${step > 0 ? '+' : ''}${step}`, 'OK', { duration: 1200 });
  }

  openChordPopover(chord: string, ev: MouseEvent) {
    // ... tu lógica actual para setear chord seleccionado + abrir menu
    if (this._openedChord() !== chord) {
      this._openedChord.set(chord);
      this.chordShapeIndex.set(0);
    }
  }

  onPopoverClosed() {
    this._openedChord.set(null);
    this.chordShapeIndex.set(0);
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

function transposeInlineChords(source: string, step: number): string {
  // replace [Chord] tokens
  return source.replace(/\[([^\]]+)\]/g, (_m, raw) => {
    const chord = String(raw ?? '').trim();
    if (!chord) return '[]';
    return `[${transposeChordSymbol(chord, step)}]`;
  });
}
