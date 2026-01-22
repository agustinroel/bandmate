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

const CHROMA_SHARP: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMA_FLAT: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function noteIndex(n: string): number {
  const iS = CHROMA_SHARP.indexOf(n as NoteName);
  if (iS !== -1) return iS;
  const iF = CHROMA_FLAT.indexOf(n as NoteName);
  return iF;
}

function idxToNote(idx: number, preferFlats: boolean): NoteName {
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
