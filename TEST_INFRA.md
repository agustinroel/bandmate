# Bandmate Test Infrastructure & Dual Track Specification

> **Version**: 2026.1  
> **Target Framework**: Angular 21 Standalone & Fastify TypeScript  
> **Test Runner**: Vitest 4.x via `@angular/build:unit-test` (`npm test`)  
> **Scope**: Roadmap 2026 Milestones R1 through R5  

---

## 1. Test Philosophy & Dual Track Methodology

Bandmate follows a strict **Dual Track Engineering & Testing Strategy**:
1. **Implementation Track**: Feature engineers implement business logic, UI components, and reactive signal stores according to interface contracts.
2. **Opaque-Box Testing Track**: Test creators design and execute requirement-driven, contract-verified test suites running independently of internal implementation nuances.

### Core Testing Tenets:
- **Opaque-Box Verification**: Tests validate behavioral contracts and observable outcomes (Signal emissions, DOM representations, PDF/Text document outputs, exported blobs) rather than private implementation details.
- **Zero-Facade Standard**: No dummy or vacuous test cases that pass unconditionally. Every test exercises real reactive state transitions, calculation logic, or data parsing.
- **Authoritative Ground Truth**: Expected outputs are derived directly from the canonical roadmap (`docs/ROADMAP_2026.md`), specifications (`prompt_draft.md`), and system contracts (`PROJECT.md`).
- **High-Fidelity Isolation**: Tests set up their own scoped fixtures and mocks, clean up subscriptions, and avoid state leakage across suites.

---

## 2. Feature Inventory Mapping

Every testable feature in the 2026 roadmap maps directly to a formal requirement ID and verification tier:

| Req ID | Feature | Description | Spec Source | Primary Test File |
|--------|---------|-------------|-------------|-------------------|
| **R1.1** | Stage Mesh Integration | Join band session `band-live:{bandId}` with role selection | ROADMAP Phase 3, §R1.1 | `live-band-sync.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R1.2** | Leader / Follower Protocol | Leader broadcasts song changes and section jumps; followers sync instantly | ROADMAP Phase 3, §R1.2 | `live-band-sync.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R1.3** | Visual Stage Cues | High-visibility flash cues on followers ("Solo in 4", "Repeat", "Ending", custom) | ROADMAP Phase 3, §R1.3 | `live-band-sync.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R1.4** | Transposition Autonomy | Followers independently transpose chords without affecting master key | ROADMAP Phase 3, §R1.4 | `practice-page.spec.ts`, `roadmap-e2e.spec.ts` |
| **R1.5** | Presence & Peer HUD | Live indicator of connected band members, roles, and instruments | ROADMAP Phase 3, §R1.5 | `live-band-sync.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R2.1** | A-B Loop Section Markers | Define Section A and Section B markers in practice mode to loop sections | ROADMAP Phase 2, §R2.1 | `loop-trainer.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R2.2** | Automated Speed Trainer | Auto-increment tempo by $X$ BPM every $N$ reps up to target BPM | ROADMAP Phase 2, §R2.2 | `loop-trainer.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R2.3** | Transport & Metronome Sync | Loops and speed changes synchronize with Metronome and Tone.js | ROADMAP Phase 2, §R2.3 | `loop-trainer.service.spec.ts`, `roadmap-e2e.spec.ts` |
| **R3.1** | Pro Strobe Tuner & Presets | 60 FPS HTML5 canvas strobe mode with 12 multi-instrument tuning presets | ROADMAP Phase 2, §R3.1 | `tuner-page.spec.ts`, `roadmap-e2e.spec.ts` |
| **R3.2** | A4 Calibration Persistence | A4 frequency slider (432-446 Hz) persisted in `localStorage` | ROADMAP Phase 2, §R3.2 | `tuner-page.spec.ts`, `roadmap-e2e.spec.ts` |
| **R4.1** | Tech Rider & Input List PDF | Dynamic 2D stage plot diagram, numbered FOH channel patch list, and printable PDF | ROADMAP Phase 7, §R4.1 | `stage-plot-page.spec.ts`, `roadmap-e2e.spec.ts` |
| **R4.2** | One-Click Band EPK Generator | Electronic Press Kit generator with bio, roster, gigs, and technical rider | ROADMAP Phase 7, §R4.2 | `band-epk-dialog.component.spec.ts`, `roadmap-e2e.spec.ts` |
| **R5.1** | Multi-file Batch Importer | Multi-file parser (.pro, .cho, .onsong, .txt) with preview and batch ingestion | ROADMAP Phase 1, §R5.1 | `smart-import-dialog.component.spec.ts`, `roadmap-e2e.spec.ts` |
| **R5.2** | Stage Setlist PDF Exporter | Stage-readable setlist PDF with layout modes (Giant, Structured, Tech), durations, watermark | ROADMAP Phase 1, §R5.2 | `setlist-export-dialog.spec.ts`, `roadmap-e2e.spec.ts` |

---

## 3. Test Architecture & Runner Setup

