// scripts/seed-batch-2.mjs
const SUPABASE_URL = "https://ojuyilbbzihtkwrrcimy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXlpbGJiemlodGt3cnJjaW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyNTUwNSwiZXhwIjoyMDg0NTAxNTA1fQ.0L8Z_Q_MMuLjUaffmEjv7o8_f3fE7FGEkFyy7yOXSoM";

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json"
};

const BATCH_2 = [
  {
    title: "Imagine",
    artist: "John Lennon",
    key: "C",
    bpm: 76,
    durationSec: 183,
    sections: [
      {
        id: "img-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-101", kind: "lyrics", source: "I[C]magine there's [Cmaj7]no hea[F]ven" },
          { id: "l-102", kind: "lyrics", source: "It's [C]easy if [Cmaj7]you [F]try" },
          { id: "l-103", kind: "lyrics", source: "No [C]hell [Cmaj7]below [F]us, a[C]bove us [Cmaj7]only [F]sky" }
        ]
      },
      {
        id: "img-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-104", kind: "lyrics", source: "You may [F]say I'm a [G]dreamer [C] [E7]" },
          { id: "l-105", kind: "lyrics", source: "But [F]I'm not the [G]only one [C] [E7]" },
          { id: "l-106", kind: "lyrics", source: "I hope [F]someday you'll [G]join us [C] [E7]" },
          { id: "l-107", kind: "lyrics", source: "And the [F]world will [G]be as [C]one" }
        ]
      }
    ]
  },
  {
    title: "Boulevard of Broken Dreams",
    artist: "Green Day",
    key: "Fm",
    bpm: 84,
    durationSec: 260,
    sections: [
      {
        id: "bbd-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-108", kind: "lyrics", source: "I [Em]walk a [G]lonely road, the [D]only one that [A]I have ever known" },
          { id: "l-109", kind: "lyrics", source: "[Em]Don't know [G]where it goes, [D]but it's home to me and [A]I walk alone [Em]" }
        ]
      },
      {
        id: "bbd-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-110", kind: "lyrics", source: "My [C]shadow's the [G]only one that [D]walks beside me [Em]" },
          { id: "l-111", kind: "lyrics", source: "My [C]shallow [G]heart's the only [D]thing that's beating [Em]" }
        ]
      }
    ]
  },
  {
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    key: "Fm",
    bpm: 117,
    durationSec: 301,
    sections: [
      {
        id: "slts-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-112", kind: "lyrics", source: "[F5]Load up on [Bb5]guns, [Ab5]bring your [Db5]friends" },
          { id: "l-113", kind: "lyrics", source: "[F5]It's fun to [Bb5]lose and [Ab5]to pre[Db5]tend" }
        ]
      },
      {
        id: "slts-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-114", kind: "lyrics", source: "With the [F5]lights out, [Bb5]it's less [Ab5]dangerous [Db5]" },
          { id: "l-115", kind: "lyrics", source: "Here we [F5]are now, [Bb5]enter[Ab5]tain us [Db5]" }
        ]
      }
    ]
  },
  {
    title: "Dreams",
    artist: "Fleetwood Mac",
    key: "F",
    bpm: 120,
    durationSec: 257,
    sections: [
      {
        id: "drm-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-116", kind: "lyrics", source: "[F]Now here you go again, you say you [G]want your freedom" },
          { id: "l-117", kind: "lyrics", source: "[F]Well, who am I to keep you [G]down?" }
        ]
      },
      {
        id: "drm-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-118", kind: "lyrics", source: "Thunder only [F]happens when it's [G]raining" },
          { id: "l-119", kind: "lyrics", source: "Players only [F]love you when they're [G]playing" }
        ]
      }
    ]
  },
  {
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    key: "D",
    bpm: 125,
    durationSec: 356,
    sections: [
      {
        id: "scom-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-120", kind: "lyrics", source: "She's got a [D]smile that it seems to me, re[C]minds me of childhood memories" },
          { id: "l-121", kind: "lyrics", source: "Where [G]everything was as fresh as the bright blue [D]sky" }
        ]
      },
      {
        id: "scom-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-122", kind: "lyrics", source: "[A]Whoa, [C]whoa, sweet [D]child o' mine" },
          { id: "l-123", kind: "lyrics", source: "[A]Whoa, [C]oh, oh, sweet [D]love of mine" }
        ]
      }
    ]
  },
  {
    title: "Perfect",
    artist: "Ed Sheeran",
    key: "Ab",
    bpm: 63,
    durationSec: 263,
    sections: [
      {
        id: "prf-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-124", kind: "lyrics", source: "I found a [G]love for [Em]me" },
          { id: "l-125", kind: "lyrics", source: "Darling, just [C]dive right in and follow my [D]lead" }
        ]
      },
      {
        id: "prf-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-126", kind: "lyrics", source: "Baby, I'm [Em]dancing in the [C]dark, with you between my [G]arms" },
          { id: "l-127", kind: "lyrics", source: "Barefoot on the [Em]grass, [C]listening to our favorite [G]song [D]" }
        ]
      }
    ]
  },
  {
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley",
    key: "D",
    bpm: 68,
    durationSec: 182,
    sections: [
      {
        id: "chf-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-128", kind: "lyrics", source: "[C]Wise [Em]men [Am]say only [F]fools [C]rush [G]in" },
          { id: "l-129", kind: "lyrics", source: "But [F]I [G]can't [Am]help [F]falling in [C]love [G]with [C]you" }
        ]
      }
    ]
  },
  {
    title: "Someone Like You",
    artist: "Adele",
    key: "A",
    bpm: 68,
    durationSec: 285,
    sections: [
      {
        id: "sly-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-130", kind: "lyrics", source: "I [A]heard that you're [A/G#]settled down" },
          { id: "l-131", kind: "lyrics", source: "That you [F#m]found a girl and you're [D]married now" }
        ]
      },
      {
        id: "sly-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-132", kind: "lyrics", source: "Never mind, I'll [A]find someone [E]like [F#m]you [D]" },
          { id: "l-133", kind: "lyrics", source: "I wish [A]nothing but the [E]best for [F#m]you, [D]too" }
        ]
      }
    ]
  }
];

async function run() {
  for (const song of BATCH_2) {
    const payload = {
      title: song.title,
      artist: song.artist,
      key: song.key,
      bpm: song.bpm,
      duration_sec: song.durationSec,
      is_seed: true,
      owner_id: null,
      version: 1,
      sections: song.sections,
      notes: "Official Bandmate community seed catalog."
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/songs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    console.log(`Batch 2 [${song.title} - ${song.artist}]: ${res.status}`);

    await fetch(`${SUPABASE_URL}/rest/v1/song_works`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: song.title,
        artist: song.artist,
        rights: "copyrighted",
        rights_notes: "Arrangement by community chords",
        source: "import"
      })
    });
  }
  console.log("Batch 2 done!");
}

run().catch(console.error);
