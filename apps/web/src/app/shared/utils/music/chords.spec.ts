import { describe, it, expect } from 'vitest';
import {
  transposeRoot,
  transposeChordSymbol,
  transposeKey,
  isFlatKey,
} from './chords';

describe('Musical Domain Invariants - Chords & Transposition', () => {
  describe('Invariant 1: Enharmonic Coherence & Key Signatures', () => {
    it('must forbid A# and produce Bb in neutral or flat tonal contexts', () => {
      // Transposing A by +1 without key defaults to Bb (never A#)
      expect(transposeRoot('A', 1)).toBe('Bb');
      expect(transposeChordSymbol('Am', 1)).toBe('Bbm');
    });

    it('must strictly respect flat key contexts (e.g., F major, Bb, Dm)', () => {
      expect(isFlatKey('F')).toBe(true);
      expect(isFlatKey('Dm')).toBe(true);
      expect(isFlatKey('Bb')).toBe(true);

      // In F major, step +1 from A must be Bb
      expect(transposeChordSymbol('A7', 1, 'F')).toBe('Bb7');

      // In F major, step +1 from C must be Db
      expect(transposeChordSymbol('C', 1, 'F')).toBe('Db');
    });

    it('must respect sharp key contexts when explicitly required (e.g., B, E, F#)', () => {
      expect(isFlatKey('B')).toBe(false);
      // In B major, step +1 from A can be A#
      expect(transposeChordSymbol('A', 1, 'B')).toBe('A#');
    });

    it('must correctly transpose slash chords preserving harmonic context', () => {
      expect(transposeChordSymbol('C/G', 2)).toBe('D/A');
      expect(transposeChordSymbol('Am/G', 1, 'F')).toBe('Bbm/Ab');
    });

    it('must correctly transpose song keys', () => {
      expect(transposeKey('C', 2)).toBe('D');
      expect(transposeKey('F', 1)).toBe('Gb');
      expect(transposeKey('Am', 2)).toBe('Bm');
      expect(transposeKey('Dm', 1)).toBe('Ebm');
    });
  });
});
