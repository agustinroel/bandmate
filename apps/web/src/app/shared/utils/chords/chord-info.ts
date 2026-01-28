// chord-info.ts
import { getGuitarShapes, GuitarShape } from '../../../features/songs/utils/guitar-shapes';

export type ChordInfo = {
  raw: string;
  root: string;
  quality: string;
  notes: string[];
  shapes: GuitarShape[]; // <-- usamos TU tipo directamente
};

export function getChordInfo(raw: string): ChordInfo | null {
  const chord = (raw ?? '').trim();
  if (!chord) return null;

  const parsed = parseChord(chord);
  if (!parsed) return null;

  const { root, quality } = parsed;
  const notes = buildChordNotes(root, quality);

  // ✅ shapes vienen de tu diccionario + normalizaciones
  const shapes = getGuitarShapes(chord) ?? [];

  return {
    raw: chord,
    root,
    quality: qualityLabel(quality),
    notes,
    shapes,
  };
}

/* ---------------------------------------
   Parsing
--------------------------------------- */

type Quality = 'maj' | 'min' | 'dom7' | 'maj7' | 'min7' | 'sus2' | 'sus4' | 'dim' | 'aug' | 'm7b5';

function parseChord(raw: string): { root: string; quality: Quality } | null {
  // Root: A-G with optional #/b, rest: everything else
  const m = raw.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return null;

  const root = `${m[1]}${m[2] ?? ''}`;
  const rest = (m[3] ?? '').trim();

  const quality = parseQuality(rest);
  return { root, quality };
}

function parseQuality(rest: string): Quality {
  const r = rest.toLowerCase();

  // order matters
  if (r.includes('m7b5') || r.includes('ø')) return 'm7b5';
  if (r.includes('maj7') || r.includes('ma7') || r.includes('Δ7')) return 'maj7';
  if (r.includes('min7') || r.includes('m7') || r.includes('-7')) return 'min7';
  if (r === 'm' || r.startsWith('m') || r.includes('min')) return 'min';
  if (r.includes('sus2')) return 'sus2';
  if (r.includes('sus4') || r === 'sus') return 'sus4';
  if (r.includes('dim') || r.includes('°')) return 'dim';
  if (r.includes('aug') || r.includes('+')) return 'aug';
  if (r.includes('7')) return 'dom7';
  return 'maj';
}

function qualityLabel(q: Quality): string {
  switch (q) {
    case 'maj':
      return 'major';
    case 'min':
      return 'minor';
    case 'dom7':
      return 'dominant 7';
    case 'maj7':
      return 'major 7';
    case 'min7':
      return 'minor 7';
    case 'sus2':
      return 'sus2';
    case 'sus4':
      return 'sus4';
    case 'dim':
      return 'diminished';
    case 'aug':
      return 'augmented';
    case 'm7b5':
      return 'half-diminished (m7♭5)';
  }
}

/* ---------------------------------------
   Notes (tiny theory, stable)
--------------------------------------- */

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

function buildChordNotes(root: string, q: Quality): string[] {
  const idx = noteIndex(root);
  if (idx === -1) return [root];

  const triadMaj = [0, 4, 7];
  const triadMin = [0, 3, 7];

  let intervals: number[] = [];

  switch (q) {
    case 'maj':
      intervals = triadMaj;
      break;
    case 'min':
      intervals = triadMin;
      break;
    case 'dom7':
      intervals = [...triadMaj, 10];
      break;
    case 'maj7':
      intervals = [...triadMaj, 11];
      break;
    case 'min7':
      intervals = [...triadMin, 10];
      break;
    case 'sus2':
      intervals = [0, 2, 7];
      break;
    case 'sus4':
      intervals = [0, 5, 7];
      break;
    case 'dim':
      intervals = [0, 3, 6];
      break;
    case 'aug':
      intervals = [0, 4, 8];
      break;
    case 'm7b5':
      intervals = [0, 3, 6, 10];
      break;
  }

  const scale = root.includes('b') ? NOTES_FLAT : NOTES_SHARP;
  return intervals.map((s) => scale[mod(idx + s, 12)]);
}

function noteIndex(note: string): number {
  let idx = (NOTES_SHARP as readonly string[]).indexOf(note);
  if (idx !== -1) return idx;
  idx = (NOTES_FLAT as readonly string[]).indexOf(note);
  return idx;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}
