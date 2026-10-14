const CHORD_TOKEN_REGEX = /^[A-G](?:[#b])?(?:maj|min|m|M|dim|aug|sus|add|7|9|11|13|6|maj7|min7|m7|m7b5|7b5|7#9|7b9|\+|-|ø|o)*(?:\/[A-G](?:[#b])?)?$/;
/**
 * Checks if a string line is composed mostly of chord tokens and spaces
 */
export function isChordLine(line) {
    const trimmed = line.trim();
    if (!trimmed)
        return false;
    // Split line by whitespace tokens
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (tokens.length === 0)
        return false;
    let chordMatchCount = 0;
    for (const token of tokens) {
        // Strip common punctuation around chord tokens
        const cleanToken = token.replace(/^[(\[{]|[)\]},.:;]$/g, '');
        if (CHORD_TOKEN_REGEX.test(cleanToken)) {
            chordMatchCount++;
        }
    }
    // If at least 70% of tokens are valid chords, consider it a chord line
    return chordMatchCount / tokens.length >= 0.7;
}
/**
 * Normalizes section names to standard Bandmate section types
 */
export function detectSectionType(header) {
    const clean = header.replace(/^[\[{(#*\s]+|[\]})#*\s:]+$/g, '').trim();
    const lower = clean.toLowerCase();
    if (lower.includes('verse') || lower.includes('verso') || lower.includes('estrofa')) {
        return { type: 'verse', name: clean };
    }
    if (lower.includes('chorus') || lower.includes('coro') || lower.includes('estribillo') || lower.includes('refrão')) {
        return { type: 'chorus', name: clean };
    }
    if (lower.includes('intro') || lower.includes('introducción')) {
        return { type: 'intro', name: clean };
    }
    if (lower.includes('bridge') || lower.includes('puente')) {
        return { type: 'bridge', name: clean };
    }
    if (lower.includes('outro') || lower.includes('final') || lower.includes('coda')) {
        return { type: 'outro', name: clean };
    }
    if (lower.includes('pre-chorus') || lower.includes('prechorus') || lower.includes('pre-coro')) {
        return { type: 'prechorus', name: clean };
    }
    if (lower.includes('solo') || lower.includes('riff') || lower.includes('instrumental')) {
        return { type: 'solo', name: clean };
    }
    return { type: 'other', name: clean || 'Section' };
}
/**
 * Merges a chord line and a lyrics line into a single inline "[Chord]Lyrics" string
 */
export function mergeChordAndLyricsLine(chordLine, lyricsLine) {
    if (!chordLine.trim())
        return lyricsLine;
    if (!lyricsLine.trim()) {
        // Only chords: convert each chord into "[Chord]"
        return chordLine.replace(/\S+/g, (match) => `[${match.trim()}]`);
    }
    // Find all chords with their character index in chordLine
    const regex = /\S+/g;
    let match;
    const placements = [];
    while ((match = regex.exec(chordLine)) !== null) {
        const chord = match[0].replace(/^[\[{(]|[\]})]$/g, '').trim();
        if (chord) {
            placements.push({ pos: match.index, chord });
        }
    }
    // Sort by position ascending
    placements.sort((a, b) => a.pos - b.pos);
    let result = '';
    let currentPos = 0;
    for (const { pos, chord } of placements) {
        if (pos >= currentPos) {
            result += lyricsLine.slice(currentPos, pos);
            result += `[${chord}]`;
            currentPos = pos;
        }
        else {
            // If chords were closer than word length, just append chord
            result += `[${chord}]`;
        }
    }
    // Append remaining lyrics
    if (currentPos < lyricsLine.length) {
        result += lyricsLine.slice(currentPos);
    }
    return result;
}
/**
 * Universal Smart Parser for ChordPro, Ultimate Guitar, CifraClub, and Plain Text tabs
 */
export function parseSmartTab(rawInput) {
    let content = rawInput;
    // 1. Clean Ultimate Guitar tags: [ch]Am[/ch] -> [Am], [tab] -> comments
    content = content.replace(/\[ch\](.*?)\[\/ch\]/gi, '[$1]');
    content = content.replace(/\[tab\]/gi, '\n{comment: Tablature}\n');
    content = content.replace(/\[\/tab\]/gi, '\n');
    // 2. Clean CifraClub HTML tags: <b class="cnt">Am</b> -> [Am], strip <pre>, <span>, etc.
    content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '[$1]');
    content = content.replace(/<\/?[^>]+(>|$)/g, ''); // strip remaining HTML
    let title = 'Untitled Song';
    let artist = 'Unknown Artist';
    let key;
    let capo;
    let bpm;
    let timeSignature;
    const lines = content.split(/\r?\n/);
    const sections = [];
    let currentSection = {
        id: `sec-${Date.now()}-1`,
        type: 'verse',
        name: 'Verse 1',
        order: 0,
        lines: [],
    };
    let i = 0;
    while (i < lines.length) {
        const rawLine = lines[i];
        const line = rawLine.trim();
        // Check for ChordPro directives: {directive: value}
        const directiveMatch = line.match(/^\{([a-zA-Z0-9_]+)(?::\s*(.*?))?\}$/);
        if (directiveMatch) {
            const directive = directiveMatch[1].toLowerCase();
            const val = (directiveMatch[2] || '').trim();
            if (directive === 'title' || directive === 't')
                title = val;
            else if (directive === 'artist' || directive === 'a')
                artist = val;
            else if (directive === 'key')
                key = val;
            else if (directive === 'capo')
                capo = parseInt(val, 10) || undefined;
            else if (directive === 'tempo' || directive === 'bpm')
                bpm = parseInt(val, 10) || undefined;
            else if (directive === 'time')
                timeSignature = val;
            else if (directive === 'soc' || directive === 'start_of_chorus') {
                if (currentSection.lines.length > 0)
                    sections.push(currentSection);
                currentSection = {
                    id: `sec-${Date.now()}-${sections.length + 1}`,
                    type: 'chorus',
                    name: 'Chorus',
                    order: sections.length,
                    lines: [],
                };
            }
            else if (directive === 'eoc' || directive === 'end_of_chorus') {
                if (currentSection.lines.length > 0)
                    sections.push(currentSection);
                currentSection = {
                    id: `sec-${Date.now()}-${sections.length + 1}`,
                    type: 'verse',
                    name: `Verse ${sections.length + 1}`,
                    order: sections.length,
                    lines: [],
                };
            }
            else if (directive === 'comment' || directive === 'c') {
                currentSection.lines.push({
                    id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    kind: 'comment',
                    text: val,
                });
            }
            i++;
            continue;
        }
        // Check for Section headers: e.g. [Chorus], Verse 1:, ## Bridge
        const isBracketHeader = /^\[([a-zA-Z0-9\s-_]+)\]$/.test(line) && !CHORD_TOKEN_REGEX.test(line.slice(1, -1));
        const isColonHeader = /^(intro|verse|chorus|bridge|outro|solo|estrofa|coro|estribillo|refrão|pre-chorus|prechorus)\s*\d*[:\s-]*$/i.test(line);
        if (isBracketHeader || isColonHeader) {
            if (currentSection.lines.length > 0) {
                sections.push(currentSection);
            }
            const { type, name } = detectSectionType(line);
            currentSection = {
                id: `sec-${Date.now()}-${sections.length + 1}`,
                type,
                name,
                order: sections.length,
                lines: [],
            };
            i++;
            continue;
        }
        // Check if line is a 2-line Chord/Lyrics pair
        if (isChordLine(rawLine)) {
            const nextRawLine = lines[i + 1];
            if (nextRawLine !== undefined && !isChordLine(nextRawLine) && nextRawLine.trim().length > 0 && !/^\{/.test(nextRawLine.trim())) {
                // Merge chord line and lyrics line
                const merged = mergeChordAndLyricsLine(rawLine, nextRawLine);
                currentSection.lines.push({
                    id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    kind: 'lyrics',
                    source: merged,
                });
                i += 2;
                continue;
            }
            else {
                // Standalone chord line (instrumental/intro)
                const chordsFormatted = rawLine.replace(/\S+/g, (match) => {
                    const c = match.trim().replace(/^[\[{(]|[\]})]$/g, '');
                    return `[${c}]`;
                });
                currentSection.lines.push({
                    id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    kind: 'lyrics',
                    source: chordsFormatted,
                });
                i++;
                continue;
            }
        }
        // Regular line (empty or pure lyrics / already inline chords)
        if (!line) {
            if (currentSection.lines.length > 0 && currentSection.lines[currentSection.lines.length - 1].kind !== 'blank') {
                currentSection.lines.push({
                    id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    kind: 'blank',
                });
            }
        }
        else {
            currentSection.lines.push({
                id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                kind: 'lyrics',
                source: line,
            });
        }
        i++;
    }
    if (currentSection.lines.length > 0) {
        sections.push(currentSection);
    }
    // Fallback if no sections were parsed
    if (sections.length === 0) {
        sections.push({
            id: `sec-${Date.now()}-1`,
            type: 'verse',
            name: 'Main Section',
            order: 0,
            lines: [{
                    id: `line-${Date.now()}-1`,
                    kind: 'lyrics',
                    source: content.trim(),
                }],
        });
    }
    // Generate clean ChordPro output
    const chordProLines = [
        `{title: ${title}}`,
        `{artist: ${artist}}`,
    ];
    if (key)
        chordProLines.push(`{key: ${key}}`);
    if (capo)
        chordProLines.push(`{capo: ${capo}}`);
    if (bpm)
        chordProLines.push(`{tempo: ${bpm}}`);
    chordProLines.push('');
    for (const sec of sections) {
        chordProLines.push(`{comment: ${sec.name || sec.type}}`);
        for (const l of sec.lines) {
            if (l.kind === 'lyrics')
                chordProLines.push(l.source || '');
            else if (l.kind === 'comment')
                chordProLines.push(`{c: ${l.text}}`);
            else if (l.kind === 'blank')
                chordProLines.push('');
        }
        chordProLines.push('');
    }
    return {
        title,
        artist,
        key,
        capo,
        bpm,
        timeSignature,
        sections,
        rawChordPro: chordProLines.join('\n').trim(),
    };
}
