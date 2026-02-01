import type { CreateSongDto } from '@bandmate/shared';

// Helper to simulate IDs if DTO requires them (or we can cast to any if DTO is loose but interface is strict)
const id = () => Math.random().toString(36).slice(2);

export const SEED_SONGS: CreateSongDto[] = [
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    key: 'F#m',
    bpm: 87,
    durationSec: 258,
    sections: [
      {
        id: id(),
        type: 'verse',
        name: 'Verse 1',
        order: 1,
        lines: [
          { id: id(), kind: 'lyrics', source: '[Em7]Today is [G]gonna be the day' },
          { id: id(), kind: 'lyrics', source: 'That they\'re [Dsus4]gonna throw it back to [A7sus4]you' },
          { id: id(), kind: 'lyrics', source: '[Em7]By now you [G]should\'ve somehow' },
          { id: id(), kind: 'lyrics', source: 'Re[Dsus4]alized what you gotta [A7sus4]do' },
          { id: id(), kind: 'lyrics', source: '[Em7]I don\'t believe that [G]anybody' },
          { id: id(), kind: 'lyrics', source: '[Dsus4]Feels the way I [A7sus4]do about you [Cadd9]now [Dsus4] [A7sus4]' },
        ],
      },
      {
        id: id(),
        type: 'chorus',
        name: 'Chorus',
        order: 2,
        lines: [
          { id: id(), kind: 'lyrics', source: 'Because [Cadd9]maybe [Em7] [G]' },
          { id: id(), kind: 'lyrics', source: 'You\'re [Em7]gonna be the one that [Cadd9]saves me [Em7] [G]' },
          { id: id(), kind: 'lyrics', source: 'And [Cadd9]after [Em7]all [G]' },
          { id: id(), kind: 'lyrics', source: 'You\'re my [Em7]wonderwall [Cadd9] [Em7] [G]' },
        ],
      },
    ],
  },
  {
    title: 'Let It Be',
    artist: 'The Beatles',
    key: 'C',
    bpm: 72,
    durationSec: 243,
    sections: [
      {
        id: id(),
        type: 'verse',
        name: 'Verse',
        order: 1,
        lines: [
          { id: id(), kind: 'lyrics', source: '[C]When I find myself in [G]times of trouble' },
          { id: id(), kind: 'lyrics', source: '[Am]Mother Mary [F]comes to me' },
          { id: id(), kind: 'lyrics', source: '[C]Speaking words of [G]wisdom, let it [F]be [C]' },
        ],
      },
      {
        id: id(),
        type: 'chorus',
        name: 'Chorus',
        order: 2,
        lines: [
          { id: id(), kind: 'lyrics', source: 'Let it [Am]be, let it [G]be, let it [F]be, let it [C]be' },
          { id: id(), kind: 'lyrics', source: 'Whisper words of [G]wisdom, let it [F]be [C]' },
        ],
      },
    ],
  },
  {
    title: 'Creep',
    artist: 'Radiohead',
    key: 'G',
    bpm: 92,
    durationSec: 239,
    sections: [
      {
        id: id(),
        type: 'verse',
        name: 'Verse',
        order: 1,
        lines: [
          { id: id(), kind: 'lyrics', source: '[G]When you were here before' },
          { id: id(), kind: 'lyrics', source: '[B]Couldn\'t look you in the eye' },
          { id: id(), kind: 'lyrics', source: '[C]You\'re just like an angel' },
          { id: id(), kind: 'lyrics', source: '[Cm]Your skin makes me cry' },
        ],
      },
      {
        id: id(),
        type: 'chorus',
        name: 'Chorus',
        order: 2,
        lines: [
          { id: id(), kind: 'lyrics', source: '[G]But I\'m a creep, [B]I\'m a weirdo' },
          { id: id(), kind: 'lyrics', source: '[C]What the hell am I doing here?' },
          { id: id(), kind: 'lyrics', source: '[Cm]I don\'t belong here' },
        ],
      },
    ],
  },
];
