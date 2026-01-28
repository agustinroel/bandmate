export function toLegacySongDetail(v2) {
    const a = v2.activeArrangement;
    return {
        id: v2.work.id, // por ahora: legacy id = workId
        title: v2.work.title,
        artist: v2.work.artist,
        key: a.key,
        bpm: a.bpm,
        durationSec: a.durationSec,
        notes: a.notes,
        links: a.links,
        sections: a.sections,
        version: 1,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        isSeed: a.isSeed,
    };
}
