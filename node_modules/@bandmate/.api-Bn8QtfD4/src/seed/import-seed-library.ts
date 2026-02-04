// apps/api/src/seed/import-seed-library.ts
import { supabase } from "../lib/supabase.js";
import { SEED_WORKS } from "./seed-works.js";
import { SEED_ARRANGEMENTS } from "./seed-arrangements.js";

function nowIso() {
  return new Date().toISOString();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function asString(v: any) {
  return typeof v === "string" ? v : "";
}

function extractSeedSlug(rightsNotes: string | null | undefined) {
  const notes = String(rightsNotes ?? "");
  const m = notes.match(/seedSlug:([a-z0-9\-]+)/i);
  return m?.[1] ?? null;
}

type SeedWorkLike = {
  title: string;
  artist: string;
  slug?: string;
  rights?: "unknown" | "public-domain" | "copyrighted" | "licensed";
  rightsNotes?: string;
  source?: "musicbrainz" | "wikidata" | "user" | "import";
  musicbrainzId?: string | null;
  wikidataId?: string | null;

  // ✅ opcional: permitir seedArrangement embebido
  seedArrangement?: any;
};

type SeedArrangementLike = {
  workSlug: string;
  source: "community" | "official" | "public-domain";
  sections?: any[];
  key?: string | null;
  bpm?: any;
  durationSec?: number | null;
  notes?: string | null;
  links?: any[];
  tags?: any[];
  capo?: number | null;
  timeSignature?: string | null;
};

function normalizeSeedWorks(input: any[]): SeedWorkLike[] {
  const list = Array.isArray(input) ? input : [];
  return list.map((w: any) => {
    const title = asString(w?.title).trim();
    const artist = asString(w?.artist).trim();

    const slug =
      asString(w?.slug).trim() ||
      slugify(`${title}-${artist}`) ||
      slugify(title);

    return {
      title,
      artist,
      slug,
      rights: w?.rights ?? "unknown",
      rightsNotes: w?.rightsNotes ?? w?.rights_notes ?? "",
      source: w?.source ?? "import",
      musicbrainzId: w?.musicbrainzId ?? w?.musicbrainz_id ?? null,
      wikidataId: w?.wikidataId ?? w?.wikidata_id ?? null,
      seedArrangement: w?.seedArrangement ?? w?.seed_arrangement ?? null,
    };
  });
}

function normalizeSeedArrangements(
  works: SeedWorkLike[],
  arrangements: any[],
): SeedArrangementLike[] {
  const out: SeedArrangementLike[] = [];

  // 1) Seed arrangements embebidos en works
  for (const w of works) {
    if (!w.seedArrangement) continue;

    const a = w.seedArrangement;

    out.push({
      workSlug: w.slug!,
      source: (a?.source ?? "public-domain") as any,
      sections: Array.isArray(a?.sections) ? a.sections : [],
      key: a?.key ?? null,
      bpm: a?.bpm ?? null,
      durationSec: a?.durationSec ?? a?.duration_sec ?? null,
      notes: a?.notes ?? null,
      links: Array.isArray(a?.links) ? a.links : [],
      tags: Array.isArray(a?.tags) ? a.tags : [],
      capo: a?.capo ?? null,
      timeSignature: a?.timeSignature ?? a?.time_signature ?? null,
    });
  }

  // 2) Seed arrangements del archivo SEED_ARRANGEMENTS (si lo usás)
  const list = Array.isArray(arrangements) ? arrangements : [];
  for (const a of list) {
    const workSlug = asString(a?.workSlug ?? a?.work_slug).trim();
    if (!workSlug) continue;

    out.push({
      workSlug,
      source: (a?.source ?? "public-domain") as any,
      sections: Array.isArray(a?.sections) ? a.sections : [],
      key: a?.key ?? null,
      bpm: a?.bpm ?? null,
      durationSec: a?.durationSec ?? a?.duration_sec ?? null,
      notes: a?.notes ?? null,
      links: Array.isArray(a?.links) ? a.links : [],
      tags: Array.isArray(a?.tags) ? a.tags : [],
      capo: a?.capo ?? null,
      timeSignature: a?.timeSignature ?? a?.time_signature ?? null,
    });
  }

  // Dedup: si hay repetidos (mismo workSlug + source), nos quedamos con el último
  const key = (x: SeedArrangementLike) => `${x.workSlug}__${x.source}`;
  const map = new Map<string, SeedArrangementLike>();
  for (const a of out) map.set(key(a), a);

  return Array.from(map.values());
}

export async function importSeedLibrary() {
  const works = normalizeSeedWorks(SEED_WORKS as any);

  // ✅ Validación mínima ahora: title + artist (slug se autogenera)
  for (const w of works) {
    if (!w.title || !w.artist) {
      throw new Error(
        `Invalid SEED_WORKS entry (needs title, artist). Got: ${JSON.stringify(w)}`,
      );
    }
  }

  const arrangements = normalizeSeedArrangements(
    works,
    SEED_ARRANGEMENTS as any,
  );

  // 1) Upsert works (por title+artist)
  for (const w of works) {
    const { data: existing, error: e1 } = await supabase
      .from("song_works")
      .select("id, title, artist, rights_notes")
      .eq("title", w.title)
      .eq("artist", w.artist)
      .maybeSingle();

    if (e1) throw e1;

    const mergedNotes = [
      asString(w.rightsNotes ?? "").trim(),
      `seedSlug:${w.slug}`,
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    const payload: any = {
      title: w.title,
      artist: w.artist,
      rights: w.rights ?? "unknown",
      rights_notes: mergedNotes || null,
      source: w.source ?? "import",
      musicbrainz_id: w.musicbrainzId ?? null,
      wikidata_id: w.wikidataId ?? null,
      updated_at: nowIso(),
    };

    if (!existing) {
      const { error } = await supabase.from("song_works").insert(payload);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("song_works")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    }
  }

  // 2) Map workSlug -> workId
  const { data: workRows, error: e2 } = await supabase
    .from("song_works")
    .select("id, rights_notes");

  if (e2) throw e2;

  const workIdBySlug = new Map<string, string>();
  for (const row of workRows ?? []) {
    const slug = extractSeedSlug((row as any).rights_notes);
    if (slug) workIdBySlug.set(slug, (row as any).id);
  }

  // 3) Upsert seed arrangements por (work_id + is_seed=true + source)
  for (const a of arrangements) {
    const workId = workIdBySlug.get(a.workSlug);
    if (!workId) {
      throw new Error(
        `Work not found for slug "${a.workSlug}". Did song_works seed include seedSlug?`,
      );
    }

    const { data: existingA, error: e3 } = await supabase
      .from("arrangements")
      .select("id")
      .eq("work_id", workId)
      .eq("is_seed", true)
      .eq("source", a.source)
      .maybeSingle();

    if (e3) throw e3;

    const payload: any = {
      work_id: workId,
      author_user_id: null,
      version: 1,
      sections: a.sections ?? [],
      key: a.key ?? null,
      bpm: a.bpm ?? null,
      duration_sec: a.durationSec ?? null,
      notes: a.notes ?? null,
      links: a.links ?? [],
      tags: a.tags ?? [],
      capo: a.capo ?? null,
      time_signature: a.timeSignature ?? null,
      source: a.source,
      is_seed: true,
      updated_at: nowIso(),
    };

    if (!existingA) {
      const { error } = await supabase.from("arrangements").insert(payload);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("arrangements")
        .update(payload)
        .eq("id", existingA.id);
      if (error) throw error;
    }
  }

  return { ok: true, works: works.length, arrangements: arrangements.length };
}
