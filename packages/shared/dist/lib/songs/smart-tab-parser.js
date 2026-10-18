const CHORD_TOKEN_REGEX = /^[A-G](?:[#b])?(?:maj|min|m|M|dim|aug|sus|add|2|4|5|6|7|9|11|13|maj7|min7|m7|m7b5|7b5|7#9|7b9|\+|-|ø|o|\([0-9#b+-]+\))*(?:\/[A-G](?:[#b])?)?$/;
const SOLFEGE_MAP = {
    do: 'C',
    re: 'D',
    mi: 'E',
    fa: 'F',
    sol: 'G',
    la: 'A',
    si: 'B',
};
export function normalizeChordToken(token) {
    const clean = token.replace(/^[(\[{]|[)\]},.:;]$/g, '').trim();
    const solfegeMatch = clean.match(/^(do|re|mi|fa|sol|la|si)([#b]?.*)$/i);
    if (solfegeMatch) {
        const root = SOLFEGE_MAP[solfegeMatch[1].toLowerCase()];
        if (root) {
            return `${root}${solfegeMatch[2]}`;
        }
    }
    return clean;
}
/**
 * Checks if a string line is composed mostly of chord tokens and spaces
 */
export function isChordLine(line) {
    const trimmed = line.trim();
    if (!trimmed)
        return false;
    // Ignore guitar tab lines like e|---0---2---|
    if (/^[eBGDAE1-6]\|[-0-9hpb/\\~x\s|]+/.test(trimmed))
        return false;
    // Split line by whitespace tokens
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (tokens.length === 0)
        return false;
    let chordMatchCount = 0;
    for (const token of tokens) {
        const cleanToken = normalizeChordToken(token);
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
    if (lower.includes('verse') ||
        lower.includes('verso') ||
        lower.includes('estrofa') ||
        lower.includes('primeira parte') ||
        lower.includes('segunda parte') ||
        lower.includes('terceira parte') ||
        lower.includes('quarta parte') ||
        lower.includes('primera parte')) {
        return { type: 'verse', name: clean };
    }
    if (lower.includes('pre-chorus') || lower.includes('prechorus') || lower.includes('pre-coro') || lower.includes('pré-refrão') || lower.includes('pre-estribillo')) {
        return { type: 'prechorus', name: clean };
    }
    if (lower.includes('chorus') || lower.includes('coro') || lower.includes('estribillo') || lower.includes('refrão')) {
        return { type: 'chorus', name: clean };
    }
    if (lower.includes('intro') || lower.includes('introducción') || lower.includes('introdução')) {
        return { type: 'intro', name: clean };
    }
    if (lower.includes('bridge') || lower.includes('puente') || lower.includes('ponte')) {
        return { type: 'bridge', name: clean };
    }
    if (lower.includes('outro') || lower.includes('final') || lower.includes('coda')) {
        return { type: 'outro', name: clean };
    }
    if (lower.includes('solo') || lower.includes('riff') || lower.includes('instrumental') || lower.includes('interludio') || lower.includes('interlude')) {
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
        return chordLine.replace(/\S+/g, (match) => `[${normalizeChordToken(match.trim())}]`);
    }
    // Find all chords with their character index in chordLine
    const regex = /\S+/g;
    let match;
    const placements = [];
    while ((match = regex.exec(chordLine)) !== null) {
        const chord = normalizeChordToken(match[0]);
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
 * Attempts to parse title and artist from a file name like:
 * "The Beatles - Let It Be.cho", "Hotel California - Eagles.pro", or "Creep.txt"
 */
export function parseFilenameMetadata(filename) {
    // Strip extension (.cho, .pro, .chopro, .txt, .crd, etc.)
    const cleanName = filename.replace(/\.[a-zA-Z0-9]+$/i, '').trim();
    if (cleanName.includes(' - ')) {
        const parts = cleanName.split(' - ').map((p) => p.trim());
        if (parts.length >= 2) {
            return {
                artist: parts[0],
                title: parts.slice(1).join(' - '),
            };
        }
    }
    return {
        title: cleanName || 'Untitled Song',
        artist: 'Unknown Artist',
    };
}
/**
 * Universal Smart Parser for ChordPro, Ultimate Guitar, CifraClub, LaCuerda, and Plain Text tabs
 */
export function parseSmartTab(rawInput, fallbackFilename) {
    let content = rawInput;
    // 1. Clean Ultimate Guitar tags: [ch]Am[/ch] -> [Am], [tab] -> comments
    content = content.replace(/\[ch\](.*?)\[\/ch\]/gi, '[$1]');
    content = content.replace(/\[tab\]/gi, '\n{comment: Tablature}\n');
    content = content.replace(/\[\/tab\]/gi, '\n');
    // 2. Clean CifraClub & LaCuerda HTML tags: strip <span class="tablatura"> ASCII blocks
    content = content
        .replace(/<span[^>]*class="[^"]*tablatura[^"]*"[^>]*>[\s\S]*?<\/span>\s*<\/span>/gi, '')
        .replace(/<span[^>]*class="[^"]*tablatura[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<\/a>\s*-\s*<a[^>]*>/gi, ' ')
        .replace(/<\/b>\s*-\s*<b[^>]*>/gi, ' ');
    content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '$1');
    content = content.replace(/<\/?[^>]+(>|$)/g, ''); // strip remaining HTML
    let title = 'Untitled Song';
    let artist = 'Unknown Artist';
    if (fallbackFilename) {
        const meta = parseFilenameMetadata(fallbackFilename);
        title = meta.title;
        artist = meta.artist;
    }
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
    // Heuristic for Plain Text title/artist headers:
    // e.g.
    // Line 0: "Stand By Me"
    // Line 1: "Ben E. King"
    // Line 2: "" (empty)
    const isMetaLine = (str) => /^(?:tom|tono|key|tonalidad|capo|capotraste|cejilla|bpm|tempo|tuning|afina[cç][aã]o)\b/i.test(str);
    if (lines.length > 3 && !lines[0].startsWith('{') && !lines[0].startsWith('[')) {
        const l0 = lines[0].trim();
        const l1 = lines[1].trim();
        const l2 = lines[2].trim();
        if (l0 && l1 && !l2 && !isChordLine(l0) && !isChordLine(l1) && !isMetaLine(l0) && !isMetaLine(l1)) {
            if (title === 'Untitled Song')
                title = l0;
            if (artist === 'Unknown Artist')
                artist = l1;
            i = 3;
        }
    }
    while (i < lines.length) {
        const rawLine = lines[i];
        const line = rawLine.trim();
        // Skip ASCII guitar tablature lines (e.g. e|---0---2---|)
        if (/^[eBGDAE1-6]\s*\|[-0-9hpb/\\~x\s|]+/i.test(line)) {
            i++;
            continue;
        }
        // Check for CifraClub / LaCuerda / UG metadata lines: "Tom: G", "Tono: Am", "Key: C", "Capotraste na 2ª casa"
        const keyMetaMatch = line.match(/^(?:tom|tono|key|tonalidad)\s*[:=-]\s*([A-G][#b]?m?)/i);
        if (keyMetaMatch) {
            key = keyMetaMatch[1];
            i++;
            continue;
        }
        const capoMetaMatch = line.match(/^(?:capo|capotraste|cejilla).*?(\d+)/i);
        if (capoMetaMatch) {
            capo = parseInt(capoMetaMatch[1], 10) || undefined;
            i++;
            continue;
        }
        const bpmMetaMatch = line.match(/^(?:bpm|tempo)\s*[:=-]\s*(\d+)/i);
        if (bpmMetaMatch) {
            bpm = parseInt(bpmMetaMatch[1], 10) || undefined;
            i++;
            continue;
        }
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
        // Check for CifraClub inline header + chords: e.g. "[Intro] G  D  Em  C"
        const bracketWithChordsMatch = line.match(/^\[([a-zA-Z0-9\s-_ªºáéíóúãõç]+)\]\s+(.+)$/i);
        if (bracketWithChordsMatch &&
            !CHORD_TOKEN_REGEX.test(bracketWithChordsMatch[1].trim()) &&
            isChordLine(bracketWithChordsMatch[2])) {
            if (currentSection.lines.length > 0) {
                sections.push(currentSection);
            }
            const { type, name } = detectSectionType(bracketWithChordsMatch[1]);
            const chordsFormatted = bracketWithChordsMatch[2].replace(/\S+/g, (match) => {
                const c = normalizeChordToken(match);
                return `[${c}]`;
            });
            currentSection = {
                id: `sec-${Date.now()}-${sections.length + 1}`,
                type,
                name,
                order: sections.length,
                lines: [
                    {
                        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        kind: 'lyrics',
                        source: chordsFormatted,
                    },
                ],
            };
            i++;
            continue;
        }
        // Check for Section headers: e.g. [Chorus], [Primeira Parte], Verse 1:, ## Bridge
        const isBracketHeader = /^\[([a-zA-Z0-9\s-_ªºáéíóúãõç]+)\]$/.test(line) &&
            !CHORD_TOKEN_REGEX.test(normalizeChordToken(line.slice(1, -1)));
        const isColonHeader = /^(intro|introducción|introdução|verse|verso|estrofa|primeira parte|segunda parte|terceira parte|primera parte|chorus|coro|estribillo|refrão|pré-refrão|bridge|puente|ponte|outro|final|coda|solo|riff|interludio)\s*\d*[:\s-]*$/i.test(line);
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
            if (nextRawLine !== undefined &&
                !isChordLine(nextRawLine) &&
                nextRawLine.trim().length > 0 &&
                !/^\{/.test(nextRawLine.trim()) &&
                !/^\[([a-zA-Z0-9\s-_ªºáéíóúãõç]+)\]/.test(nextRawLine.trim())) {
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
                    const c = normalizeChordToken(match);
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
    if (title === 'Untitled Song' && fallbackFilename) {
        const cleanName = fallbackFilename.replace(/\.(pro|cho|chopro|crd|onsong|txt)$/i, '').trim();
        if (cleanName.includes(' - ')) {
            const parts = cleanName.split(' - ');
            // Handle both "Artist - Title" and "Title - Artist" common naming
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
        }
        else {
            title = cleanName;
        }
    }
    // Infer key from the first chord in sections if not explicitly declared
    if (!key) {
        for (const sec of sections) {
            for (const l of sec.lines) {
                if (l.kind === 'lyrics' && l.source) {
                    const firstChord = l.source.match(/\[([A-G][#b]?m?)/);
                    if (firstChord && firstChord[1]) {
                        key = firstChord[1];
                        break;
                    }
                }
            }
            if (key)
                break;
        }
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
