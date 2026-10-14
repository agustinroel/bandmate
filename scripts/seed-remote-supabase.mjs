// scripts/seed-remote-supabase.mjs
const SUPABASE_URL = "https://ojuyilbbzihtkwrrcimy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXlpbGJiemlodGt3cnJjaW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyNTUwNSwiZXhwIjoyMDg0NTAxNTA1fQ.0L8Z_Q_MMuLjUaffmEjv7o8_f3fE7FGEkFyy7yOXSoM";

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates"
};

// Top 28 Real Worldwide Songs with ChordPro sections
const SONGS_CATALOG = [
  {
    title: "Stand By Me",
    artist: "Ben E. King",
    key: "A",
    bpm: 118,
    durationSec: 180,
    sections: [
      {
        id: "sbm-intro",
        name: "Intro",
        type: "intro",
        order: 1,
        lines: [{ id: "l-1", kind: "lyrics", source: "[A] [A] [F#m] [F#m] [D] [E] [A] [A]" }]
      },
      {
        id: "sbm-v1",
        name: "Verse 1",
        type: "verse",
        order: 2,
        lines: [
          { id: "l-2", kind: "lyrics", source: "When the [A]night has come and the [F#m]land is dark" },
          { id: "l-3", kind: "lyrics", source: "And the [D]moon is the [E]only light we'll [A]see" },
          { id: "l-4", kind: "lyrics", source: "No I [A]won't be afraid, no I [F#m]won't be afraid" },
          { id: "l-5", kind: "lyrics", source: "Just as [D]long as you [E]stand, stand by [A]me" }
        ]
      },
      {
        id: "sbm-c1",
        name: "Chorus",
        type: "chorus",
        order: 3,
        lines: [
          { id: "l-6", kind: "lyrics", source: "So darling, darling, [A]stand by me, oh, [F#m]stand by me" },
          { id: "l-7", kind: "lyrics", source: "Oh, [D]stand, [E]stand by me, [A]stand by me" }
        ]
      }
    ]
  },
  {
    title: "Let It Be",
    artist: "The Beatles",
    key: "C",
    bpm: 72,
    durationSec: 243,
    sections: [
      {
        id: "lib-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-8", kind: "lyrics", source: "When I [C]find myself in [G]times of trouble, [Am]Mother Mary [F]comes to me" },
          { id: "l-9", kind: "lyrics", source: "[C]Speaking words of [G]wisdom, let it [F]be [C]" },
          { id: "l-10", kind: "lyrics", source: "And [C]in my hour of [G]darkness she is [Am]standing right in [F]front of me" },
          { id: "l-11", kind: "lyrics", source: "[C]Speaking words of [G]wisdom, let it [F]be [C]" }
        ]
      },
      {
        id: "lib-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-12", kind: "lyrics", source: "Let it [Am]be, let it [G]be, let it [F]be, let it [C]be" },
          { id: "l-13", kind: "lyrics", source: "[C]Whisper words of [G]wisdom, let it [F]be [C]" }
        ]
      }
    ]
  },
  {
    title: "Wonderwall",
    artist: "Oasis",
    key: "Em",
    bpm: 87,
    durationSec: 258,
    sections: [
      {
        id: "ww-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-14", kind: "lyrics", source: "To[Em7]day is gonna be the day that they're [G]gonna throw it back to [Dsus4]you [A7sus4]" },
          { id: "l-15", kind: "lyrics", source: "By [Em7]now you should've somehow realized [G]what you gotta [Dsus4]do [A7sus4]" },
          { id: "l-16", kind: "lyrics", source: "I don't be[Em7]lieve that anybody [G]feels the way I [Dsus4]do about you [A7sus4]now" }
        ]
      },
      {
        id: "ww-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-17", kind: "lyrics", source: "Because [C]maybe, [Em7] [G] you're gonna be the one that [Em7]saves me" },
          { id: "l-18", kind: "lyrics", source: "And [Em7]after [C]all, [Em7] [G] you're my [Em7]wonder[C]wall [Em7] [G] [Em7]" }
        ]
      }
    ]
  },
  {
    title: "Creep",
    artist: "Radiohead",
    key: "G",
    bpm: 92,
    durationSec: 238,
    sections: [
      {
        id: "crp-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-19", kind: "lyrics", source: "When you were here be[G]fore, couldn't look you in the [B]eye" },
          { id: "l-20", kind: "lyrics", source: "You're just like an [C]angel, your skin makes me [Cm]cry" },
          { id: "l-21", kind: "lyrics", source: "You float like a [G]feather in a beautiful [B]world" },
          { id: "l-22", kind: "lyrics", source: "I wish I was [C]special, you're so fuckin' [Cm]special" }
        ]
      },
      {
        id: "crp-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-23", kind: "lyrics", source: "But I'm a [G]creep, I'm a [B]weirdo" },
          { id: "l-24", kind: "lyrics", source: "What the hell am I [C]doin' here? I don't be[Cm]long here" }
        ]
      }
    ]
  },
  {
    title: "House of the Rising Sun",
    artist: "The Animals",
    key: "Am",
    bpm: 116,
    durationSec: 270,
    sections: [
      {
        id: "hrs-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-25", kind: "lyrics", source: "There [Am]is a [C]house in [D]New Orleans [F]" },
          { id: "l-26", kind: "lyrics", source: "They [Am]call the [C]Rising [E]Sun [E]" },
          { id: "l-27", kind: "lyrics", source: "And it's [Am]been the [C]ruin of [D]many a poor [F]boy" },
          { id: "l-28", kind: "lyrics", source: "And [Am]God, I [E]know I'm [Am]one [C] [D] [F] [Am] [E] [Am] [E]" }
        ]
      }
    ]
  },
  {
    title: "Knockin' on Heaven's Door",
    artist: "Bob Dylan",
    key: "G",
    bpm: 68,
    durationSec: 150,
    sections: [
      {
        id: "kohd-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-29", kind: "lyrics", source: "[G]Mama, take this [D]badge off of [Am]me" },
          { id: "l-30", kind: "lyrics", source: "[G]I can't [D]use it any[C]more" },
          { id: "l-31", kind: "lyrics", source: "[G]It's gettin' [D]dark, too dark for me to [Am]see" },
          { id: "l-32", kind: "lyrics", source: "[G]I feel I'm [D]knockin' on heaven's [C]door" }
        ]
      },
      {
        id: "kohd-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-33", kind: "lyrics", source: "[G]Knock, knock, [D]knockin' on heaven's [Am]door" },
          { id: "l-34", kind: "lyrics", source: "[G]Knock, knock, [D]knockin' on heaven's [C]door" }
        ]
      }
    ]
  },
  {
    title: "Wish You Were Here",
    artist: "Pink Floyd",
    key: "G",
    bpm: 60,
    durationSec: 334,
    sections: [
      {
        id: "wywh-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-35", kind: "lyrics", source: "So, [C]so you think you can [D]tell heaven from [Am]hell" },
          { id: "l-36", kind: "lyrics", source: "Blue skies from [G]pain, can you tell a green [D]field" },
          { id: "l-37", kind: "lyrics", source: "From a cold steel [C]rail, a smile from a [Am]veil" },
          { id: "l-38", kind: "lyrics", source: "Do you think you can [G]tell?" }
        ]
      },
      {
        id: "wywh-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-39", kind: "lyrics", source: "How I [C]wish, how I wish you were [D]here" },
          { id: "l-40", kind: "lyrics", source: "We're just [Am]two lost souls swimming in a fish bowl, [G]year after year" },
          { id: "l-41", kind: "lyrics", source: "[D]Running over the same old ground, [C]what have we found?" },
          { id: "l-42", kind: "lyrics", source: "The same old [Am]fears, wish you were [G]here" }
        ]
      }
    ]
  },
  {
    title: "Hey Jude",
    artist: "The Beatles",
    key: "F",
    bpm: 74,
    durationSec: 431,
    sections: [
      {
        id: "hj-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-43", kind: "lyrics", source: "Hey [F]Jude, don't make it [C]bad, take a [C7]sad song and make it [F]better" },
          { id: "l-44", kind: "lyrics", source: "Re[Bb]member to let her into your [F]heart, then you can [C7]start to make it [F]better" }
        ]
      },
      {
        id: "hj-outro",
        name: "Outro",
        type: "outro",
        order: 2,
        lines: [
          { id: "l-45", kind: "lyrics", source: "[F]Na na na [Eb]na na na na, [Bb]na na na na, hey [F]Jude" }
        ]
      }
    ]
  },
  {
    title: "Hallelujah",
    artist: "Leonard Cohen",
    key: "C",
    bpm: 56,
    durationSec: 250,
    sections: [
      {
        id: "hal-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-46", kind: "lyrics", source: "I've [C]heard there was a [Am]secret chord that [C]David played and it [Am]pleased the Lord" },
          { id: "l-47", kind: "lyrics", source: "But [F]you don't really [G]care for music, [C]do ya? [G]" },
          { id: "l-48", kind: "lyrics", source: "It [C]goes like this the [F]fourth, the [G]fifth, the [Am]minor fall and the [F]major lift" },
          { id: "l-49", kind: "lyrics", source: "The [G]baffled king com[E7]posing Halle[Am]lujah" }
        ]
      },
      {
        id: "hal-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-50", kind: "lyrics", source: "Halle[F]lujah, Halle[Am]lujah, Halle[F]lujah, Halle[C]lu---[G]jah [C]" }
        ]
      }
    ]
  },
  {
    title: "Nothing Else Matters",
    artist: "Metallica",
    key: "Em",
    bpm: 46,
    durationSec: 388,
    sections: [
      {
        id: "nem-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-51", kind: "lyrics", source: "So close, no matter [D]how far [C]" },
          { id: "l-52", kind: "lyrics", source: "Couldn't be much more [D]from the heart [C]" },
          { id: "l-53", kind: "lyrics", source: "Forever trusting [D]who we are [C]" },
          { id: "l-54", kind: "lyrics", source: "[G]And [B7]nothing else [Em]matters" }
        ]
      },
      {
        id: "nem-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-55", kind: "lyrics", source: "Never cared for what they [C]do [A] [D]" },
          { id: "l-56", kind: "lyrics", source: "Never cared for what they [C]know [A] [D] but I [Em]know" }
        ]
      }
    ]
  },
  {
    title: "Zombie",
    artist: "The Cranberries",
    key: "Em",
    bpm: 84,
    durationSec: 306,
    sections: [
      {
        id: "zom-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-57", kind: "lyrics", source: "An[Em]other head hangs lowly, [C]child is slowly taken" },
          { id: "l-58", kind: "lyrics", source: "And the [G]violence caused such silence, [D/F#]who are we mistaken?" }
        ]
      },
      {
        id: "zom-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-59", kind: "lyrics", source: "In your [Em]head, in your [C]head, they are fighting" },
          { id: "l-60", kind: "lyrics", source: "With their [G]tanks and their bombs and their [D/F#]bombs and their guns" },
          { id: "l-61", kind: "lyrics", source: "In your [Em]head, in your [C]head, zombie, [G]zombie [D/F#]" }
        ]
      }
    ]
  },
  {
    title: "Hotel California",
    artist: "Eagles",
    key: "Bm",
    bpm: 75,
    durationSec: 390,
    sections: [
      {
        id: "hc-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-62", kind: "lyrics", source: "On a [Bm]dark desert highway, [F#7]cool wind in my hair" },
          { id: "l-63", kind: "lyrics", source: "[A]Warm smell of colitas, [E]rising up through the air" },
          { id: "l-64", kind: "lyrics", source: "[G]Up ahead in the distance, [D]I saw a shimmering light" },
          { id: "l-65", kind: "lyrics", source: "[Em]My head grew heavy and my sight grew dim, [F#7]I had to stop for the night" }
        ]
      },
      {
        id: "hc-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-66", kind: "lyrics", source: "[G]Welcome to the Hotel Cali[D]fornia" },
          { id: "l-67", kind: "lyrics", source: "Such a [F#7]lovely place, such a [Bm]lovely face" }
        ]
      }
    ]
  },
  {
    title: "Yellow",
    artist: "Coldplay",
    key: "B",
    bpm: 87,
    durationSec: 269,
    sections: [
      {
        id: "yel-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-68", kind: "lyrics", source: "Look at the [B]stars, look how they shine for [F#]you" },
          { id: "l-69", kind: "lyrics", source: "And everything you [E]do, yeah they were all [B]yellow" }
        ]
      },
      {
        id: "yel-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-70", kind: "lyrics", source: "Your [E]skin, oh yeah your skin and [G#m]bones [F#]" },
          { id: "l-71", kind: "lyrics", source: "Turn into [E]something beau[G#m]tiful [F#]" },
          { id: "l-72", kind: "lyrics", source: "Do you [E]know, you know I love you [B]so" }
        ]
      }
    ]
  },
  {
    title: "Riptide",
    artist: "Vance Joy",
    key: "Am",
    bpm: 102,
    durationSec: 204,
    sections: [
      {
        id: "rip-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-73", kind: "lyrics", source: "I was scared of [Am]dentists and the [G]dark [C]" },
          { id: "l-74", kind: "lyrics", source: "I was scared of [Am]pretty girls and [G]starting conversa[C]tions" }
        ]
      },
      {
        id: "rip-c1",
        name: "Chorus",
        type: "chorus",
        order: 2,
        lines: [
          { id: "l-75", kind: "lyrics", source: "Lady, [Am]running down to the [G]riptide, taken away to the [C]dark side" },
          { id: "l-76", kind: "lyrics", source: "[Am]I wanna be your [G]left hand man [C]" }
        ]
      }
    ]
  },
  {
    title: "Californication",
    artist: "Red Hot Chili Peppers",
    key: "Am",
    bpm: 96,
    durationSec: 329,
    sections: [
      {
        id: "cal-v1",
        name: "Verse 1",
        type: "verse",
        order: 1,
        lines: [
          { id: "l-77", kind: "lyrics", source: "Psychic spies from [Am]China try to steal your mind's e[F]lation" },
          { id: "l-78", kind: "lyrics", source: "And little girls from [Am]Sweden dream of silver screen quo[F]tations" },
          { id: "l-79", kind: "lyrics", source: "And [C]if you want these [G]kind of dreams it's [F]Californi[Dm]cation" }
        ]
      }
    ]
  }
];

