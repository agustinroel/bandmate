import { Component, signal, OnDestroy, NgZone, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'bm-tuner-compact',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="tuner-compact-card">
      <div class="display">
        <div class="note" [class.in-tune]="isInTune()">{{ currentNote() || '--' }}</div>

        <div class="gauge-mini">
          <div class="needle-mini" [style.transform]="getNeedleTransform()"></div>
          <div class="center-mark"></div>
        </div>

        <div class="cents" [style.color]="getCentsColor()">
          {{ currentCents() === 0 ? 'READY' : (currentCents() > 0 ? '+' : '') + currentCents() }}
        </div>
      </div>

      <button
        mat-flat-button
        color="primary"
        class="rounded-pill w-100 mt-2"
        (click)="isListening() ? stop() : start()"
      >
        <mat-icon class="me-1">{{ isListening() ? 'mic_off' : 'mic' }}</mat-icon>
        {{ isListening() ? 'Stop Tuner' : 'Start Tuner' }}
      </button>
    </div>
  `,
  styles: [
    `
      .tuner-compact-card {
        background: #ffffff;
        padding: 16px;
        border-radius: 20px;
        width: 188px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 8px 28px rgba(15, 23, 42, 0.1);
        border: 1px solid rgba(38, 70, 83, 0.1);

        button {
          min-height: 44px;
          font-weight: 700;
        }
      }
      .display {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      .note {
        font-family: var(--bm-font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 46px;
        font-weight: 800;
        color: var(--bm-wood);
        line-height: 1;
        height: 48px;
      }
      .note.in-tune {
        color: var(--bm-teal);
      }
      .gauge-mini {
        width: 132px;
        height: 4px;
        background: rgba(38, 70, 83, 0.12);
        border-radius: 2px;
        margin: 16px 0;
        position: relative;
      }
      .needle-mini {
        position: absolute;
        top: -4px;
        left: 50%;
        width: 4px;
        height: 12px;
        background: var(--bm-wood);
        border-radius: 2px;
        transition: transform 0.1s var(--bm-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
        margin-left: -2px;
      }
      .center-mark {
        position: absolute;
        top: -2px;
        left: 50%;
        width: 2px;
        height: 8px;
        background: var(--bm-teal);
        margin-left: -1px;
        opacity: 0.7;
      }
      .cents {
        font-family: var(--bm-font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.9;
        height: 14px;
      }
      :host-context([data-bs-theme='dark']),
      :host-context(.theme-dark) {
        .tuner-compact-card {
          background: #0f172a;
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        }
        .note {
          color: #f8fafc;
        }
        .note.in-tune {
          color: var(--bm-teal);
        }
        .gauge-mini {
          background: rgba(255, 255, 255, 0.14);
        }
        .needle-mini {
          background: var(--bm-accent);
        }
      }
    `,
  ],
})
export class TunerCompactComponent implements OnDestroy {
  private readonly zone = inject(NgZone);

  isListening = signal(false);
  currentNote = signal<string | null>(null);
  currentCents = signal<number>(0);

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  private readonly noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  async start() {
    try {
      this.audioContext = new AudioContext();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);
      this.isListening.set(true);
      this.loop();
    } catch (err) {
      console.error('Tuner error:', err);
    }
  }

  stop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    if (this.audioContext) this.audioContext.close();
    this.isListening.set(false);
    this.currentNote.set(null);
    this.currentCents.set(0);
  }

  private loop() {
    if (!this.analyser || !this.isListening()) return;
    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    const freq = this.autoCorrelate(buffer, this.audioContext!.sampleRate);

    this.zone.run(() => {
      if (freq !== -1) {
        const note = this.noteFromPitch(freq);
        this.currentNote.set(this.noteStrings[note % 12]);
        this.currentCents.set(this.centsOffFromPitch(freq, note));
      }
    });

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  isInTune() {
    return Math.abs(this.currentCents()) < 5;
  }

  getCentsColor() {
    const c = Math.abs(this.currentCents());
    if (c < 5) return 'var(--bm-teal)';
    if (c < 20) return '#E9C46A';
    return '#E76F51';
  }

  getNeedleTransform() {
    const c = Math.max(-50, Math.min(50, this.currentCents()));
    return `translateX(${c * 1.2}px)`;
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    if (rms < 0.01) return -1;

    let r1 = 0,
      r2 = buf.length - 1,
      thres = 0.2;
    for (let i = 0; i < buf.length / 2; i++)
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    for (let i = 1; i < buf.length / 2; i++)
      if (Math.abs(buf[buf.length - i]) < thres) {
        r2 = buf.length - i;
        break;
      }
    const sub = buf.slice(r1, r2);
    const c = new Array(sub.length).fill(0);
    for (let i = 0; i < sub.length; i++)
      for (let j = 0; j < sub.length - i; j++) c[i] += sub[j] * sub[j + i];
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let mv = -1,
      mp = -1;
    for (let i = d; i < sub.length; i++)
      if (c[i] > mv) {
        mv = c[i];
        mp = i;
      }
    let T0 = mp;
    const x1 = c[T0 - 1],
      x2 = c[T0],
      x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  }

  private noteFromPitch(f: number) {
    return Math.round(12 * (Math.log(f / 440) / Math.log(2))) + 69;
  }
  private centsOffFromPitch(f: number, n: number) {
    return Math.floor((1200 * Math.log(f / (440 * Math.pow(2, (n - 69) / 12)))) / Math.log(2));
  }

  ngOnDestroy() {
    this.stop();
  }
}
