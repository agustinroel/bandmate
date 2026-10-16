import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface PianoKey {
  note: string;
  isBlack: boolean;
  x: number;
  width: number;
  height: number;
  isActive: boolean;
  isRoot: boolean;
  octave: number;
}

const ENHARMONIC_MAP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'B#': 'C',
  'Cb': 'B',
  'E#': 'F',
  'Fb': 'E',
};

function normalizeNoteName(n: string): string {
  const stripped = n.trim().replace(/\d+$/, '');
  return ENHARMONIC_MAP[stripped] || stripped;
}

@Component({
  standalone: true,
  selector: 'bm-piano-chord-diagram',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bm-piano-stage" (click)="chordClicked.emit(notes())" [attr.aria-label]="ariaLabel()">
      <svg
        class="bm-piano-svg"
        viewBox="0 0 336 96"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Defs for luxury drop-shadows & gradients -->
        <defs>
          <linearGradient id="ivoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="85%" stop-color="#f8f9fa" />
            <stop offset="100%" stop-color="#e9ecef" />
          </linearGradient>

          <linearGradient id="ivoryActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="70%" stop-color="#fef3c7" />
            <stop offset="100%" stop-color="#fde68a" />
          </linearGradient>

          <linearGradient id="ebonyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#2d3748" />
            <stop offset="80%" stop-color="#1a202c" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>

          <linearGradient id="ebonyActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#78350f" />
            <stop offset="70%" stop-color="#92400e" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>

          <filter id="keyShadow" x="-10%" y="0%" width="120%" height="115%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.25" />
          </filter>
        </defs>

        <!-- Keyboard bed -->
        <rect x="0" y="0" width="336" height="96" rx="6" fill="#14171a" />

        <!-- 1. White keys layer -->
        @for (k of whiteKeys(); track k.note + '_' + k.octave) {
          <g class="bm-key-group">
            <rect
              [attr.x]="k.x"
              [attr.y]="4"
              [attr.width]="k.width"
              [attr.height]="k.height"
              rx="3"
              [attr.fill]="k.isActive ? 'url(#ivoryActiveGrad)' : 'url(#ivoryGrad)'"
              stroke="rgba(0,0,0,0.15)"
              stroke-width="1"
              class="bm-white-key"
              [class.is-active]="k.isActive"
              [class.is-root]="k.isRoot"
            />

            <!-- Note dot marker on active white keys -->
            @if (k.isActive) {
              <circle
                [attr.cx]="k.x + (k.width / 2)"
                [attr.cy]="78"
                [attr.r]="k.isRoot ? 7 : 5.5"
                [attr.fill]="k.isRoot ? '#2a9d8f' : '#e9c46a'"
                stroke="#1a202c"
                stroke-width="1.5"
              />
              @if (k.isRoot) {
                <text
                  [attr.x]="k.x + (k.width / 2)"
                  [attr.y]="81"
                  text-anchor="middle"
                  font-size="7"
                  font-weight="800"
                  fill="#ffffff"
                  font-family="'JetBrains Mono', monospace"
                >
                  R
                </text>
              }
            }
          </g>
        }

        <!-- 2. Black keys layer (rendered on top) -->
        @for (k of blackKeys(); track k.note + '_' + k.octave) {
          <g class="bm-key-group" filter="url(#keyShadow)">
            <rect
              [attr.x]="k.x"
              [attr.y]="4"
              [attr.width]="k.width"
              [attr.height]="k.height"
              rx="2.5"
              [attr.fill]="k.isActive ? 'url(#ebonyActiveGrad)' : 'url(#ebonyGrad)'"
              stroke="rgba(255,255,255,0.08)"
              stroke-width="1"
              class="bm-black-key"
              [class.is-active]="k.isActive"
              [class.is-root]="k.isRoot"
            />

            <!-- Note dot marker on active black keys -->
            @if (k.isActive) {
              <circle
                [attr.cx]="k.x + (k.width / 2)"
                [attr.cy]="44"
                [attr.r]="k.isRoot ? 5.5 : 4.5"
                [attr.fill]="k.isRoot ? '#2a9d8f' : '#e9c46a'"
                stroke="#0f172a"
                stroke-width="1.2"
              />
              @if (k.isRoot) {
                <text
                  [attr.x]="k.x + (k.width / 2)"
                  [attr.y]="46.5"
                  text-anchor="middle"
                  font-size="6"
                  font-weight="800"
                  fill="#ffffff"
                  font-family="'JetBrains Mono', monospace"
                >
                  R
                </text>
              }
            }
          </g>
        }
      </svg>

      <div class="bm-piano-hud">
        <span class="bm-piano-hint">
          <mat-icon class="bm-piano-hint-ic">volume_up</mat-icon>
          Toca el teclado para escuchar
        </span>
        <div class="bm-piano-legend">
          <span class="bm-legend-item">
            <span class="bm-legend-dot bm-legend-dot--root"></span> Tónica (R)
          </span>
          <span class="bm-legend-item">
            <span class="bm-legend-dot bm-legend-dot--note"></span> Notas
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .bm-piano-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
      padding: 6px;
      border-radius: 12px;
      transition: background 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);

      &:hover {
        background: rgba(233, 196, 106, 0.08);
        transform: translateY(-1px);

        .bm-piano-hint {
          color: var(--bm-accent, #e9c46a);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }

    .bm-piano-svg {
      width: 100%;
      max-width: 336px;
      height: auto;
      display: block;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
    }

    .bm-white-key {
      transition: fill 0.2s ease;
      cursor: pointer;

      &.is-active {
        stroke: #d97706;
        stroke-width: 1.5;
      }
    }

    .bm-black-key {
      transition: fill 0.2s ease;
      cursor: pointer;

      &.is-active {
        stroke: #f59e0b;
        stroke-width: 1.5;
      }
    }

    .bm-piano-hud {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 336px;
      font-size: 11px;
      padding: 0 4px;
    }

    .bm-piano-hint {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--bm-muted, #94a3b8);
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .bm-piano-hint-ic {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .bm-piano-legend {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 10.5px;
      color: var(--bm-muted, #94a3b8);
      font-weight: 600;
    }

    .bm-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .bm-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;

      &--root {
        background: #2a9d8f;
      }

      &--note {
        background: #e9c46a;
      }
    }
  `],
})
export class PianoChordDiagramComponent {
  readonly notes = input.required<string[]>();
  readonly root = input<string>('');
  readonly ariaLabel = input<string>('Piano chord diagram');
  readonly chordClicked = output<string[]>();

  private readonly normalizedNotes = computed(() => {
    return new Set(this.notes().map(normalizeNoteName));
  });

  private readonly normalizedRoot = computed(() => {
    return normalizeNoteName(this.root());
  });

  // 14 White keys across 2 octaves (C4 to B5)
  // Total width: 336px, so each white key is 24px wide.
  readonly whiteKeys = computed<PianoKey[]>(() => {
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const active = this.normalizedNotes();
    const root = this.normalizedRoot();
    const keys: PianoKey[] = [];
    const keyWidth = 24;

    for (let octave = 4; octave <= 5; octave++) {
      for (let i = 0; i < whiteNotes.length; i++) {
        const note = whiteNotes[i];
        const norm = normalizeNoteName(note);
        const index = (octave - 4) * 7 + i;
        keys.push({
          note,
          isBlack: false,
          x: index * keyWidth,
          width: keyWidth,
          height: 88,
          isActive: active.has(norm),
          isRoot: norm === root,
          octave,
        });
      }
    }
    return keys;
  });

  // 10 Black keys across 2 octaves
  // Black keys are placed on seams between:
  // C-D (x ~ 15), D-E (x ~ 39), F-G (x ~ 87), G-A (x ~ 111), A-B (x ~ 135)
  readonly blackKeys = computed<PianoKey[]>(() => {
    const active = this.normalizedNotes();
    const root = this.normalizedRoot();
    const blackKeyDef = [
      { note: 'C#', offset: 15 },
      { note: 'D#', offset: 39 },
      { note: 'F#', offset: 87 },
      { note: 'G#', offset: 111 },
      { note: 'A#', offset: 135 },
    ];
    const octaveWidth = 7 * 24; // 168
    const keys: PianoKey[] = [];
    const width = 14;
    const height = 54;

    for (let octave = 4; octave <= 5; octave++) {
      const baseOffset = (octave - 4) * octaveWidth;
      for (const def of blackKeyDef) {
        const norm = normalizeNoteName(def.note);
        keys.push({
          note: def.note,
          isBlack: true,
          x: baseOffset + def.offset,
          width,
          height,
          isActive: active.has(norm),
          isRoot: norm === root,
          octave,
        });
      }
    }
    return keys;
  });
}