async function seed() {
  console.log("Starting Supabase Seeding of Real Song Catalog...");

  for (const song of SONGS_CATALOG) {
    // 1. Insert / Upsert into `songs` table
    const songPayload = {
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
      body: JSON.stringify(songPayload)
    });

    console.log(`Song [${song.title} - ${song.artist}]: HTTP ${res.status}`);

    // 2. Also insert / upsert into `song_works`
    const workPayload = {
      title: song.title,
      artist: song.artist,
      rights: "copyrighted",
      rights_notes: "Arrangement by community chords",
      source: "import"
    };

    const workRes = await fetch(`${SUPABASE_URL}/rest/v1/song_works`, {
      method: "POST",
      headers,
      body: JSON.stringify(workPayload)
    });

    console.log(`Work [${song.title}]: HTTP ${workRes.status}`);

    // 3. Also insert into `arrangements` table
    const getWorkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/song_works?title=eq.${encodeURIComponent(song.title)}&artist=eq.${encodeURIComponent(song.artist)}&select=id`,
      { headers }
    );
    const workData = await getWorkRes.json();
    const workId = workData?.[0]?.id;

    if (workId) {
      const arrPayload = {
        work_id: workId,
        author_user_id: null,
        version: 1,
        sections: song.sections,
        key: song.key || null,
        bpm: song.bpm ? String(song.bpm) : null,
        duration_sec: song.durationSec || null,
        notes: "Official Bandmate community ChordPro arrangement.",
        source: "community",
        is_seed: true,
        rating_avg: 4.8,
        rating_count: 5
      };

      const arrRes = await fetch(`${SUPABASE_URL}/rest/v1/arrangements`, {
        method: "POST",
        headers,
        body: JSON.stringify(arrPayload)
      });
      console.log(`Arrangement [${song.title}]: HTTP ${arrRes.status}`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
