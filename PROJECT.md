# Project: Bandmate Roadmap 2026 Completion

## Architecture
Bandmate is a high-performance stage and practice platform for musicians and bands.
- **Frontend (`apps/web`)**: Angular 21 Standalone architecture with Angular Signals (`signal`, `computed`, `effect`), `inject()`, new control flow (`@if`, `@for`, `@defer`), Tone.js audio engine, Supabase Realtime WebSocket client, and HTML5 Canvas.
- **Backend (`apps/api`)**: Fastify API with TypeScript, Supabase PostgreSQL with Row Level Security (RLS), and BullMQ.
- **Shared (`packages/shared`)**: Shared data models, validation schemas, and music parsers (Smart Tab parser, chord transposers).
- **Styling & Design System**: OLED Dark Theme (`#000000`), WCAG 2.1 AA compliant contrast, `@media print` PDF vector export isolation.

---

## Feature Inventory
Every feature identified during the Survey phase appears here with its assigned milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1.1 | Stage Mesh Integration | Toolbar controls to join band session `band-live:{bandId}` with role selection | M1 | prompt_draft §R1.1, ROADMAP Phase 3 |
| F1.2 | Leader / Follower Protocol | Leader broadcasts song changes and section jumps; followers sync instantly | M1 | prompt_draft §R1.2, ROADMAP Phase 3 |
| F1.3 | Leader-to-Follower Scroll Sync | Throttled scroll position broadcast on leader; follower view synchronizes | M1 | prompt_draft §R1.2, ROADMAP Phase 3 |
| F1.4 | Visual Stage Cues | High-visibility flash cues on followers ("Solo in 4", "Repeat", "Ending", etc.) | M1 | prompt_draft §R1.3, ROADMAP Phase 3 |
| F1.5 | Custom Stage Cue Input | Leader can type and send custom text cues to band followers | M1 | prompt_draft §R1.3, ROADMAP Phase 3 |
| F1.6 | Transposition Autonomy | Followers can independently transpose chords without affecting master key | M1 | prompt_draft §R1.4, ROADMAP Phase 3 |
| F1.7 | Presence & Peer HUD | Live indicator of connected members, assigned instruments, and roles | M1 | prompt_draft §R1.5, ROADMAP Phase 3 |
| F2.1 | A-B Section Loop Marker | Define Section A and Section B markers in practice mode to loop sections | M2 | prompt_draft §R2.1, ROADMAP Phase 2 |
| F2.2 | Automated Speed Trainer | Auto-increment tempo by X BPM every N reps until target BPM is reached | M2 | prompt_draft §R2.2, ROADMAP Phase 2 |
| F2.3 | Loop Pause/Resume & Reset | Granular controls in active loop bar to pause, resume, and reset reps/BPM | M2 | prompt_draft §R2.2, ROADMAP Phase 2 |
| F2.4 | Loop Transport Sync | Practice loops and speed changes stay strictly synchronized to Tone.js ticks | M2 | prompt_draft §R2.3, ROADMAP Phase 2 |
| F2.5 | Pro Strobe Tuner & Presets | 60 FPS HTML5 canvas strobe mode with 12 multi-instrument tuning presets | M2 | prompt_draft §R3.1, ROADMAP Phase 2 |
| F2.6 | A4 Calibration Persistence | A4 frequency slider (432-446 Hz) persisted in `localStorage` | M2 | prompt_draft §R3.2, ROADMAP Phase 2 |
| F3.1 | Tech Rider Stage Plot Diagram | 2D interactive canvas diagram with upstage/downstage and stage gear items | M3 | prompt_draft §R4.1, ROADMAP Phase 7 |
| F3.2 | Numbered Channel Input List | Dynamic FOH channel patch list (channel, mic, DI, +48V phantom, stand) | M3 | prompt_draft §R4.1, ROADMAP Phase 7 |
| F3.3 | Tech Rider Export Dialog | Dedicated export modal with live sheet preview, layout options, print-to-PDF | M3 | prompt_draft §R4.1, ROADMAP Phase 7 |
| F3.4 | Mixer Patch Text Download | Plain text format export (`.txt` & clipboard copy) for digital mixer desks | M3 | prompt_draft §R4.1, ROADMAP Phase 7 |
| F3.5 | One-Click Band EPK Generator | Modal generating Electronic Press Kit with bio, roster, gigs, and repertoire | M3 | prompt_draft §R4.2, ROADMAP Phase 7 |
| F3.6 | EPK Genre & Rider Summary | Genre tags and dynamic technical stage rider summary (channels, IEM, power) | M3 | prompt_draft §R4.2, ROADMAP Phase 7 |
| F3.7 | EPK Press Dossier Download | Downloadable and printable press one-sheet document (.txt/.md) | M3 | prompt_draft §R4.2, ROADMAP Phase 7 |
| F3.8 | Public EPK Route | Publicly accessible standalone route `/epk/:id` | M3 | prompt_draft §R4.2, ROADMAP Phase 7 |
| F4.1 | Multi-file Batch Importer | Drag-and-drop / file selector for `.pro`, `.cho`, `.chopro`, `.onsong`, `.txt` | M4 | prompt_draft §R5.1, ROADMAP Phase 1 |
| F4.2 | Batch Tab Preview & Ingestion | Interactive preview of parsed songs, section counts, key, and sequential save | M4 | prompt_draft §R5.1, ROADMAP Phase 1 |
| F4.3 | Repertoire Band Context | Direct import into band repertoire when target band ID is provided | M4 | prompt_draft §R5.1, ROADMAP Phase 1 |
| F4.4 | Stage Setlist PDF Exporter | Stage-readable setlist PDF with layout modes (Giant, Structured, Tech) | M4 | prompt_draft §R5.2, ROADMAP Phase 1 |
| F4.5 | Setlist Styling & Watermark | Custom stage font size, keys, BPMs, durations, and stage security watermark | M4 | prompt_draft §R5.2, ROADMAP Phase 1 |
| F5.1 | E2E Opaque-Box Test Suite | Comprehensive 4-tier test suite validating all user requirements | E2E | prompt_draft §5, Project Pattern |
| F5.2 | Adversarial Hardening | Tier 5 challenger gap detection and adversarial edge case validation | M5 | prompt_draft §5, Project Pattern |
| F5.3 | Roadmap Checklist Synchronization | Update `docs/ROADMAP_2026.md` checkboxes from `[ ]` to `[x]` | M5 | prompt_draft §5, ROADMAP_2026 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Design & implement opaque-box test suite (Tiers 1-4) in parallel; publish `TEST_READY.md` | none | DONE (`TEST_INFRA.md`, `TEST_READY.md`, 34 tests in `roadmap-e2e.spec.ts`) |
| M1 | Live Band Real-time Sync | Implement scroll sync, custom stage cue dispatch, peer instrument HUD, joiner flow | none | DONE (`live-band-sync.service.ts`, `practice-page.ts`, 13 tests) |
| M2 | Pro Musician Audio Toolkit | Loop Trainer pause/resume/reset controls, HUD wiring, A4 calibration `localStorage` | none | DONE (`loop-trainer.service.ts`, `tuner-page.ts`, `practice-page.html`, 17 tests) |
| M3 | Live Gigs, Tech Riders & EPK | Tech Rider Export Dialog, mixer patch text export, EPK genre & rider summary, public EPK route | none | DONE (`tech-rider-export-dialog.ts`, `band-epk-dialog.component.ts`, `public-epk-page.ts`, 25 tests) |
| M4 | Universal Catalog Bulk Operations | Verify batch import band context, setlist font size controls, export integration | none | DONE (`smart-import-dialog.component.ts`, `setlist-export-dialog.ts`, 19 tests) |
| M5 | Final Milestone: 100% E2E Pass & Hardening | Pass 100% of E2E test suite (Tiers 1-4), Tier 5 adversarial hardening, update `ROADMAP_2026.md` to `[x]` | M1, M2, M3, M4, E2E | DONE (193/193 tests passed, build code 0, ROADMAP updated) |

