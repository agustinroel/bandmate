export type GuitarShape = {
  name: string;
  frets: number[]; // [E A D G B e] -1 muted, 0 open, >0 fret
};

const SHAPES: Record<string, GuitarShape[]> = {
  // ----------------
  // OPEN MAJ / MIN
  // ----------------
  C: [{ name: 'Open', frets: [-1, 3, 2, 0, 1, 0] }],
  Cm: [
    { name: 'Barre (3rd)', frets: [-1, 3, 5, 5, 4, 3] },
    { name: 'Barre (8th)', frets: [8, 10, 10, 8, 8, 8] },
  ],
  D: [{ name: 'Open', frets: [-1, -1, 0, 2, 3, 2] }],
  Dm: [{ name: 'Open', frets: [-1, -1, 0, 2, 3, 1] }],
  E: [{ name: 'Open', frets: [0, 2, 2, 1, 0, 0] }],
  Em: [{ name: 'Open', frets: [0, 2, 2, 0, 0, 0] }],
  F: [{ name: 'Barre (1st)', frets: [1, 3, 3, 2, 1, 1] }],
  Fm: [{ name: 'Barre (1st)', frets: [1, 3, 3, 1, 1, 1] }],
  G: [{ name: 'Open', frets: [3, 2, 0, 0, 0, 3] }],
  Gm: [{ name: 'Barre (3rd)', frets: [3, 5, 5, 3, 3, 3] }],
  A: [{ name: 'Open', frets: [-1, 0, 2, 2, 2, 0] }],
  Am: [{ name: 'Open', frets: [-1, 0, 2, 2, 1, 0] }],
  B: [{ name: 'Barre (2nd)', frets: [2, 2, 4, 4, 4, 2] }],
  Bm: [{ name: 'Barre (2nd)', frets: [2, 2, 4, 4, 3, 2] }],

  // ----------------
  // SHARPS / FLATS MAJ / MIN (barres)
  // ----------------
  'C#': [{ name: 'Barre (4th)', frets: [-1, 4, 6, 6, 6, 4] }],
  'C#m': [{ name: 'Barre (4th)', frets: [-1, 4, 6, 6, 5, 4] }],
  Db: [{ name: 'Barre (4th)', frets: [-1, 4, 6, 6, 6, 4] }],
  Dbm: [{ name: 'Barre (4th)', frets: [-1, 4, 6, 6, 5, 4] }],

  'D#': [{ name: 'Barre (6th)', frets: [-1, 6, 8, 8, 8, 6] }],
  'D#m': [{ name: 'Barre (6th)', frets: [-1, 6, 8, 8, 7, 6] }],
  Eb: [{ name: 'Barre (6th)', frets: [-1, 6, 8, 8, 8, 6] }],
  Ebm: [{ name: 'Barre (6th)', frets: [-1, 6, 8, 8, 7, 6] }],

  'F#': [{ name: 'Barre (2nd)', frets: [2, 4, 4, 3, 2, 2] }],
  'F#m': [{ name: 'Barre (2nd)', frets: [2, 4, 4, 2, 2, 2] }],
  Gb: [{ name: 'Barre (2nd)', frets: [2, 4, 4, 3, 2, 2] }],
  Gbm: [{ name: 'Barre (2nd)', frets: [2, 4, 4, 2, 2, 2] }],

  'G#': [{ name: 'Barre (4th)', frets: [4, 6, 6, 5, 4, 4] }],
  'G#m': [{ name: 'Barre (4th)', frets: [4, 6, 6, 4, 4, 4] }],
  Ab: [{ name: 'Barre (4th)', frets: [4, 6, 6, 5, 4, 4] }],
  Abm: [{ name: 'Barre (4th)', frets: [4, 6, 6, 4, 4, 4] }],

  'A#': [{ name: 'Barre (1st)', frets: [-1, 1, 3, 3, 3, 1] }],
  'A#m': [{ name: 'Barre (1st)', frets: [-1, 1, 3, 3, 2, 1] }],
  Bb: [{ name: 'Barre (1st)', frets: [-1, 1, 3, 3, 3, 1] }],
  Bbm: [{ name: 'Barre (1st)', frets: [-1, 1, 3, 3, 2, 1] }],

  // ----------------
  // DOMINANT 7 (7)
  // ----------------
  C7: [{ name: 'Open-ish', frets: [-1, 3, 2, 3, 1, 0] }],
  D7: [{ name: 'Open', frets: [-1, -1, 0, 2, 1, 2] }],
  E7: [{ name: 'Open', frets: [0, 2, 0, 1, 0, 0] }],
  F7: [{ name: 'Barre (1st)', frets: [1, 3, 1, 2, 1, 1] }],
  G7: [{ name: 'Open', frets: [3, 2, 0, 0, 0, 1] }],
  A7: [{ name: 'Open', frets: [-1, 0, 2, 0, 2, 0] }],
  B7: [{ name: 'Open', frets: [-1, 2, 1, 2, 0, 2] }],

  'C#7': [{ name: 'Barre (4th)', frets: [-1, 4, 6, 4, 6, 4] }],
  Db7: [{ name: 'Barre (4th)', frets: [-1, 4, 6, 4, 6, 4] }],
  'D#7': [{ name: 'Barre (6th)', frets: [-1, 6, 8, 6, 8, 6] }],
  Eb7: [{ name: 'Barre (6th)', frets: [-1, 6, 8, 6, 8, 6] }],
  'F#7': [{ name: 'Barre (2nd)', frets: [2, 4, 2, 3, 2, 2] }],
  Gb7: [{ name: 'Barre (2nd)', frets: [2, 4, 2, 3, 2, 2] }],
  'G#7': [{ name: 'Barre (4th)', frets: [4, 6, 4, 5, 4, 4] }],
  Ab7: [{ name: 'Barre (4th)', frets: [4, 6, 4, 5, 4, 4] }],
  'A#7': [{ name: 'Barre (1st)', frets: [-1, 1, 3, 1, 3, 1] }],
  Bb7: [{ name: 'Barre (1st)', frets: [-1, 1, 3, 1, 3, 1] }],

  // ----------------
  // MAJ7
  // ----------------
  Cmaj7: [{ name: 'Open', frets: [-1, 3, 2, 0, 0, 0] }],
  Dmaj7: [{ name: 'Open', frets: [-1, -1, 0, 2, 2, 2] }],
  Emaj7: [{ name: 'Open', frets: [0, 2, 1, 1, 0, 0] }],
  Fmaj7: [{ name: 'Open', frets: [-1, -1, 3, 2, 1, 0] }],
  Gmaj7: [{ name: 'Open', frets: [3, 2, 0, 0, 0, 2] }],
  Amaj7: [{ name: 'Open', frets: [-1, 0, 2, 1, 2, 0] }],
  Bmaj7: [{ name: 'Barre (2nd)', frets: [-1, 2, 4, 3, 4, 2] }],

  'C#maj7': [{ name: 'Barre (4th)', frets: [-1, 4, 6, 5, 6, 4] }],
  Dbmaj7: [{ name: 'Barre (4th)', frets: [-1, 4, 6, 5, 6, 4] }],
  'D#maj7': [{ name: 'Barre (6th)', frets: [-1, 6, 8, 7, 8, 6] }],
  Ebmaj7: [{ name: 'Barre (6th)', frets: [-1, 6, 8, 7, 8, 6] }],
  'F#maj7': [{ name: 'Barre (2nd)', frets: [2, 4, 3, 3, 2, 2] }],
  Gbmaj7: [{ name: 'Barre (2nd)', frets: [2, 4, 3, 3, 2, 2] }],
  'G#maj7': [{ name: 'Barre (4th)', frets: [4, 6, 5, 5, 4, 4] }],
  Abmaj7: [{ name: 'Barre (4th)', frets: [4, 6, 5, 5, 4, 4] }],
  'A#maj7': [{ name: 'Barre (1st)', frets: [-1, 1, 3, 2, 3, 1] }],
  Bbmaj7: [{ name: 'Barre (1st)', frets: [-1, 1, 3, 2, 3, 1] }],

  // ----------------
  // MIN7 (m7)
  // ----------------
  Cm7: [{ name: 'Barre (3rd)', frets: [-1, 3, 5, 3, 4, 3] }],
  Dm7: [{ name: 'Open', frets: [-1, -1, 0, 2, 1, 1] }],
  Em7: [{ name: 'Open', frets: [0, 2, 2, 0, 3, 0] }],
  Fm7: [{ name: 'Barre (1st)', frets: [1, 3, 1, 1, 1, 1] }],
  Gm7: [{ name: 'Barre (3rd)', frets: [3, 5, 3, 3, 3, 3] }],
  Am7: [{ name: 'Open', frets: [-1, 0, 2, 0, 1, 0] }],
  Bm7: [{ name: 'Barre (2nd)', frets: [2, 2, 4, 2, 3, 2] }],

  'C#m7': [{ name: 'Barre (4th)', frets: [-1, 4, 6, 4, 5, 4] }],
  Dbm7: [{ name: 'Barre (4th)', frets: [-1, 4, 6, 4, 5, 4] }],
  'D#m7': [{ name: 'Barre (6th)', frets: [-1, 6, 8, 6, 7, 6] }],
  Ebm7: [{ name: 'Barre (6th)', frets: [-1, 6, 8, 6, 7, 6] }],
  'F#m7': [{ name: 'Barre (2nd)', frets: [2, 4, 2, 2, 2, 2] }],
  Gbm7: [{ name: 'Barre (2nd)', frets: [2, 4, 2, 2, 2, 2] }],
  'G#m7': [{ name: 'Barre (4th)', frets: [4, 6, 4, 4, 4, 4] }],
  Abm7: [{ name: 'Barre (4th)', frets: [4, 6, 4, 4, 4, 4] }],
  'A#m7': [{ name: 'Barre (1st)', frets: [-1, 1, 3, 1, 2, 1] }],
  Bbm7: [{ name: 'Barre (1st)', frets: [-1, 1, 3, 1, 2, 1] }],

  // ----------------
  // DIM / m7b5 (very common in jazz/pop)
  // ----------------
  Cdim: [{ name: 'Shape', frets: [-1, 3, 4, 2, 4, 2] }],
  'C#m7b5': [{ name: 'Shape', frets: [-1, 4, 5, 4, 5, -1] }],
  Dm7b5: [{ name: 'Shape', frets: [-1, -1, 0, 1, 1, 1] }], // easy voicing
  Bdim: [{ name: 'Shape', frets: [-1, 2, 3, 1, 3, 1] }],

  // Aliases you might use:
  Cm7b5: [{ name: 'Alt', frets: [-1, 3, 4, 3, 4, -1] }],
};

