---
name: Bandmate
description: "Prep · Rehearse · Play — Studio-grade repertoire, practice, and live stage platform for musicians and bands"
colors:
  deep-wood: "#264653"
  warm-brass: "#E9C46A"
  studio-teal: "#2A9D8F"
  amber-cue: "#F4A261"
  terracotta-warn: "#E76F51"
  acoustic-cream: "#F9F7F0"
  parchment-tint: "#F4F1DE"
  ivory-surface: "#FFFFFF"
  stage-oled-bg: "#030712"
  stage-slate-surface: "#0F172A"
  stage-slate-elevated: "#1E293B"
  stage-snow-text: "#F8FAFC"
  stage-muted-slate: "#94A3B8"
typography:
  display:
    fontFamily: "'Space Grotesk', 'Manrope', system-ui, -apple-system, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Space Grotesk', 'Manrope', system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Plus Jakarta Sans', 'Manrope', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.deep-wood}"
    textColor: "{colors.warm-brass}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.stage-slate-surface}"
    textColor: "{colors.warm-brass}"
  button-accent:
    backgroundColor: "{colors.warm-brass}"
    textColor: "{colors.stage-oled-bg}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  card-surface:
    backgroundColor: "{colors.ivory-surface}"
    textColor: "{colors.deep-wood}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  chip-chord:
    backgroundColor: "{colors.parchment-tint}"
    textColor: "{colors.deep-wood}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
---

# Design System: Bandmate

## Overview

**Creative North Star: "The Luthier's Console"**

Bandmate's visual language merges the tactile warmth of an acoustic luthier's workshop with the high-contrast precision of a backstage mixing console. During daytime preparation and catalog management, the interface rests on Warm Acoustic Cream (`#F9F7F0`) and Deep Wood (`#264653`), reducing eye strain while reading dense chord sheets and lyrics. When the musician steps into rehearsal or onto a dark stage, the system shifts seamlessly into Stage OLED Dark Mode (`#030712` and `#0F172A`), where illuminated Warm Brass (`#E9C46A`) and Studio Teal (`#2A9D8F`) readouts cut through stage glare without bleeding ambient light.

Every surface is engineered for **Operate** and **Read** clarity under real musical constraints: an instrument in hand, a tablet two meters away on a mic stand, and zero tolerance for visual clutter or ambiguous state. Motion uses smooth exponential deceleration—never bouncy or elastic novelties—and every numerical readout (BPM, Hz, cents, duration, semitones) locks to a tabular monospace grid.

**Key Characteristics:**
- **Dual-Scene Polarity**: Warm Acoustic Cream (`#F9F7F0`) for daytime prep and studio arrangement; Deep Stage OLED (`#030712`) for low-light rehearsal and live performance.
- **Tactile Hardware Hierarchy**: Primary actions, active transport controls, and harmonic cues carry Warm Brass (`#E9C46A`) and Deep Wood (`#264653`), inspired by vintage brass hardware and anodized studio consoles.
- **Musical Typography Triad**: `Space Grotesk` provides architectural precision for display headers, `Plus Jakarta Sans` (and `Manrope`) delivers humanist warmth and stage legibility for lyrics and UI copy, while `JetBrains Mono` guarantees character-exact chord positioning, fret diagrams, and tabular telemetry.
- **Stage-Safe Ergonomics**: `44x44px` minimum touch targets (`48x48px` on live transport bars), high-contrast WCAG 2.1 AA compliance in both themes, and full-perimeter or inset glow states instead of generic side-stripe borders.

## Colors

Bandmate's palette balances warm organic luthiery tones in light mode with high-contrast studio console telemetry in dark mode.

### Primary
- **Deep Wood** (`#264653`): Primary brand anchor, main typography in light mode, primary button fills, and structural headers. Evokes aged spruce and deep petrol-stained mahogany.
- **Warm Brass** (`#E9C46A`): Primary accent used for active transport indicators, chord highlights in dark mode, PRO badges, focus rings, and primary stage CTAs (`Show Mode`, `Play`).

### Secondary
- **Studio Teal** (`#2A9D8F`): Secondary accent for live synchronization status (`Stage Mesh Connected`), in-tune strobe confirmation, attached song cards, and positive completion states.

### Tertiary
- **Amber Cue** (`#F4A261`): Used for tempo/loop warnings, rehearsal streaks, and stage cue flashes.
- **Terracotta Warn** (`#E76F51`): Used for destructive actions, out-of-tune sharp/flat alerts, and critical stage cues.

### Neutral
- **Acoustic Cream** (`#F9F7F0`): Default page background in light mode, eliminating the harsh glare of pure white paper.
- **Parchment Tint** (`#F4F1DE`): Secondary container fill for subtle grouping, tags, and inactive pills in light mode.
- **Ivory Surface** (`#FFFFFF`): Elevated card and sheet-music canvas surface in light mode.
- **Stage OLED Background** (`#030712`): Root canvas in dark mode and live stage view, minimizing light spill on dark stages.
- **Stage Slate Surface** (`#0F172A`): Card and panel container surface in dark mode.
- **Stage Slate Elevated** (`#1E293B`): Hover, input, and secondary surface layer in dark mode.
- **Stage Snow Text** (`#F8FAFC`): Primary high-contrast foreground text in dark mode.
- **Stage Muted Slate** (`#94A3B8`): Secondary metadata, timestamps, and helper labels in dark mode (guaranteed `>= 4.5:1` contrast against `#030712` and `#0F172A`).

