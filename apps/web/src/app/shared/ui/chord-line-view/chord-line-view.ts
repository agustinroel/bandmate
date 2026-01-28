import { Component, Input, computed, effect, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ChordLyricLayout, toChordLyricLayout } from '../../../features/songs/utils/chord-inline';
import { getChordInfo, ChordInfo } from '../../utils/chords/chord-info';
import { GuitarChordDiagramComponent } from '../guitar-chord-diagram/guitar-chord-diagram';
import type { GuitarShape } from '../../../features/songs/utils/guitar-shapes';

type FlowToken = { chord?: string | null; text: string };

@Component({
  selector: 'bm-chord-line-view',
  standalone: true,
  imports: [NgClass, MatMenuModule, MatIconModule, GuitarChordDiagramComponent],
  templateUrl: './chord-line-view.html',
  styleUrl: './chord-line-view.scss',
})
export class ChordLineViewComponent {
  // ---- inputs -> signals internos (clave para que computed reaccione) ----
  private readonly _source = signal('');
  @Input({ required: true }) set source(v: string) {
    this._source.set(v ?? '');
  }
  get source() {
    return this._source();
  }

  private readonly _transpose = signal(0);
  @Input() set transpose(v: number) {
    this._transpose.set(Number(v ?? 0));
  }
  get transpose() {
    return this._transpose();
  }

  @Input() mode: 'auto' | 'flow' | 'chart' = 'auto';
  @Input() interactive = true;

  @Input() chordInfoResolver?: (chord: string) => ChordInfo | null;

  readonly hoveredChord = signal<string | null>(null);
  readonly selectedChord = signal<string | null>(null);

  // Shape carousel (por chord seleccionado)
  private readonly shapeIdx = signal(0);

  // ✅ ahora SÍ reacciona porque depende de signals
  readonly resolved = computed(() => this.transposeInlineChords(this._source(), this._transpose()));
  readonly built = computed(() => this.buildLayout(this.resolved()));
  readonly flow = computed(() => this.flowTokens(this.resolved()));

  readonly isProgressionOnly = computed(() => {
    const s = this.resolved();
    const text = s.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, '');
    return text.length === 0;
  });

  readonly chordInfo = computed(() => {
    const chord = this.selectedChord();
    if (!chord) return null;
    return this.chordInfoResolver ? this.chordInfoResolver(chord) : getChordInfo(chord);
  });

  constructor() {
    // ✅ resetear shape index cuando cambia el chord seleccionado
    effect(() => {
      const chord = this.selectedChord();
      // si querés resetear solo cuando hay chord:
      if (chord) this.shapeIdx.set(0);
    });
  }

  // --- Shape helpers usados por el HTML ---
  chordShapeIndex() {
    return this.shapeIdx();
  }
  shapeAt(shapes: GuitarShape[], idx: number): GuitarShape {
    if (!shapes?.length) return { name: 'N/A', frets: [-1, -1, -1, -1, -1, -1] };
    const safe = ((idx % shapes.length) + shapes.length) % shapes.length;
    return shapes[safe];
  }

  prevShape(total: number) {
    if (!total) return;
    this.shapeIdx.set(this.shapeIdx() - 1);
  }

  nextShape(total: number) {
    if (!total) return;
    this.shapeIdx.set(this.shapeIdx() + 1);
  }

  // --- core ---
  transposeInlineChords(source: string, step: number): string {
    return (source ?? '').replace(/\[([^\]]+)\]/g, (_m, raw) => {
      const chord = String(raw ?? '').trim();
      if (!chord) return '[]';
      return `[${transposeChordSymbol(chord, step)}]`;
    });
  }

  flowTokens(source: string): FlowToken[] {
    const out: FlowToken[] = [];
    const re = /\[([^\]]+)\]/g;

    let lastIdx = 0;
    let currentChord: string | null = null;

    let m: RegExpExecArray | null;
    while ((m = re.exec(source))) {
      const before = source.slice(lastIdx, m.index);
      if (before) out.push({ chord: currentChord, text: before });

      currentChord = String(m[1] ?? '').trim() || null;
      lastIdx = re.lastIndex;
    }

    const tail = source.slice(lastIdx);
    if (tail) out.push({ chord: currentChord, text: tail });

    if (out.length === 0) return [{ chord: null, text: source }];
    return out;
  }

  buildLayout(source: string): ChordLyricLayout {
    return toChordLyricLayout(source);
  }

  chPad(pos: number, idx: number, all: Array<{ pos: number }>) {
    const prev = idx === 0 ? 0 : all[idx - 1].pos;
    const delta = Math.max(0, pos - prev);
    return `${delta}`;
  }
}

// ---- transpose helpers ----
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

function transposeChordSymbol(symbol: string, step: number): string {
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

function parseChordRoot(chord: string): { root: string; rest: string } | null {
  const m = chord.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return null;
  const root = `${m[1]}${m[2] ?? ''}`;
  const rest = m[3] ?? '';
  return { root, rest };
}

function transposeRoot(root: string, step: number): string {
  const useFlats = root.includes('b');
  const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;

  let idx = (NOTES_SHARP as readonly string[]).indexOf(root);
  if (idx === -1) idx = (NOTES_FLAT as readonly string[]).indexOf(root);
  if (idx === -1) return root;

  const nextIdx = mod(idx + step, 12);
  return scale[nextIdx];
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}