### Test Execution Commands:
- **Full Test Suite**:
  ```bash
  npm test
  ```
  Runs `vitest run` in `apps/api` and `ng test` in `apps/web`.
- **Frontend Suite Only**:
  ```bash
  npm test -w apps/web
  ```
- **Backend Suite Only**:
  ```bash
  npm test -w apps/api
  ```

### Configuration & Runner Mechanics:
- **Angular Test Builder**: `@angular/build:unit-test` configured with `runnerConfig: "vitest.config.ts"`.
- **Environment**: Node.js `jsdom` simulated DOM environment.
- **Timeouts**: Configured with `hookTimeout: 30000` and `testTimeout: 30000` in `apps/web/vitest.config.ts` to accommodate parallel Angular module compilation under Windows and CI runners.

---

## 4. Test Case Hierarchy (Tiers 1 - 4)

The comprehensive E2E test suite in `apps/web/src/app/testing/roadmap-e2e.spec.ts` is organized into four hierarchical tiers:

### Tier 1: Requirement & Feature Coverage (Happy Path)
- **R1 Live Sync**: Validates leader session creation, follower connection, song change broadcast, section jump synchronization, scroll position synchronization, visual stage cue triggers ('solo', 'repeat', 'ending', 'custom'), and peer presence list.
- **R2 Loop Trainer**: Validates setting Section A and B markers, loop activation, cycle repetition counting, automatic tempo increments by $X$ BPM every $N$ reps, and status summary computations.
- **R3 Pro Tuner**: Validates switching between needle gauge and 60 FPS strobe modes, selecting presets across guitar, bass, ukulele, violin, and cello, and calibrating string frequencies based on A4 reference frequency.
- **R4 Tech Rider & EPK**: Validates generating structured FOH patch sheets with numbered channels, phantom power (+48V), mic/stand specs, layout switching ('full', 'compact', 'patch-only'), and EPK press document compilation.
- **R5 Batch Import & Setlist Export**: Validates multi-file batch parsing of ChordPro and plain text sheets, extracting titles, artists, musical keys, BPMs, and section structures, as well as setlist PDF formatting and total duration calculations.

### Tier 2: Boundary & Corner Cases
- **A4 Frequency Clamping**: Strict boundaries at 432 Hz minimum and 446 Hz maximum; resetting to 440 Hz standard; fallback behavior on corrupted or invalid `localStorage` values.
- **Tempo Limits & Clamping**: Speed Trainer clamping initial/target BPM between 30 and 300 BPM; cycle lengths from 1 to 64 bars; handling pause/resume state cycles.
- **Empty & Corrupt Inputs**: 0-channel stage plots; empty member/gig lists in EPK; malformed ChordPro files (missing titles, unclosed brackets, binary garbage); setlists with 0 songs or zero-duration tracks.
- **Rapid Events & Reconnection**: Rapid firing of visual stage cues; prompt dismissal before timeout; session disconnect and reconnection idempotency.

### Tier 3: Cross-Feature Combinations
- **Live Sync + Autonomous Transposition + Stage Cues**: Follower transposes chord displays independently while remaining locked to leader's song and position; simultaneous reception of visual cues during active performance.
- **Loop Trainer + Metronome + Transport Synchronization**: Loop cycle completion drives dynamic tempo changes on the shared `MetronomeService`, updating metronome audio state and loop summary signals in sync.
- **A4 Calibration + Preset Transposition Calculations**: Dynamic adjustment of A4 propagates mathematically to all instrument presets and open-string frequency targets.
- **Batch Ingestion + Band Repertoire + Setlist Exporter**: Multi-file parsed repertoire seamlessly populates a live stage setlist, generating high-contrast print layouts and accurate duration tallies.

### Tier 4: Real-World Scenarios
- **Scenario 1 — High-Intensity Rehearsal Loop Routine**: Musician isolates a difficult guitar solo section, enables Speed Trainer from 80 BPM to 120 BPM (+10 BPM every 2 reps), pauses for coaching, resumes, and reaches target tempo.
- **Scenario 2 — Live Stage Performance Synchronization**: 4-member band (Leader, Bassist, Horn, Keys) connects to `band-live:gig-2026`. Leader switches setlist songs; followers auto-navigate; horn transposes to Bb; leader flashes "Ending on 1" cue.
- **Scenario 3 — Venue Soundcheck & Tech Rider Delivery**: Band creates stage plot with 12 channels (drums, bass DI, guitar amps, lead vocals with +48V). Exports plain text patch sheet for FOH engineer and EPK dossier for the venue promoter.
- **Scenario 4 — Large Catalog Bulk Migration**: Musician imports a legacy songbook archive (ChordPro + plain text files), verifies automated key/tempo parsing, and bulk-saves into band repertoire.

---

## 5. Quality Standards & Coverage Thresholds

- **Zero-Failure Gate**: 100% of all unit and E2E tests must pass cleanly.
- **No Regressions**: Baseline 86+ existing tests must continue to pass alongside all new test tiers.
- **Clean Production Build**: Frontend and backend must compile with 0 TypeScript/Angular errors (`npm run build`).
