import { describe, it, expect } from 'vitest';
import { parseSmartTab, isChordLine, mergeChordAndLyricsLine } from '@bandmate/shared';

describe('smart-tab-parser', () => {
  it('detects chord lines accurately', () => {
    expect(isChordLine('Am  C  G  D')).toBe(true);
    expect(isChordLine('C#m7  F#7  Bmaj7')).toBe(true);
    expect(isChordLine('Yesterday, all my troubles seemed so far away')).toBe(false);
  });

  it('merges 2-line chords above lyrics correctly', () => {
    const chordLine = 'C          G          Am         F';
    const lyricLine = 'Let it be, let it be, let it be, let it be';
    const merged = mergeChordAndLyricsLine(chordLine, lyricLine);
    expect(merged).toContain('[C]Let it be');
    expect(merged).toContain('[G]');
    expect(merged).toContain('[Am]');
    expect(merged).toContain('[F]');
  });

  it('parses Ultimate Guitar pseudo-tags [ch]...[/ch]', () => {
    const rawUG = `[Verse 1]
[ch]Em7[/ch]Today is [ch]G[/ch]the day that they're 
[ch]D[/ch]gonna throw it back to [ch]A7[/ch]you`;

    const parsed = parseSmartTab(rawUG);
    expect(parsed.sections.length).toBeGreaterThan(0);
    const line = parsed.sections[0].lines[0];
    expect(line.source).toContain('[Em7]Today is [G]the day');
  });

  it('parses CifraClub HTML tags <b class="cnt">...</b>', () => {
    const rawCifra = `[Chorus]
<b class="cnt">C</b>Whisper words of wisdom, <b class="cnt">G</b>let it be`;

    const parsed = parseSmartTab(rawCifra);
    expect(parsed.sections.length).toBeGreaterThan(0);
    const line = parsed.sections[0].lines[0];
    expect(line.source).toBe('[C]Whisper words of wisdom, [G]let it be');
  });

  it('parses ChordPro directives and headers', () => {
    const rawChordPro = `{title: Stand By Me}
{artist: Ben E. King}
{key: A}
{capo: 2}
{tempo: 120}

{soc}
[A]When the night has come
[F#m]And the land is dark
{eoc}`;

    const parsed = parseSmartTab(rawChordPro);
    expect(parsed.title).toBe('Stand By Me');
    expect(parsed.artist).toBe('Ben E. King');
    expect(parsed.key).toBe('A');
    expect(parsed.capo).toBe(2);
    expect(parsed.bpm).toBe(120);
    expect(parsed.sections.some(s => s.type === 'chorus')).toBe(true);
  });

  it('infers title and artist from fallback filename if directives are absent', () => {
    const rawContent = `[Verse 1]\n[G]On a dark desert highway, [D]cool wind in my hair`;
    const parsed = parseSmartTab(rawContent, 'Eagles - Hotel California.cho');
    expect(parsed.artist).toBe('Eagles');
    expect(parsed.title).toBe('Hotel California');
  });

  it('parses CifraClub/LaCuerda metadata, inline [Intro] chords, and solfege chords', () => {
    const rawCifraClub = `Tom: G
Capotraste na 2ª casa

[Intro] Sol  Re  Mim  Do

[Primeira Parte]
Sol                Re
Ella durmió al calor de las masas
Mim                Do
Y yo desperté queriendo soñarla`;

    const parsed = parseSmartTab(rawCifraClub, 'Soda Stereo - De Musica Ligera.txt');
    expect(parsed.key).toBe('G');
    expect(parsed.capo).toBe(2);
    expect(parsed.sections.length).toBe(2);
    expect(parsed.sections[0].type).toBe('intro');
    expect(parsed.sections[0].lines[0].source).toContain('[G]');
    expect(parsed.sections[1].type).toBe('verse');
    expect(parsed.sections[1].lines[0].source).toContain('[G]Ella durmió');
  });
});