### Named Rules
**The Brass-On-Obsidian Rule.** Whenever Warm Brass (`#E9C46A`) is used as a solid button or badge fill, its label and icon must use Obsidian (`#090D16` or `#0F172A`) at `font-weight: 700+`—never white—to guarantee WCAG AA contrast above `8:1`.

**The Tinted Neutral Rule.** Never use pure neutral gray (`#808080` or `#999999`) for secondary text or borders. Every neutral is tinted with either Deep Wood (`rgba(38, 70, 83, 0.68)`) in light mode or cool slate (`#94A3B8`) in dark mode.

## Typography

**Display Font:** `Space Grotesk` (with `Manrope, system-ui, -apple-system, sans-serif` fallback)
**Body Font:** `Plus Jakarta Sans` (with `Manrope, system-ui, -apple-system, sans-serif` fallback)
**Label/Mono Font:** `JetBrains Mono` (with `ui-monospace, monospace` fallback)

**Character:** `Space Grotesk` and `Plus Jakarta Sans` combine geometric authority with warm apertures that remain effortless to read at a distance, while `JetBrains Mono` anchors every musical measurement—chords, keys, BPMs, frequencies, and FOH channel numbers—in a rock-solid rhythmic grid.

### Hierarchy
- **Display** (`800`, `2.2rem`, `line-height: 1.1`, `letter-spacing: -0.035em`): Page titles (`.bm-page-title`), song sheet titles, and public EPK artist headers.
- **Headline** (`700`, `1.5rem`, `line-height: 1.2`, `letter-spacing: -0.02em`): Section headers, modal titles, and dashboard module headings.
- **Title** (`700`, `1.125rem`, `line-height: 1.3`, `letter-spacing: -0.01em`): Card titles, song row titles, and band roster names.
- **Body** (`400`–`500`, `1rem`, `line-height: 1.6`): Lyrics, descriptions, community posts, and form inputs (constrained to `65ch–75ch` for long-form prose and legal/EPK bios).
- **Label / Telemetry** (`700`, `0.78rem` / `12.5px`, `letter-spacing: 0.04em`, `JetBrains Mono`): Chord tokens (`[Am7]`), musical keys, BPM counters, Hz readouts, and badge pills. Minimum functional UI text size is strictly `11px` (`0.6875rem`).

### Named Rules
**The Monospace Telemetry Rule.** Use `JetBrains Mono` with `font-variant-numeric: tabular-nums` exclusively for musical notation (chords, keys, semitones), timing/frequency metrics (BPM, Hz, cents, durations), and technical patch indices. Never use `Inter` or system monospace fallbacks as a decorative costume.

## Layout

Bandmate uses an app-shell architecture (`280px` collapsible left sidenav + `64px` topbar on desktop; slide-over drawer + `56px` topbar with safe-area padding on mobile) wrapping a centered `.content-wrap` container (`max-width: 980px` for standard workspaces, expanding to `1200px` for multi-column stage, dashboard, and stage-plot surfaces).