function normalizeChordSymbol(symbol: string): string {
  const s = symbol.trim().replace(/\s+/g, '');
  const main = s.split('/')[0];

  return main
    .replace(/min/i, 'm')
    .replace(/maj7/i, 'maj7')
    .replace(/ma7/i, 'maj7')
    .replace(/Δ7/g, 'maj7')
    .replace(/-7/g, 'm7')
    .replace(/min7/i, 'm7')
    .replace(/m7b5/i, 'm7b5')
    .replace(/ø/g, 'm7b5')
    .replace(/dim/i, 'dim');
}

export function getGuitarShapes(symbol: string): GuitarShape[] {
  const key = normalizeChordSymbol(symbol);

  // Fallbacks MVP: add9/add6 -> triad; 9 -> 7; 13 -> 7 (simplifications)
  const direct = SHAPES[key];
  if (direct) return direct;

  const simplified = key
    .replace(/add\d+$/i, '')
    .replace(/(maj7|m7|7)?(9|11|13)$/i, '$1') // e.g. A9 -> A7, Am11 -> Am7
    .replace(/sus4$/i, 'sus4'); // keep as-is, maybe later add shapes

  return SHAPES[simplified] ?? SHAPES[simplified.replace(/(maj7|m7|7)$/i, '')] ?? [];
}
