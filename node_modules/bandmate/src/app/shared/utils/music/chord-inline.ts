export type ChordLyricLines = {
  chords: string; // e.g. "Am     G     F"
  lyrics: string; // e.g. "Hello World "
};

const CHORD_RE = /\[([^\]]+)\]/g;

/**
 * Converts inline format like:
 *   "[Am]Hello [G]World [F]"
 * into two aligned lines:
 *   chords: "Am     G     F"
 *   lyrics: "Hello World "
 *
 * Alignment is character-based, so preview should be monospace.
 */
export function toChordLyricLines(input: string): ChordLyricLines {
  if (!input) return { chords: '', lyrics: '' };

  let lyrics = '';
  const chordPlacements: Array<{ pos: number; chord: string }> = [];

  let lastIndex = 0;

  for (const match of input.matchAll(CHORD_RE)) {
    const index = match.index ?? 0;
    const chord = (match[1] ?? '').trim();

    // add lyric text between previous token and this chord
    const chunk = input.slice(lastIndex, index);
    lyrics += chunk;

    // chord should be placed at current lyric length
    chordPlacements.push({ pos: lyrics.length, chord });

    lastIndex = index + match[0].length;
  }

  // remaining lyric text after last chord
  lyrics += input.slice(lastIndex);

  // build chords line with spaces
  const chars: string[] = Array(lyrics.length).fill(' ');

  for (const { pos, chord } of chordPlacements) {
    // ensure enough space
    while (chars.length < pos + chord.length) chars.push(' ');

    for (let i = 0; i < chord.length; i++) {
      chars[pos + i] = chord[i];
    }
  }

  return { chords: chars.join(''), lyrics };
}

export type ChordPlacement = { chord: string; pos: number };
export type ChordLyricLayout = {
  lyrics: string;
  chordsLine: string; // útil como fallback/debug
  chords: ChordPlacement[];
};

export function toChordLyricLayout(input: string): ChordLyricLayout {
  const { chords, lyrics } = toChordLyricLines(input);

  // reconstruimos placements de manera estable (posiciones en lyrics)
  const placements: ChordPlacement[] = [];
  if (!input) return { lyrics: '', chordsLine: '', chords: [] };

  const CHORD_RE = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let lyricsAcc = '';

  for (const match of input.matchAll(CHORD_RE)) {
    const idx = match.index ?? 0;
    const chord = (match[1] ?? '').trim();

    const chunk = input.slice(lastIndex, idx);
    lyricsAcc += chunk;

    placements.push({ chord, pos: lyricsAcc.length });

    lastIndex = idx + match[0].length;
  }
  lyricsAcc += input.slice(lastIndex);

  return {
    lyrics,
    chordsLine: chords,
    chords: placements,
  };
}
