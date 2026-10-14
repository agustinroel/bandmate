import { SongSection, SongSectionType } from './song.model.js';
export interface ParsedSmartSong {
    title: string;
    artist: string;
    key?: string;
    capo?: number;
    bpm?: number;
    timeSignature?: string;
    sections: SongSection[];
    rawChordPro: string;
}
/**
 * Checks if a string line is composed mostly of chord tokens and spaces
 */
export declare function isChordLine(line: string): boolean;
/**
 * Normalizes section names to standard Bandmate section types
 */
export declare function detectSectionType(header: string): {
    type: SongSectionType;
    name: string;
};
/**
 * Merges a chord line and a lyrics line into a single inline "[Chord]Lyrics" string
 */
export declare function mergeChordAndLyricsLine(chordLine: string, lyricsLine: string): string;
/**
 * Attempts to parse title and artist from a file name like:
 * "The Beatles - Let It Be.cho", "Hotel California - Eagles.pro", or "Creep.txt"
 */
export declare function parseFilenameMetadata(filename: string): {
    title: string;
    artist: string;
};
/**
 * Universal Smart Parser for ChordPro, Ultimate Guitar, CifraClub, and Plain Text tabs
 */
export declare function parseSmartTab(rawInput: string, fallbackFilename?: string): ParsedSmartSong;
//# sourceMappingURL=smart-tab-parser.d.ts.map