import { Component, computed, input } from '@angular/core';
import type { GuitarShape } from '../../../features/songs/utils/guitar-shapes';

type Marker = 'x' | 'o' | number;

@Component({
  standalone: true,
  selector: 'bm-guitar-chord-diagram',
  template: `
    @if (vm(); as v) {
      <svg
        class="bm-chord-svg"
        [attr.viewBox]="'0 0 ' + v.w + ' ' + v.h"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        <!-- grid -->
        @for (x of v.stringX; track $index) {
          <line
            class="bm-s"
            [attr.x1]="x"
            [attr.y1]="v.gridTop"
            [attr.x2]="x"
            [attr.y2]="v.gridBottom"
          />
        }
        @for (y of v.fretY; track $index) {
          <line
            class="bm-f"
            [attr.x1]="v.gridLeft"
            [attr.y1]="y"
            [attr.x2]="v.gridRight"
            [attr.y2]="y"
          />
        }

        <!-- nut or base fret label -->
        @if (v.baseFret === 1) {
          <line
            class="bm-nut"
            [attr.x1]="v.gridLeft"
            [attr.y1]="v.gridTop"
            [attr.x2]="v.gridRight"
            [attr.y2]="v.gridTop"
          />
        } @else {
          <text class="bm-base" [attr.x]="v.gridLeft - 10" [attr.y]="v.gridTop + 10">
            {{ v.baseFret }}
          </text>
        }

        <!-- top markers (X/O) -->
        @for (m of v.topMarkers; track $index) {
          <text class="bm-top" [attr.x]="v.stringX[$index]" [attr.y]="v.topY">{{ m }}</text>
        }

        <!-- barre -->
        @if (v.barre) {
          <rect
            class="bm-barre"
            [attr.x]="v.barre.x"
            [attr.y]="v.barre.y"
            [attr.width]="v.barre.w"
            [attr.height]="v.barre.h"
            [attr.rx]="v.barre.rx"
          />
        }

        <!-- dots -->
        @for (d of v.dots; track d.key) {
          <circle class="bm-dot" [attr.cx]="d.cx" [attr.cy]="d.cy" [attr.r]="d.r" />
        }
      </svg>
    }
  `,
  styles: [
    `
      .bm-chord-svg {
        width: 100%;
        height: auto;
        display: block;
      }

      .bm-s,
      .bm-f {
        stroke: rgba(0, 0, 0, 0.25);
        stroke-width: 1;
        shape-rendering: crispEdges;
      }

      .bm-nut {
        stroke: rgba(0, 0, 0, 0.45);
        stroke-width: 3;
        shape-rendering: crispEdges;
      }

      .bm-top,
      .bm-base {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
        font-size: 10px;
        fill: rgba(0, 0, 0, 0.55);
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .bm-base {
        text-anchor: end;
      }

      .bm-dot {
        fill: rgba(0, 0, 0, 0.78);
      }

      .bm-barre {
        fill: rgba(0, 0, 0, 0.78);
      }
    `,
  ],
})
export class GuitarChordDiagramComponent {
  shape = input.required<GuitarShape>();
  ariaLabel = input<string>('Guitar chord diagram');

  // Basic layout values
  private W = 170;
  private H = 140;

  private gridLeft = 22;
  private gridRight = 162;
  private gridTop = 28;
  private gridBottom = 128;

  vm = computed(() => {
    const sh = this.shape();
    if (!sh?.frets?.length || sh.frets.length !== 6) return null;

    const frets = sh.frets;

    const markers: Marker[] = frets.map((f) => (f === -1 ? 'x' : f === 0 ? 'o' : f));

    // base fret: smallest >0
    const pressed = frets.filter((f) => f > 0) as number[];
    const minF = pressed.length ? Math.min(...pressed) : 1;
    const maxF = pressed.length ? Math.max(...pressed) : 1;

    // if chord is far up (e.g. 8th), we display a 5-fret window starting at minF
    // for open-ish chords, baseFret=1 and we draw nut.
    const baseFret = minF <= 1 ? 1 : minF;
    const windowFrets = 5;

    const w = this.W;
    const h = this.H;

    const stringX = Array.from({ length: 6 }).map((_, i) => {
      const t = i / 5;
      return this.gridLeft + t * (this.gridRight - this.gridLeft);
    });

    const fretY = Array.from({ length: windowFrets + 1 }).map((_, i) => {
      const t = i / windowFrets;
      return this.gridTop + t * (this.gridBottom - this.gridTop);
    });

    const topY = 14;

    // dots: place pressed frets within window
    const dots: { key: string; cx: number; cy: number; r: number }[] = [];
    for (let s = 0; s < 6; s++) {
      const f = frets[s];
      if (f <= 0) continue;

      const rel = baseFret === 1 ? f : f - baseFret + 1; // 1..windowFrets
      if (rel < 1 || rel > windowFrets) continue;

      const cx = stringX[s];
      const y1 = fretY[rel - 1];
      const y2 = fretY[rel];
      const cy = (y1 + y2) / 2;

      dots.push({ key: `${s}_${f}`, cx, cy, r: 7 });
    }

    // barre detection: if multiple strings share same fret, draw a rounded rect
    // naive MVP barre: if at least 4 strings pressed on same fret and it's the minimum fret, we draw barre across those.
    let barre: { x: number; y: number; w: number; h: number; rx: number } | null = null;

    if (pressed.length >= 4) {
      const freq = new Map<number, number>();
      pressed.forEach((f) => freq.set(f, (freq.get(f) ?? 0) + 1));
      // candidate barre = most frequent fret
      const entries = [...freq.entries()].sort((a, b) => b[1] - a[1]);
      const [bf, count] = entries[0] ?? [];
      if (bf && count >= 4) {
        // find string span with this fret
        const idxs = frets.map((f, i) => (f === bf ? i : -1)).filter((i) => i !== -1);

        const minS = Math.min(...idxs);
        const maxS = Math.max(...idxs);

        const rel = baseFret === 1 ? bf : bf - baseFret + 1;
        if (rel >= 1 && rel <= windowFrets) {
          const y1 = fretY[rel - 1];
          const y2 = fretY[rel];
          const cy = (y1 + y2) / 2;

          const x = stringX[minS] - 9;
          const wBar = stringX[maxS] - stringX[minS] + 18;
          barre = { x, y: cy - 6, w: wBar, h: 12, rx: 6 };

          // remove dots that are on barre fret (optional) - keeps it cleaner
          for (let i = dots.length - 1; i >= 0; i--) {
            const d = dots[i];
            const [sStr, fStr] = d.key.split('_').map(Number);
            if (fStr === bf) dots.splice(i, 1);
          }
        }
      }
    }

    return {
      w,
      h,
      gridLeft: this.gridLeft,
      gridRight: this.gridRight,
      gridTop: this.gridTop,
      gridBottom: this.gridBottom,
      stringX,
      fretY,
      topY,
      topMarkers: markers,
      baseFret,
      dots,
      barre,
    };
  });
}
