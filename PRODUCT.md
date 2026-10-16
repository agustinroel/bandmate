# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Solo & Gigging Musicians**: Guitarists, bassists, vocalists, keyboardists, drummers, and horn players who need a single workspace to organize their chord/lyric repertoire, transpose keys on the fly, practice difficult passages with an A-B loop speed trainer and strobe tuner, and discover or audition for bands.
2. **Working Bands & Musical Directors**: Band leaders and ensemble members who collaborate on shared repertoires, build structured setlists with duration and key flow, synchronize tablets on stage in real time (Leader/Follower broadcast), and generate professional Technical Riders, 2D Stage Plots, and Electronic Press Kits (EPKs) for sound engineers and venue bookers.
3. **Venue Sound Engineers, Promoters & Gig Attendees (External Viewers)**: FOH engineers reading exported Tech Riders and channel input patch lists, talent buyers reviewing public `/epk/:id` press kits, and concertgoers viewing `/events/:id` gig pages or presenting QR tickets at the door (`/events/:id/check-in`).

## Product Purpose

Bandmate unifies the complete lifecycle of a musician—**Prep · Rehearse · Play**—eliminating the fragmented mess of static PDFs, disconnected tuner/metronome utilities, and chaotic group chats. Success means a musician or band can import or write an arrangement in seconds, rehearse it with studio-grade audio timing, walk onto a dimly lit stage with zero-latency synchronized charts and hands-free pedal control, and hand the venue a crystal-clear Tech Rider and EPK.

## Positioning

Unlike static sheet-music readers or generic cloud drives, Bandmate combines an interactive, chromatic-transposable ChordPro engine (`[Am]`) with Tone.js studio tools (polyphonic chord playback, 60 FPS strobe tuner, tick-synced A-B loop speed trainer), a Supabase Realtime Leader/Follower stage mesh (`band-live:{bandId}`), and a musician-native social & gig logistics network (auditions, 2D stage plots, FOH patch sheets, and one-click EPKs).

## Operating Context

- **At-Home / Studio Prep (Daylight & Ambient Light)**: Editing songs in ChordPro format, batch-importing `.pro`/`.cho`/`.txt` catalogs, building setlists, browsing the musician community feed, and configuring band profiles on desktop or laptop.
- **Rehearsal Room (Medium-Low Light, Instrument in Hand)**: Standing or sitting 1–2 meters from a tablet or laptop; hands occupied by an instrument; relies on high-contrast typography, large touch targets (`>= 44x44px`), visual metronome pulse, A-B section looping, and Bluetooth foot pedals (PageUp/PageDown/Space).
- **Live Stage Performance (Dark Stage / Direct Spotlights)**: Tablet mounted on a mic stand under extreme lighting contrast; requires an optional pure OLED Dark Stage surface (`#030712` / `#000000`), Wake Lock active, zero accidental navigation, instant visual stage cues ("Solo in 4", "Repeat Chorus"), and individual horn/capo transposition autonomy while locked to the band leader's scroll and song selection.

## Capabilities and Constraints

- **Stack**: Angular 21 Standalone components with Signals (`signal`, `computed`, `effect`), Angular Material + custom CSS token architecture (`styles.scss`), Tone.js Web Audio synthesis & transport clock, HTML5 Canvas (60 FPS strobe tuner & 2D stage plot), Fastify + Supabase backend.
- **Bilingual i18n**: Dynamic Spanish (`es`) and English (`en`) support via `I18nService`.
- **Print & Export Fidelity**: Stage Setlists, Tech Riders, and EPKs must support clean `@media print` vector PDF output and plain-text digital mixer patch downloads.
- **Zero-Latency Audio & Stage Safety**: UI animations and transitions must never block `Tone.Transport` or audio autocorrelation frames, and must respect `prefers-reduced-motion`.

## Brand Commitments

- **Brand Name & Tagline**: **Bandmate** — *"Prep · Rehearse · Play"* / *"Less chaos. More music."*
- **Brand Personality**: Luthiery warmth meets backstage studio precision—tactile, musical, confident, and distraction-free.
- **Signature Palette Commitment**: Warm Acoustic Cream (`#F9F7F0`), Deep Wood/Petrol (`#264653`), Brass/Gold Accent (`#E9C46A`), Studio Teal (`#2A9D8F`), and High-Contrast Stage OLED Slate/Black (`#030712` / `#0f172a`) in dark mode.
- **Typography Commitment**: `Manrope` for UI, headings, and lyrics; `JetBrains Mono` for chord symbols, tablature alignment, BPM/Hz readouts, and technical patch data.

## Evidence on Hand

- Brand logo assets at `apps/web/src/assets/brand/transparent-gold.png` and `avatar-fallback.svg`.
- Canonical rock/pop/blues seed catalog (`Stand By Me`, `Let It Be`, `House of the Rising Sun`, `Creep`, `Wonderwall`) in `apps/web/src/app/features/songs/data/seed-songs.data.ts`.
- Full E2E and unit test suites (`roadmap-e2e.spec.ts`, `m1-m2-adversarial.spec.ts`, `adversarial-m3-m4.spec.ts`) verifying functional contracts across all milestones.

## Product Principles

1. **Stage-First Legibility**: Chords, section markers, BPMs, and cues must be unmistakable at a two-meter distance with an instrument in hand.
2. **Earned Familiarity & Tactile Precision**: Controls should feel like well-crafted studio hardware—clear states, crisp borders, exponential deceleration, and zero decorative clutter.
3. **Seamless Mode Transitions**: Moving from editing a song to practicing a loop to performing live with a band should feel like switching channels on a console, never like entering a different product.
4. **Respect the Musician's Hands**: Prioritize keyboard shortcuts, Bluetooth foot-pedal bindings, generous touch targets, and one-click actions over nested menus.

## Accessibility & Inclusion

- **WCAG 2.1 Level AA Compliance**: Minimum `4.5:1` contrast ratio for normal text and `3:1` for large stage typography across both Light (Warm Cream) and Dark (Stage OLED) themes.
- **Touch & Pedal Ergonomics**: Minimum `44x44px` touch targets (`48x48px` on primary stage transport controls), visible `:focus-visible` brass focus rings (`rgba(233, 196, 106, 0.5)`), and full `prefers-reduced-motion` support.
