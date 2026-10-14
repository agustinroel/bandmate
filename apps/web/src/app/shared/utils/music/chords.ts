export type NoteName =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export const CHROMA_SHARP: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMA_FLAT: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function noteIndex(n: string): number {
  const iS = CHROMA_SHARP.indexOf(n as NoteName);
  if (iS !== -1) return iS;
  const iF = CHROMA_FLAT.indexOf(n as NoteName);
  return iF;
}

export function idxToNote(idx: number, preferFlats: boolean): NoteName {
  return (preferFlats ? CHROMA_FLAT : CHROMA_SHARP)[mod(idx, 12)];
}

export type ParsedChord = {
  raw: string;
  root: NoteName;
  quality: 'maj' | 'min' | 'dim' | 'aug' | 'sus2' | 'sus4' | '7' | 'maj7' | 'min7' | 'm7b5';
  intervals: number[]; // semitones from root
  bass?: NoteName; // slash bass if any
  preferFlats: boolean;
};

export function parseChord(raw: string): ParsedChord | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  const [mainRaw, bassRaw] = cleaned.split('/');

  const m = mainRaw.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return null;

  const root = `${m[1]}${m[2] ?? ''}` as NoteName;
  const rest = (m[3] ?? '').trim();
  const preferFlats = root.includes('b');

  // detect quality
  // order matters (maj7 before maj etc.)
  const q = rest.toLowerCase();

  let quality: ParsedChord['quality'] = 'maj';
  let intervals: number[] = [0, 4, 7];

  if (q.startsWith('maj7') || q.startsWith('ma7')) {
    quality = 'maj7';
    intervals = [0, 4, 7, 11];
  } else if (q.startsWith('m7b5') || q.startsWith('ø')) {
    quality = 'm7b5';
    intervals = [0, 3, 6, 10];
  } else if (q.startsWith('m7') || q.startsWith('min7')) {
    quality = 'min7';
    intervals = [0, 3, 7, 10];
  } else if (q.startsWith('7')) {
    quality = '7';
    intervals = [0, 4, 7, 10];
  } else if (q.startsWith('dim') || q.startsWith('o')) {
    quality = 'dim';
    intervals = [0, 3, 6];
  } else if (q.startsWith('aug') || q.startsWith('+')) {
    quality = 'aug';
    intervals = [0, 4, 8];
  } else if (q.startsWith('sus2')) {
    quality = 'sus2';
    intervals = [0, 2, 7];
  } else if (q.startsWith('sus4') || q.startsWith('sus')) {
    quality = 'sus4';
    intervals = [0, 5, 7];
  } else if (q.startsWith('m') || q.startsWith('min')) {
    quality = 'min';
    intervals = [0, 3, 7];
  } else {
    quality = 'maj';
    intervals = [0, 4, 7];
  }

  let bass: NoteName | undefined;
  if (bassRaw) {
    const b = bassRaw.trim();
    const bm = b.match(/^([A-G])([#b]?)/);
    if (bm) bass = `${bm[1]}${bm[2] ?? ''}` as NoteName;
  }

  return { raw: cleaned, root, quality, intervals, bass, preferFlats };
}

export function chordNotes(chord: ParsedChord): NoteName[] {
  const rootIdx = noteIndex(chord.root);
  if (rootIdx < 0) return [chord.root];

  const notes = chord.intervals.map((iv) => idxToNote(rootIdx + iv, chord.preferFlats));

  // include bass if slash and not already in notes
  if (chord.bass && !notes.includes(chord.bass)) notes.unshift(chord.bass);

  return notes;
}

// -------------------------
// Transposition & Harmonic Enharmonics
// -------------------------

export const FLAT_KEYS = new Set([
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
  'Cb',
  'Dm',
  'Gm',
  'Cm',
  'Fm',
  'Bbm',
  'Ebm',
]);

export const SHARP_KEYS = new Set([
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'Em',
  'Bm',
  'F#m',
  'C#m',
  'G#m',
  'D#m',
]);

export function isFlatKey(key: string): boolean {
  if (!key) return false;
  const clean = key.trim();
  if (FLAT_KEYS.has(clean)) return true;
  if (clean.includes('b')) return true;
  return false;
}

export function transposeRoot(
  root: string,
  step: number,
  targetKeyOrPreferFlats?: string | boolean,
): string {
  let preferFlats = false;

  if (typeof targetKeyOrPreferFlats === 'boolean') {
    preferFlats = targetKeyOrPreferFlats;
  } else if (typeof targetKeyOrPreferFlats === 'string' && targetKeyOrPreferFlats.trim()) {
    preferFlats = isFlatKey(targetKeyOrPreferFlats);
  } else {
    preferFlats = root.includes('b');
  }

  let idx = (CHROMA_SHARP as readonly string[]).indexOf(root as NoteName);
  if (idx === -1) idx = (CHROMA_FLAT as readonly string[]).indexOf(root as NoteName);
  if (idx === -1) return root;

  const nextIdx = mod(idx + step, 12);

  // Invariant 1: Prohibido mostrar A# en contextos tonales donde corresponde Bb.
  // When target key is specified and is a flat key, enforce flat scale:
  if (typeof targetKeyOrPreferFlats === 'string' && targetKeyOrPreferFlats.trim()) {
    if (isFlatKey(targetKeyOrPreferFlats)) {
      return CHROMA_FLAT[nextIdx];
    }
  }

  // If explicit preferFlats is requested:
  if (preferFlats) {
    return CHROMA_FLAT[nextIdx];
  }

  // Next note is index 10 (Bb vs A#):
  // Universally prefer Bb across contemporary chord notation unless explicitly in sharp keys (B, E, F#, C#m, G#m)
  if (nextIdx === 10) {
    if (
      typeof targetKeyOrPreferFlats === 'string' &&
      SHARP_KEYS.has(targetKeyOrPreferFlats.trim())
    ) {
      return 'A#';
    }
    return 'Bb';
  }

  // Next note is index 3 (Eb vs D#):
  // Default to Eb unless explicitly in sharp keys
  if (nextIdx === 3) {
    if (
      typeof targetKeyOrPreferFlats === 'string' &&
      SHARP_KEYS.has(targetKeyOrPreferFlats.trim())
    ) {
      return 'D#';
    }
    return 'Eb';
  }

  // Next note is index 8 (Ab vs G#):
  if (nextIdx === 8) {
    if (
      typeof targetKeyOrPreferFlats === 'string' &&
      SHARP_KEYS.has(targetKeyOrPreferFlats.trim())
    ) {
      return 'G#';
    }
    return 'Ab';
  }

  return (preferFlats ? CHROMA_FLAT : CHROMA_SHARP)[nextIdx];
}

export function parseChordRoot(chord: string): { root: string; rest: string } | null {
  const m = chord.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return null;
  const root = `${m[1]}${m[2] ?? ''}`;
  const rest = m[3] ?? '';
  return { root, rest };
}

export function transposeKey(key: string, step: number): string {
  if (!key) return key;
  const isMinor = key.endsWith('m') && !key.endsWith('maj');
  const root = isMinor ? key.slice(0, -1) : key;
  const parsed = parseChordRoot(root);
  if (!parsed) return key;

  const originalIsFlat = isFlatKey(key);
  const nextRoot = transposeRoot(parsed.root, step, originalIsFlat);
  return `${nextRoot}${isMinor ? 'm' : ''}`;
}

export function transposeChordSymbol(
  symbol: string,
  step: number,
  targetKeyOrPreferFlats?: string | boolean,
): string {
  const parts = symbol.split('/');
  const main = parts[0];
  const bass = parts[1];

  const mainParsed = parseChordRoot(main);
  if (!mainParsed) return symbol;

  const mainNext =
    transposeRoot(mainParsed.root, step, targetKeyOrPreferFlats) + mainParsed.rest;

  if (!bass) return mainNext;

  const bassParsed = parseChordRoot(bass);
  if (!bassParsed) return `${mainNext}/${bass}`;

  const bassNext =
    transposeRoot(bassParsed.root, step, targetKeyOrPreferFlats) + bassParsed.rest;
  return `${mainNext}/${bassNext}`;
}