---

## Interface Contracts

### 1. `LiveBandSyncService` & Practice Stage
- `broadcastScroll(scrollTop: number, scrollRatio: number): void`
- `remoteScroll: Signal<LiveScrollPayload | null>`
- `broadcastStageCue(text: string, type: StageCueType): void`
- `activeCue: Signal<StageCue | null>`
- `peers: Signal<LiveStagePeer[]>` where `LiveStagePeer` includes `instrument?: string`

### 2. `LoopTrainerService`
- `pauseLoop(): void`
- `resumeLoop(): void`
- `resetLoop(): void`
- `isPaused: Signal<boolean>`
- `summary: Signal<LoopStatusSummary>`

### 3. `TunerPageComponent`
- `a4Frequency: Signal<number>` with persistence via `localStorage.getItem('bandmate_tuner_a4')` / `setItem`
- Range: `432` to `446` Hz, default `440` Hz

### 4. `TechRiderExportDialogComponent`
- Input: `TechRiderExportDialogData` (`meta: TechRiderMeta`, `elements: StageElement[]`, `channelInputList: InputChannel[]`, `stageDimensions?: string`)
- Actions: `printRiderSheet()`, `copyPatchSheetText()`, `downloadPatchSheetTxt()`

### 5. `BandEpkDialogComponent`
- Input: `BandEpkDialogData` (`band: BandRow`, `members: any[]`, `songs: any[]`, `events: any[]`, `genre?: string`, `stageRiderSummary?: StageRiderSummary`, `bookingContact?: BookingContact`)
- Actions: `printEpk()`, `copyShareLink()`, `downloadEpkTxt()`, `copyEpkText()`

### 6. Public EPK Route
- Path: `/epk/:id`
- Routed to `PublicEpkPageComponent` (or standalone EPK viewer)

---

## Code Layout

- `apps/web/src/app/core/services/` — Core singleton services (`live-band-sync.service.ts`)
- `apps/web/src/app/features/practice/` — Rehearsal and stage mode
  - `pages/practice-page/` — Main live stage and practice view
  - `services/` — `loop-trainer.service.ts`, `metronome.service.ts`
- `apps/web/src/app/features/tools/tuner/` — Pro Strobe Tuner component and canvas rendering
- `apps/web/src/app/features/tools/stage-plot/` — 2D Stage Plot Designer & Tech Rider
  - `ui/tech-rider-export-dialog/` — Tech Rider PDF & text export modal
- `apps/web/src/app/features/bands/` — Band management
  - `ui/stage-plot/` — Embedded band stage plot
  - `ui/band-epk-dialog/` — Band EPK modal and press generator
  - `pages/public-epk-page/` — Public EPK standalone view
- `apps/web/src/app/features/songs/` — Song repertoire & import
  - `ui/smart-import-dialog/` — Multi-file batch importer
- `apps/web/src/app/features/setlists/` — Setlist management
  - `ui/setlist-export-dialog.ts` — Stage setlist PDF exporter
- `docs/ROADMAP_2026.md` — Canonical roadmap checklist
