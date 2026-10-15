import {
  Component,
  signal,
  computed,
  OnDestroy,
  NgZone,
  inject,
  ElementRef,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AchievementService } from '../../../core/services/achievement.service';

export interface TuningString {
  note: string;
  octave: number;
  baseFreqAt440: number;
}

export interface TuningPreset {
  id: string;
  name: string;
  instrument: 'guitar' | 'bass' | 'ukulele' | 'violin' | 'cello';
  instrumentLabel: string;
  strings: TuningString[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  // Guitar Presets
  {
    id: 'guitar-standard',
    name: 'Estándar (E A D G B E)',
    instrument: 'guitar',
    instrumentLabel: 'Guitarra',
    strings: [
      { note: 'E', octave: 2, baseFreqAt440: 82.41 },
      { note: 'A', octave: 2, baseFreqAt440: 110.0 },
      { note: 'D', octave: 3, baseFreqAt440: 146.83 },
      { note: 'G', octave: 3, baseFreqAt440: 196.0 },
      { note: 'B', octave: 3, baseFreqAt440: 246.94 },
      { note: 'E', octave: 4, baseFreqAt440: 329.63 },
    ],
  },
  {
    id: 'guitar-drop-d',
    name: 'Drop D (D A D G B E)',
    instrument: 'guitar',
    instrumentLabel: 'Guitarra',
    strings: [
      { note: 'D', octave: 2, baseFreqAt440: 73.42 },
      { note: 'A', octave: 2, baseFreqAt440: 110.0 },
      { note: 'D', octave: 3, baseFreqAt440: 146.83 },
      { note: 'G', octave: 3, baseFreqAt440: 196.0 },
      { note: 'B', octave: 3, baseFreqAt440: 246.94 },
      { note: 'E', octave: 4, baseFreqAt440: 329.63 },
    ],
  },
  {
    id: 'guitar-dadgad',
    name: 'DADGAD (D A D G A D)',
    instrument: 'guitar',
    instrumentLabel: 'Guitarra',
    strings: [
      { note: 'D', octave: 2, baseFreqAt440: 73.42 },
      { note: 'A', octave: 2, baseFreqAt440: 110.0 },
      { note: 'D', octave: 3, baseFreqAt440: 146.83 },
      { note: 'G', octave: 3, baseFreqAt440: 196.0 },
      { note: 'A', octave: 3, baseFreqAt440: 220.0 },
      { note: 'D', octave: 4, baseFreqAt440: 293.66 },
    ],
  },
  {
    id: 'guitar-open-e',
    name: 'Open E (E B E G# B E)',
    instrument: 'guitar',
    instrumentLabel: 'Guitarra',
    strings: [
      { note: 'E', octave: 2, baseFreqAt440: 82.41 },
      { note: 'B', octave: 2, baseFreqAt440: 123.47 },
      { note: 'E', octave: 3, baseFreqAt440: 164.81 },
      { note: 'G#', octave: 3, baseFreqAt440: 207.65 },
      { note: 'B', octave: 3, baseFreqAt440: 246.94 },
      { note: 'E', octave: 4, baseFreqAt440: 329.63 },
    ],
  },
  {
    id: 'guitar-open-g',
    name: 'Open G (D G D G B D)',
    instrument: 'guitar',
    instrumentLabel: 'Guitarra',
    strings: [
      { note: 'D', octave: 2, baseFreqAt440: 73.42 },
      { note: 'G', octave: 2, baseFreqAt440: 98.0 },
      { note: 'D', octave: 3, baseFreqAt440: 146.83 },
      { note: 'G', octave: 3, baseFreqAt440: 196.0 },
      { note: 'B', octave: 3, baseFreqAt440: 246.94 },
      { note: 'D', octave: 4, baseFreqAt440: 293.66 },
    ],
  },
  {
    id: 'guitar-half-step',
    name: 'Medio Tono Abajo (Eb Ab Db Gb Bb Eb)',
    instrument: 'guitar',
    instrumentLabel: 'Guitarra',
    strings: [
      { note: 'Eb', octave: 2, baseFreqAt440: 77.78 },
      { note: 'Ab', octave: 2, baseFreqAt440: 103.83 },
      { note: 'Db', octave: 3, baseFreqAt440: 138.59 },
      { note: 'Gb', octave: 3, baseFreqAt440: 185.0 },
      { note: 'Bb', octave: 3, baseFreqAt440: 233.08 },
      { note: 'Eb', octave: 4, baseFreqAt440: 311.13 },
    ],
  },
  // Bass Presets
  {
    id: 'bass-4-string',
    name: 'Bajo 4 Cuerdas (E A D G)',
    instrument: 'bass',
    instrumentLabel: 'Bajo',
    strings: [
      { note: 'E', octave: 1, baseFreqAt440: 41.2 },
      { note: 'A', octave: 1, baseFreqAt440: 55.0 },
      { note: 'D', octave: 2, baseFreqAt440: 73.42 },
      { note: 'G', octave: 2, baseFreqAt440: 98.0 },
    ],
  },
  {
    id: 'bass-5-string',
    name: 'Bajo 5 Cuerdas (B E A D G)',
    instrument: 'bass',
    instrumentLabel: 'Bajo',
    strings: [
      { note: 'B', octave: 0, baseFreqAt440: 30.87 },
      { note: 'E', octave: 1, baseFreqAt440: 41.2 },
      { note: 'A', octave: 1, baseFreqAt440: 55.0 },
      { note: 'D', octave: 2, baseFreqAt440: 73.42 },
      { note: 'G', octave: 2, baseFreqAt440: 98.0 },
    ],
  },
  // Ukulele Presets
  {
    id: 'ukulele-standard',
    name: 'Ukulele Soprano/Concierto (G C E A)',
    instrument: 'ukulele',
    instrumentLabel: 'Ukulele',
    strings: [
      { note: 'G', octave: 4, baseFreqAt440: 392.0 },
      { note: 'C', octave: 4, baseFreqAt440: 261.63 },
      { note: 'E', octave: 4, baseFreqAt440: 329.63 },
      { note: 'A', octave: 4, baseFreqAt440: 440.0 },
    ],
  },
  {
    id: 'ukulele-baritone',
    name: 'Ukulele Barítono (D G B E)',
    instrument: 'ukulele',
    instrumentLabel: 'Ukulele',
    strings: [
      { note: 'D', octave: 3, baseFreqAt440: 146.83 },
      { note: 'G', octave: 3, baseFreqAt440: 196.0 },
      { note: 'B', octave: 3, baseFreqAt440: 246.94 },
      { note: 'E', octave: 4, baseFreqAt440: 329.63 },
    ],
  },
  // Violin Presets
  {
    id: 'violin-standard',
    name: 'Violín Estándar (G D A E)',
    instrument: 'violin',
    instrumentLabel: 'Violín',
    strings: [
      { note: 'G', octave: 3, baseFreqAt440: 196.0 },
      { note: 'D', octave: 4, baseFreqAt440: 293.66 },
      { note: 'A', octave: 4, baseFreqAt440: 440.0 },
      { note: 'E', octave: 5, baseFreqAt440: 659.25 },
    ],
  },
  // Cello Presets
  {
    id: 'cello-standard',
    name: 'Cello Estándar (C G D A)',
    instrument: 'cello',
    instrumentLabel: 'Cello',
    strings: [
      { note: 'C', octave: 2, baseFreqAt440: 65.41 },
      { note: 'G', octave: 2, baseFreqAt440: 98.0 },
      { note: 'D', octave: 3, baseFreqAt440: 146.83 },
      { note: 'A', octave: 3, baseFreqAt440: 220.0 },
    ],
  },
];

@Component({
  selector: 'bm-tuner-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="tuner-container">
      <header class="bm-page-header">
        <div class="flex-grow-1">
          <h2 class="bm-page-title">Pro Tuner Studio</h2>
          <div class="small opacity-75">
            {{ activePreset().instrumentLabel }} • {{ activePreset().name }}
          </div>
        </div>

        <div class="mode-toggles">
          <button
            class="mode-btn"
            [class.active]="tunerMode() === 'needle'"
            (click)="setTunerMode('needle')"
            title="Modo Aguja Clásica"
          >
            <mat-icon>speed</mat-icon>
            <span>Aguja</span>
          </button>
          <button
            class="mode-btn strobe-toggle"
            [class.active]="tunerMode() === 'strobe'"
            (click)="setTunerMode('strobe')"
            title="Modo Estroboscópico de Alta Precisión"
          >
            <mat-icon>album</mat-icon>
            <span>Strobe 60fps</span>
          </button>
        </div>
      </header>

      <!-- Panel de Configuración Rápida: Instrumento y Calibración A4 -->
      <section class="tuning-config-panel">
        <div class="instrument-selector">
          <label class="section-label">Afinación & Instrumento</label>
          <div class="preset-chips">
            @for (preset of presets; track preset.id) {
              <button
                class="chip-btn"
                [class.active]="selectedPresetId() === preset.id"
                (click)="selectPreset(preset.id)"
              >
                {{ preset.instrumentLabel }}: {{ preset.name }}
              </button>
            }
          </div>
        </div>

        <div class="a4-calibration-card">
          <div class="a4-header">
            <span class="section-label">Calibración A4</span>
            <span class="a4-val-badge">{{ a4Frequency() }} Hz</span>
          </div>
          <div class="a4-controls">
            <button
              class="step-btn"
              (click)="adjustA4(-1)"
              [disabled]="a4Frequency() <= minA4"
              aria-label="Disminuir frecuencia A4"
            >
              -1
            </button>
            <input
              type="range"
              class="a4-slider"
              [min]="minA4"
              [max]="maxA4"
              [value]="a4Frequency()"
              (input)="onA4SliderChange($event)"
              aria-label="Frecuencia A4 en Hertz"
            />
            <button
              class="step-btn"
              (click)="adjustA4(1)"
              [disabled]="a4Frequency() >= maxA4"
              aria-label="Aumentar frecuencia A4"
            >
              +1
            </button>
            <button
              class="reset-a4-btn"
              (click)="resetA4()"
              [disabled]="a4Frequency() === 440"
              title="Restablecer a 440 Hz estándar"
            >
              440 Hz
            </button>
          </div>
        </div>
      </section>

      <!-- Main Visual Tuner Card -->
      <div class="tuner-card" [class.strobe-card]="tunerMode() === 'strobe'">
        <div class="tuner-display">
          <div class="note-display">
            @if (isListening()) {
              <div class="note-val" [class.in-tune]="isInTune()">
                {{ renderNote() }}
              </div>
              <div class="cents-val" [ngStyle]="{ color: getCentsColor() }">
                {{ renderCents() }}
              </div>
              <div class="frequency-detail">
                @if (detectedPitch()) {
                  <span>{{ detectedPitch() | number: '1.1-1' }} Hz</span>
                  <span class="target-diff">
                    (Target: {{ targetFrequency() | number: '1.1-1' }} Hz)
                  </span>
                } @else {
                  <span>Escuchando...</span>
                }
              </div>
            } @else {
              <!-- Idle State -->
              <div class="note-val placeholder">--</div>
              <div class="cents-val">Pulsa Iniciar para Afinar</div>
              <div class="frequency-detail">Micrófono inactivo</div>
            }
          </div>

          <!-- Needle Mode Display -->
          @if (tunerMode() === 'needle') {
            <div class="gauge-wrapper">
              <svg class="gauge" viewBox="0 0 200 100">
                <!-- Tick marks -->
                <line x1="100" y1="10" x2="100" y2="25" stroke="#bbb" stroke-width="2" />
                <line x1="60" y1="20" x2="65" y2="35" stroke="#555" stroke-width="1.5" />
                <line x1="140" y1="20" x2="135" y2="35" stroke="#555" stroke-width="1.5" />
                <line x1="30" y1="40" x2="38" y2="52" stroke="#444" stroke-width="1" />
                <line x1="170" y1="40" x2="162" y2="52" stroke="#444" stroke-width="1" />

                <!-- In-tune target arc highlight -->
                <path
                  d="M 94 22 A 80 80 0 0 1 106 22"
                  fill="none"
                  stroke="#2ec4b6"
                  stroke-width="5"
                  stroke-linecap="round"
                />

                <!-- Main Arc -->
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  stroke-width="8"
                  stroke-linecap="round"
                />

                <!-- Needle -->
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="15"
                  [attr.stroke]="getNeedleColor()"
                  stroke-width="5"
                  stroke-linecap="round"
                  class="needle"
                  [class.idle]="!isListening()"
                  [style.transform]="getNeedleTransform()"
                />
                <circle cx="100" cy="100" r="7" [attr.fill]="getNeedleColor()" />
              </svg>
            </div>
          }

          <!-- 60 FPS Canvas Strobe Tuner Display -->
          @if (tunerMode() === 'strobe') {
            <div class="strobe-wrapper">
              <div class="strobe-lens">
                <canvas #strobeCanvas class="strobe-canvas" width="440" height="96"></canvas>
                <div class="strobe-center-line"></div>
              </div>
              <div class="strobe-status">
                @if (!isListening()) {
                  <span>Modo Estroboscópico en reposo</span>
                } @else if (isInTune()) {
                  <span class="strobe-locked">● ESTROBO BLOQUEADO (PERFECTO)</span>
                } @else if (currentCents() < 0) {
                  <span class="strobe-flat">◀ Desplazamiento hacia la izquierda (Grave / Flat)</span>
                } @else {
                  <span class="strobe-sharp">Desplazamiento hacia la derecha (Agudo / Sharp) ▶</span>
                }
              </div>
            </div>
          }
        </div>

        <div class="controls">
          @if (!isListening()) {
            <button mat-flat-button class="start-btn" (click)="startTuner()">
              <mat-icon>mic</mat-icon> Iniciar Afinador
            </button>
          } @else {
            <button mat-stroked-button (click)="stopTuner()" class="stop-btn">
              <mat-icon>stop</mat-icon> Detener
            </button>
          }
        </div>
      </div>

      <!-- Cuerdas de Referencia & Tonos Calibrados -->
      <section class="reference-tones-section">
        <div class="section-label-row">
          <span class="section-label">Tonos de Cuerdas Abiertas (Calibrados a A4={{ a4Frequency() }}Hz)</span>
          <span class="section-hint">Toca una cuerda para escuchar su frecuencia exacta</span>
        </div>
        <div class="reference-tones">
          @for (stringItem of calibratedStrings(); track stringItem.note + stringItem.octave) {
            <button
              class="tone-btn"
              [class.highlight-match]="currentNote() === stringItem.note"
              (click)="playTone(stringItem.calibratedFreq)"
              title="{{ stringItem.note }}{{ stringItem.octave }} ({{ stringItem.calibratedFreq | number: '1.1-1' }} Hz)"
            >
              <span class="note-name">{{ stringItem.note }}</span>
              <span class="octave-num">{{ stringItem.octave }}</span>
              <span class="freq-tag">{{ stringItem.calibratedFreq | number: '1.0-0' }}Hz</span>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 24px;
        min-height: 100%;
        background: var(--bm-gradient-dark, #0d1b2a);
        color: #fff;
        border-radius: 24px;
        box-sizing: border-box;
      }

      .tuner-container {
        max-width: 640px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-top: 16px;
      }

      .bm-page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      .bm-page-title {
        font-size: 32px;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(135deg, #e9c46a 0%, #f4a261 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }

      .mode-toggles {
        display: flex;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 99px;
        padding: 4px;
        gap: 4px;
      }

      .mode-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 40px;
        min-width: 48px;
        padding: 0 16px;
        border-radius: 99px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .mode-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }

      .mode-btn.active {
        background: var(--bm-accent, #2ec4b6);
        color: #0d1b2a;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(46, 196, 182, 0.3);
      }

      .mode-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Config Panel */
      .tuning-config-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 18px 20px;
      }

      .section-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: rgba(255, 255, 255, 0.6);
        display: block;
        margin-bottom: 8px;
      }

      .preset-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip-btn {
        height: 38px;
        min-height: 38px;
        padding: 0 14px;
        border-radius: 99px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.85);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .chip-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .chip-btn.active {
        background: #e9c46a;
        color: #1a1a1a;
        border-color: #e9c46a;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(233, 196, 106, 0.3);
      }

      /* A4 Calibration */
      .a4-calibration-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 14px;
      }

      .a4-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .a4-val-badge {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        font-size: 15px;
        background: rgba(233, 196, 106, 0.15);
        color: #e9c46a;
        padding: 2px 10px;
        border-radius: 99px;
        border: 1px solid rgba(233, 196, 106, 0.3);
      }

      .a4-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .step-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: white;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .step-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
      }

      .step-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .reset-a4-btn {
        height: 44px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
      }

      .reset-a4-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }

