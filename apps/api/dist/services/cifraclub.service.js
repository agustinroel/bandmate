import { parseSmartTab } from "@bandmate/shared";
import { supabase } from "../lib/supabase.js";
import { createWork } from "../works/works.repo.js";
import crypto from "node:crypto";
const BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,pt-BR;q=0.8,en;q=0.7",
};
function decodeHtmlEntities(str) {
    return (str || "")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}
function slugToTitle(slug) {
    return (slug || "")
        .replace(/-\d+$/, "")
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
function deterministicUuid(namespace) {
    const hash = crypto.createHash("sha256").update(namespace).digest("hex");
    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        "4" + hash.slice(13, 16),
        "a" + hash.slice(17, 20),
        hash.slice(20, 32),
    ].join("-");
}
export class CifraClubService {
    /**
     * Search across all 800,000+ songs in CifraClub's global Solr CDN index,
     * plus expand artist catalog if an artist matches.
     */
    async search(query, limit = 24) {
        const q = (query || "").trim();
        if (!q)
            return [];
        const results = [];
        const seen = new Set();
        try {
            const solrUrl = `https://solr.sscdn.co/cc/h2/?q=${encodeURIComponent(q)}`;
            const res = await fetch(solrUrl, { headers: BROWSER_HEADERS });
            if (res.ok) {
                const raw = await res.text();
                // Strip JSONP wrapper: ({ ... })
                const jsonStart = raw.indexOf("{");
                const jsonEnd = raw.lastIndexOf("}");
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
                    const docs = parsed?.response?.docs || [];
                    let topArtistSlug = null;
                    let topArtistName = null;
                    for (const doc of docs) {
                        if (doc.t === "1" && doc.d && !topArtistSlug) {
                            topArtistSlug = doc.d;
                            topArtistName = doc.a || doc.m || slugToTitle(doc.d);
                        }
                        else if (doc.t === "2" && doc.d && doc.u) {
                            const key = `${doc.d}/${doc.u}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                results.push({
                                    id: `cc:${doc.d}__${doc.u}`,
                                    title: doc.m || slugToTitle(doc.u),
                                    artist: doc.a || slugToTitle(doc.d),
                                    artistSlug: doc.d,
                                    songSlug: doc.u,
                                    url: `https://www.cifraclub.com.br/${doc.d}/${doc.u}/`,
                                    source: "cifraclub",
                                });
                            }
                        }
                    }
                    // If an artist matched and we have room for more songs from that artist, fetch their catalog page
                    if (topArtistSlug && results.length < limit) {
                        const artistSongs = await this.getArtistSongs(topArtistSlug, topArtistName || slugToTitle(topArtistSlug), limit - results.length);
                        for (const s of artistSongs) {
                            const key = `${s.artistSlug}/${s.songSlug}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                results.push(s);
                            }
                        }
                    }
                }
            }
        }
        catch (err) {
            console.warn("[CifraClubService] Solr search warning:", err);
        }
        return results.slice(0, limit);
    }
    /**
     * Lists songs for a given CifraClub artist slug (e.g. "soda-stereo")
     */
    async getArtistSongs(artistSlug, artistDisplayName, limit = 40) {
        const cleanArtist = artistSlug.replace(/^\/+|\/+$/g, "");
        const url = `https://www.cifraclub.com.br/${cleanArtist}/musicas.html`;
        const matches = [];
        const seen = new Set();
        try {
            const res = await fetch(url, { headers: BROWSER_HEADERS });
            if (!res.ok)
                return [];
            const html = await res.text();
            const resolvedArtist = artistDisplayName ||
                decodeHtmlEntities(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "") ||
                slugToTitle(cleanArtist);
            const regex = new RegExp(`href="\\/(${cleanArtist})\\/([a-z0-9-]+)\\/"`, "gi");
            for (const m of html.matchAll(regex)) {
                const songSlug = m[2];
                if (!songSlug ||
                    songSlug === "musicas" ||
                    songSlug === "discografia" ||
                    songSlug === "fotos" ||
                    songSlug === "letra" ||
                    seen.has(songSlug)) {
                    continue;
                }
                seen.add(songSlug);
                matches.push({
                    id: `cc:${cleanArtist}__${songSlug}`,
                    title: slugToTitle(songSlug),
                    artist: resolvedArtist,
                    artistSlug: cleanArtist,
                    songSlug,
                    url: `https://www.cifraclub.com.br/${cleanArtist}/${songSlug}/`,
                    source: "cifraclub",
                });
                if (matches.length >= limit)
                    break;
            }
        }
        catch (err) {
            console.warn(`[CifraClubService] Artist songs warning for ${artistSlug}:`, err);
        }
        return matches;
    }
    /**
     * Scrapes a full song from CifraClub by artistSlug + songSlug or full URL
     */
    async scrapeSong(idOrUrl) {
        let targetUrl = idOrUrl.trim();
        let fallbackArtistSlug = "";
        let fallbackSongSlug = "";
        if (targetUrl.startsWith("cc:")) {
            const [artistSlug, songSlug] = targetUrl.slice(3).split("__");
            fallbackArtistSlug = artistSlug || "";
            fallbackSongSlug = songSlug || "";
            targetUrl = `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/`;
        }
        else if (!/^https?:\/\//i.test(targetUrl)) {
            const parts = targetUrl.replace(/^\/+|\/+$/g, "").split("/");
            if (parts.length >= 2) {
                fallbackArtistSlug = parts[0];
                fallbackSongSlug = parts[1];
                targetUrl = `https://www.cifraclub.com.br/${parts[0]}/${parts[1]}/`;
            }
        }
        let html = "";
        try {
            const res = await fetch(targetUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(8000) });
            if (res.ok) {
                html = await res.text();
            }
        }
        catch {
            // Fallback below
        }
        // Fallback 1: Edge HTML extractor for CifraClub if direct IP is rate-limited (429)
        if (!html || !/<pre/i.test(html)) {
            try {
                const edgeRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
                    headers: {
                        ...BROWSER_HEADERS,
                        "X-Respond-With": "html",
                        "X-Target-Selector": "pre",
                    },
                    signal: AbortSignal.timeout(10000),
                });
                if (edgeRes.ok) {
                    const edgeHtml = await edgeRes.text();
                    if (/<pre/i.test(edgeHtml)) {
                        html = edgeHtml;
                    }
                }
            }
            catch {
                // Fallback 2 below
            }
        }
        // Fallback 2: LaCuerda ES/EN mirror using artistSlug and songSlug
        if ((!html || !/<pre/i.test(html)) && fallbackArtistSlug && fallbackSongSlug) {
            const lcArtist = fallbackArtistSlug.replace(/-/g, "_");
            const lcSong = fallbackSongSlug.replace(/-/g, "_");
            for (const host of ["acordes.lacuerda.net", "chords.lacuerda.net", "cifras.lacuerda.net"]) {
                try {
                    const lcRes = await fetch(`https://${host}/${lcArtist}/${lcSong}.shtml`, {
                        headers: BROWSER_HEADERS,
                        signal: AbortSignal.timeout(8000),
                    });
                    if (lcRes.ok) {
                        const lcHtml = await lcRes.text();
                        if (/<pre/i.test(lcHtml)) {
                            html = lcHtml;
                            break;
                        }
                    }
                }
                catch {
                    // continue
                }
            }
        }
        const preMatches = Array.from(html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi));
        if (preMatches.length === 0) {
            throw new Error(`No <pre> chord sheet found at ${targetUrl}`);
        }
        const longestPre = preMatches.map((m) => m[1]).sort((a, b) => b.length - a.length)[0];
        const rawPre = decodeHtmlEntities(longestPre);
        // Extract title & artist from <title> ("De Música Ligera - Soda Stereo - Cifra Club") or <h1>
        let detectedTitle = "";
        let detectedArtist = "";
        const pageTitle = decodeHtmlEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "")
            .replace(/\s*-\s*Cifra\s*Club.*$/i, "")
            .trim();
        if (pageTitle.includes(" - ")) {
            const parts = pageTitle.split(" - ").map((s) => s.trim());
            detectedTitle = parts[0];
            detectedArtist = parts.slice(1).join(" - ");
        }
        if (!detectedTitle) {
            const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
            if (h1)
                detectedTitle = decodeHtmlEntities(h1);
        }
        if (!detectedTitle && fallbackSongSlug)
            detectedTitle = slugToTitle(fallbackSongSlug);
        if (!detectedArtist && fallbackArtistSlug)
            detectedArtist = slugToTitle(fallbackArtistSlug);
        // Extract Key (Tom)
        const tomMatch = html.match(/id="cifra_tom"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
            html.match(/tom:\s*<a[^>]*>([^<]+)<\/a>/i) ||
            html.match(/"key"\s*:\s*"([A-G][#b]?m?)"/i);
        const detectedKey = tomMatch ? tomMatch[1].trim() : "";
        // Build header + body for parseSmartTab
        const headerLines = [];
        if (detectedTitle)
            headerLines.push(`{title: ${detectedTitle}}`);
        if (detectedArtist)
            headerLines.push(`{artist: ${detectedArtist}}`);
        if (detectedKey)
            headerLines.push(`{key: ${detectedKey}}`);
        const parsed = parseSmartTab(`${headerLines.join("\n")}\n\n${rawPre}`);
        // Filter out sections that are purely ASCII guitar tablature (E|--- B|--- G|---) so chord sheets stay clean
        const cleanSections = (parsed.sections || []).filter((sec) => {
            const nonBlankLines = (sec.lines || []).filter((l) => l.kind !== "blank");
            if (nonBlankLines.length === 0)
                return false;
            const isAsciiTabOnly = nonBlankLines.every((l) => /^[eBGDAE]\|[-0-9hpb/\\~x()|\s]+/i.test((l.source || "").trim()));
            return !isAsciiTabOnly;
        });
        const finalSections = cleanSections.length > 0 ? cleanSections : parsed.sections;
        return {
            title: detectedTitle || parsed.title || "Untitled Song",
            artist: detectedArtist || parsed.artist || "Unknown Artist",
            key: detectedKey || parsed.key || "C",
            bpm: parsed.bpm || 116,
            durationSec: 220,
            genre: "Rock",
            capo: parsed.capo,
            sections: finalSections,
            url: targetUrl,
        };
    }
    /**
     * Scrapes a song from CifraClub and saves it permanently into Supabase
     * (song_works, arrangements, and songs) so it becomes part of Bandmate's Library.
     */
    async ingestToLibrary(idOrUrl, userId) {
        const scraped = await this.scrapeSong(idOrUrl);
        // 1. Create or find Work in song_works
        const work = await createWork({
            title: scraped.title,
            artist: scraped.artist,
            genre: scraped.genre,
            source: "import",
        });
        // 2. Check if arrangement already exists for this work, or create/update it
        const arrId = deterministicUuid(`bm-cc-arr:${scraped.artist.toLowerCase()}::${scraped.title.toLowerCase()}`);
        const songId = deterministicUuid(`bm-cc-song:${scraped.artist.toLowerCase()}::${scraped.title.toLowerCase()}`);
        const now = new Date().toISOString();
        if (supabase) {
            await supabase.from("arrangements").upsert({
                id: arrId,
                work_id: work.id,
                author_user_id: userId || null,
                version: 1,
                sections: scraped.sections,
                key: scraped.key,
                bpm: String(scraped.bpm),
                duration_sec: scraped.durationSec,
                notes: scraped.capo
                    ? `Capotraste en traste ${scraped.capo} · Importado de CifraClub`
                    : "Arreglo completo · CifraClub",
                links: [{ title: "CifraClub", url: scraped.url }],
                source: "community",
                is_seed: true,
                rating_avg: 4.8,
                rating_count: 12,
                created_at: now,
                updated_at: now,
            }, { onConflict: "id" });
            await supabase.from("songs").upsert({
                id: songId,
                title: scraped.title,
                artist: scraped.artist,
                key: scraped.key,
                bpm: scraped.bpm,
                duration_sec: scraped.durationSec,
                sections: scraped.sections,
                notes: scraped.capo
                    ? `Capotraste en traste ${scraped.capo} · CifraClub`
                    : "Canción completa · CifraClub",
                links: [{ title: "CifraClub", url: scraped.url }],
                is_seed: true,
                is_imported: true,
                owner_id: userId || null,
                work_id: work.id,
                origin_arrangement_id: arrId,
                rating_avg: 4.8,
                rating_count: 12,
            }, { onConflict: "id" });
        }
        return {
            success: true,
            workId: work.id,
            arrangementId: arrId,
            songId,
            scraped,
        };
    }
}
export const cifraClubService = new CifraClubService();
