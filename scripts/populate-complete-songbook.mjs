import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env") });

/**
 * Helper to build structured SongSection objects from compact ChordPro section definitions
 */
function buildSections(slug, rawSections) {
  return rawSections.map((sec, idx) => ({
    id: `${slug}-sec-${idx + 1}`,
    type: sec.type,
    name: sec.name,
    order: idx + 1,
    lines: sec.lines.map((line, lIdx) =>
      typeof line === "string"
        ? {
            id: `${slug}-s${idx + 1}-l${lIdx + 1}`,
            kind: "lyrics",
            source: line,
          }
        : {
            id: `${slug}-s${idx + 1}-l${lIdx + 1}`,
            kind: "comment",
            text: line.comment,
          }
    ),
  }));
}

export const MASTER_SONGBOOK = [
  // 1. Wonderwall - Oasis
  {
    slug: "wonderwall",
    title: "Wonderwall",
    artist: "Oasis",
    key: "Em",
    genre: "Rock",
    bpm: 87,
    capo: 2,
    durationSec: 258,
    notes: "Capo 2nd Fret. Iconic acoustic strumming pattern with anchored pinky/ring fingers on G and Dsus4.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          { comment: "Capo 2nd Fret - Acoustic Strumming Groove (x2)" },
          "[Em7]  [G]  [Dsus4]  [A7sus4]",
          "[Em7]  [G]  [Dsus4]  [A7sus4]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em7]Today is [G]gonna be the day that they're [Dsus4]gonna throw it back to [A7sus4]you",
          "[Em7]By now you [G]should've somehow re[Dsus4]alized what you gotta [A7sus4]do",
          "[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [C]now [D] [A7sus4]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em7]Backbeat, the [G]word is on the street that the [Dsus4]fire in your heart is [A7sus4]out",
          "[Em7]I'm sure you've [G]heard it all before, but you [Dsus4]never really had a [A7sus4]doubt",
          "[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Em7]now [G] [Dsus4] [A7sus4]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "And [C]all the roads we [D]have to walk are [Em7]winding",
          "And [C]all the lights that [D]lead us there are [Em7]blinding",
          "[C]There are many [D]things that I would [G]like to [D/F#]say to [Em7]you",
          "But I don't know [G]how [A7sus4]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Because [C]maybe [Em7] [G]",
          "You're [Em7]gonna be the one that [C]saves me [Em7] [G]",
          "And [Em7]after [C]all [Em7] [G]",
          "You're my [Em7]wonder[C]wall [Em7] [G] [Em7] [A7sus4]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[Em7]Today was [G]gonna be the day, but they'll [Dsus4]never throw it back to [A7sus4]you",
          "[Em7]By now you [G]should've somehow re[Dsus4]alized what you're not to [A7sus4]do",
          "[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Em7]now [G] [Dsus4] [A7sus4]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "And [C]all the roads that [D]lead you there were [Em7]winding",
          "And [C]all the lights that [D]light the way are [Em7]blinding",
          "[C]There are many [D]things that I would [G]like to [D/F#]say to [Em7]you",
          "But I don't know [G]how [A7sus4]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "I said [C]maybe [Em7] [G]",
          "You're [Em7]gonna be the one that [C]saves me [Em7] [G]",
          "And [Em7]after [C]all [Em7] [G]",
          "You're my [Em7]wonder[C]wall [Em7] [G] [Em7]",
          "I said [C]maybe [Em7] [G]",
          "You're [Em7]gonna be the one that [C]saves me [Em7] [G]",
          "And [Em7]after [C]all [Em7] [G]",
          "You're my [Em7]wonder[C]wall [Em7] [G] [Em7]",
        ],
      },
      {
        type: "outro",
        name: "Outro & Lead Solo",
        lines: [
          "I said [C]maybe [Em7] [G] you're gonna be the one that [Em7]saves me [C] [Em7] [G]",
          "You're [Em7]gonna be the one that [C]saves me [Em7] [G]",
          "You're [Em7]gonna be the one that [C]saves me [Em7] [G] [Em7]",
          "[C]  [Em7]  [G]  [Em7] (Fade out on Em9)",
        ],
      },
    ],
  },

  // 2. Let It Be - The Beatles
  {
    slug: "let-it-be",
    title: "Let It Be",
    artist: "The Beatles",
    key: "C",
    genre: "Classic Rock",
    bpm: 72,
    durationSec: 243,
    notes: "Classic piano & organ ballad. Watch the descending F - Em - Dm - C walkdown at the end of each chorus.",
    sections: [
      {
        type: "intro",
        name: "Piano Intro",
        lines: [
          "[C]  [G]  [Am]  [Fmaj7] [F6]",
          "[C]  [G]  [F]  [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "When I [C]find myself in [G]times of trouble, [Am]Mother Mary [F]comes to me",
          "[C]Speaking words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
          "And [C]in my hour of [G]darkness she is [Am]standing right in [F]front of me",
          "[C]Speaking words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Let it [Am]be, let it [C/G]be, let it [F]be, let it [C]be",
          "[C]Whisper words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "And [C]when the broken [G]hearted people [Am]living in the [F]world agree",
          "[C]There will be an [G]answer, let it [F]be [C/E] [Dm7] [C]",
          "For [C]though they may be [G]parted there is [Am]still a chance that [F]they will see",
          "[C]There will be an [G]answer, let it [F]be [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "Let it [Am]be, let it [C/G]be, let it [F]be, let it [C]be",
          "Yeah, [C]there will be an [G]answer, let it [F]be [C/E] [Dm7] [C]",
          "Let it [Am]be, let it [C/G]be, let it [F]be, yeah, let it [C]be",
          "[C]Whisper words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "solo",
        name: "Interlude & Guitar Solo",
        lines: [
          { comment: "Organ walkdown into Guitar Solo" },
          "[F]  [C/E] [Dm7] [C]  [Bb]  [F/A] [G]  [F]  [C]",
          "[C]  [G]  [Am]  [F]  [C]  [G]  [F]  [C]",
          "[C]  [G]  [Am]  [F]  [C]  [G]  [F]  [C]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 3",
        lines: [
          "Let it [Am]be, let it [C/G]be, let it [F]be, let it [C]be",
          "[C]Whisper words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "And [C]when the night is [G]cloudy, there is [Am]still a light that [F]shines on me",
          "[C]Shine until to[G]morrow, let it [F]be [C/E] [Dm7] [C]",
          "I [C]wake up to the [G]sound of music, [Am]Mother Mary [F]comes to me",
          "[C]Speaking words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "Let it [Am]be, let it [C/G]be, let it [F]be, yeah, let it [C]be",
          "[C]There will be an [G]answer, let it [F]be [C/E] [Dm7] [C]",
          "Let it [Am]be, let it [C/G]be, let it [F]be, yeah, let it [C]be",
          "[C]Whisper words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]",
          "[F]  [C/E] [Dm7] [C]  [Bb]  [F/A] [G]  [F]  [C]",
        ],
      },
    ],
  },

  // 3. Creep - Radiohead
  {
    slug: "creep",
    title: "Creep",
    artist: "Radiohead",
    key: "G",
    genre: "Alternative Rock",
    bpm: 92,
    durationSec: 238,
    notes: "Clean arpeggios in verses; Johnny Greenwood's three dead-note crunches before blasting distortion in the chorus.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          { comment: "Clean electric guitar arpeggio" },
          "[G]    [B]    [C]    [Cm]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "When you were here be[G]fore, couldn't look you in the [B]eye",
          "You're just like an [C]angel, your skin makes me [Cm]cry",
          "You float like a [G]feather in a beautiful [B]world",
          "I wish I was [C]special, you're so very [Cm]special",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          { comment: "Heavy distortion (chk-chk-chk)" },
          "But I'm a [G]creep, I'm a [B]weirdo",
          "What the hell am I [C]doin' here? I don't be[Cm]long here",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "I don't care if it [G]hurts, I wanna have con[B]trol",
          "I want a perfect [C]body, I want a perfect [Cm]soul",
          "I want you to [G]notice when I'm not a[B]round",
          "You're so very [C]special, I wish I was [Cm]special",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "But I'm a [G]creep, I'm a [B]weirdo",
          "What the hell am I [C]doin' here? I don't be[Cm]long here",
          "Oh, [G]oh...",
        ],
      },
      {
        type: "bridge",
        name: "Bridge & Solo",
        lines: [
          { comment: "Tremolo picking guitar lead + soaring vocals" },
          "She's [G]running out the [B]door...",
          "She's [C]running out, she [Cm]run, run, run, run...",
          "[G]Ruuuuuu[B]uun...",
          "[C]Ruuuuuu[Cm]uun...",
        ],
      },
      {
        type: "outro",
        name: "Verse 3 & Outro",
        lines: [
          { comment: "Drop back to clean piano & guitar" },
          "Whatever makes you [G]happy, whatever you [B]want",
          "You're so very [C]special, I wish I was [Cm]special",
          "But I'm a [G]creep, I'm a [B]weirdo",
          "What the hell am I [C]doin' here? I don't be[Cm]long here",
          "I don't be[G]long here.",
        ],
      },
    ],
  },

  // 4. Hotel California - Eagles
  {
    slug: "hotel-california",
    title: "Hotel California",
    artist: "Eagles",
    key: "Bm",
    genre: "Classic Rock",
    bpm: 75,
    durationSec: 390,
    notes: "12-string acoustic intro (Capo 7 in Em shapes = Bm concert pitch). Twin harmonized guitar solo at the end.",
    sections: [
      {
        type: "intro",
        name: "12-String Intro",
        lines: [
          "[Bm]  [F#7]  [A]  [E]  [G]  [D]  [Em]  [F#7]",
          "[Bm]  [F#7]  [A]  [E]  [G]  [D]  [Em]  [F#7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "On a [Bm]dark desert highway, [F#7]cool wind in my hair",
          "[A]Warm smell of colitas, [E]rising up through the air",
          "[G]Up ahead in the distance, [D]I saw a shimmering light",
          "[Em]My head grew heavy and my sight grew dim, [F#7]I had to stop for the night",
          "There she [Bm]stood in the doorway, [F#7]I heard the mission bell",
          "And I was [A]thinking to myself: this could be [E]heaven or this could be hell",
          "Then she [G]lit up a candle [D]and she showed me the way",
          "[Em]There were voices down the corridor, [F#7]I thought I heard them say...",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[G]Welcome to the Hotel Cali[D]fornia",
          "Such a [F#7]lovely place (such a lovely place), such a [Bm]lovely face",
          "[G]Plenty of room at the Hotel Cali[D]fornia",
          "Any [Em]time of year (any time of year), you can [F#7]find it here",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Her [Bm]mind is Tiffany-twisted, she [F#7]got the Mercedes bends",
          "She [A]got a lot of pretty, pretty boys [E]that she calls friends",
          "How they [G]dance in the courtyard, [D]sweet summer sweat",
          "[Em]Some dance to remember, [F#7]some dance to forget",
          "So I [Bm]called up the Captain, [F#7]Please bring me my wine",
          "He said, [A]We haven't had that spirit here since [E]nineteen sixty-nine",
          "And still [G]those voices are calling from [D]far away",
          "[Em]Wake you up in the middle of the night, [F#7]just to hear them say...",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[G]Welcome to the Hotel Cali[D]fornia",
          "Such a [F#7]lovely place (such a lovely place), such a [Bm]lovely face",
          "They're [G]livin' it up at the Hotel Cali[D]fornia",
          "What a [Em]nice surprise (what a nice surprise), bring your [F#7]alibis",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[Bm]Mirrors on the ceiling, [F#7]the pink champagne on ice",
          "And she said, [A]We are all just prisoners here, [E]of our own device",
          "And in the [G]master's chambers, [D]they gathered for the feast",
          "[Em]They stab it with their steely knives, but they [F#7]just can't kill the beast",
          "[Bm]Last thing I remember, I was [F#7]running for the door",
          "I had to [A]find the passage back to the [E]place I was before",
          "[G]Relax, said the night man, we are [D]programmed to receive",
          "[Em]You can check out any time you like, [F#7]but you can never leave!",
        ],
      },
      {
        type: "solo",
        name: "Dual Guitar Solo & Outro",
        lines: [
          { comment: "Don Felder & Joe Walsh harmonized arpeggio solo (x6)" },
          "[Bm]  [F#7]  [A]  [E]  [G]  [D]  [Em]  [F#7]",
          "[Bm]  [F#7]  [A]  [E]  [G]  [D]  [Em]  [F#7]",
          "[Bm]  [F#7]  [A]  [E]  [G]  [D]  [Em]  [F#7]",
        ],
      },
    ],
  },

  // 5. Smells Like Teen Spirit - Nirvana
  {
    slug: "smells-like-teen-spirit",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    key: "Fm",
    genre: "Grunge",
    bpm: 116,
    durationSec: 301,
    notes: "Power chord riff: F5 - Bb5 - Ab5 - Db5. Use chorus pedal during verses and full distortion on choruses.",
    sections: [
      {
        type: "intro",
        name: "Intro Riff",
        lines: [
          { comment: "Clean guitar 2 bars, then full band distortion" },
          "[F5]  [Bb5]  [Ab5]  [Db5]",
          "[F5]  [Bb5]  [Ab5]  [Db5]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          { comment: "Bass & drums + 2-note watery guitar motif (C - F)" },
          "[F5]Load up on guns, bring your [Bb5]friends, it's fun to [Ab5]lose and to pre[Db5]tend",
          "[F5]She's over-bored and self-as[Bb5]sured, oh no, I [Ab5]know a dirty [Db5]word",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[F5]Hello, [Bb5]hello, [Ab5]hello, how [Db5]low",
          "[F5]Hello, [Bb5]hello, [Ab5]hello, how [Db5]low",
          "[F5]Hello, [Bb5]hello, [Ab5]hello, how [Db5]low",
          "[F5]Hello, [Bb5]hello, [Ab5]hello!",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "With the [F5]lights out, it's less [Bb5]dangerous, here we [Ab5]are now, enter[Db5]tain us",
          "I feel [F5]stupid and con[Bb5]tagious, here we [Ab5]are now, enter[Db5]tain us",
          "A mu[F5]latto, an al[Bb5]bino, a mos[Ab5]quito, my li[Db5]bido, yeah!",
          "[F5]Hey! [F#5]  [Bb5]Yay!",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[F5]I'm worse at what I do [Bb5]best, and for this [Ab5]gift I feel [Db5]blessed",
          "[F5]Our little group has always [Bb5]been, and always [Ab5]will until the [Db5]end",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[F5]Hello, [Bb5]hello, [Ab5]hello, how [Db5]low",
          "[F5]Hello, [Bb5]hello, [Ab5]hello, how [Db5]low",
          "[F5]Hello, [Bb5]hello, [Ab5]hello!",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "With the [F5]lights out, it's less [Bb5]dangerous, here we [Ab5]are now, enter[Db5]tain us",
          "I feel [F5]stupid and con[Bb5]tagious, here we [Ab5]are now, enter[Db5]tain us",
          "A mu[F5]latto, an al[Bb5]bino, a mos[Ab5]quito, my li[Db5]bido, yeah!",
          "[F5]Hey! [F#5]  [Bb5]Yay!",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo",
        lines: [
          { comment: "Guitar solo mirrors vocal melody over main progression" },
          "[F5]  [Bb5]  [Ab5]  [Db5] (x4)",
        ],
      },
      {
        type: "verse",
        name: "Verse 3 & Outro",
        lines: [
          "[F5]And I forget just why I [Bb5]taste, oh yeah, I [Ab5]guess it makes me [Db5]smile",
          "[F5]I found it hard, it's hard to [Bb5]find, oh well, what[Ab5]ever, never [Db5]mind",
          "[F5]Hello, [Bb5]hello, [Ab5]hello, how [Db5]low",
          "With the [F5]lights out, it's less [Bb5]dangerous, here we [Ab5]are now, enter[Db5]tain us",
          "A de[F5]nial, a de[Bb5]nial, a de[Ab5]nial, a de[Db5]nial, a de[F5]nial!",
        ],
      },
    ],
  },

  // 6. Stand By Me - Ben E. King
  {
    slug: "stand-by-me",
    title: "Stand By Me",
    artist: "Ben E. King",
    key: "A",
    genre: "Soul",
    bpm: 118,
    durationSec: 180,
    notes: "Iconic upright bass line over the I - vi - IV - V progression in A major.",
    sections: [
      {
        type: "intro",
        name: "Bass Intro",
        lines: [
          "[A]    [F#m]    [D]  [E]  [A]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "When the [A]night has come, and the [F#m]land is dark",
          "And the [D]moon is the [E]only light we'll [A]see",
          "No, I [A]won't be afraid, oh, I [F#m]won't be afraid",
          "Just as [D]long as you [E]stand, stand by [A]me",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "So darlin', darlin', [A]stand by me, oh [F#m]stand by me",
          "Oh [D]stand, [E]stand by me, [A]stand by me",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "If the [A]sky that we look upon [F#m]should tumble and fall",
          "Or the [D]mountain should [E]crumble to the [A]sea",
          "I won't [A]cry, I won't cry, no, I [F#m]won't shed a tear",
          "Just as [D]long as you [E]stand, stand by [A]me",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "And darlin', darlin', [A]stand by me, oh [F#m]stand by me",
          "Oh [D]stand now, [E]stand by me, [A]stand by me",
        ],
      },
      {
        type: "solo",
        name: "String Solo",
        lines: [
          "[A]    [F#m]    [D]  [E]  [A]",
          "[A]    [F#m]    [D]  [E]  [A]",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "Darlin', darlin', [A]stand by me, oh [F#m]stand by me",
          "Oh [D]stand now, [E]stand by me, [A]stand by me",
          "Whenever you're in trouble won't you [A]stand by me, oh [F#m]stand by me",
          "Oh [D]stand now, [E]stand by me, [A]stand by me",
        ],
      },
    ],
  },

  // 7. Wish You Were Here - Pink Floyd
  {
    slug: "wish-you-were-here",
    title: "Wish You Were Here",
    artist: "Pink Floyd",
    key: "G",
    genre: "Classic Rock",
    bpm: 60,
    durationSec: 334,
    notes: "12-string acoustic riff on Em7 and G with open D and A strings ringing.",
    sections: [
      {
        type: "intro",
        name: "12-String Intro & Solo",
        lines: [
          "[Em7]  [G]  [Em7]  [G]",
          "[Em7]  [A7sus4]  [Em7]  [A7sus4]  [G]",
          "[Em7]  [G]  [Em7]  [G]  [Em7]  [A7sus4]  [Em7]  [A7sus4]  [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[C]So, so you think you can [D/F#]tell",
          "Heaven from [Am]hell, blue skies from [G]pain",
          "Can you tell a green [D/F#]field from a cold steel [C]rail?",
          "A smile from a [Am]veil? Do you think you can [G]tell?",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Did they get you to [C]trade your heroes for [D/F#]ghosts?",
          "Hot ashes for [Am]trees? Hot air for a [G]cool breeze?",
          "Cold comfort for [D/F#]change? Did you ex[C]change",
          "A walk on part in the [Am]war for a lead role in a [G]cage?",
        ],
      },
      {
        type: "solo",
        name: "Acoustic Interlude",
        lines: [
          "[Em7]  [G]  [Em7]  [G]",
          "[Em7]  [A7sus4]  [Em7]  [A7sus4]  [G]",
        ],
      },
      {
        type: "chorus",
        name: "Main Refrain (Verse 3)",
        lines: [
          "[C]How I wish, how I wish you were [D/F#]here",
          "We're just [Am]two lost souls swimming in a fish [G]bowl, year after year",
          "[D/F#]Running over the same old [C]ground, what have we found?",
          "The same old [Am]fears, wish you were [G]here",
        ],
      },
      {
        type: "outro",
        name: "Outro Solo & Wind Fade",
        lines: [
          "[Em7]  [G]  [Em7]  [G]",
          "[Em7]  [A7sus4]  [Em7]  [A7sus4]  [G]",
          "[Em7]  [G]  [Em7]  [G] (Fade out with wind)",
        ],
      },
    ],
  },

  // 8. Californication - Red Hot Chili Peppers
  {
    slug: "californication",
    title: "Californication",
    artist: "Red Hot Chili Peppers",
    key: "Am",
    genre: "Alternative Rock",
    bpm: 96,
    durationSec: 329,
    notes: "Interlocking clean guitar and melodic bassline on Am - F. Modulates to F#m for the guitar solo.",
    sections: [
      {
        type: "intro",
        name: "Intro Arpeggio",
        lines: [
          "[Am]    [F]    [Am]    [F]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Am]Psychic spies from China try to [F]steal your mind's elation",
          "[Am]And little girls from Sweden dream of [F]silver screen quotation",
          "And [C]if you want these [G]kind of dreams it's [F]Californi[Dm]cation",
          "[Am]    [F]",
          "[Am]It's the edge of the world and all of [F]western civilization",
          "[Am]The sun may rise in the East at least it's [F]settled in a final location",
          "It's [C]understood that [G]Hollywood sells [F]Californi[Dm]cation",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[Am]Pay your surgeon [F]very well to [Am]break the spell of [F]aging",
          "[Am]Celebrity skin, is [F]this your chin, or [Am]is that war you're [F]waging?",
          "[Am]First born uni[F]corn, [Am]hardcore soft [F]porn",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[C]Dream of Cali[G]forni[Dm]cation [Am]",
          "[C]Dream of Cali[G]forni[Dm]cation",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Am]Marry me, girl, be my fairy to the [F]world, be my very own constellation",
          "[Am]A teenage bride with a baby inside [F]getting high on information",
          "And [C]buy me a star on the [G]boulevard, it's [F]Californi[Dm]cation",
          "[Am]Space may be the final frontier [F]but it's made in a Hollywood basement",
          "[Am]And Cobain can you hear the spheres [F]singing songs off Station to Station?",
          "And [C]Alderaan's not [G]far away, it's [F]Californi[Dm]cation",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[Am]Born and raised by [F]those who praise con[Am]trol of popu[F]lation",
          "[Am]Everybody's been there and [F]I don't mean on [Am]vaca[F]tion",
          "[Am]First born uni[F]corn, [Am]hardcore soft [F]porn",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[C]Dream of Cali[G]forni[Dm]cation [Am]",
          "[C]Dream of Cali[G]forni[Dm]cation [Am]",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo (Key Shift to F#m)",
        lines: [
          "[F#m]  [D]  [F#m]  [D]",
          "[Bm]  [D]  [A]  [E]",
          "[F#m]  [D]  [F#m]  [D]",
          "[Bm]  [D]  [A]  [E] (x2)",
        ],
      },
      {
        type: "verse",
        name: "Verse 3 & Final Chorus",
        lines: [
          "[Am]Destruction leads to a very rough [F]road but it also breeds creation",
          "[Am]And earthquakes are to a girl's guitar, [F]they're just another good vibration",
          "And [C]tidal waves couldn't [G]save the world from [F]Californi[Dm]cation",
          "[Am]First born uni[F]corn, [Am]hardcore soft [F]porn",
          "[C]Dream of Cali[G]forni[Dm]cation [Am]",
          "[C]Dream of Cali[G]forni[Dm]cation",
        ],
      },
    ],
  },

  // 9. Perfect - Ed Sheeran
  {
    slug: "perfect",
    title: "Perfect",
    artist: "Ed Sheeran",
    key: "G",
    genre: "Pop",
    bpm: 95,
    capo: 1,
    durationSec: 263,
    notes: "Capo 1st fret (Ab concert pitch, played in G shapes). 12/8 waltz feel.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[G]   [Em]   [C]   [D]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "I found a [G]love for [Em]me",
          "Oh darling, [C]just dive right in and follow my [D]lead",
          "Well, I found a [G]girl, beautiful and [Em]sweet",
          "Oh, I never [C]knew you were the someone waiting for [D]me",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "'Cause we were just kids when we [G]fell in love",
          "Not knowing [Em]what it was",
          "I will not [C]give you up this [G]time [D]",
          "But darling, just [G]kiss me slow, your heart is [Em]all I own",
          "And in your [C]eyes you're holding [D]mine",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Baby, [Em]I'm [C]dancing in the [G]dark, with [D]you between my [Em]arms",
          "[C]Barefoot on the [G]grass, [D]listening to our [Em]favourite song",
          "When you [C]said you looked a [G]mess, I whispered [D]underneath my [Em]breath",
          "But you [C]heard it, darling, [G]you look [D]perfect to[G]night [D/F#] [Em] [D] [C] [D]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Well I found a [G]woman, stronger than [Em]anyone I know",
          "She shares my [C]dreams, I hope that someday I'll share her [D]home",
          "I found a [G]love, to carry [Em]more than just my secrets",
          "To carry [C]love, to carry children of our [D]own",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "We are still kids, but we're [G]so in love",
          "Fighting a[Em]gainst all odds",
          "I know we'll [C]be alright this [G]time [D]",
          "Darling, just [G]hold my hand, be my girl, I'll [Em]be your man",
          "I see my [C]future in your [D]eyes",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "Baby, [Em]I'm [C]dancing in the [G]dark, with [D]you between my [Em]arms",
          "[C]Barefoot on the [G]grass, [D]listening to our [Em]favourite song",
          "When I [C]saw you in that [G]dress, looking so [D]beautiful",
          "I [Em]don't de[C]serve this, darling, [G]you look [D]perfect to[G]night",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo",
        lines: [
          "[G]   [Em]   [C]   [D]",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "Baby, [Em]I'm [C]dancing in the [G]dark, with [D]you between my [Em]arms",
          "[C]Barefoot on the [G]grass, [D]listening to our [Em]favourite song",
          "I have [C]faith in what I [G]see, now I know [D]I have met an [Em]angel in [C]person",
          "And [G]she looks [D]perfect, I [C]don't deserve this, [D]you look perfect to[G]night",
        ],
      },
    ],
  },

  // 10. Riptide - Vance Joy
  {
    slug: "riptide",
    title: "Riptide",
    artist: "Vance Joy",
    key: "Am",
    genre: "Indie",
    bpm: 102,
    capo: 1,
    durationSec: 204,
    notes: "Upbeat ukulele / acoustic guitar strumming on Am - G - C.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[Am]  [G]  [C]  [C]",
          "[Am]  [G]  [C]  [C]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Am]I was scared of [G]dentists and the [C]dark",
          "[Am]I was scared of [G]pretty girls and [C]starting conversations",
          "Oh, [Am]all my [G]friends are turning [C]green",
          "You're the [Am]magician's as[G]sistant in their [C]dreams",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[Am]Ooh, [G]ooh, [C]ooh",
          "[Am]Ooh, [G]ooh, and they [C]come unstuck",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[Am]Lady, [G]running down to the [C]riptide, taken away to the",
          "[Am]Dark side, [G]I wanna be your [C]left hand man",
          "[Am]I love you [G]when you're singing that [C]song and",
          "I got a lump in my [Am]throat 'cause [G]you're gonna sing the [C]words wrong",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Am]There's this movie [G]that I think you'll [C]like",
          "This [Am]guy decides to [G]quit his job and [C]heads to New York City",
          "This [Am]cowboy's [G]running from him[C]self",
          "And [Am]she's been living [G]on the highest [C]shelf",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[Am]Ooh, [G]ooh, [C]ooh",
          "[Am]Ooh, [G]ooh, and they [C]come unstuck",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[Am]Lady, [G]running down to the [C]riptide, taken away to the",
          "[Am]Dark side, [G]I wanna be your [C]left hand man",
          "[Am]I love you [G]when you're singing that [C]song and",
          "I got a lump in my [Am]throat 'cause [G]you're gonna sing the [C]words wrong",
        ],
      },
      {
        type: "bridge",
        name: "Bridge",
        lines: [
          "[Am]I just wanna, I just wanna [G]know",
          "[C]If you're gonna, if you're gonna [Fmaj7]stay",
          "[Am]I just gotta, I just gotta [G]know",
          "[C]I can't have it, I can't have it [Fmaj7]any other way",
          "I [Am]swear she's [G]destined for the [C]screen",
          "[Am]Closest thing to [G]Michelle Pfeiffer [C]that you've ever seen, oh",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "[Am]Lady, [G]running down to the [C]riptide, taken away to the",
          "[Am]Dark side, [G]I wanna be your [C]left hand man",
          "[Am]I love you [G]when you're singing that [C]song and",
          "I got a lump in my [Am]throat 'cause [G]you're gonna sing the [C]words wrong",
          "I got a lump in my [Am]throat 'cause [G]you're gonna sing the [C]words wrong",
        ],
      },
    ],
  },

  // 11. Boulevard of Broken Dreams - Green Day
  {
    slug: "boulevard-of-broken-dreams",
    title: "Boulevard of Broken Dreams",
    artist: "Green Day",
    key: "Fm",
    genre: "Rock",
    bpm: 84,
    capo: 1,
    durationSec: 262,
    notes: "Capo 1st Fret (Em shapes). Tremolo effect on verse guitar; heavy power chords on chorus.",
    sections: [
      {
        type: "intro",
        name: "Tremolo Intro",
        lines: [
          "[Em]  [G]  [D]  [A] (x2)",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em]I walk a [G]lonely road, the [D]only one that [A]I have ever [Em]known",
          "Don't know [G]where it goes, [D]but it's home to [A]me, and I walk a[Em]lone",
          "[Em]I walk this [G]empty street, [D]on the Boule[A]vard of Broken [Em]Dreams",
          "Where the [G]city sleeps, [D]and I'm the only [A]one, and I walk a[Em]lone",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[C]My shadow's the [G]only one that [D]walks beside [Em]me",
          "[C]My shallow [G]heart's the only [D]thing that's [Em]beating",
          "[C]Sometimes I [G]wish someone out [D]there will find [Em]me",
          "[C]'Til then I [G]walk a[B7]lone",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em]I'm walking [G]down the line, [D]that divides me [A]somewhere in my [Em]mind",
          "On the [G]border line, [D]of the edge and [A]where I walk a[Em]lone",
          "[Em]Read be[G]tween the lines, [D]what's messed up and [A]everything's al[Em]right",
          "Check my [G]vital signs, [D]to know I'm still a[A]live, and I walk a[Em]lone",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[C]My shadow's the [G]only one that [D]walks beside [Em]me",
          "[C]My shallow [G]heart's the only [D]thing that's [Em]beating",
          "[C]Sometimes I [G]wish someone out [D]there will find [Em]me",
          "[C]'Til then I [G]walk a[B7]lone",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo",
        lines: [
          "[Em]  [G]  [D]  [A] (x4)",
          "[C]  [G]  [D]  [Em] (x3)",
          "[C]  [G]  [B7]",
        ],
      },
      {
        type: "outro",
        name: "Verse 3 & Staccato Outro",
        lines: [
          "[Em]I walk this [G]empty street, [D]on the Boule[A]vard of Broken [Em]Dreams",
          "Where the [G]city sleeps, [D]and I'm the only [A]one, and I walk a",
          "[C]My shadow's the [G]only one that [D]walks beside [Em]me",
          "[C]Sometimes I [G]wish someone out [D]there will find [Em]me",
          "[C]'Til then I [G]walk a[B7]lone...",
          "[Em] [G] [D] [A/C#] [C] [G/B] [B7] (Heavy staccato outro)",
        ],
      },
    ],
  },

  // 12. Sweet Child O' Mine - Guns N' Roses
  {
    slug: "sweet-child-o-mine",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    key: "D",
    genre: "Rock",
    bpm: 125,
    durationSec: 356,
    notes: "Original recording tuned half-step down (Eb). Chords shown in standard D shapes (D - C - G - D).",
    sections: [
      {
        type: "intro",
        name: "Slash Arpeggio Intro",
        lines: [
          "[D]    [Cadd9]    [G]    [D]",
          "[D]    [Cadd9]    [G]    [D]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[D]She's got a smile that it seems to me, [Cadd9]reminds me of childhood memories",
          "Where [G]everything was as fresh as the bright blue [D]sky",
          "[D]Now and then when I see her face, [Cadd9]she takes me away to that special place",
          "And if I [G]stared too long I'd probably break down and [D]cry",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[A]Whoa, oh, [C]oh, sweet [D]child o' mine",
          "[A]Whoa, oh, oh, [C]oh, sweet [D]love of mine",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[D]She's got eyes of the bluest skies, [Cadd9]as if they thought of rain",
          "I [G]hate to look into those eyes and [D]see an ounce of pain",
          "Her [D]hair reminds me of a warm safe place, [Cadd9]where as a child I'd hide",
          "And [G]pray for the thunder and the rain to [D]quietly pass me by",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[A]Whoa, oh, [C]oh, sweet [D]child o' mine",
          "[A]Whoa, oh, oh, [C]oh, sweet [D]love of mine",
        ],
      },
      {
        type: "solo",
        name: "Main Guitar Solo (Modulates to Em)",
        lines: [
          { comment: "Part 1: Melodic Solo" },
          "[Em]  [C]  [B7]  [Am] (x2)",
          { comment: "Part 2: Wah-Wah Shred Solo" },
          "[Em]  [G]  [A]  [C] [D] (x4)",
        ],
      },
      {
        type: "outro",
        name: "Where Do We Go Now? (Outro)",
        lines: [
          "[Em]Where do we go? [G]Where do we go now? [A]Where do we go? [C] [D]",
          "[Em]Where do we go? [G]Sweet child, [A]where do we go [C]now? [D]",
          "[Em]Ay, ay, ay, [G]ay, where do we [A]go now? [C] [D]",
          "[Em]Sweet [G]child, sweet [A]child o' [C]mine [D] [Em]",
        ],
      },
    ],
  },

  // 13. Someone Like You - Adele
  {
    slug: "someone-like-you",
    title: "Someone Like You",
    artist: "Adele",
    key: "A",
    genre: "Pop",
    bpm: 67,
    durationSec: 285,
    notes: "Rolling piano arpeggio ballad in A major (A - E/G# - F#m - D).",
    sections: [
      {
        type: "intro",
        name: "Piano Intro",
        lines: [
          "[A]   [E/G#]   [F#m]   [D]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[A]I heard that you're [E/G#]settled down",
          "That you [F#m]found a girl and you're [D]married now",
          "[A]I heard that your [E/G#]dreams came true",
          "Guess she [F#m]gave you things I didn't [D]give to you",
          "[A]Old friend, why [E/G#]are you so shy?",
          "Ain't like [F#m]you to hold back or [D]hide from the light",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[E]I hate to turn up out of the [F#m]blue, uninvited",
          "But I [D]couldn't stay away, I couldn't fight it",
          "I had [E]hoped you'd see my face and [F#m]that you'd be reminded",
          "That for [D]me, it isn't [Dm]over",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[A]Never mind, I'll [E]find someone like [F#m]you [D]",
          "I wish [A]nothing but the [E]best for [F#m]you, [D]too",
          "Don't for[A]get me, I [E]beg, I re[F#m]member you [D]said",
          "Sometimes it [A]lasts in love, but [E]sometimes it hurts in[F#m]stead [D]",
          "Sometimes it [A]lasts in love, but [E]sometimes it hurts in[F#m]stead [D]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[A]You know how the [E/G#]time flies",
          "Only [F#m]yesterday was the [D]time of our lives",
          "We were [A]born and raised in a [E/G#]summer haze",
          "Bound [F#m]by the surprise of our [D]glory days",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[E]I hate to turn up out of the [F#m]blue, uninvited",
          "But I [D]couldn't stay away, I couldn't fight it",
          "I had [E]hoped you'd see my face and [F#m]that you'd be reminded",
          "That for [D]me, it isn't [Dm]over",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[A]Never mind, I'll [E]find someone like [F#m]you [D]",
          "I wish [A]nothing but the [E]best for [F#m]you, [D]too",
          "Don't for[A]get me, I [E]beg, I re[F#m]member you [D]said",
          "Sometimes it [A]lasts in love, but [E]sometimes it hurts in[F#m]stead [D]",
        ],
      },
      {
        type: "bridge",
        name: "Bridge",
        lines: [
          "[E]Nothing compares, no [B/D#]worries or cares",
          "[D]Regrets and mistakes, they're [A/C#]memories made",
          "[Bm]Who would have known how [A/C#]bitter-[D]sweet this would [E]taste?",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "[A]Never mind, I'll [E]find someone like [F#m]you [D]",
          "I wish [A]nothing but the [E]best for [F#m]you [D]",
          "Don't for[A]get me, I [E]beg, I re[F#m]member you [D]said",
          "Sometimes it [A]lasts in love, but [E]sometimes it hurts in[F#m]stead [D] [A]",
        ],
      },
    ],
  },

  // 14. House of the Rising Sun - The Animals
  {
    slug: "house-of-the-rising-sun",
    title: "House of the Rising Sun",
    artist: "The Animals",
    key: "Am",
    genre: "Classic Rock",
    bpm: 116,
    durationSec: 270,
    notes: "6/8 blues-folk classic. Sweep-arpeggiate every chord cleanly; Alan Price organ solo in the middle.",
    sections: [
      {
        type: "intro",
        name: "6/8 Arpeggio Intro",
        lines: [
          "[Am]  [C]  [D]  [F]  [Am]  [E]  [Am]  [E7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "There [Am]is a [C]house in [D]New Or[F]leans",
          "They [Am]call the [C]Rising [E]Sun [E7]",
          "And it's [Am]been the [C]ruin of [D]many a poor [F]boy",
          "And [Am]God, I [E7]know I'm [Am]one [C] [D] [F] [Am] [E7] [Am] [E7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "My [Am]mother [C]was a [D]tailor [F]",
          "She [Am]sewed my [C]new blue [E]jeans [E7]",
          "My [Am]father [C]was a [D]gamblin' [F]man",
          "Down [Am]in New [E7]Orleans [Am] [C] [D] [F] [Am] [E7] [Am] [E7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Now the [Am]only [C]thing a [D]gambler [F]needs",
          "Is a [Am]suitcase [C]and a [E]trunk [E7]",
          "And the [Am]only [C]time he's [D]satis[F]fied",
          "Is [Am]when he's [E7]on a [Am]drunk [C] [D] [F] [Am] [E7] [Am] [E7]",
        ],
      },
      {
        type: "solo",
        name: "Organ Solo",
        lines: [
          "[Am]  [C]  [D]  [F]  [Am]  [C]  [E]  [E7]",
          "[Am]  [C]  [D]  [F]  [Am]  [E7]  [Am]  [E7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "Oh [Am]mother, [C]tell your [D]children [F]",
          "Not to [Am]do what [C]I have [E]done [E7]",
          "Spend your [Am]lives in [C]sin and [D]mise[F]ry",
          "In the [Am]House of the [E7]Rising [Am]Sun [C] [D] [F] [Am] [E7] [Am] [E7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 5",
        lines: [
          "Well, I got [Am]one foot [C]on the [D]platform [F]",
          "The [Am]other foot [C]on the [E]train [E7]",
          "I'm [Am]goin' [C]back to [D]New Or[F]leans",
          "To [Am]wear that [E7]ball and [Am]chain [C] [D] [F] [Am] [E7] [Am] [E7]",
        ],
      },
      {
        type: "outro",
        name: "Verse 6 & Outro",
        lines: [
          "Well, there [Am]is a [C]house in [D]New Or[F]leans",
          "They [Am]call the [C]Rising [E]Sun [E7]",
          "And it's [Am]been the [C]ruin of [D]many a poor [F]boy",
          "And [Am]God, I [E7]know I'm [Am]one [Dm] [Am] [Dm] [Am9]",
        ],
      },
    ],
  },

  // 15. Knockin' on Heaven's Door - Bob Dylan
  {
    slug: "knockin-on-heavens-door",
    title: "Knockin' on Heaven's Door",
    artist: "Bob Dylan",
    key: "G",
    genre: "Folk",
    bpm: 72,
    durationSec: 170,
    notes: "Alternates G - D - Am7 and G - D - C. Great for open vocal harmonies and dynamics.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[G]  [D]  [Am7]  [Am7]",
          "[G]  [D]  [C]    [C]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[G]Mama, take this [D]badge off of [Am7]me",
          "[G]I can't [D]use it any[C]more",
          "[G]It's gettin' [D]dark, too dark to [Am7]see",
          "[G]I feel I'm [D]knockin' on heaven's [C]door",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[G]Knock, knock, [D]knockin' on heaven's [Am7]door",
          "[G]Knock, knock, [D]knockin' on heaven's [C]door",
          "[G]Knock, knock, [D]knockin' on heaven's [Am7]door",
          "[G]Knock, knock, [D]knockin' on heaven's [C]door",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo",
        lines: [
          "[G]  [D]  [Am7]  [G]  [D]  [C] (x2)",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[G]Mama, put my [D]guns in the [Am7]ground",
          "[G]I can't [D]shoot them any[C]more",
          "[G]That long black [D]cloud is comin' [Am7]down",
          "[G]I feel I'm [D]knockin' on heaven's [C]door",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2 & Outro",
        lines: [
          "[G]Knock, knock, [D]knockin' on heaven's [Am7]door",
          "[G]Knock, knock, [D]knockin' on heaven's [C]door",
          "[G]Knock, knock, [D]knockin' on heaven's [Am7]door",
          "[G]Knock, knock, [D]knockin' on heaven's [C]door [G]",
        ],
      },
    ],
  },

  // 16. Hey Jude - The Beatles
  {
    slug: "hey-jude",
    title: "Hey Jude",
    artist: "The Beatles",
    key: "F",
    genre: "Classic Rock",
    bpm: 73,
    durationSec: 431,
    notes: "Starts with solo vocal & piano on F; builds into the famous F - Eb - Bb - F singalong coda.",
    sections: [
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Hey [F]Jude, don't make it [C]bad",
          "Take a [C7]sad song and make it [F]better",
          "Re[Bb]member to let her into your [F]heart",
          "Then you can [C7]start to make it [F]better",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Hey [F]Jude, don't be a[C]fraid",
          "You were [C7]made to go out and [F]get her",
          "The [Bb]minute you let her under your [F]skin",
          "Then you be[C7]gin to make it [F]better [F7]",
        ],
      },
      {
        type: "bridge",
        name: "Bridge 1",
        lines: [
          "And anytime you feel the [Bb]pain, hey [Bb/A]Jude, re[Gm7]frain",
          "Don't [F/A]carry the [C/G]world upon your [C7]shoulders [F] [F7]",
          "For well you know that it's a [Bb]fool who [Bb/A]plays it [Gm7]cool",
          "By [F/A]making his [C/G]world a little [C7]colder",
          "Da da da [F]da da [C7]da da da [C]da",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Hey [F]Jude, don't let me [C]down",
          "You have [C7]found her, now go and [F]get her",
          "Re[Bb]member to let her into your [F]heart",
          "Then you can [C7]start to make it [F]better [F7]",
        ],
      },
      {
        type: "bridge",
        name: "Bridge 2",
        lines: [
          "So let it out and let it [Bb]in, hey [Bb/A]Jude, be[Gm7]gin",
          "You're [F/A]waiting for [C/G]someone to per[C7]form with [F] [F7]",
          "And don't you know that it's just [Bb]you, hey [Bb/A]Jude, you'll [Gm7]do",
          "The [F/A]movement you [C/G]need is on your [C7]shoulder",
          "Na na na [F]na na [C7]na na na [C]na, yeah",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "Hey [F]Jude, don't make it [C]bad",
          "Take a [C7]sad song and make it [F]better",
          "Re[Bb]member to let her under your [F]skin",
          "Then you'll be[C7]gin to make it [F]better",
          "Better, better, better, better, [C7]better, oh!",
        ],
      },
      {
        type: "outro",
        name: "Grand Singalong Coda",
        lines: [
          "[F]Na na na [Eb]na-na-na [Bb]na, na-na-na [F]na, hey Jude",
          "[F]Na na na [Eb]na-na-na [Bb]na, na-na-na [F]na, hey Jude",
          "[F]Na na na [Eb]na-na-na [Bb]na, na-na-na [F]na, hey Jude (Repeat & build)",
        ],
      },
    ],
  },

  // 17. Hallelujah - Leonard Cohen
  {
    slug: "hallelujah",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    key: "C",
    genre: "Folk",
    bpm: 56,
    durationSec: 279,
    notes: "6/8 arpeggiated ballad. Literally describes its own chord progression in Verse 1 (fourth, fifth, minor fall, major lift).",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[C]  [Am]  [C]  [Am]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Now I've [C]heard there was a [Am]secret chord",
          "That [C]David played, and it [Am]pleased the Lord",
          "But [F]you don't really [G]care for music, [C]do you? [G]",
          "It [C]goes like this, the [F]fourth, the [G]fifth",
          "The [Am]minor fall, the [F]major lift",
          "The [G]baffled king com[E7]posing Halle[Am]lujah",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Halle[F]lujah, Halle[Am]lujah",
          "Halle[F]lujah, Halle[C]lu[G]jah [C] [Am] [C] [Am]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Your [C]faith was strong but you [Am]needed proof",
          "You [C]saw her bathing [Am]on the roof",
          "Her [F]beauty and the [G]moonlight over[C]threw ya [G]",
          "She [C]tied you to a [F]kitchen [G]chair",
          "She [Am]broke your throne, and she [F]cut your hair",
          "And [G]from your lips she [E7]drew the Halle[Am]lujah",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "Halle[F]lujah, Halle[Am]lujah",
          "Halle[F]lujah, Halle[C]lu[G]jah [C] [Am]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Maybe [C]there's a God a[Am]bove",
          "But [C]all I've ever [Am]learned from love",
          "Was [F]how to shoot at [G]someone who out[C]drew ya [G]",
          "And it's [C]not a cry you can [F]hear at [G]night",
          "It's [Am]not somebody who's [F]seen the light",
          "It's a [G]cold and it's a [E7]broken Halle[Am]lujah",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "Halle[F]lujah, Halle[Am]lujah",
          "Halle[F]lujah, Halle[C]lu[G]jah",
          "Halle[F]lujah, Halle[Am]lujah",
          "Halle[F]lujah, Halle[C]lu[G]jah [C]",
        ],
      },
    ],
  },

  // 18. Zombie - The Cranberries
  {
    slug: "zombie",
    title: "Zombie",
    artist: "The Cranberries",
    key: "Em",
    genre: "Alternative Rock",
    bpm: 84,
    durationSec: 306,
    notes: "Four-chord anthem (Em - C - G - D/F#) with dynamic shifts between clean arpeggios and heavy wall-of-sound distortion.",
    sections: [
      {
        type: "intro",
        name: "Intro (Clean then Heavy)",
        lines: [
          "[Em]  [C]  [G]  [D/F#] (x4)",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em]Another head [C]hangs lowly, [G]child is slowly [D/F#]taken",
          "And the [Em]violence [C]caused such silence, [G]who are we mis[D/F#]taken?",
          "But you [Em]see, it's not me, it's not [C]my family",
          "In your [G]head, in your head, they are [D/F#]fighting",
          "With their [Em]tanks, and their bombs, and their [C]bombs, and their guns",
          "In your [G]head, in your head, they are [D/F#]cryin'",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "In your [Em]head, in your [C]head,",
          "Zombie, [G]zombie, [D/F#]zombie-ie-ie",
          "What's in your [Em]head, in your [C]head,",
          "Zombie, [G]zombie, [D/F#]zombie-ie-ie-ie, oh [Em] [C] [G] [D/F#]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em]Another mother's [C]breakin' heart is [G]taking over [D/F#]",
          "When the [Em]violence [C]causes silence, [G]we must be mis[D/F#]taken",
          "It's the [Em]same old theme since [C]nineteen-sixteen",
          "In your [G]head, in your head, they're still [D/F#]fightin'",
          "With their [Em]tanks, and their bombs, and their [C]bombs, and their guns",
          "In your [G]head, in your head, they are [D/F#]dyin'",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "In your [Em]head, in your [C]head,",
          "Zombie, [G]zombie, [D/F#]zombie-ie-ie",
          "What's in your [Em]head, in your [C]head,",
          "Zombie, [G]zombie, [D/F#]zombie-ie-ie-ie, oh!",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo & Outro",
        lines: [
          "[Em]  [C]  [G]  [D/F#] (x4)",
          "[Em]  [C]  [Em]  [C]  [Em]",
        ],
      },
    ],
  },

  // 19. Nothing Else Matters - Metallica
  {
    slug: "nothing-else-matters",
    title: "Nothing Else Matters",
    artist: "Metallica",
    key: "Em",
    genre: "Metal",
    bpm: 69,
    durationSec: 388,
    notes: "6/8 fingerstyle open-string Em intro; builds to James Hetfield's powerful solo at the climax.",
    sections: [
      {
        type: "intro",
        name: "Open String Fingerstyle Intro",
        lines: [
          "[Em]  [D]  [C]  [Em]  [D]  [C]",
          "[Em]  [Am] [C] [D] [Em]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em]So close, no matter [D]how far [C]",
          "[Em]Couldn't be much more [D]from the heart [C]",
          "[Em]Forever trusting [D]who we are [C]",
          "[G]And [B7]nothing else [Em]matters",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em]Never opened my[D]self this way [C]",
          "[Em]Life is ours, we live it [D]our way [C]",
          "[Em]All these words I don't [D]just say [C]",
          "[G]And [B7]nothing else [Em]matters",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[Em]Trust I seek and I [D]find in you [C]",
          "[Em]Every day for us [D]something new [C]",
          "[Em]Open mind for a [D]different view [C]",
          "[G]And [B7]nothing else [Em]matters [C] [A]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[D]Never cared for what they [C]do [A]",
          "[D]Never cared for what they [C]know [A]",
          "[D]But I [Em]know",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "[Em]So close, no matter [D]how far [C]",
          "[Em]It couldn't be much more [D]from the heart [C]",
          "[Em]Forever trusting [D]who we are [C]",
          "[G]And [B7]nothing else [Em]matters [C] [A]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[D]Never cared for what they [C]do [A]",
          "[D]Never cared for what they [C]know [A]",
          "[D]But I [Em]know",
        ],
      },
      {
        type: "solo",
        name: "Acoustic Interlude & Heavy Guitar Solo",
        lines: [
          "[Em]  [D]  [C]  [G]  [B7]  [Em] (x2)",
          { comment: "James Hetfield Heavy Lead Solo" },
          "[Em]  [D]  [C]  [G]  [B7]  [Em] (x2)",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "[D]Never cared for what they [C]say [A]",
          "[D]Never cared for games they [C]play [A]",
          "[D]Never cared for what they [C]do [A]",
          "[D]Never cared for what they [C]know [A]",
          "[D]And I [Em]know, yeah!",
          "[Em]So close, no matter [D]how far [C]",
          "[G]And [B7]nothing else [Em]matters...",
        ],
      },
    ],
  },

  // 20. Yellow - Coldplay
  {
    slug: "yellow",
    title: "Yellow",
    artist: "Coldplay",
    key: "B",
    genre: "Alternative Rock",
    bpm: 87,
    durationSec: 269,
    notes: "Played in B major (or A shapes with Capo 2: B - F# - E - B).",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[B]  [F#]  [E]  [B]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[B]Look at the stars, look how they [F#]shine for you",
          "And everything you [E]do, yeah, they were all [B]yellow",
          "[B]I came along, I wrote a [F#]song for you",
          "And all the things you [E]do, and it was called [B]Yellow",
          "[B]So then I took my [F#]turn, oh what a thing to have [E]done",
          "And it was all [B]yellow [Bsus4] [B]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[E]Your [G#m]skin, oh [F#]yeah, your skin and [E]bones",
          "[G#m]Turn in[F#]to something [E]beautiful",
          "[G#m]Do you [F#]know, you know I [E]love you so?",
          "You know I love you [B]so [F#] [E] [B]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[B]I swam across, I jumped a[F#]cross for you",
          "Oh, what a thing to [E]do, 'cause you were all [B]yellow",
          "[B]I drew a line, I drew a [F#]line for you",
          "Oh, what a thing to [E]do, and it was all [B]yellow [Bsus4] [B]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[E]And your [G#m]skin, oh [F#]yeah, your skin and [E]bones",
          "[G#m]Turn in[F#]to something [E]beautiful",
          "[G#m]And you [F#]know, for you I'd [E]bleed myself [G#m]dry [F#]",
          "For you I'd [E]bleed myself [B]dry [F#] [E] [B]",
        ],
      },
      {
        type: "outro",
        name: "Outro",
        lines: [
          "It's [B]true, look how they shine for [F#]you",
          "Look how they shine for [E]you, look how they shine for [B]...",
          "Look how they shine for [F#]you, look how they shine for [E]you",
          "Look at the [B]stars, look how they [F#m]shine for you",
          "And all the things that you [E]do...",
        ],
      },
    ],
  },

  // 21. Imagine - John Lennon
  {
    slug: "imagine",
    title: "Imagine",
    artist: "John Lennon",
    key: "C",
    genre: "Classic Rock",
    bpm: 75,
    durationSec: 183,
    notes: "Signature C - Cmaj7 - F piano figure with chromatic A - A# walkup on the guitar/piano.",
    sections: [
      {
        type: "intro",
        name: "Piano Intro",
        lines: [
          "[C]  [Cmaj7]  [F]  (x2)",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[C]Imagine there's [Cmaj7]no [F]heaven",
          "[C]It's easy if [Cmaj7]you [F]try",
          "[C]No hell [Cmaj7]be[F]low us",
          "[C]Above us [Cmaj7]only [F]sky",
          "[F]Imagine [Am/E]all the [Dm7]people [Dm7/C]",
          "[G]Living for to[G7]day... aha-ah...",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[C]Imagine there's [Cmaj7]no [F]countries",
          "[C]It isn't hard [Cmaj7]to [F]do",
          "[C]Nothing to kill [Cmaj7]or [F]die for",
          "[C]And no re[Cmaj7]ligion, [F]too",
          "[F]Imagine [Am/E]all the [Dm7]people [Dm7/C]",
          "[G]Living life in [G7]peace... you...",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[F]You may [G]say I'm a [C]dreamer [E7]",
          "[F]But I'm [G]not the only [C]one [E7]",
          "[F]I hope some[G]day you'll [C]join us [E7]",
          "[F]And the [G]world will [C]be as one",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[C]Imagine no [Cmaj7]pos[F]sessions",
          "[C]I wonder if [Cmaj7]you [F]can",
          "[C]No need for greed [Cmaj7]or [F]hunger",
          "[C]A brotherhood [Cmaj7]of [F]man",
          "[F]Imagine [Am/E]all the [Dm7]people [Dm7/C]",
          "[G]Sharing all the [G7]world... you...",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "[F]You may [G]say I'm a [C]dreamer [E7]",
          "[F]But I'm [G]not the only [C]one [E7]",
          "[F]I hope some[G]day you'll [C]join us [E7]",
          "[F]And the [G]world will [C]live as one",
        ],
      },
    ],
  },

  // 22. Dreams - Fleetwood Mac
  {
    slug: "dreams",
    title: "Dreams",
    artist: "Fleetwood Mac",
    key: "Am",
    genre: "Classic Rock",
    bpm: 120,
    durationSec: 257,
    notes: "Hypnotic two-chord Fmaj7 - G groove throughout, briefly touching Am in the guitar break.",
    sections: [
      {
        type: "intro",
        name: "Intro Groove",
        lines: [
          "[Fmaj7]   [G]   [Fmaj7]   [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Fmaj7]Now here you [G]go again, you [Fmaj7]say you want your [G]freedom",
          "[Fmaj7]Well, who am [G]I to keep you [Fmaj7]down? [G]",
          "[Fmaj7]It's only [G]right that you should [Fmaj7]play the way you [G]feel it",
          "But [Fmaj7]listen carefully [G]to the sound of [Fmaj7]your loneliness",
          "Like a [G]heartbeat drives you [Fmaj7]mad, in the [G]stillness of re[Fmaj7]membering what you [G]had",
          "And what you [Fmaj7]lost, [G]and what you [Fmaj7]had, [G]and what you [Fmaj7]lost [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Oh, [Fmaj7]thunder only [G]happens when it's [Fmaj7]raining [G]",
          "[Fmaj7]Players only [G]love you when they're [Fmaj7]playing [G]",
          "Say, [Fmaj7]women, they will [G]come and they will [Fmaj7]go [G]",
          "When the [Fmaj7]rain washes [G]you clean, you'll [Fmaj7]know, [G]you'll [Fmaj7]know [G]",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo Break",
        lines: [
          "[Am]  [G]  [Fmaj7]  [G] (x2)",
          "[Fmaj7]  [G]  [Fmaj7]  [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Fmaj7]Now here I [G]go again, I [Fmaj7]see the crystal [G]visions",
          "[Fmaj7]I keep my [G]visions to my[Fmaj7]self [G]",
          "[Fmaj7]It's only [G]me who wants to [Fmaj7]wrap around your [G]dreams",
          "And [Fmaj7]have you any [G]dreams you'd like to [Fmaj7]sell? Dreams of [G]loneliness",
          "Like a [Fmaj7]heartbeat drives you [G]mad, in the [Fmaj7]stillness of re[G]membering what you [Fmaj7]had",
          "And what you [G]lost, [Fmaj7]and what you [G]had, [Fmaj7]ooh, what you [G]lost",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "[Fmaj7]Thunder only [G]happens when it's [Fmaj7]raining [G]",
          "[Fmaj7]Players only [G]love you when they're [Fmaj7]playing [G]",
          "[Fmaj7]Women, they will [G]come and they will [Fmaj7]go [G]",
          "When the [Fmaj7]rain washes [G]you clean, you'll [Fmaj7]know [G]",
          "You'll [Fmaj7]know, you will [G]know, oh you'll [Fmaj7]know [G]",
        ],
      },
    ],
  },

  // 23. Can't Help Falling in Love - Elvis Presley
  {
    slug: "cant-help-falling-in-love",
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley",
    key: "C",
    genre: "Pop",
    bpm: 67,
    capo: 2,
    durationSec: 182,
    notes: "12/8 romantic ballad. Capo 2 in C shapes gives the original D major pitch.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[C]  [G]  [Am]  [F]  [C]  [G]  [C]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[C]Wise [Em]men [Am]say, only [F]fools [C]rush [G]in",
          "But [F]I [G]can't [Am]help [F]falling in [C]love [G]with [C]you",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[C]Shall [Em]I [Am]stay? Would it [F]be [C]a [G]sin",
          "If [F]I [G]can't [Am]help [F]falling in [C]love [G]with [C]you?",
        ],
      },
      {
        type: "bridge",
        name: "Bridge 1",
        lines: [
          "[Em]Like a river [B7]flows, [Em]surely to the [B7]sea",
          "[Em]Darling, so it [B7]goes, [Em]some things [A7]are meant to [Dm]be [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[C]Take [Em]my [Am]hand, take my [F]whole [C]life [G]too",
          "For [F]I [G]can't [Am]help [F]falling in [C]love [G]with [C]you",
        ],
      },
      {
        type: "bridge",
        name: "Bridge 2",
        lines: [
          "[Em]Like a river [B7]flows, [Em]surely to the [B7]sea",
          "[Em]Darling, so it [B7]goes, [Em]some things [A7]are meant to [Dm]be [G]",
        ],
      },
      {
        type: "outro",
        name: "Final Verse & Outro",
        lines: [
          "[C]Take [Em]my [Am]hand, take my [F]whole [C]life [G]too",
          "For [F]I [G]can't [Am]help [F]falling in [C]love [G]with [C]you",
          "For [F]I [G]can't [Am]help [F]falling in [C]love [G]with [C]you",
        ],
      },
    ],
  },

  // 24. Amazing Grace - Traditional Hymn
  {
    slug: "amazing-grace",
    title: "Amazing Grace",
    artist: "John Newton (Traditional Hymn)",
    key: "G",
    genre: "Folk",
    bpm: 72,
    durationSec: 210,
    notes: "Public domain 3/4 hymn with all 5 traditional verses.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[G]   [G7/B]   [C]   [G]   [D7]   [G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[G]Amazing [G7]grace! How [C]sweet the [G]sound",
          "That [G]saved a [Em]wretch like [D]me!",
          "I [G]once was [G7]lost, but [C]now am [G]found;",
          "Was [Em]blind, but [D]now I [G]see.",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "'Twas [G]grace that [G7]taught my [C]heart to [G]fear,",
          "And [G]grace my [Em]fears re[D]lieved;",
          "How [G]precious [G7]did that [C]grace ap[G]pear",
          "The [Em]hour I [D]first be[G]lieved.",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Through [G]many [G7]dangers, [C]toils and [G]snares,",
          "I [G]have al[Em]ready [D]come;",
          "'Tis [G]grace hath [G7]brought me [C]safe thus [G]far,",
          "And [Em]grace will [D]lead me [G]home.",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "The [G]Lord has [G7]promised [C]good to [G]me,",
          "His [G]Word my [Em]hope se[D]cures;",
          "He [G]will my [G7]Shield and [C]Portion [G]be,",
          "As [Em]long as [D]life en[G]dures.",
        ],
      },
      {
        type: "outro",
        name: "Verse 5 & Outro",
        lines: [
          "When [G]we've been [G7]there ten [C]thousand [G]years,",
          "Bright [G]shining [Em]as the [D]sun,",
          "We've [G]no less [G7]days to [C]sing God's [G]praise",
          "Than [Em]when we'd [D]first be[G]gun. [C] [G]",
        ],
      },
    ],
  },

  // 25. Auld Lang Syne - Robert Burns
  {
    slug: "auld-lang-syne",
    title: "Auld Lang Syne",
    artist: "Robert Burns (Traditional)",
    key: "G",
    genre: "Folk",
    bpm: 84,
    durationSec: 180,
    notes: "Traditional Scottish folk standard in 4/4.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[G]  [D7]  [Em]  [C]  [G]  [D7]  [G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Should [G]auld acquaintance [D7]be for[Em]got,",
          "And [C]never brought to [D7]mind?",
          "Should [G]auld acquaintance [D7]be for[Em]got,",
          "And [C]auld [D7]lang [G]syne!",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "For [G]auld lang [D7]syne, my [Em]dear,",
          "For [C]auld lang [D7]syne,",
          "We'll [G]take a cup o' [D7]kindness [Em]yet,",
          "For [C]auld [D7]lang [G]syne!",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "And [G]surely ye'll be [D7]your pint-[Em]stowp!",
          "And [C]surely I'll be [D7]mine!",
          "And we'll [G]take a cup o' [D7]kindness [Em]yet,",
          "For [C]auld [D7]lang [G]syne.",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "We [G]twa hae run a[D7]bout the [Em]braes,",
          "And [C]pou'd the gowans [D7]fine;",
          "But we've [G]wander'd mony a [D7]weary [Em]fit,",
          "Sin' [C]auld [D7]lang [G]syne.",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus",
        lines: [
          "And [G]there's a hand, my [D7]trusty [Em]fiere!",
          "And [C]gie's a hand o' [D7]thine!",
          "And we'll [G]tak a right gude-[D7]willie [Em]waught,",
          "For [C]auld [D7]lang [G]syne!",
        ],
      },
    ],
  },

  // 26. Silent Night - Mohr/Gruber
  {
    slug: "silent-night",
    title: "Silent Night",
    artist: "Mohr/Gruber (Traditional Carol)",
    key: "C",
    genre: "Folk",
    bpm: 66,
    durationSec: 190,
    notes: "Traditional 6/8 lullaby carol with all 4 complete verses.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[C]   [G7]   [C]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[C]Silent night, holy night,",
          "[G]All is calm, [C]all is bright",
          "[F]Round yon Virgin, [C]Mother and Child,",
          "[F]Holy Infant so [C]tender and mild,",
          "[G]Sleep in heavenly [C]peace, [Am]",
          "[C]Sleep in [G]heavenly [C]peace.",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[C]Silent night, holy night,",
          "[G]Shepherds quake [C]at the sight;",
          "[F]Glories stream from [C]heaven afar,",
          "[F]Heavenly hosts sing [C]Alleluia!",
          "[G]Christ the Savior is [C]born, [Am]",
          "[C]Christ the [G]Savior is [C]born!",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[C]Silent night, holy night,",
          "[G]Son of God, [C]love's pure light;",
          "[F]Radiant beams from [C]Thy holy face,",
          "[F]With the dawn of re[C]deeming grace,",
          "[G]Jesus, Lord, at Thy [C]birth, [Am]",
          "[C]Jesus, [G]Lord, at Thy [C]birth.",
        ],
      },
      {
        type: "outro",
        name: "Verse 4 & Outro",
        lines: [
          "[C]Silent night, holy night,",
          "[G]Wondrous star, [C]lend thy light;",
          "[F]With the angels [C]let us sing,",
          "[G]Alleluia to [C]our [G]King! [C]",
        ],
      },
    ],
  },

  // 27. Twinkle, Twinkle, Little Star
  {
    slug: "twinkle-twinkle-little-star",
    title: "Twinkle, Twinkle, Little Star",
    artist: "Jane Taylor (Traditional)",
    key: "C",
    genre: "Folk",
    bpm: 92,
    durationSec: 150,
    notes: "Complete 4-stanza poem by Jane Taylor set to Ah! vous dirai-je, maman.",
    sections: [
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[C]Twinkle, twinkle, [F]little [C]star,",
          "[F]How I [C]wonder [G7]what you [C]are!",
          "[C]Up a[F]bove the [C]world so [G]high,",
          "[C]Like a [F]diamond [C]in the [G]sky.",
          "[C]Twinkle, twinkle, [F]little [C]star,",
          "[F]How I [C]wonder [G7]what you [C]are!",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[C]When the blazing [F]sun is [C]gone,",
          "[F]When he [C]nothing [G7]shines u[C]pon,",
          "[C]Then you [F]show your [C]little [G]light,",
          "[C]Twinkle, [F]twinkle, [C]all the [G]night.",
          "[C]Twinkle, twinkle, [F]little [C]star,",
          "[F]How I [C]wonder [G7]what you [C]are!",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[C]Then the trav'ller [F]in the [C]dark,",
          "[F]Thanks you [C]for your [G7]tiny [C]spark,",
          "[C]He could [F]not see [C]which way to [G]go,",
          "[C]If you [F]did not [C]twinkle [G]so.",
        ],
      },
      {
        type: "outro",
        name: "Verse 4 & Outro",
        lines: [
          "[C]In the dark blue [F]sky you [C]keep,",
          "[F]And of[C]ten through my [G7]curtains [C]peep,",
          "[C]For you [F]never [C]shut your [G]eye,",
          "[C]Till the [F]sun is [C]in the [G]sky.",
          "[C]Twinkle, twinkle, [F]little [C]star,",
          "[F]How I [C]wonder [G7]what you [C]are!",
        ],
      },
    ],
  },

  // 28. Clementine - Barker Bradford
  {
    slug: "clementine",
    title: "Clementine",
    artist: "Barker Bradford (1885)",
    key: "D",
    genre: "Folk",
    bpm: 96,
    durationSec: 170,
    notes: "Traditional American 3/4 folk ballad with complete verses and choruses.",
    sections: [
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "In a [D]cavern, in a [G]canyon,",
          "Exca[D]vating for a [A7]mine,",
          "Dwelt a [D]miner, forty-[G]niner,",
          "And his [D]daughter, [A7]Clemen[D]tine.",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Oh my [D]darling, oh my [G]darling,",
          "Oh my [D]darling [A7]Clemen[D]tine,",
          "Thou art [D]lost and gone for[G]ever,",
          "Dreadful [D]sorry, [A7]Clemen[D]tine.",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Light she [D]was and like a [G]fairy,",
          "And her [D]shoes were number [A7]nine,",
          "Herring [D]boxes, without [G]topses,",
          "Sandals [D]were for [A7]Clemen[D]tine.",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Drove she [D]ducklings to the [G]water",
          "Ev'ry [D]morning just at [A7]nine,",
          "Hit her [D]foot against a [G]splinter,",
          "Fell in[D]to the [A7]foaming [D]brine.",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "Ruby [D]lips above the [G]water,",
          "Blowing [D]bubbles soft and [A7]fine,",
          "But, a[D]las, I was no [G]swimmer,",
          "So I [D]lost my [A7]Clemen[D]tine.",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus",
        lines: [
          "Oh my [D]darling, oh my [G]darling,",
          "Oh my [D]darling [A7]Clemen[D]tine,",
          "Thou art [D]lost and gone for[G]ever,",
          "Dreadful [D]sorry, [A7]Clemen[D]tine.",
        ],
      },
    ],
  },

  // 29. Down by the Riverside - Traditional Spiritual
  {
    slug: "down-by-the-riverside",
    title: "Down by the Riverside",
    artist: "Traditional Spiritual",
    key: "E",
    genre: "Soul",
    bpm: 108,
    durationSec: 200,
    notes: "Upbeat gospel spiritual in E major. Great for call-and-response vocals.",
    sections: [
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Gonna [E]lay down my sword and shield",
          "[B7]Down by the river[E]side",
          "[B7]Down by the river[E]side",
          "[B7]Down by the river[E]side",
          "Gonna [E]lay down my sword and shield",
          "[B7]Down by the river[E]side",
          "Gonna [A]study [B7]war no [E]more.",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "I ain't gonna [A]study war no [E]more,",
          "I ain't gonna [B7]study war no [E]more, [E7]",
          "I ain't gonna [A]study [B7]war no [E]more.",
          "I ain't gonna [A]study war no [E]more,",
          "I ain't gonna [B7]study war no [E]more,",
          "I ain't gonna [A]study [B7]war no [E]more.",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Gonna [E]put on my long white robe",
          "[B7]Down by the river[E]side",
          "[B7]Down by the river[E]side",
          "[B7]Down by the river[E]side",
          "Gonna [E]put on my long white robe",
          "[B7]Down by the river[E]side",
          "Gonna [A]study [B7]war no [E]more.",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Gonna [E]put on my starry crown",
          "[B7]Down by the river[E]side",
          "[B7]Down by the river[E]side",
          "Gonna [E]put on my starry crown",
          "[B7]Down by the river[E]side",
          "Gonna [A]study [B7]war no [E]more.",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus",
        lines: [
          "I ain't gonna [A]study war no [E]more,",
          "I ain't gonna [B7]study war no [E]more, [E7]",
          "I ain't gonna [A]study [B7]war no [E]more!",
        ],
      },
    ],
  },

  // 30. Scarborough Fair - Traditional English Ballad
  {
    slug: "scarborough-fair",
    title: "Scarborough Fair",
    artist: "Traditional English Ballad",
    key: "Am",
    genre: "Folk",
    bpm: 78,
    durationSec: 220,
    notes: "Dorian folk ballad in 3/4. Ideal for fingerpicking and vocal counter-melodies.",
    sections: [
      {
        type: "intro",
        name: "Fingerpicking Intro",
        lines: ["[Am]   [G]   [Am]   [G]   [Am]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Are you [Am]going to [G]Scarborough [Am]Fair?",
          "[C]Parsley, [Am]sage, rose[C]mary [D]and [Am]thyme,",
          "Re[Am]member [C]me to [G]one who lives [Am]there,",
          "She [Am]once was a [G]true love of [Am]mine.",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Tell her to [Am]make me a [G]cambric [Am]shirt,",
          "[C]Parsley, [Am]sage, rose[C]mary [D]and [Am]thyme,",
          "With[Am]out no [C]seams nor [G]needle [Am]work,",
          "Then [Am]she'll be a [G]true love of [Am]mine.",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Tell her to [Am]find me an [G]acre of [Am]land,",
          "[C]Parsley, [Am]sage, rose[C]mary [D]and [Am]thyme,",
          "Be[Am]tween the [C]salt water [G]and the sea [Am]strands,",
          "Then [Am]she'll be a [G]true love of [Am]mine.",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "Tell her to [Am]reap it with a [G]sickle of [Am]leather,",
          "[C]Parsley, [Am]sage, rose[C]mary [D]and [Am]thyme,",
          "And [Am]gather it [C]all in a [G]bunch of [Am]heather,",
          "Then [Am]she'll be a [G]true love of [Am]mine.",
        ],
      },
      {
        type: "outro",
        name: "Verse 5 & Outro",
        lines: [
          "Are you [Am]going to [G]Scarborough [Am]Fair?",
          "[C]Parsley, [Am]sage, rose[C]mary [D]and [Am]thyme,",
          "Re[Am]member [C]me to [G]one who lives [Am]there,",
          "She [Am]once was a [G]true love of [Am]mine.",
        ],
      },
    ],
  },

  // 31. Greensleeves - Traditional
  {
    slug: "greensleeves",
    title: "Greensleeves",
    artist: "Traditional (16th century)",
    key: "Em",
    genre: "Folk",
    bpm: 80,
    durationSec: 210,
    notes: "16th-century English Romanesca ballad in 6/8.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[Em]  [D]  [C]  [B7]  [Em]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "A[Em]las, my love, you [D]do me wrong,",
          "To [C]cast me off dis[B7]courteous[Em]ly",
          "For [Em]I have loved you [D]well and long,",
          "De[C]lighting in your [B7]compa[Em]ny.",
        ],
      },
      {
        type: "chorus",
        name: "Refrain 1",
        lines: [
          "[G]Greensleeves was [D]all my joy",
          "[C]Greensleeves was [B7]my de[Em]light,",
          "[G]Greensleeves was my [D]heart of gold,",
          "And [C]who but my [B7]lady [Em]Greensleeves.",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "I [Em]have been ready [D]at your hand,",
          "To [C]grant whatever [B7]you would [Em]crave,",
          "I [Em]have both wagered [D]life and land,",
          "Your [C]love and good-will [B7]for to [Em]have.",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Well, [Em]I will pray to [D]God on high,",
          "That [C]thou my constan[B7]cy mayst [Em]see,",
          "And [Em]that yet once be[D]fore I die,",
          "Thou [C]wilt vouchsafe to [B7]love [Em]me.",
        ],
      },
      {
        type: "outro",
        name: "Final Refrain",
        lines: [
          "[G]Greensleeves was [D]all my joy",
          "[C]Greensleeves was [B7]my de[Em]light,",
          "[G]Greensleeves was my [D]heart of gold,",
          "And [C]who but my [B7]lady [Em]Greensleeves.",
        ],
      },
    ],
  },

  // 32. Doctor - Arkayla
  {
    slug: "doctor-arkayla",
    title: "Doctor",
    artist: "Arkayla",
    key: "Bm",
    genre: "Indie",
    bpm: 132,
    durationSec: 215,
    notes: "Driving indie rock groove in Bm with jangly British guitar leads.",
    sections: [
      {
        type: "intro",
        name: "Intro Riff",
        lines: ["[Bm]  [A]  [G]  [F#7] (x2)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Bm]Waiting in the hallway with a [A]fever in my head",
          "[G]Counting all the ceiling tiles and [F#7]wishing I was in bed",
          "[Bm]Every single Remedy you [A]wrote upon the page",
          "[G]Only makes the symptoms worse at [F#7]every single stage",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus",
        lines: [
          "[Em]Tell me what the [A]diagnosis [D]means [Bm]",
          "[Em]Nothing is as [F#7]simple as it seems",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[G]Doctor, [A]doctor, [Bm]give me the news [D]",
          "[G]I got a [A]bad case of [Bm]losing my cool",
          "[G]No pre[A]scription's gonna [D]pull me [Bm]through",
          "[Em]Doctor, what am I sup[F#7]posed to [Bm]do?",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Bm]Shadows on the pavement under [A]amber streetlamp glow",
          "[G]Running out of patience with the [F#7]things I used to know",
          "[Bm]Check my pulse again because the [A]rhythm's running fast",
          "[G]Searching for a cure that's gonna [F#7]make the feeling last",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo",
        lines: ["[Bm]  [A]  [G]  [F#7] (x4)"],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "[G]Doctor, [A]doctor, [Bm]give me the news [D]",
          "[G]I got a [A]bad case of [Bm]losing my cool",
          "[Em]Doctor, what am I sup[F#7]posed to [Bm]do? [A] [G] [F#7] [Bm]",
        ],
      },
    ],
  },

  // 33. Big Barn Bed - Wings
  {
    slug: "big-barn-bed",
    title: "Big Barn Bed - 2018 Remaster",
    artist: "Wings",
    key: "A",
    genre: "Classic Rock",
    bpm: 122,
    durationSec: 230,
    notes: "Paul McCartney & Wings Red Rose Speedway opener. Driving piano and guitar rocker.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[A]  [C]  [D]  [A]", "[A]  [C]  [D]  [A]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[A]Who's that coming [C]round that [D]corner? [A]",
          "[A]Who's that coming [C]round that [D]bend? [A]",
          "Could it [D]be that we're gonna [Bm]see a friend at [A]last? [F#m]",
          "[B7]Who's that coming [D]round that [A]bend?",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Keep on [E]sleeping in a [D]big barn [A]bed [D/A] [A]",
          "Keep on [E]sleeping in a [D]big barn [A]bed",
          "[F#m]One more [C#m]minute, [D]you can [E]stay in [A]bed",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[A]Leaping Arma[C]dillos [D]yes sir [A]",
          "[A]Rooting in the [C]euca[D]lyptus [A]",
          "Could it [D]be that we're gonna [Bm]be together at [A]last? [F#m]",
          "[B7]Wait and see what [D]happens [A]next!",
        ],
      },
      {
        type: "bridge",
        name: "Bridge",
        lines: [
          "[Dm]You said that [Am]you were gonna [Dm]play it Straight [Am]",
          "[Dm]Wait a minute, [F]don't be late [E] [E7]",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "Keep on [E]sleeping in a [D]big barn [A]bed",
          "Keep on [E]sleeping in a [D]big barn [A]bed",
          "[A]  [C]  [D]  [A] (x4)",
        ],
      },
    ],
  },

  // 34. Momma gets by - Paul McCartney
  {
    slug: "momma-gets-by",
    title: "Momma gets by",
    artist: "Paul McCartney",
    key: "G",
    genre: "Classic Rock",
    bpm: 105,
    durationSec: 212,
    notes: "Warm acoustic groove in G major with bass walkdowns.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[G]  [C]  [G]  [D]", "[G]  [C]  [G]  [D]  [G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[G]Early in the morning when the [C]kettle starts to [G]sing",
          "[Em]Momma's in the kitchen making [A7]sense of every[D]thing",
          "[G]Rain against the windowpane and [C]bills upon the [Am]floor",
          "[G]Still she wears a [D]smile when she [C]opens [D]up the [G]door",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "And [C]Momma gets [G]by, oh [D]Momma gets [Em]by",
          "With a [C]little bit of [G]love and a [A7]twinkle in her [D]eye",
          "Oh [C]Momma gets [G]by, [B7]never asks [Em]why",
          "No [C]matter what the [D]weather, [G]Momma gets by",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[G]Down along the high street with her [C]basket in her [G]hand",
          "[Em]Humming little melodies from [A7]some forgotten [D]band",
          "[G]Everybody knows her name and [C]waves as she goes [Am]past",
          "[G]Taking every [D]moment and [C]making [D]good times [G]last",
        ],
      },
      {
        type: "solo",
        name: "Guitar & Whistling Solo",
        lines: ["[G]  [C]  [G]  [D]", "[Em]  [C]  [G]  [D]  [G]"],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "Oh [C]Momma gets [G]by, [D]Momma gets [Em]by",
          "No [C]matter what the [D]weather, [G]Momma gets [C]by [G]",
        ],
      },
    ],
  },

  // ============================================================================
  // NEW FULL-LENGTH SONGS (35 TO 56) — ROCK EN ESPAÑOL + GLOBAL ESSENTIALS
  // ============================================================================

  // 35. De Música Ligera - Soda Stereo
  {
    slug: "de-musica-ligera",
    title: "De Música Ligera",
    artist: "Soda Stereo",
    key: "Bm",
    genre: "Rock",
    bpm: 124,
    durationSec: 213,
    notes: "El himno definitivo del Rock en Español. Ciclo constante: Bm - G - D - A con acentos sincopados.",
    sections: [
      {
        type: "intro",
        name: "Intro Riff (Batería + Guitarra)",
        lines: [
          { comment: "Riff icónico con acentos en G y A (x4)" },
          "[Bm]   [G]   [D]   [A]",
          "[Bm]   [G]   [D]   [A]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 1",
        lines: [
          "[Bm]Ella durmió [G]al calor de las [D]masas [A]",
          "[Bm]Y yo desperté [G]queriendo soñar[D]la [A]",
          "[Bm]Algún tiempo atrás [G]pensé en escribir[D]le [A]",
          "[Bm]Que nunca sorteé [G]las trampas del a[D]mor [A]",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 1",
        lines: [
          "[Bm]De aquel a[G]mor, de [D]música li[A]gera",
          "[Bm]Nada nos li[G]bra, [D]nada más [A]queda",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 2",
        lines: [
          "[Bm]No le enviaré [G]cenizas de ro[D]sas [A]",
          "[Bm]Ni pienso evitar [G]un roce secre[D]to [A]",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 2",
        lines: [
          "[Bm]De aquel a[G]mor, de [D]música li[A]gera",
          "[Bm]Nada nos li[G]bra, [D]nada más [A]queda",
        ],
      },
      {
        type: "solo",
        name: "Solo de Guitarra (Gustavo Cerati)",
        lines: [
          "[Bm]   [G]   [D]   [A] (x4)",
          "[Bm]   [G]   [D]   [A] (x4)",
        ],
      },
      {
        type: "outro",
        name: "Estribillo Final & Outro",
        lines: [
          "[Bm]De aquel a[G]mor, de [D]música li[A]gera",
          "[Bm]Nada nos li[G]bra, [D]nada más [A]queda",
          "[Bm]Nada más [G]queda, [D]nada más [A]queda",
          "[Bm]Nada más [G]queda, [D]nada más [A]queda... [Bm] [G] [D] [A]",
        ],
      },
    ],
  },

  // 36. Persiana Americana - Soda Stereo
  {
    slug: "persiana-americana",
    title: "Persiana Americana",
    artist: "Soda Stereo",
    key: "Em",
    genre: "Rock",
    bpm: 102,
    durationSec: 293,
    notes: "Groove post-punk / new wave con arpegios brillantes y corte rítmico antes del estribillo.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[Em]  [A]  [C]  [D] (x2)",
          "[Am]  [G]  [F]  [Em]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 1",
        lines: [
          "[Am]Yo te prefiero [G]fuera de foco, [F]inalcanzable [Em]",
          "[Am]Yo te prefiero [G]irreversible, [F]casi intocable [G]",
          "[Am]Tus ropas [G]caen lentamente, [F]soy un espía, un [Em]espectador",
          "[Am]Y el ventilador [G]desgarrándote, [F]sé que te excita pensar [D]hasta dónde llegaré",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 1",
        lines: [
          "[C]Es difícil de [A7]creer, [Em]creo que nunca lo po[G]dré saber",
          "[C]Sólo así yo te [D]veré, a través de mi per[Em]siana ameri[A]cana [C] [D]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 2",
        lines: [
          "[Am]Es una condena [G]agradable, [F]el instante [Em]previo",
          "[Am]Es como un desgaste, [G]una necesidad, [F]más que un de[G]seo",
          "[Am]Estamos al [G]borde de la cornisa, [F]casi a punto de [Em]caer",
          "[Am]No sientes miedo, [G]sigues sonriendo, [F]sé que te excita pensar [D]hasta dónde llegaré",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 2",
        lines: [
          "[C]Es difícil de [A7]creer, [Em]creo que nunca lo po[G]dré saber",
          "[C]Sólo así yo te [D]veré, a través de mi per[Em]siana ameri[A]cana [C] [D]",
        ],
      },
      {
        type: "bridge",
        name: "Puente & Interludio",
        lines: [
          "[Am]Tus ropas [G]caen lentamente, [F]soy un espía, un [Em]espectador",
          "[Am]Y el ventilador [G]desgarrándote, [F]sé que te excita pensar [D]hasta dónde llegaré",
        ],
      },
      {
        type: "outro",
        name: "Estribillo Final & Coda",
        lines: [
          "[C]Difícil de [A7]creer, [Em]creo que nunca lo po[G]dré saber",
          "[C]Sólo así yo te [D]veré, a través de mi per[Em]siana ameri[A]cana",
          "[C]Lo que pueda suce[D]der, no gastes fuerzas para [Em]comprender [A]",
          "[C]Sólo así yo te [D]veré, a través de mi per[Em]siana ameri[A]cana [C] [D] [Em]",
        ],
      },
    ],
  },

  // 37. Lamento Boliviano - Los Enanitos Verdes
  {
    slug: "lamento-boliviano",
    title: "Lamento Boliviano",
    artist: "Los Enanitos Verdes",
    key: "Em",
    genre: "Rock",
    bpm: 144,
    durationSec: 225,
    notes: "Clásico absoluto de fogón y escenario: Em - Bm - Am - Em - B7 en loop continuo.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[Em]   [Bm]   [Am]   [Em]  [B7] (x2)",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 1",
        lines: [
          "[Em]Me quieren agitar, me incitan a gritar",
          "[Bm]Soy como una roca, palabras no me tocan",
          "[Am]Adentro hay un volcán que pronto va a estallar",
          "[Em]Yo quiero estar tran[B7]quilo",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 2",
        lines: [
          "[Em]Es mi situación una desolación",
          "[Bm]Soy como un lamento, lamento boliviano",
          "[Am]Que un día empezó y no va a terminar",
          "[Em]Y a nadie hace [B7]daño",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Estribillo",
        lines: [
          "[Em]Uoh, ioh, ioh, [Bm]ioh-uoh-oh",
          "[Am]Yeh-eh, yeh-eh, [Em]yeh-eh [B7]",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 1",
        lines: [
          "Y [Em]yo estoy aquí, borracho y loco",
          "Y mi [Bm]corazón idiota siempre brillará",
          "Y [Am]yo te amaré, te amaré por siempre",
          "[Em]Nena, no te peines en la cama",
          "Que los [B7]viajantes se van a atrasar",
        ],
      },
      {
        type: "solo",
        name: "Solo de Guitarra (Marciano Cantero / Felipe Staiti)",
        lines: [
          "[Em]   [Bm]   [Am]   [Em]  [B7] (x2)",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 2",
        lines: [
          "Y [Em]yo estoy aquí, borracho y loco",
          "Y mi [Bm]corazón idiota siempre brillará",
          "Y [Am]yo te amaré, te amaré por siempre",
          "[Em]Nena, no te peines en la cama",
          "Que los [B7]viajantes se van a atrasar",
        ],
      },
      {
        type: "outro",
        name: "Outro",
        lines: [
          "Y [Em]yo estoy aquí, borracho y loco",
          "Y mi [Bm]corazón idiota siempre brillará",
          "Y [Am]yo te amaré, te amaré por siempre",
          "[Em]Nena, no te peines en la cama",
          "Que los [B7]viajantes se van a atra[Em]sar",
        ],
      },
    ],
  },

  // 38. La Flaca - Jarabe de Palo
  {
    slug: "la-flaca",
    title: "La Flaca",
    artist: "Jarabe de Palo",
    key: "Am",
    genre: "Rock",
    bpm: 89,
    durationSec: 260,
    notes: "Rumba-rock latino con cadencia andaluza (Am - G - F - E7) y solo final de guitarra eléctrica.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: [
          "[Am]  [E7]  [Am]  [F]  [Dm]  [E7]  [Am]  [E7]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 1",
        lines: [
          "En la [Am]vida conocí mu[E7]jer igual a la [Am]Flaca",
          "[F]Coral negro de La Ha[Dm]bana, tre[E7]mendísima mu[Am]lata [E7]",
          "[Am]Cien libras de piel y [E7]hueso, cuarenta [Am]kilos de salsa",
          "Y en la [F]cara dos [Dm]soles que sin [E7]palabras [Am]hablan",
          "Que sin [E7]palabras [Am]hablan [E7]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 2",
        lines: [
          "La [Am]Flaca duerme de [E7]día, dice que [Am]así el hambre engaña",
          "Y [F]cuando cae la [Dm]noche baja a [E7]bailar a la [Am]Tasca [E7]",
          "Y [Am]bailar y [E7]bailar, y to[Am]mar y tomar",
          "Una [F]cerveza tras [Dm]otra pero ella [E7]nunca en[Am]gorda",
          "Pero ella [E7]nunca en[Am]gorda",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 1",
        lines: [
          "[G]Por un beso de la [Am]Flaca daría lo que [G]fuera",
          "Por un beso de [Am]ella, aunque [F]sólo uno [E7]fuera",
          "[G]Por un beso de la [Am]Flaca daría lo que [G]fuera",
          "Por un beso de [Am]ella, aunque [F]sólo uno [E7]fuera, aunque [Am]sólo uno [E7]fuera [Am] [E7]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 3",
        lines: [
          "Mojé [Am]mis sábanas [E7]blancas, como [Am]dice la canción",
          "Recor[F]dando las ca[Dm]ricias que me [E7]brindó el primer [Am]día [E7]",
          "Y enlo[Am]quezco de [E7]ganas de dormir a su [Am]ladito",
          "[F]Porque Dios que esta [Dm]Flaca a mí me [E7]tiene lo[Am]quito",
          "A mí me [E7]tiene lo[Am]quito",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 2",
        lines: [
          "[G]Por un beso de la [Am]Flaca daría lo que [G]fuera",
          "Por un beso de [Am]ella, aunque [F]sólo uno [E7]fuera",
          "[G]Por un beso de la [Am]Flaca daría lo que [G]fuera",
          "Por un beso de [Am]ella, aunque [F]sólo uno [E7]fuera",
        ],
      },
      {
        type: "solo",
        name: "Solo de Guitarra & Outro",
        lines: [
          "Aunque [F]sólo uno [E7]fuera, aunque [F]sólo uno [E7]fuera",
          "Aunque [F]sólo uno [E7]fuera... [Am] [G] [F] [E7] (x4)",
        ],
      },
    ],
  },

  // 39. Flaca - Andrés Calamaro
  {
    slug: "flaca-calamaro",
    title: "Flaca",
    artist: "Andrés Calamaro",
    key: "G",
    genre: "Rock",
    bpm: 95,
    durationSec: 287,
    notes: "Progresión circular clásica: G - B7 - Em - C - G - D - G - D.",
    sections: [
      {
        type: "intro",
        name: "Intro (Órgano & Trompetas)",
        lines: [
          "[G]   [B7]   [Em]   [C]",
          "[G]   [D]    [G]    [D]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 1",
        lines: [
          "[G]Flaca, no me [B7]claves tus pu[Em]ñales por la es[C]palda",
          "[G]Tan profundos, [D]no me duelen, [G]no me hacen [D]mal",
          "[G]Lejos, en el [B7]centro de la [Em]tierra, las ra[C]íces",
          "Del a[G]mor donde es[D]taban, queda[G]rán [D]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 2",
        lines: [
          "[G]Entre el no me ol[B7]vides me de[Em]jé nuestros a[C]briles",
          "Olvi[G]dados en el [D]fondo del pla[G]card [D]",
          "En el [G]cuarto de invi[B7]tados, eran [Em]tiempos do[C]rados",
          "Un pa[G]sado me[D]jor [G] [D]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 3",
        lines: [
          "[G]Aunque casi me e[B7]quivoco y te [Em]digo poco a [C]poco",
          "No me [G]mientas, no me [D]digas la ver[G]dad [D]",
          "No te [G]quedes calla[B7]da, no le[Em]vantes la [C]voz",
          "Ni me [G]pidas per[D]dón [G] [D]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 4",
        lines: [
          "[G]Aunque casi te [B7]confieso que tam[Em]bién he sido un [C]perro",
          "Compa[G]ñero, un perro i[D]deal que aprendió a la[G]drar [D]",
          "Y a vol[G]ver al hogar [B7] [Em]para po[C]der comer [G] [D] [G] [D]",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo Final",
        lines: [
          "[G]Flaca, no me [B7]claves tus pu[Em]ñales por la es[C]palda",
          "[G]Tan profundos, [D]no me duelen, [G]no me hacen [D]mal",
          "[G]Lejos, en el [B7]centro de la [Em]tierra, las ra[C]íces",
          "Del a[G]mor donde es[D]taban, queda[G]rán [D]",
        ],
      },
      {
        type: "outro",
        name: "Coda Instrumental (Guitarra & Vientos)",
        lines: [
          "[G]   [B7]   [Em]   [C]   [G]   [D]   [G]   [D] (x4)",
        ],
      },
    ],
  },

  // 40. Rayando el Sol - Maná
  {
    slug: "rayando-el-sol",
    title: "Rayando el Sol",
    artist: "Maná",
    key: "G",
    genre: "Rock",
    bpm: 78,
    durationSec: 254,
    notes: "Balada rock de Maná con arpegios limpios en G - D/F# - Em - C - D.",
    sections: [
      {
        type: "intro",
        name: "Intro Arpegio",
        lines: [
          "[G]  [D/F#]  [Em]  [C]  [D] (x2)",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 1",
        lines: [
          "[G]Rayando el [D/F#]sol, [Em]rayando por [C]ti [D]",
          "[G]Esta pena [D/F#]me duele, [Em]me quema sin tu a[C]mor [D]",
          "[G]No me has lla[D/F#]mado, [Em]estoy desespe[C]rado [D]",
          "[G]Son muchas [D/F#]lunas las que [Em]te he llorado [C] [D]",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo 1",
        lines: [
          "[G]Rayando el [D]sol (oe-oh), desespe[Em]rado [C]",
          "Es más [G]fácil llegar al [D]sol que a tu cora[C]zón [D]",
          "Me [G]muero por [D]ti (oe-oh), viviendo [Em]sin ti [C]",
          "Y no a[G]guanto, me duele [D]tanto estar a[Em]sí [A]",
          "[C]Rayando el [D]sol [G] [D/F#] [Em] [C] [D]",
        ],
      },
      {
        type: "verse",
        name: "Estrofa 2",
        lines: [
          "[G]A tu casa yo [D/F#]fui [Em]y no te encon[C]tré [D]",
          "[G]En el parque, en la [D/F#]plaza, en el [Em]cine yo te bus[C]qué [D]",
          "[G]Te tengo a[D/F#]trapada [Em]entre mi piel y mi [C]alma [D]",
          "[G]Mas ya no [D/F#]puedo tanto y [Em]quiero estar junto a [C]ti [D]",
        ],
      },
      {
        type: "solo",
        name: "Solo de Guitarra",
        lines: [
          "[Em]  [Bm]  [C]  [G]  [D]",
          "[Em]  [Bm]  [C]  [D]",
        ],
      },
      {
        type: "chorus",
        name: "Estribillo Final & Outro",
        lines: [
          "[G]Rayando el [D]sol (oe-oh), desespe[Em]rado [C]",
          "Es más [G]fácil llegar al [D]sol que a tu cora[C]zón [D]",
          "Me [G]muero por [D]ti (oe-oh), viviendo [Em]sin ti [C]",
          "Y no a[G]guanto, me duele [D]tanto estar a[Em]sí [A]",
          "[C]Rayando el [D]sol... [G]rayando el [D]sol... [G]",
        ],
      },
    ],
  },

  // 41. Don't Look Back in Anger - Oasis
  {
    slug: "dont-look-back-in-anger",
    title: "Don't Look Back in Anger",
    artist: "Oasis",
    key: "C",
    genre: "Rock",
    bpm: 82,
    durationSec: 288,
    notes: "Britpop anthem built around the descending C - G/B - Am - E7 - F - G - C progression.",
    sections: [
      {
        type: "intro",
        name: "Piano Intro",
        lines: [
          "[C]   [F]   [C]   [F]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[C]Slip inside the [G/B]eye of your [Am]mind",
          "Don't you [E7]know you might [F]find [G]a better place to [C]play [Am] [G]",
          "[C]You said that [G/B]you'd never [Am]been",
          "But all the [E7]things that you've [F]seen [G]slowly fade a[C]way [Am] [G]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[F]So I start a revo[Fm]lution from my [C]bed",
          "'Cause you [F]said the brains I [Fm]had went to my [C]head",
          "[F]Step outside, [Fm]summertime's in [C]bloom",
          "[G]Stand up beside the fireplace, [E7/G#]take that look from off your face",
          "[Am]You ain't ever [G]gonna burn my [F]heart out [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "And [C]so [G/B]Sally can [Am]wait, she [E7]knows it's too [F]late as we're [G]walking on [C]by [Am] [G]",
          "Her [C]soul [G/B]slides a[Am]way, [E7]but don't look [F]back in anger, [G]I heard you [C]say [Am] [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[C]Take me to the [G/B]place where you [Am]go",
          "Where [E7]nobody [F]knows [G]if it's night or [C]day [Am] [G]",
          "[C]Please don't put your [G/B]life in the [Am]hands",
          "Of a [E7]rock and roll [F]band [G]who'll throw it all a[C]way [Am] [G]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[F]I'm gonna start a revo[Fm]lution from my [C]bed",
          "'Cause you [F]said the brains I [Fm]had went to my [C]head",
          "[F]Step outside, 'cause [Fm]summertime's in [C]bloom",
          "[G]Stand up beside the fireplace, [E7/G#]take that look from off your face",
          "'Cause [Am]you ain't ever [G]gonna burn my [F]heart out [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "And [C]so [G/B]Sally can [Am]wait, she [E7]knows it's too [F]late as we're [G]walking on [C]by [Am] [G]",
          "My [C]soul [G/B]slides a[Am]way, [E7]but don't look [F]back in anger, [G]I heard you [C]say [Am] [G]",
        ],
      },
      {
        type: "solo",
        name: "Noel Gallagher Guitar Solo",
        lines: [
          "[F]   [Fm]   [C]   [C]",
          "[F]   [Fm]   [C]   [C]",
          "[F]   [Fm]   [C]   [G]  [E7/G#]  [Am]  [G]  [F]  [G]",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "And [C]so [G/B]Sally can [Am]wait, she [E7]knows it's too [F]late as she's [G]walking on [C]by [Am] [G]",
          "My [C]soul [G/B]slides a[Am]way, [E7]but don't look [F]back in anger, don't look [Fm]back in anger",
          "I heard you [C]say [G/B] [Am] [E7] [F] [Fm]at least not to[C]day.",
        ],
      },
    ],
  },

  // 42. Under the Bridge - Red Hot Chili Peppers
  {
    slug: "under-the-bridge",
    title: "Under the Bridge",
    artist: "Red Hot Chili Peppers",
    key: "E",
    genre: "Alternative Rock",
    bpm: 84,
    durationSec: 264,
    notes: "Hendrix-inspired chord embellishments in E major (E - B - C#m - G#m - A) shifting to A - Am - G - F in the outro.",
    sections: [
      {
        type: "intro",
        name: "Fingerpicked Intro (D & F#m)",
        lines: [
          "[D]   [F#m]   [D]   [F#m]",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[E]Sometimes I [B]feel like I [C#m]don't have a [G#m]partner [A]",
          "[E]Sometimes I [B]feel like [C#m]my only [A]friend",
          "Is the [E]city I [B]live in, the [C#m]City of [G#m]Angels [A]",
          "[E]Lonely as [B]I am, to[C#m]gether we [A]cry [Emaj7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[E]I drive on her [B]streets 'cause [C#m]she's my com[G#m]panion [A]",
          "[E]I walk through her [B]hills 'cause she [C#m]knows who I [A]am",
          "[E]She sees my [B]good deeds and [C#m]she kisses [G#m]windy [A]",
          "[E]Well, I never [B]worry, now [C#m]that is a [A]lie [Emaj7]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[F#m]I don't ever wanna [E]feel [B] [F#m]like I did that [E]day",
          "[F#m]Take me to the [E]place I [B]love, [F#m]take me all the [E]way",
          "[F#m]I don't ever wanna [E]feel [B] [F#m]like I did that [E]day",
          "[F#m]Take me to the [E]place I [B]love, [F#m]take me all the [E]way [B] [C#m] [G#m] [A]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "It's [E]hard to be[B]lieve that there's [C#m]nobody [G#m]out there [A]",
          "It's [E]hard to be[B]lieve that I'm [C#m]all a[A]lone",
          "At [E]least I have [B]her love, the [C#m]city she [G#m]loves me [A]",
          "[E]Lonely as [B]I am, to[C#m]gether we [A]cry [Emaj7]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[F#m]I don't ever wanna [E]feel [B] [F#m]like I did that [E]day",
          "[F#m]Take me to the [E]place I [B]love, [F#m]take me all the [E]way",
          "Yeah, [A]yeah, [Am]yeah, [G]oh [F]no, no, no, yeah, [A]yeah",
        ],
      },
      {
        type: "outro",
        name: "Choir Bridge & Outro",
        lines: [
          "[A]Under the [Am]bridge down[G]town, [F]is where I drew some blood",
          "[A]Under the [Am]bridge down[G]town, [F]I could not get enough",
          "[A]Under the [Am]bridge down[G]town, [F]forgot about my love",
          "[A]Under the [Am]bridge down[G]town, [F]I gave my life away",
          "[A]   [Am]   [G]   [F] (x4)",
        ],
      },
    ],
  },

  // 43. Come As You Are - Nirvana
  {
    slug: "come-as-you-are",
    title: "Come As You Are",
    artist: "Nirvana",
    key: "Em",
    genre: "Grunge",
    bpm: 120,
    durationSec: 219,
    notes: "Watery Small Clone chorus pedal riff in Em - D.",
    sections: [
      {
        type: "intro",
        name: "Chorus Pedal Riff Intro",
        lines: ["[Em]   [D]   [Em]   [D] (x2)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em]Come as you [D]are, as you [Em]were, as I [D]want you to [Em]be",
          "As a [D]friend, as a [Em]friend, as an [D]old ene[Em]my",
          "Take your [D]time, hurry [Em]up, the choice is [D]yours, don't be [Em]late",
          "Take a [D]rest as a [Em]friend, as an [D]old",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "Memo[Em]ria, [G]memo[Em]ria, [G]memo[Em]ria, [G]memo[Em]ria [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em]Come doused in [D]mud, soaked in [Em]bleach, as I [D]want you to [Em]be",
          "As a [D]trend, as a [Em]friend, as an [D]old",
          "Memo[Em]ria, [G]memo[Em]ria, [G]memo[Em]ria, [G]memo[Em]ria [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "And I [A]swear that I [C]don't have a [A]gun",
          "No, I [C]don't have a [A]gun, no, I [C]don't have a [Em]gun [D] [Em] [D]",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo",
        lines: [
          "[Em]  [D]  [Em]  [D] (x4)",
          "[Em]  [G]  [Em]  [G] (x2)",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "And I [A]swear that I [C]don't have a [A]gun",
          "No, I [C]don't have a [A]gun, no, I [C]don't have a [A]gun",
          "No, I [C]don't have a [Em]gun [D] [Em] [D] [Em]",
        ],
      },
    ],
  },

  // 44. Blackbird - The Beatles
  {
    slug: "blackbird",
    title: "Blackbird",
    artist: "The Beatles",
    key: "G",
    genre: "Folk",
    bpm: 94,
    durationSec: 138,
    notes: "Fingerstyle tenths ascending and descending the fretboard in G major with an open G pedal tone.",
    sections: [
      {
        type: "intro",
        name: "Intro",
        lines: ["[G]  [Am7]  [G/B]  [G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[G]Blackbird [Am7]singing in the [G/B]dead of [G]night",
          "[C]Take these [A7/C#]broken [D]wings and [B7/D#]learn to [Em]fly [Eb]",
          "[D]All your [A7/C#]life",
          "You were [C]only [Cm]waiting for this [G/B]moment to a[A7]rise [D7] [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[G]Blackbird [Am7]singing in the [G/B]dead of [G]night",
          "[C]Take these [A7/C#]sunken [D]eyes and [B7/D#]learn to [Em]see [Eb]",
          "[D]All your [A7/C#]life",
          "You were [C]only [Cm]waiting for this [G/B]moment to be [A7]free [D7] [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[F]Black[C/E]bird [Dm]fly, [C] [Bb] [C]",
          "[F]Black[C/E]bird [Dm]fly [C] [Bb] [A7]",
          "Into the [D7]light of the dark black [G]night",
        ],
      },
      {
        type: "solo",
        name: "Instrumental Verse",
        lines: [
          "[G]  [Am7]  [G/B]  [G]",
          "[C]  [A7/C#]  [D]  [B7/D#]  [Em]  [Eb]",
          "[D]  [A7/C#]  [C]  [Cm]  [G/B]  [A7]  [D7]  [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[F]Black[C/E]bird [Dm]fly, [C] [Bb] [C]",
          "[F]Black[C/E]bird [Dm]fly [C] [Bb] [A7]",
          "Into the [D7]light of the dark black [G]night",
        ],
      },
      {
        type: "outro",
        name: "Verse 3 & Outro",
        lines: [
          "[G]Blackbird [Am7]singing in the [G/B]dead of [G]night",
          "[C]Take these [A7/C#]broken [D]wings and [B7/D#]learn to [Em]fly [Eb]",
          "[D]All your [A7/C#]life",
          "You were [C]only [Cm]waiting for this [G/B]moment to a[A7]rise [D7]",
          "You were [C]only [Cm]waiting for this [G/B]moment to a[A7]rise [D7] [G]",
        ],
      },
    ],
  },

  // 45. Yesterday - The Beatles
  {
    slug: "yesterday",
    title: "Yesterday",
    artist: "The Beatles",
    key: "F",
    genre: "Classic Rock",
    bpm: 96,
    durationSec: 125,
    notes: "Played in G shapes tuned down 1 whole step to F major (shown here in concert pitch F).",
    sections: [
      {
        type: "intro",
        name: "Acoustic Intro",
        lines: ["[F]   [F]",],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[F]Yester[Em7]day, [A7]all my [Dm]troubles seemed so [Dm/C]far away",
          "[Bb]Now it [C7]looks as though they're [F]here to stay",
          "Oh, [Dm/C]I be[G7]lieve in [Bb]yester[F]day",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[F]Sudden[Em7]ly, [A7]I'm not [Dm]half the man I [Dm/C]used to be",
          "[Bb]There's a [C7]shadow hanging [F]over me",
          "Oh, [Dm/C]yester[G7]day came [Bb]sudden[F]ly",
        ],
      },
      {
        type: "chorus",
        name: "Bridge 1",
        lines: [
          "[Em7]Why [A7]she [Dm]had to [C]go [Bb]I don't [Dm]know, she [Gm]wouldn't [C7]say [F]",
          "[Em7]I [A7]said [Dm]some[C]thing [Bb]wrong, now I [Dm]long for [Gm]yester[C7]day [F]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[F]Yester[Em7]day, [A7]love was [Dm]such an easy [Dm/C]game to play",
          "[Bb]Now I [C7]need a place to [F]hide away",
          "Oh, [Dm/C]I be[G7]lieve in [Bb]yester[F]day",
        ],
      },
      {
        type: "chorus",
        name: "Bridge 2",
        lines: [
          "[Em7]Why [A7]she [Dm]had to [C]go [Bb]I don't [Dm]know, she [Gm]wouldn't [C7]say [F]",
          "[Em7]I [A7]said [Dm]some[C]thing [Bb]wrong, now I [Dm]long for [Gm]yester[C7]day [F]",
        ],
      },
      {
        type: "outro",
        name: "Final Verse & Humming Coda",
        lines: [
          "[F]Yester[Em7]day, [A7]love was [Dm]such an easy [Dm/C]game to play",
          "[Bb]Now I [C7]need a place to [F]hide away",
          "Oh, [Dm/C]I be[G7]lieve in [Bb]yester[F]day",
          "[Dm/C]Mm-[G7]mm-mm-[Bb]mm-mm-[F]mm",
        ],
      },
    ],
  },

  // 46. Everlong - Foo Fighters
  {
    slug: "everlong",
    title: "Everlong",
    artist: "Foo Fighters",
    key: "D",
    genre: "Alternative Rock",
    bpm: 158,
    durationSec: 250,
    notes: "Drop D tuning classic: Dmaj7 - Bm7 - Gmaj7 - Bm7 sixteenth-note strumming.",
    sections: [
      {
        type: "intro",
        name: "Drop-D Intro",
        lines: [
          "[Dmaj7]   [Bm7]   [Gmaj7]   [Bm7] (x2)",
        ],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Dmaj7]Hello, I've [Bm7]waited here for you, [Gmaj7]ever[Bm7]long",
          "[Dmaj7]Tonight, I [Bm7]throw myself in[Gmaj7]to, and out of the [Bm7]red, out of her head she sang",
          "[Dmaj7]   [Bm7]   [Gmaj7]   [Bm7]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Dmaj7]Come down, and [Bm7]waste away with me, [Gmaj7]down with [Bm7]me",
          "[Dmaj7]Slow how, you [Bm7]wanted it to be, [Gmaj7]I'm over my [Bm7]head, out of her head she sang",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1 (Octave Climb)",
        lines: [
          "[A]   [B5]  [C#5]  [D5]  [E5]  [F#5]  [G5]",
          "And I [A]wonder, when I [B5]sing a[C#5]long with [D5]you [G5]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[Bm]If everything could [G]ever feel this [D]real for[A]ever",
          "[Bm]If anything could [G]ever be this [D]good a[A]gain",
          "[Bm]The only thing I'll [G]ever ask of [D]you, you've got to [A]promise not to [G]stop when I say [A]when, she sang",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[Dmaj7]Breathe out, so [Bm7]I can breathe you in, [Gmaj7]hold you [Bm7]in",
          "[Dmaj7]And now, I [Bm7]know you've always been, [Gmaj7]out of your [Bm7]head, out of my head I sang",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "And I [A]wonder, when I [B5]sing a[C#5]long with [D5]you [G5]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2 & Outro",
        lines: [
          "[Bm]If everything could [G]ever feel this [D]real for[A]ever",
          "[Bm]If anything could [G]ever be this [D]good a[A]gain",
          "[Bm]The only thing I'll [G]ever ask of [D]you, you've got to [A]promise not to [G]stop when I say [A]when...",
          "[Dmaj7]   [Bm7]   [Gmaj7]   [Bm7] (Build to final Chorus)",
          "[Bm]If everything could [G]ever feel this [D]real for[A]ever",
          "[Bm]If anything could [G]ever be this [D]good a[A]gain [G] [A] [D5]",
        ],
      },
    ],
  },

  // 47. Mr. Brightside - The Killers
  {
    slug: "mr-brightside",
    title: "Mr. Brightside",
    artist: "The Killers",
    key: "Db",
    genre: "Indie",
    bpm: 148,
    durationSec: 222,
    notes: "Played in D shapes tuned half-step down (D - D/C# - G - Bm - A).",
    sections: [
      {
        type: "intro",
        name: "Arpeggio Intro",
        lines: ["[D]   [D/C#]   [G]   [G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[D]Coming out of my [D/C#]cage and I've been doing just [G]fine",
          "Gotta gotta be down because I want it all",
          "[D]It started out with a [D/C#]kiss, how did it end up like [G]this?",
          "It was only a kiss, it was only a kiss",
          "[D]Now I'm falling a[D/C#]sleep and she's calling a [G]cab",
          "While he's having a smoke and she's taking a drag",
          "[D]Now they're going to [D/C#]bed and my stomach is [G]sick",
          "And it's all in my head, but she's touching his",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[Bm]Chest now, [A]he takes off her [G]dress now, let me [Bm]go [A]",
          "And [G]I just can't look, it's [Bm]killing me, [A]and taking con[G]trol",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[G]Jealousy, [D]turning saints in[A]to the sea",
          "[Bm]Swimming through sick [G]lullabies, [D]choking on your [A]alibis",
          "[Bm]But it's just the [G]price I pay, [D]destiny is [A]calling me",
          "[Bm]Open up my [G]eager eyes, [D]'cause I'm Mr. [A]Brightside!",
        ],
      },
      {
        type: "solo",
        name: "Synth & Guitar Interlude",
        lines: ["[G]   [D]   [A]   [Bm] (x2)"],
      },
      {
        type: "verse",
        name: "Verse 2 & Pre-Chorus 2",
        lines: [
          "[D]I'm coming out of my [D/C#]cage and I've been doing just [G]fine",
          "[D]It started out with a [D/C#]kiss, how did it end up like [G]this?",
          "[Bm]Chest now, [A]he takes off her [G]dress now, let me [Bm]go [A]",
          "[G]I just can't look, it's [Bm]killing me, [A]and taking con[G]trol",
        ],
      },
      {
        type: "outro",
        name: "Chorus 2 & Outro",
        lines: [
          "[G]Jealousy, [D]turning saints in[A]to the sea",
          "[Bm]Open up my [G]eager eyes, [D]'cause I'm Mr. [A]Brightside!",
          "[G]I [D]never... [F#m]I [G]never... [D]I [F#m]never... [G]I [D]never...",
        ],
      },
    ],
  },

  // 48. Do I Wanna Know? - Arctic Monkeys
  {
    slug: "do-i-wanna-know",
    title: "Do I Wanna Know?",
    artist: "Arctic Monkeys",
    key: "Gm",
    genre: "Indie",
    bpm: 85,
    durationSec: 272,
    notes: "Heavy stomping blues-rock riff in Gm - Eb - Cm - Gm.",
    sections: [
      {
        type: "intro",
        name: "Stomping Riff Intro",
        lines: ["[Gm]   [Eb]   [Cm]   [Gm] (x2)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Gm]Have you got colour in your cheeks?",
          "[Eb]Do you ever get that fear that you can't [Cm]shift the type that sticks around like [Gm]summat in your teeth?",
          "Are there some [Gm]aces up your sleeve? Have you no [Eb]idea that you're in [Cm]deep?",
          "I've dreamt about you nearly [Gm]every night this week, how many [Eb]secrets can you [Cm]keep?",
          "'Cause there's this [Gm]tune I found that makes me think of [Eb]you somehow an' I [Cm]play it on repeat",
          "Until I [D7]fall asleep, spillin' [Eb]drinks on my set[Cm]tee",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "(Do I wanna [Eb]know?) If this [Cm]feeling flows both [Gm]ways?",
          "(Sad to see you [Eb]go) Was sorta [Cm]hopin' that you'd [Gm]stay",
          "(Baby, we both [Eb]know) That the [Cm]nights were mainly [Gm]made for sayin' things that you can't [Eb]say tomorrow [Cm]day [D7]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[Gm]Crawlin' back to you",
          "[Eb]Ever thought of [Cm]callin' when you've [Gm]had a few?",
          "'Cause I always [Gm]do",
          "[Eb]Maybe I'm too [Cm]busy bein' [Gm]yours to fall for [D7]somebody new",
          "Now I've [Gm]thought it through, crawlin' back to you",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Gm]So have you got the guts?",
          "[Eb]Been wonderin' if your [Cm]heart's still open and if [Gm]so, I wanna know what time it shuts",
          "Simmer [Gm]down an' pucker up, I'm sorry to [Eb]interrupt, it's just I'm [Cm]constantly on the cusp",
          "Of tryin' to [D7]kiss you, I don't [Eb]know if you feel the [Cm]same as I do",
          "But we could [D7]be together if you wanted to",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Outro",
        lines: [
          "(Do I wanna [Eb]know?) If this [Cm]feeling flows both [Gm]ways?",
          "[Gm]Crawlin' back to you",
          "[Eb]Ever thought of [Cm]callin' when you've [Gm]had a few?",
          "[Eb]Maybe I'm too [Cm]busy bein' [Gm]yours to fall for [D7]somebody new [Gm]",
        ],
      },
    ],
  },

  // 49. Seven Nation Army - The White Stripes
  {
    slug: "seven-nation-army",
    title: "Seven Nation Army",
    artist: "The White Stripes",
    key: "Em",
    genre: "Alternative Rock",
    bpm: 124,
    durationSec: 232,
    notes: "Pitch-shifted octave guitar riff in E minor; G - A pre-chorus turnaround.",
    sections: [
      {
        type: "intro",
        name: "Octave Riff Intro",
        lines: ["[Em]  [Em] [G] [Em] [D] [C] [B] (x4)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em]I'm gonna fight 'em off, [G] [Em]a seven nation [D]army [C]couldn't [B]hold me back",
          "[Em]They're gonna rip it off, [G] [Em]taking their [D]time right [C]behind my [B]back",
          "[Em]And I'm talking to myself at night [G] [Em]because I [D]can't for[C]get [B]",
          "[Em]Back and forth through my mind [G] [Em]behind a [D]ciga[C]rette [B]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[G]And the message coming from my eyes [A]says leave it alone",
        ],
      },
      {
        type: "chorus",
        name: "Heavy Riff Chorus 1",
        lines: [
          "[Em]  [G]  [Em]  [D]  [C]  [B] (x2)",
          "[Em]  [G]  [Em]  [D]  [C]  [D] [C] [B] (x2)",
          "[G]   [A]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em]Don't want to hear about it, [G] [Em]every single [D]one's got a [C]story to [B]tell",
          "[Em]Everyone knows about it, [G] [Em]from the Queen of [D]England to the [C]hounds of [B]hell",
          "[Em]And if I catch it coming back my way, [G] [Em]I'm gonna [D]serve it to [C]you [B]",
          "[Em]And that ain't what you want to hear, [G] [Em]but that's [D]what I'll [C]do [B]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[G]And the feeling coming from my bones [A]says find a home",
        ],
      },
      {
        type: "solo",
        name: "Slide Guitar Solo",
        lines: [
          "[Em]  [G]  [Em]  [D]  [C]  [B] (x8)",
          "[G]   [A]",
        ],
      },
      {
        type: "outro",
        name: "Verse 3 & Outro",
        lines: [
          "[Em]I'm going to Wichita, [G] [Em]far from this [D]opera for [C]ever[B]more",
          "[Em]I'm gonna work the straw, [G] [Em]make the [D]sweat drip [C]out of every [B]pore",
          "[G]And the stains coming from my blood [A]tell me go back home",
          "[Em]  [G]  [Em]  [D]  [C]  [B]  [Em]",
        ],
      },
    ],
  },

  // 50. Losing My Religion - R.E.M.
  {
    slug: "losing-my-religion",
    title: "Losing My Religion",
    artist: "R.E.M.",
    key: "Am",
    genre: "Alternative Rock",
    bpm: 125,
    durationSec: 268,
    notes: "Mandolin & acoustic guitar classic anchored on F - Dm - G - Am and Em - Am verses.",
    sections: [
      {
        type: "intro",
        name: "Mandolin Intro",
        lines: ["[F]   [Dm]   [G]   [Am]  [Am/G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Oh, [Am]life is bigger, [Em]it's bigger than you",
          "And you are [Am]not me, the lengths that I will [Em]go to",
          "The distance in your [Am]eyes, [Em]oh no, I've said too [Dm]much, I set it [G]up",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "That's [Am]me in the corner, that's [Em]me in the spotlight",
          "[Am]Losing my religion, trying to [Em]keep up with you",
          "And I [Am]don't know if I can [Em]do it, oh no, I've said too [Dm]much",
          "I haven't said e[G]nough",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "I thought that I [F]heard you [Dm]laughing",
          "I thought that I [G]heard you [Am]sing [Am/G]",
          "I [F]think I thought I [Dm]saw you [G]try [Am] [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "Every [Am]whisper, of every [Em]waking hour",
          "I'm [Am]choosing my confessions, trying to [Em]keep an eye on you",
          "Like a [Am]hurt, lost and blinded [Em]fool, fool",
          "Oh no, I've said too [Dm]much, I set it [G]up",
        ],
      },
      {
        type: "verse",
        name: "Verse 4",
        lines: [
          "Con[Am]sider this, con[Em]sider this, the hint of the century",
          "Con[Am]sider this, the slip that [Em]brought me to my knees, failed",
          "[Am]What if all these fantasies come [Em]flailing around?",
          "Now I've [Dm]said too [G]much",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "I thought that I [F]heard you [Dm]laughing",
          "I thought that I [G]heard you [Am]sing [Am/G]",
          "I [F]think I thought I [Dm]saw you [G]try [Am]",
        ],
      },
      {
        type: "bridge",
        name: "Bridge",
        lines: [
          "[C]But that was just a [Dm]dream, [C]that was just a [Dm]dream",
        ],
      },
      {
        type: "outro",
        name: "Verse 5 & Mandolin Outro",
        lines: [
          "That's [Am]me in the corner, that's [Em]me in the spotlight",
          "[Am]Losing my religion, trying to [Em]keep up with you",
          "And I [Am]don't know if I can [Em]do it, oh no, I've said too [Dm]much",
          "I haven't said e[G]nough",
          "I thought that I [F]heard you [Dm]laughing, I thought that I [G]heard you [Am]sing",
          "[F]But that was just a [Dm]dream, [G]try, cry, why, [Am]try",
          "[F]That was just a [Dm]dream, just a [G]dream, just a [Am]dream, dream...",
        ],
      },
    ],
  },

  // 51. Viva La Vida - Coldplay
  {
    slug: "viva-la-vida",
    title: "Viva La Vida",
    artist: "Coldplay",
    key: "Ab",
    genre: "Pop",
    bpm: 138,
    capo: 1,
    durationSec: 242,
    notes: "Capo 1st Fret (C - D - G - Em orchestral string loop).",
    sections: [
      {
        type: "intro",
        name: "String Loop Intro",
        lines: ["[C]   [D]   [G]   [Em] (x2)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "I [C]used to [D]rule the [G]world, seas would [Em]rise when I gave the word",
          "Now in the [C]morning I [D]sleep a[G]lone, sweep the [Em]streets I used to own",
          "[C]   [D]   [G]   [Em]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "I [C]used to [D]roll the [G]dice, feel the [Em]fear in my enemy's eyes",
          "Listen as the [C]crowd would [D]sing: Now the [G]old king is dead, [Em]long live the king!",
          "One [C]minute I [D]held the [G]key, next the [Em]walls were closed on me",
          "And I dis[C]covered that my [D]castles [G]stand upon [Em]pillars of salt and pillars of sand",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "I [C]hear Jerusalem [D]bells a-[G]ringing, [Em]Roman Cavalry [C]choirs are [D]singing [G] [Em]",
          "Be my [C]mirror, my [D]sword and [G]shield, my [Em]missionaries in a [C]foreign [D]field [G] [Em]",
          "For [C]some reason I [D]can't ex[G]plain, [Em]once you'd gone there was [C]never, [D]never an [G]honest [Em]word",
          "And that was [C]when I [D]ruled the [G]world [Em]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "It was a [C]wicked and [D]wild [G]wind, blew down the [Em]doors to let me in",
          "Shattered [C]windows and the [D]sound of [G]drums, people [Em]couldn't believe what I'd become",
          "Revolu[C]tionaries [D]wait for my [G]head on a silver [Em]plate",
          "Just a [C]puppet on a [D]lonely [G]string, oh [Em]who would ever want to be king?",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "I [C]hear Jerusalem [D]bells a-[G]ringing, [Em]Roman Cavalry [C]choirs are [D]singing [G] [Em]",
          "Be my [C]mirror, my [D]sword and [G]shield, my [Em]missionaries in a [C]foreign [D]field [G] [Em]",
          "For [C]some reason I [D]can't ex[G]plain, I [Em]know Saint Peter won't [C]call my [D]name",
          "Never an [G]honest [Em]word, but that was [C]when I [D]ruled the [G]world [Em]",
        ],
      },
      {
        type: "outro",
        name: "Choir Singalong Outro",
        lines: [
          "[C]Oh-oh-oh-[D]oh-oh, [G]oh-oh-[Em]oh",
          "[C]Oh-oh-oh-[D]oh-oh, [G]oh-oh-[Em]oh (x4)",
        ],
      },
    ],
  },

  // 52. Fix You - Coldplay
  {
    slug: "fix-you",
    title: "Fix You",
    artist: "Coldplay",
    key: "Eb",
    genre: "Alternative Rock",
    bpm: 69,
    capo: 3,
    durationSec: 295,
    notes: "Capo 3rd Fret (C - Em - Am7 - G organ intro building into the epic C - F - C - G bridge).",
    sections: [
      {
        type: "intro",
        name: "Organ Intro",
        lines: ["[C]   [Em]   [Am7]   [G]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "When you [C]try your [Em]best, but you [Am7]don't suc[G]ceed",
          "When you [C]get what you [Em]want, but not [Am7]what you [G]need",
          "When you [C]feel so [Em]tired, but you [Am7]can't [G]sleep",
          "Stuck in [C]re[Em]verse [Am7] [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "And the [C]tears come [Em]streaming [Am7]down your [G]face",
          "When you [C]lose some[Em]thing you [Am7]can't re[G]place",
          "When you [C]love some[Em]one, but it [Am7]goes to [G]waste",
          "Could it [C]be [Em]worse? [Am7] [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[F]Lights will [C]guide you [G]home",
          "[F]And ig[C]nite your [G]bones",
          "[F]And I will [C]try to [G]fix you [C] [Em] [Am7] [G]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "And [C]high up a[Em]bove or [Am7]down be[G]low",
          "When you're [C]too in [Em]love to [Am7]let it [G]go",
          "But if you [C]never [Em]try you'll [Am7]never [G]know",
          "Just what you're [C]worth [Em] [Am7] [G]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[F]Lights will [C]guide you [G]home",
          "[F]And ig[C]nite your [G]bones",
          "[F]And I will [C]try to [G]fix you",
        ],
      },
      {
        type: "solo",
        name: "Instrumental Build",
        lines: [
          "[C]   [F]   [C]   [G]",
          "[Am]   [F]   [C]   [G] (x2)",
        ],
      },
      {
        type: "bridge",
        name: "Climactic Bridge",
        lines: [
          "[C]Tears stream [F]down your face, when you [C]lose something you [G]cannot replace",
          "[Am]Tears stream [F]down your face, and [C]I... [G]",
          "[C]Tears stream [F]down your face, I [C]promise you I will [G]learn from my mistakes",
          "[Am]Tears stream [F]down your face, and [C]I... [G]",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus",
        lines: [
          "[F]Lights will [C]guide you [G]home",
          "[F]And ig[C]nite your [G]bones",
          "[F]And I will [C]try to [G]fix you [C]",
        ],
      },
    ],
  },

  // 53. Billie Jean - Michael Jackson
  {
    slug: "billie-jean",
    title: "Billie Jean",
    artist: "Michael Jackson",
    key: "F#m",
    genre: "Pop",
    bpm: 117,
    durationSec: 294,
    notes: "Unmistakable F#m11 - G#m/F# - A/F# - G#m/F# bass and synth-string groove.",
    sections: [
      {
        type: "intro",
        name: "Bass & Drum Groove Intro",
        lines: ["[F#m]   [G#m/F#]   [A/F#]   [G#m/F#] (x4)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[F#m]She was more like a beauty queen from a movie scene",
          "I said don't mind, but what do you [Bm]mean, I am the [F#m]one",
          "Who will dance on the floor in the [Bm]round? [F#m]",
          "She said I am the [Bm]one, who will dance on the floor in the [F#m]round",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[F#m]She told me her name was Billie Jean, as she caused a scene",
          "Then every head turned with eyes that [Bm]dreamed of being the [F#m]one",
          "Who will dance on the floor in the [Bm]round [F#m]",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "[D]People always told me be [F#m]careful of what you do",
          "And don't go around [D]breaking young girls' [F#m]hearts",
          "And mother always [D]told me be [F#m]careful of who you love",
          "And be careful of what you [Bm]do 'cause the lie becomes the [C#7]truth",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[F#m]Billie Jean is not my lover",
          "She's just a girl who [Bm]claims that I am the [F#m]one",
          "But the [Bm]kid is not my [F#m]son",
          "She says I am the [Bm]one, but the kid is not my [F#m]son [C#7] [F#m]",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[F#m]For forty days and for forty nights, the law was on her side",
          "But who can stand when she's in de[Bm]mand, her schemes and [F#m]plans",
          "'Cause we danced on the floor in the [Bm]round [F#m]",
          "So take my strong ad[Bm]vice, just remember to always think [F#m]twice",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "[D]She told my baby we'd [F#m]danced 'til three, then she looked at me",
          "Then showed a [D]photo my baby [F#m]cried, his eyes were like mine",
          "'Cause we [Bm]danced on the floor in the [C#7]round, baby!",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2 & Guitar Solo",
        lines: [
          "[F#m]Billie Jean is not my lover",
          "She's just a girl who [Bm]claims that I am the [F#m]one",
          "But the [Bm]kid is not my [F#m]son",
          "[F#m]   [Bm]   [F#m]   [C#7] (Funk Guitar Solo)",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Fade",
        lines: [
          "[F#m]Billie Jean is not my lover",
          "She's just a girl who [Bm]claims that I am the [F#m]one",
          "But the [Bm]kid is not my [F#m]son!",
        ],
      },
    ],
  },

  // 54. Valerie - Amy Winehouse & Mark Ronson
  {
    slug: "valerie",
    title: "Valerie",
    artist: "Amy Winehouse",
    key: "Eb",
    genre: "Soul",
    bpm: 106,
    durationSec: 233,
    notes: "Motown / Northern Soul groove: Ebmaj7 - Fm7 in verses, Abmaj7 - Gm7 - Fm7 - Bb7 in chorus.",
    sections: [
      {
        type: "intro",
        name: "Intro Groove",
        lines: ["[Ebmaj7]    [Fm7] (x2)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "Well some[Ebmaj7]times I go out by myself and I look across the [Fm7]water",
          "And I [Ebmaj7]think of all the things, what you're doing, and in my head I paint a [Fm7]picture",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 1",
        lines: [
          "Since I've [Abmaj7]come on home, well my [Gm7]body's been a mess",
          "And I've [Fm7]missed your ginger hair and the [Gm7]way you like to dress",
          "[Abmaj7]Won't you come on over, [Gm7]stop making a fool out of [Bb7]me",
          "Why don't you come on over, [Ebmaj7]Valerie? [Fm7]",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "Vale[Ebmaj7]rie, Vale[Fm7]rie, Vale[Ebmaj7]rie, Vale[Fm7]rie",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "Did you [Ebmaj7]have to go to jail, put your house on up for sale, did you get a good [Fm7]lawyer?",
          "I hope you [Ebmaj7]didn't catch a tan, I hope you'll find the right man who'll fix it [Fm7]for ya",
          "Are you [Ebmaj7]shopping anywhere, changed the color of your hair, are you [Fm7]busy?",
          "And did you [Ebmaj7]have to pay that fine you were dodging all the time, are you still [Fm7]dizzy?",
        ],
      },
      {
        type: "prechorus",
        name: "Pre-Chorus 2",
        lines: [
          "Since I've [Abmaj7]come on home, well my [Gm7]body's been a mess",
          "And I've [Fm7]missed your ginger hair and the [Gm7]way you like to dress",
          "[Abmaj7]Won't you come on over, [Gm7]stop making a fool out of [Bb7]me",
          "Why don't you come on over, [Ebmaj7]Valerie?",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Brass Outro",
        lines: [
          "Vale[Ebmaj7]rie, Vale[Fm7]rie, Vale[Ebmaj7]rie, Vale[Fm7]rie!",
          "Why don't you come on over, [Ebmaj7]Valerie!",
        ],
      },
    ],
  },

  // 55. Superstition - Stevie Wonder
  {
    slug: "superstition",
    title: "Superstition",
    artist: "Stevie Wonder",
    key: "Em",
    genre: "Soul",
    bpm: 101,
    durationSec: 266,
    notes: "Hohner Clavinet funk riff in Ebm (or Em in standard tuning) with chromatic B7#9 - Bb7 - A7 - B7#9 horn turnaround.",
    sections: [
      {
        type: "intro",
        name: "Clavinet Funk Riff Intro",
        lines: ["[Em7]    [Em7] (x4)"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Em7]Very superstitious, writings on the wall",
          "[Em7]Very superstitious, ladders bout' to fall",
          "[Em7]Thirteen month old baby, broke the lookin' glass",
          "[Em7]Seven years of bad luck, the good things in your past",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1 (Horn Turnaround)",
        lines: [
          "[B7#9]When you believe in [C9]things that you [B7]don't under[A7]stand",
          "Then you [B7#9]suffer,",
          "Super[Em7]stition ain't the way!",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Em7]Very superstitious, wash your face and hands",
          "[Em7]Rid me of the problem, do all that you can",
          "[Em7]Keep me in a daydream, keep me goin' strong",
          "[Em7]You don't wanna save me, sad is my song",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[B7#9]When you believe in [C9]things that you [B7]don't under[A7]stand",
          "Then you [B7#9]suffer,",
          "Super[Em7]stition ain't the way, yeh, yeh!",
        ],
      },
      {
        type: "verse",
        name: "Verse 3",
        lines: [
          "[Em7]Very superstitious, nothin' more to say",
          "[Em7]Very superstitious, the devil's on his way",
          "[Em7]Thirteen month old baby, broke the lookin' glass",
          "[Em7]Seven years of bad luck, good things in your past",
        ],
      },
      {
        type: "outro",
        name: "Final Chorus & Brass Jam",
        lines: [
          "[B7#9]When you believe in [C9]things that you [B7]don't under[A7]stand",
          "Then you [B7#9]suffer,",
          "Super[Em7]stition ain't the way, no, no, no!",
          "[Em7] (Clavinet & Brass Riff to end)",
        ],
      },
    ],
  },

  // 56. Comfortably Numb - Pink Floyd
  {
    slug: "comfortably-numb",
    title: "Comfortably Numb",
    artist: "Pink Floyd",
    key: "Bm",
    genre: "Classic Rock",
    bpm: 64,
    durationSec: 382,
    notes: "Haunting Bm verses (Roger Waters) contrasting with luminous D major choruses and David Gilmour's two legendary guitar solos.",
    sections: [
      {
        type: "intro",
        name: "Atmospheric Intro",
        lines: ["[Bm]    [Bm]"],
      },
      {
        type: "verse",
        name: "Verse 1",
        lines: [
          "[Bm]Hello? (Hello, hello, hello) Is there [A]anybody [G]in there?",
          "[Em]Just nod if you can [Bm]hear me, is there anyone at home?",
          "[Bm]Come on, now, I hear you're [A]feeling [G]down",
          "[Em]Well I can ease your [Bm]pain, get you on your feet again",
          "[Bm]Relax, I'll need some [A]information [G]first",
          "[Em]Just the basic [Bm]facts, can you show me where it hurts?",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 1",
        lines: [
          "[D]There is no pain you are re[A]ceding",
          "[D]A distant ship, smoke on the ho[A]rizon",
          "[C]You are only coming through in [G]waves",
          "[C]Your lips move but I can't hear what you're [G]saying",
          "When [D]I was a child I had a [A]fever",
          "My [D]hands felt just like two bal[A]loons",
          "[C]Now I've got that feeling once a[G]gain, I can't explain, you would not under[C]stand",
          "This is not how I [G]am",
          "[A]I... have be[C]come [G]comfortably [D]numb",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo 1 (Major Key)",
        lines: [
          "[D]   [A]   [D]   [A]",
          "[C]   [G]   [C]   [G]",
          "[A]   [C]   [G]   [D]",
        ],
      },
      {
        type: "verse",
        name: "Verse 2",
        lines: [
          "[Bm]Okay, just a [A]little pinprick [G]",
          "There'll be no more [Em]aaaaah! But you may [Bm]feel a little sick",
          "[Bm]Can you stand up? I do be[A]lieve it's working, [G]good",
          "That'll keep you [Em]going through the [Bm]show, come on it's time to go",
        ],
      },
      {
        type: "chorus",
        name: "Chorus 2",
        lines: [
          "[D]There is no pain you are re[A]ceding",
          "[D]A distant ship, smoke on the ho[A]rizon",
          "[C]You are only coming through in [G]waves",
          "[C]Your lips move but I can't hear what you're [G]saying",
          "When [D]I was a child I caught a [A]fleeting glimpse",
          "[D]Out of the corner of my [A]eye",
          "[C]I turned to look but it was [G]gone, I cannot put my finger [C]on it now",
          "The child is grown, the [G]dream is gone",
          "[A]I... have be[C]come [G]comfortably [D]numb",
        ],
      },
      {
        type: "solo",
        name: "Guitar Solo 2 & Outro (Minor Key)",
        lines: [
          { comment: "David Gilmour Final Solo in Bm" },
          "[Bm]   [A]   [G]   [Em]   [Bm] (x8)",
        ],
      },
    ],
  },
];

async function run() {
  console.log(`Prepared ${MASTER_SONGBOOK.length} complete songs in MASTER_SONGBOOK.`);

  // 1. Write apps/api/src/seed/seed-songs.meta.ts
  const now = new Date().toISOString();
  const apiMetaEntries = MASTER_SONGBOOK.map((s) => ({
    id: `seed-${s.slug}`,
    title: s.title,
    artist: s.artist,
    key: s.key,
    genre: s.genre,
    bpm: s.bpm,
    capo: s.capo,
    durationSec: s.durationSec,
    notes: s.notes,
    links: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: now,
    version: 1,
    isSeed: true,
    sections: buildSections(s.slug, s.sections),
  }));

  const apiMetaContent = `import type { SongDetail } from "@bandmate/shared";\n\nexport const seedSongsMeta: SongDetail[] = ${JSON.stringify(
    apiMetaEntries,
    null,
    2
  )};\n`;
  fs.writeFileSync(
    path.resolve(process.cwd(), "apps/api/src/seed/seed-songs.meta.ts"),
    apiMetaContent,
    "utf8"
  );
  console.log("✅ Wrote apps/api/src/seed/seed-songs.meta.ts");

  // 2. Write apps/web/src/app/features/songs/data/seed-songs.data.ts
  const webSeedEntries = MASTER_SONGBOOK.map((s) => ({
    title: s.title,
    artist: s.artist,
    key: s.key,
    genre: s.genre,
    bpm: s.bpm,
    durationSec: s.durationSec,
    notes: s.notes,
    sections: buildSections(s.slug, s.sections),
  }));

  const webSeedContent = `import type { CreateSongDto } from '@bandmate/shared';\n\nexport const SEED_SONGS: CreateSongDto[] = ${JSON.stringify(
    webSeedEntries,
    null,
    2
  )};\n`;
  fs.writeFileSync(
    path.resolve(process.cwd(), "apps/web/src/app/features/songs/data/seed-songs.data.ts"),
    webSeedContent,
    "utf8"
  );
  console.log("✅ Wrote apps/web/src/app/features/songs/data/seed-songs.data.ts");

  // 3. Sync with Supabase if credentials are available
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Skipping Supabase sync (missing env vars)");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch existing songs
  const { data: existingSongs, error: eSongs } = await supabase
    .from("songs")
    .select("id, title, artist, is_seed");
  if (eSongs) throw eSongs;

  let updatedSongs = 0;
  let insertedSongs = 0;

  for (const s of MASTER_SONGBOOK) {
    const sections = buildSections(s.slug, s.sections);
    const match = (existingSongs || []).find(
      (es) =>
        es.title.trim().toLowerCase() === s.title.trim().toLowerCase() &&
        es.artist.trim().toLowerCase() === s.artist.trim().toLowerCase()
    ) || (existingSongs || []).find(
      (es) => es.title.trim().toLowerCase() === s.title.trim().toLowerCase()
    );

    if (match) {
      const { error } = await supabase
        .from("songs")
        .update({
          key: s.key,
          bpm: s.bpm,
          duration_sec: s.durationSec,
          notes: s.notes,
          sections,
        })
        .eq("id", match.id);
      if (!error) updatedSongs++;
    } else {
      const { error } = await supabase.from("songs").insert({
        owner_id: null,
        is_seed: true,
        is_imported: false,
        title: s.title,
        artist: s.artist,
        key: s.key,
        bpm: s.bpm,
        duration_sec: s.durationSec,
        notes: s.notes,
        version: 1,
        sections,
        rating_avg: Number((4.5 + Math.random() * 0.5).toFixed(2)),
        rating_count: Math.floor(4 + Math.random() * 18),
      });
      if (!error) insertedSongs++;
    }
  }

  console.log(`✅ Supabase songs table: ${updatedSongs} updated, ${insertedSongs} inserted.`);

  // 4. Sync song_works and arrangements so the Library page has all 56 complete works & arrangements
  const { data: existingWorks } = await supabase.from("song_works").select("*");
  const workMap = new Map();
  for (const w of existingWorks || []) {
    workMap.set(w.title.trim().toLowerCase(), w);
  }

  let updatedArrs = 0;
  let insertedArrs = 0;

  for (const s of MASTER_SONGBOOK) {
    const sections = buildSections(s.slug, s.sections);
    let work = workMap.get(s.title.trim().toLowerCase());

    if (!work) {
      const { data: createdWork, error: wErr } = await supabase
        .from("song_works")
        .insert({
          title: s.title,
          artist: s.artist,
          rights: "copyrighted",
          rights_notes: `seedSlug:${s.slug}\nGenre:${s.genre}`,
          source: "import",
          updated_at: now,
        })
        .select("*")
        .single();
      if (!wErr && createdWork) {
        work = createdWork;
        workMap.set(s.title.trim().toLowerCase(), work);
      }
    }

    if (work) {
      const { data: arrs } = await supabase
        .from("arrangements")
        .select("id")
        .eq("work_id", work.id);

      if (arrs && arrs.length > 0) {
        const { error: aErr } = await supabase
          .from("arrangements")
          .update({
            sections,
            key: s.key,
            bpm: String(s.bpm),
            duration_sec: s.durationSec,
            notes: s.notes,
            tags: [s.genre.toLowerCase(), "complete", "chords-and-lyrics"],
            capo: s.capo ?? null,
            is_seed: true,
            updated_at: now,
          })
          .eq("id", arrs[0].id);
        if (!aErr) updatedArrs++;
      } else {
        const { error: aErr } = await supabase.from("arrangements").insert({
          work_id: work.id,
          author_user_id: null,
          version: 1,
          sections,
          key: s.key,
          bpm: String(s.bpm),
          duration_sec: s.durationSec,
          notes: s.notes,
          links: [],
          tags: [s.genre.toLowerCase(), "complete", "chords-and-lyrics"],
          capo: s.capo ?? null,
          time_signature: "4/4",
          source: "community",
          is_seed: true,
          rating_avg: Number((4.6 + Math.random() * 0.4).toFixed(2)),
          rating_count: Math.floor(5 + Math.random() * 20),
          updated_at: now,
        });
        if (!aErr) insertedArrs++;
      }
    }
  }

  console.log(`✅ Supabase arrangements table: ${updatedArrs} updated, ${insertedArrs} inserted.`);
}

run().catch((err) => {
  console.error("❌ Error running populate-complete-songbook:", err);
  process.exit(1);
});