      .reset-a4-btn:disabled {
        opacity: 0.25;
        cursor: default;
      }

      .a4-slider {
        flex-grow: 1;
        accent-color: #e9c46a;
        cursor: pointer;
        height: 8px;
        border-radius: 99px;
      }

      /* Tuner Card */
      .tuner-card {
        background: #111a24;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        padding: 36px 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        position: relative;
        overflow: hidden;
      }

      .tuner-card.strobe-card {
        border-color: rgba(46, 196, 182, 0.3);
      }

      .tuner-display {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .note-display {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .note-val {
        font-size: 110px;
        font-weight: 900;
        line-height: 1;
        color: #f8f9fa;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        transition: color 0.15s ease;
      }

      .note-val.in-tune {
        color: #2ec4b6;
        text-shadow: 0 0 25px rgba(46, 196, 182, 0.6);
      }

      .note-val.placeholder {
        color: rgba(255, 255, 255, 0.2);
        font-size: 90px;
      }

      .cents-val {
        font-size: 20px;
        font-weight: 700;
        margin-top: 6px;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-variant-numeric: tabular-nums;
      }

      .frequency-detail {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'JetBrains Mono', monospace;
        margin-top: 4px;
        display: flex;
        gap: 8px;
      }

      .target-diff {
        color: rgba(255, 255, 255, 0.35);
      }

      /* Gauge */
      .gauge-wrapper {
        width: 100%;
        max-width: 320px;
        height: 150px;
      }

      .needle {
        transition: transform 0.1s cubic-bezier(0.2, 0, 0.4, 1);
        transform-origin: 100px 100px;
      }

      .needle.idle {
        opacity: 0.2;
      }

      /* Strobe Visuals */
      .strobe-wrapper {
        width: 100%;
        max-width: 440px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .strobe-lens {
        position: relative;
        width: 100%;
        height: 96px;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid rgba(46, 196, 182, 0.35);
        background: #050a0f;
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
      }

      .strobe-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .strobe-center-line {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 3px;
        transform: translateX(-50%);
        background: #2ec4b6;
        box-shadow: 0 0 8px #2ec4b6;
        pointer-events: none;
      }

      .strobe-status {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
      }

      .strobe-locked {
        color: #2ec4b6;
        text-shadow: 0 0 10px rgba(46, 196, 182, 0.6);
      }

      .strobe-flat {
        color: #e76f51;
      }

      .strobe-sharp {
        color: #f4a261;
      }

      /* Control Buttons */
      .controls {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 8px;
      }

      .start-btn {
        background: var(--bm-accent, #2ec4b6) !important;
        color: #0d1b2a !important;
        height: 52px !important;
        padding: 0 36px !important;
        font-size: 16px !important;
        font-weight: 800 !important;
        border-radius: 99px !important;
        letter-spacing: 0.5px;
        box-shadow: 0 8px 24px rgba(46, 196, 182, 0.35);
        transition: transform 0.2s, box-shadow 0.2s;
        display: inline-flex !important;
        align-items: center;
        gap: 8px;
      }

      .start-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(46, 196, 182, 0.5);
      }

      .stop-btn {
        border-color: #e76f51 !important;
        color: #e76f51 !important;
        height: 48px !important;
        padding: 0 32px !important;
        border-radius: 99px !important;
        font-weight: 700 !important;
        background: rgba(231, 111, 81, 0.08) !important;
        display: inline-flex !important;
        align-items: center;
        gap: 8px;
      }

      .stop-btn:hover {
        background: rgba(231, 111, 81, 0.18) !important;
      }

      /* Reference Tones */
      .reference-tones-section {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .section-label-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 8px;
      }

      .section-hint {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
      }

      .reference-tones {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
      }

      .tone-btn {
        min-width: 58px;
        height: 64px;
        border-radius: 16px;
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.07);
        color: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        transition: all 0.2s ease;
        padding: 6px 10px;
        font-family: inherit;
      }

      .tone-btn:hover {
        transform: translateY(-2px);
        background: #e9c46a;
        color: #1a1a1a;
        border-color: #e9c46a;
        box-shadow: 0 8px 20px rgba(233, 196, 106, 0.4);
      }

      .tone-btn.highlight-match {
        border-color: #2ec4b6;
        background: rgba(46, 196, 182, 0.2);
        color: #2ec4b6;
      }

      .tone-btn .note-name {
        font-size: 18px;
        font-weight: 800;
        line-height: 1;
      }

      .tone-btn .octave-num {
        font-size: 11px;
        opacity: 0.7;
        font-weight: 600;
      }

      .tone-btn .freq-tag {
        font-size: 10px;
        font-family: 'JetBrains Mono', monospace;
        opacity: 0.6;
      }
    `,
  ],
})
export class TunerPageComponent implements OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly achievements = inject(AchievementService);

  readonly presets = TUNING_PRESETS;
  readonly minA4 = 432;
  readonly maxA4 = 446;

  readonly strobeCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('strobeCanvas');

  private readonly STORAGE_KEY_A4 = 'bandmate_tuner_a4';
  private readonly STORAGE_KEY_PRESET = 'bandmate_tuner_preset';
  private readonly STORAGE_KEY_MODE = 'bandmate_tuner_mode';

  private getInitialA4(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(this.STORAGE_KEY_A4);
        if (val) {
          const parsed = Number(val);
          if (!isNaN(parsed) && parsed >= this.minA4 && parsed <= this.maxA4) {
            return parsed;
          }
        }
      }
    } catch {}
    return 440;
  }

  private getInitialPresetId(): string {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(this.STORAGE_KEY_PRESET);
        if (val && this.presets.some((p) => p.id === val)) {
          return val;
        }
      }
    } catch {}
    return 'guitar-standard';
  }

  private getInitialMode(): 'needle' | 'strobe' {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(this.STORAGE_KEY_MODE);
        if (val === 'needle' || val === 'strobe') {
          return val;
        }
      }
    } catch {}
    return 'needle';
  }

  private persistA4(val: number) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY_A4, String(val));
      }
    } catch {}
  }

  private persistPreset(presetId: string) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY_PRESET, presetId);
      }
    } catch {}
  }

  private persistMode(mode: 'needle' | 'strobe') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY_MODE, mode);
      }
    } catch {}
  }

  // State Signals
  readonly isListening = signal(false);
  readonly currentNote = signal<string | null>(null);
  readonly currentCents = signal<number>(0);
  readonly detectedPitch = signal<number | null>(null);
  readonly targetFrequency = signal<number | null>(null);
  readonly tunerMode = signal<'needle' | 'strobe'>(this.getInitialMode());
  readonly selectedPresetId = signal<string>(this.getInitialPresetId());
  readonly a4Frequency = signal<number>(this.getInitialA4());

  // Computed Values
  readonly activePreset = computed(() => {
    return (
      this.presets.find((p) => p.id === this.selectedPresetId()) ?? this.presets[0]
    );
  });

  readonly calibratedStrings = computed(() => {
    const a4 = this.a4Frequency();
    const factor = a4 / 440;
    return this.activePreset().strings.map((str) => ({
      ...str,
      calibratedFreq: Number((str.baseFreqAt440 * factor).toFixed(2)),
    }));
  });

  // Audio & Pitch Detection
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  mediaStream: MediaStream | null = null;
  animationFrameId: number | null = null;

  // Strobe Rendering State
  private strobeOffset = 0;
  private strobeFrameId: number | null = null;

  // Smoothing buffer
  private centsBuffer: number[] = [];
  private readonly BUFFER_SIZE = 8;
  private inTuneFrames = 0;
  private hasPlayedSuccess = false;

  private noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  constructor() {
    afterNextRender(() => {
      this.startStrobeRenderLoop();
    });
  }

  setTunerMode(mode: 'needle' | 'strobe') {
    this.tunerMode.set(mode);
    this.persistMode(mode);
    if (mode === 'strobe') {
      // Allow DOM to render canvas before starting loop
      setTimeout(() => this.startStrobeRenderLoop(), 50);
    }
  }

  selectPreset(presetId: string) {
    this.selectedPresetId.set(presetId);
    this.persistPreset(presetId);
  }

  adjustA4(delta: number) {
    const next = Math.min(this.maxA4, Math.max(this.minA4, this.a4Frequency() + delta));
    this.a4Frequency.set(next);
    this.persistA4(next);
  }

  onA4SliderChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      const clamped = Math.min(this.maxA4, Math.max(this.minA4, val));
      this.a4Frequency.set(clamped);
      this.persistA4(clamped);
    }
  }

  resetA4() {
    this.a4Frequency.set(440);
    this.persistA4(440);
  }

  async startTuner() {
    this.achievements.unlock('tuner_used_first');
    try {
      this.audioContext = new AudioContext();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      source.connect(this.analyser);
      this.isListening.set(true);
      this.detectPitch();
    } catch (err) {
      console.error('Mic access denied or error', err);
    }
  }

  stopTuner() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isListening.set(false);
    this.currentNote.set(null);
    this.currentCents.set(0);
    this.detectedPitch.set(null);
    this.targetFrequency.set(null);
    this.centsBuffer = [];
  }

  detectPitch() {
    if (!this.analyser || !this.isListening()) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const ac = this.autoCorrelate(buffer, this.audioContext!.sampleRate);
    const a4 = this.a4Frequency();

    this.zone.run(() => {
      if (ac === -1) {
        this.inTuneFrames = 0;
        this.hasPlayedSuccess = false;
        this.detectedPitch.set(null);
      } else {
        this.detectedPitch.set(ac);
        const note = this.noteFromPitch(ac, a4);
        const rawCents = this.centsOffFromPitch(ac, note, a4);
        const targetFreq = this.frequencyFromNoteNumber(note, a4);
        this.targetFrequency.set(targetFreq);

        this.centsBuffer.push(rawCents);
        if (this.centsBuffer.length > this.BUFFER_SIZE) {
          this.centsBuffer.shift();
        }

        const avgCents =
          this.centsBuffer.reduce((a, b) => a + b, 0) / this.centsBuffer.length;
        const noteName = this.noteStrings[((note % 12) + 12) % 12];

        this.currentNote.set(noteName);
        this.currentCents.set(Math.round(avgCents));

        if (Math.abs(avgCents) < 5) {
          this.inTuneFrames++;
          if (this.inTuneFrames > 20 && !this.hasPlayedSuccess) {
            this.playSuccessSound();
            this.hasPlayedSuccess = true;
          }
        } else {
          this.inTuneFrames = 0;
          this.hasPlayedSuccess = false;
        }
      }
    });

    this.animationFrameId = requestAnimationFrame(() => this.detectPitch());
  }

  private startStrobeRenderLoop() {
    if (this.strobeFrameId) return;

    const render = () => {
      this.renderStrobe();
      this.strobeFrameId = requestAnimationFrame(render);
    };
    this.strobeFrameId = requestAnimationFrame(render);
  }

  private renderStrobe() {
    const canvasRef = this.strobeCanvasRef();
    if (!canvasRef) return;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
    bgGrad.addColorStop(0, '#04080c');
    bgGrad.addColorStop(0.5, '#0a1622');
    bgGrad.addColorStop(1, '#04080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const cents = this.currentCents();
    const isListening = this.isListening();
    const inTune = this.isInTune();

    // Speed of strobe bands: stationary when cents === 0, drift left when flat, right when sharp
    if (isListening && Math.abs(cents) >= 1) {
      // Speed factor: proportional to cents error
      const driftSpeed = (cents / 50) * 8;
      this.strobeOffset = (this.strobeOffset + driftSpeed) % 60;
    }

    // Draw 3 tiered strobe rows (harmonic octaves)
    const rows = [
      { y: 6, h: 24, period: 20, alpha: 0.9 },
      { y: 34, h: 28, period: 30, alpha: 1.0 },
      { y: 66, h: 24, period: 40, alpha: 0.8 },
    ];

    rows.forEach((row) => {
      const period = row.period;
      const barWidth = period / 2;
      const offset = (this.strobeOffset * (period / 30)) % period;

      for (let x = -period; x < width + period; x += period) {
        const posX = x + offset;

        if (inTune && isListening) {
          ctx.fillStyle = `rgba(46, 196, 182, ${row.alpha})`;
        } else if (!isListening) {
          ctx.fillStyle = `rgba(255, 255, 255, ${row.alpha * 0.15})`;
        } else if (cents < 0) {
          ctx.fillStyle = `rgba(231, 111, 81, ${row.alpha * 0.85})`;
        } else {
          ctx.fillStyle = `rgba(244, 162, 97, ${row.alpha * 0.85})`;
        }

        ctx.fillRect(posX, row.y, barWidth, row.h);
      }
    });

    // Optical vignette shadow on sides
    const vig = ctx.createLinearGradient(0, 0, width, 0);
    vig.addColorStop(0, 'rgba(5, 10, 15, 0.9)');
    vig.addColorStop(0.15, 'rgba(5, 10, 15, 0)');
    vig.addColorStop(0.85, 'rgba(5, 10, 15, 0)');
    vig.addColorStop(1, 'rgba(5, 10, 15, 0.9)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  // ACF2+ pitch detection
  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    for (let i = 1; i < SIZE / 2; i++)
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }

    const subBuf = buf.slice(r1, r2);
    const newSize = subBuf.length;
    const c = new Array(newSize).fill(0);

    for (let i = 0; i < newSize; i++)
      for (let j = 0; j < newSize - i; j++) c[i] = c[i] + subBuf[j] * subBuf[j + i];

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < newSize; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    const x1 = c[T0 - 1],
      x2 = c[T0],
      x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }

  // Calibrated Pitch Math
  noteFromPitch(frequency: number, a4 = 440): number {
    const noteNum = 12 * (Math.log(frequency / a4) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  centsOffFromPitch(frequency: number, note: number, a4 = 440): number {
    return Math.floor(
      (1200 * Math.log(frequency / this.frequencyFromNoteNumber(note, a4))) / Math.log(2),
    );
  }

  frequencyFromNoteNumber(note: number, a4 = 440): number {
    return a4 * Math.pow(2, (note - 69) / 12);
  }

  // UI Helpers
  renderNote() {
    return this.currentNote() || '--';
  }

  renderCents() {
    const c = this.currentCents();
    if (c === 0) return 'Perfect';
    return c > 0 ? `+${c} cents` : `${c} cents`;
  }

  isInTune() {
    return Math.abs(this.currentCents()) < 5 && this.isListening() && !!this.currentNote();
  }

  getCentsColor() {
    const c = Math.abs(this.currentCents());
    if (c < 5) return '#2ec4b6'; // In tune
    if (c < 20) return '#e9c46a'; // Close
    return '#e76f51'; // Far
  }

  getNeedleColor() {
    if (!this.isListening()) return '#6c757d';
    return this.getCentsColor();
  }

  getNeedleTransform() {
    let c = this.currentCents();
    if (c < -50) c = -50;
    if (c > 50) c = 50;
    const deg = (c / 50) * 45;
    return `rotate(${deg}deg)`;
  }

  playTone(freq: number) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(ctx.destination);

      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.00001, now + 1.8);

      osc.start(now);
      osc.stop(now + 1.8);
      setTimeout(() => ctx.close(), 2000);
    } catch (e) {
      console.warn('Tone playback error:', e);
    }
  }

  playSuccessSound() {
    if (!this.audioContext) return;
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.15);

      gain.gain.setValueAtTime(0.04, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.4);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.4);
    } catch {
      // silent fallback
    }
  }

  ngOnDestroy() {
    this.stopTuner();
    if (this.strobeFrameId) {
      cancelAnimationFrame(this.strobeFrameId);
      this.strobeFrameId = null;
    }
  }
}