- **Spacing Rhythm**: Built on a `4px` base unit (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`). Related controls within a toolbar cluster at `8px`–`10px`; distinct page sections separate by `24px`–`32px`.
- **Responsive Breakpoints**:
  - `640px` (`sm`): Mobile layout; action rows stack vertically (`.bm-actions-row`), footer hides to maximize viewport height, and padding adapts to `12px–16px` with `env(safe-area-inset-bottom)`.
  - `768px` (`md`): Tablet portrait; two-column card grids and collapsible practice HUD panels.
  - `1024px+` (`lg`): Desktop and tablet landscape; full dual-column stage lyrics mode, side-by-side community feed + trending sidebar, and interactive 2D stage plot canvas.

## Elevation & Depth

Bandmate uses a **hybrid tonal-and-ambient depth system**. In light mode, Ivory (`#FFFFFF`) cards sit atop Warm Acoustic Cream (`#F9F7F0`) with warm, low-opacity multi-layered shadows and a subtle `1px` wood-tinted border (`rgba(38, 70, 83, 0.12)`). In dark mode, depth is conveyed through tonal surface stepping (`#030712` canvas → `#0F172A` card → `#1E293B` interactive control) paired with crisp `1px solid rgba(255, 255, 255, 0.12)` borders.

### Shadow Vocabulary
- **Resting Card (`--bm-shadow-1`)** (`box-shadow: 0 6px 14px rgba(38, 48, 53, 0.06)`): Default elevation for cards, song rows, and panels in light mode.
- **Interactive Lift (`--bm-shadow-2`)** (`box-shadow: 0 10px 24px rgba(38, 48, 53, 0.08)`): Hover elevation for interactive song cards, setlists, and bands.
- **Brass Focus Ring** (`box-shadow: 0 0 0 3px rgba(233, 196, 106, 0.5)`): Keyboard `:focus-visible` indicator across all interactive controls.

### Named Rules
**The Exponential Deceleration Rule.** All transitions and micro-interactions use smooth exponential easing (`cubic-bezier(0.22, 1, 0.36, 1)` or `cubic-bezier(0.2, 0.8, 0.2, 1)` over `150ms–250ms`). Overshooting bounce or elastic curves (`cubic-bezier(..., >1)`) are strictly forbidden.

## Shapes

- **Cards & Panels**: `18px` border radius (`.bm-card`) for primary content containers; `24px` for hero banners and dialogs.
- **Buttons & Inputs**: `12px`–`14px` border radius for standard action buttons, form inputs, and navigation list items; `9999px` (pill) for social follow actions, filter chips, and transport capsules.
- **Brand Mark (`.bm-mark`)**: `44x44px` squircle with `14px` radius, dark charcoal gradient fill, and centered `22px` Warm Brass icon.
- **Full-Perimeter Selection**: Active cards, song sections, and navigation items indicate state through subtle background tinting and full `1px` perimeter borders (`rgba(233, 196, 106, 0.4)`), never through a thick `3px–4px` left or top side-stripe pseudo-element.

## Components

### Buttons
- **Shape:** Gently rounded hardware key (`12px`–`14px` radius) for standard actions; full pill (`9999px`) for stage mode and social follow triggers.
- **Primary (`.mat-primary`):** Deep Wood gradient fill (`linear-gradient(135deg, #1a2f38 0%, #264653 100%)`) with Warm Brass (`#E9C46A`) label and icon, `1px solid rgba(233, 196, 106, 0.25)` border.
- **Accent (`.bm-btn-accent` / `.show-mode-btn`):** Solid Warm Brass (`#E9C46A`) fill with Obsidian (`#090D16`) bold label (`700`).
- **Hover / Focus:** Subtle `translateY(-1px)` lift with `brightness(1.06)` and `3px` Warm Brass focus ring on `:focus-visible`.

### Chips
- **Style:** Pill-shaped (`9999px`) or compact tag (`6px` radius for chord badges), `1px` border, `JetBrains Mono` or `Manrope` `600` weight.
- **State:** Unselected uses subtle surface tint (`rgba(38, 70, 83, 0.06)` light / `rgba(255, 255, 255, 0.08)` dark); active state switches to Warm Brass (`#E9C46A`) fill with `#090D16` text.

### Cards / Containers
- **Corner Style:** `18px` radius (`.bm-card`).
- **Background:** `#FFFFFF` in light mode; `#0F172A` in dark mode.
- **Shadow Strategy:** `--bm-shadow-1` at rest, `--bm-shadow-2` on hover.
- **Border:** `1px solid rgba(38, 70, 83, 0.12)` in light mode; `1px solid rgba(255, 255, 255, 0.12)` in dark mode.
- **Internal Padding:** `20px`–`24px` on desktop; `16px` on mobile.

### Inputs / Fields
- **Style:** Outlined fields with `12px` radius, clear floating or top-aligned labels, and `44px+` height.
- **Focus:** Border shifts to Warm Brass (`#E9C46A`) or Deep Wood (`#264653`) with a soft `3px` focus halo.

### Navigation
- **Style:** Left sidenav (`280px`) with grouped sections (`Main`, `Library`, `Community`, `Tools`) and a top bar (`64px`) housing workspace context, theme toggle, notifications, and profile avatar.
- **Active State:** Full rounded rectangle (`12px` radius) with subtle gold-tinted border (`1px solid rgba(233, 196, 106, 0.35)`), elevated surface background, and Warm Brass icon.

### Chord Line View & Stage HUD (Signature Component)
- **Chord Line View (`bm-chord-line-view`):** Renders inline `[Chord]` tokens positioned rhythmically above their corresponding syllable in `JetBrains Mono` `700`, with interactive click-to-voice Tone.js synthesis and guitar fret diagram popovers.

## Do's and Don'ts

### Do:
- **Do** use `Manrope` for all UI and lyric text and `JetBrains Mono` (`tabular-nums`) for chords, keys, BPM, Hz, and channel numbers.
- **Do** ensure every `<img>` tag (including dynamic user/band avatars) provides a valid fallback `src` and descriptive `alt` attribute so broken image boxes never appear.
- **Do** keep all functional badges and micro-labels at or above `11px` (`0.6875rem`) with WCAG AA contrast (`>= 4.5:1`).
- **Do** theme browser surfaces (`::selection`, scrollbars, focus rings, caret) using Bandmate's Warm Brass and Deep Wood tokens.

### Don't:
- **Don't** use `Inter`, `Arial`, or generic system fonts in component stylesheets.
- **Don't** use thick `3px`–`4px` left or top side-tab stripes (`::before` / `::after` side bars) on cards, song sections, or nav items; use full-perimeter borders or inset highlights instead.
- **Don't** use bounce or elastic easing curves (`cubic-bezier` with values `> 1.0`); use smooth exponential ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **Don't** use low-contrast gray text (`#808080` on white or dark slate on dark backgrounds) or nest cards inside cards.
