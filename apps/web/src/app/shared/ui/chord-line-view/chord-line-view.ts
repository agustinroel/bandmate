import { Component, Input, computed, effect, signal, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ChordLyricLayout, toChordLyricLayout } from '../../utils/music/chord-inline';
import { getChordInfo, ChordInfo } from '../../utils/chords/chord-info';
import { GuitarChordDiagramComponent } from '../guitar-chord-diagram/guitar-chord-diagram';
import type { GuitarShape } from '../../utils/music/guitar-shapes';
import { transposeChordSymbol } from '../../utils/music/chords';
import { AudioService } from '../../data-access/audio/audio.service';

type FlowToken = { chord?: string | null; text: string };

@Component({
  selector: 'bm-chord-line-view',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, GuitarChordDiagramComponent],
  templateUrl: './chord-line-view.html',
  styleUrl: './chord-line-view.scss',
})
export class ChordLineViewComponent {
  private readonly audio = inject(AudioService);
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

  playShape(shape: GuitarShape) {
    this.audio.playShape(shape);
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
// Removed: using shared/utils/music/chords logic

