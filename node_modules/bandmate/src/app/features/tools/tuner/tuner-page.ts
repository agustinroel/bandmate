import { Component, signal, OnDestroy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'bm-tuner-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="tuner-container">
      <header class="tuner-header">
        <h1>Tuner</h1>
        <p class="subtitle">Standard Tuning (E A D G B E)</p>
      </header>

      <div class="tuner-card">
        <div class="tuner-display">
          <div class="note-display">
            @if (isListening()) {
              <div class="note-val" [class.in-tune]="isInTune()">{{ renderNote() }}</div>
              <div class="cents-val" [ngStyle]="{color: getCentsColor()}">
                {{ renderCents() }}
              </div>
            } @else {
              <!-- Idle State: Visible but dimmed/ghosted -->
              <div class="note-val placeholder">--</div>
              <div class="cents-val">Tab Start to Tune</div>
            }
          </div>
          
           <div class="gauge-wrapper">
              <svg class="gauge" viewBox="0 0 200 100">
                <!-- Tick marks (Darker for Cream) -->
                <line x1="100" y1="10" x2="100" y2="25" stroke="#bbb" stroke-width="2" />
                <line x1="60" y1="20" x2="65" y2="35" stroke="#ddd" stroke-width="2" />
                <line x1="140" y1="20" x2="135" y2="35" stroke="#ddd" stroke-width="2" />
 
                <!-- Arc -->
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(38, 70, 83, 0.08)" stroke-width="8" stroke-linecap="round" />
                
                <!-- Needle -->
                <line 
                   x1="100" y1="100" x2="100" y2="15" 
                   stroke="#264653" 
                   stroke-width="5" 
                   stroke-linecap="round"
                   class="needle" 
                   [class.idle]="!isListening()"
                   [style.transform]="getNeedleTransform()"
                 />
                 <circle cx="100" cy="100" r="6" fill="#264653" />
              </svg>
           </div>
        </div>

        <div class="controls">
          @if (!isListening()) {
            <button mat-flat-button class="start-btn" (click)="startTuner()">
              <mat-icon>mic</mat-icon> Start Tuner
            </button>
          } @else {
             <button mat-stroked-button (click)="stopTuner()" class="stop-btn">
              Stop
            </button>
          }
        </div>
      </div>

      <div class="reference-tones">
        @for (tone of openStrings; track tone.note) {
          <button class="tone-btn" (click)="playTone(tone.freq)">
            {{ tone.note }}
          </button>
        }
      </div>
    </div>
  `,
  /* Updated Styles per User Feedback */
  styles: [`
    :host {
      display: block;
      padding: 24px;
      height: 100%;
      /* Background IS the Hero Gradient now */
      background: linear-gradient(135deg, var(--bm-wood) 0%, var(--bm-teal) 100%);
      color: white; /* Default text for outside card */
      border-radius: 32px;
    }

    .tuner-container {
      max-width: 520px;
      margin: 0 auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 32px;
      padding-top: 40px;
    }

    /* Header text on dark background needs to be white/light */
    .tuner-header h1 {
      font-size: 48px;
      font-weight: 800;
      color: var(--bm-cream); 
      margin: 0;
      letter-spacing: -1px;
      text-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .subtitle {
      color: rgba(244, 241, 222, 0.8);
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 8px;
    }

    /* Card should be Cream Style (.bm-fr match) */
    .tuner-card {
      background: linear-gradient(180deg, rgba(201, 162, 39, 0.09), rgba(0, 0, 0, 0.008));
      background-color: var(--bm-cream); 
      border: 1px solid rgba(201, 162, 39, 0.18);
      border-radius: 32px;
      padding: 48px 32px;
      /* Strong shadow for depth on dark bg */
      box-shadow: 
        0 24px 60px -12px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255,255,255,0.1);
      position: relative;
      overflow: hidden;
      
      display: flex;
      flex-direction: column;
      gap: 24px;
      align-items: center;
      color: var(--bm-wood);
      
      /* Enforce fixed height to prevent jumping if content changes */
      min-height: 480px; 
    }

    .note-display {
      height: 180px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      /* Ensure this container doesn't shrink/grow */
      flex-shrink: 0; 
    }

    .note-val {
      font-size: 120px;
      font-weight: 900;
      color: var(--bm-wood);
      line-height: 1;
      
      /* Fixed width to prevent horizontal jumping when switching A -> A# */
      width: 180px; 
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .note-val.in-tune {
      color: var(--bm-teal);
      text-shadow: 0 0 0; /* Remove glow for cleaner look on white, or subtle */
    }
    
    .cents-val {
       font-size: 18px;
       font-weight: 700;
       margin-top: 8px;
       height: 24px;
       /* Fixed width to prevent jitter */
       width: 100%; 
       text-align: center;
       opacity: 0.8;
       letter-spacing: 1px;
       text-transform: uppercase;
       font-variant-numeric: tabular-nums;
    }

    .placeholder {
       font-size: 80px;
       font-weight: 800;
       color: #e0e0e0;
       width: 180px;
       text-align: center;
    }

    .gauge-wrapper {
       margin-top: -10px;
       width: 100%;
       max-width: 320px;
       height: 160px; /* Fixed height reservation */
    }
    
    .needle {
       transition: transform 0.15s cubic-bezier(0.2, 0, 0.4, 1);
       transform-origin: 100px 100px;
    }
    
    .needle.idle {
        opacity: 0.3;
    }

    /* Start button - Dark Wood on Cream Card */
    .start-btn {
       background-color: var(--bm-wood) !important; 
       color: var(--bm-cream) !important; 
       padding: 24px 48px !important;
       font-size: 18px !important;
       border-radius: 99px !important;
       font-weight: 800 !important;
       letter-spacing: 0.5px;
       box-shadow: 0 8px 20px rgba(38, 70, 83, 0.15);
       transition: transform 0.2s;
       border: 2px solid transparent;
    }
    .start-btn:hover {
       transform: translateY(-2px);
       box-shadow: 0 12px 24px rgba(38, 70, 83, 0.25);
       background-color: #1a3a47 !important;
    }
    
    .stop-btn {
       border-color: var(--bm-burnt) !important;
       color: var(--bm-burnt) !important;
       padding: 0 32px !important;
       height: 48px !important;
       border-radius: 99px !important;
       font-weight: 600 !important;
    }
    .stop-btn:hover {
       background: rgba(231, 111, 81, 0.05);
    }

    .reference-tones {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .tone-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      font-weight: 700;
      color: white;
      cursor: pointer;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .tone-btn:hover {
       transform: translateY(-2px);
       background: var(--bm-gold); /* Gold */
       color: var(--bm-wood); /* Dark */
       border-color: var(--bm-gold);
       box-shadow: 0 8px 16px rgba(233, 196, 106, 0.4);
    }
    
    .tone-btn:active {
       transform: translateY(0);
    }
  `]
})
export class TunerPageComponent implements OnDestroy {
  private readonly zone = inject(NgZone);
  
  isListening = signal(false);
  currentNote = signal<string | null>(null);
  currentCents = signal<number>(0);

  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  mediaStream: MediaStream | null = null;
  animationFrameId: number | null = null;
  
  openStrings = [
    { note: 'E', freq: 82.41 },
    { note: 'A', freq: 110.00 },
    { note: 'D', freq: 146.83 },
    { note: 'G', freq: 196.00 },
    { note: 'B', freq: 246.94 },
    { note: 'E', freq: 329.63 },
  ];

  // Smoothing buffer
  private centsBuffer: number[] = [];
  private readonly BUFFER_SIZE = 8; // Average last 8 frames (~130ms at 60fps)

  async startTuner() {
    try {
      this.audioContext = new AudioContext();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      // Low pass filter to reduce noise? Optional but helpful
      // const filter = this.audioContext.createBiquadFilter();
      // filter.type = 'lowpass';
      // filter.frequency.value = 1000;
      // source.connect(filter);
      // filter.connect(this.analyser);
      
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
    }
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    
    this.isListening.set(false);
    this.currentNote.set(null);
    this.currentCents.set(0);
    this.centsBuffer = [];
  }

  // Success sound state
  private inTuneFrames = 0;
  private hasPlayedSuccess = false;

  detectPitch() {
    if (!this.analyser || !this.isListening()) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const ac = this.autoCorrelate(buffer, this.audioContext!.sampleRate);

    this.zone.run(() => {
      if (ac === -1) {
        // No signal
        this.inTuneFrames = 0;
        this.hasPlayedSuccess = false;
      } else {
        const note = this.noteFromPitch(ac);
        const rawCents = this.centsOffFromPitch(ac, note);
        
        // Push to buffer
        this.centsBuffer.push(rawCents);
        if (this.centsBuffer.length > this.BUFFER_SIZE) {
          this.centsBuffer.shift();
        }
        
        // Calculate average
        const avgCents = this.centsBuffer.reduce((a, b) => a + b, 0) / this.centsBuffer.length;

        const noteName = this.noteStrings[note % 12];
        
        this.currentNote.set(noteName);
        this.currentCents.set(avgCents);

        // Check for success sound (hold in tune for ~0.5s)
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

  playSuccessSound() {
      if (!this.audioContext) return;
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
  }



  // Need to use the new styles array in Component metadata
  // But since I'm editing the class body, I can't easily change the @Component metadata 
  // unless I replace the whole file or use a specific technique.
  // Wait, I am replacing lines inside the class? No, I need to check where I am editing.
  
  // The tool call below targets lines 288-?, which is inside the class??
  // No, the previous `styles` block was in the @Component decorator.
  // I need to be careful. The user provided file has styles in the @Component decorator.
  // I should probably replace the whole file or a large chunk including the @Component decorator to update styles safely.


  // --- Logic Helpers (ACF2+ algorithm simplified) ---
  
  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        const val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // signal too weak

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
        if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++)
        if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    const subBuf = buf.slice(r1, r2);
    const newSize = subBuf.length; 
    const c = new Array(newSize).fill(0);
    
    for (let i = 0; i < newSize; i++)
        for (let j = 0; j < newSize - i; j++)
            c[i] = c[i] + subBuf[j] * subBuf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < newSize; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;

    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }

  // Notes
  private noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private noteFromPitch(frequency: number): number {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  private centsOffFromPitch(frequency: number, note: number): number {
    return Math.floor(1200 * Math.log(frequency / this.frequencyFromNoteNumber(note)) / Math.log(2));
  }

  private frequencyFromNoteNumber(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // --- UI Helpers ---

  renderNote() {
    return this.currentNote() || '--';
  }

  renderCents() {
    const c = this.currentCents();
    if (c === 0) return 'Perfect';
    return c > 0 ? `+${c} cents` : `${c} cents`;
  }

  isInTune() {
    return Math.abs(this.currentCents()) < 5;
  }

  getCentsColor() {
     const c = Math.abs(this.currentCents());
     if (c < 5) return 'var(--bm-teal)'; // In tune
     if (c < 20) return '#E9C46A'; // Close (Gold)
     return '#E76F51'; // Far (Burnt)
  }

  getNeedleTransform() {
    // Map -50 (flat) ... 0 ... +50 (sharp) to rotation
    // Clamp between -45 and 45 degrees
    let c = this.currentCents();
    if (c < -50) c = -50;
    if (c > 50) c = 50;
    
    // -50 -> -45deg
    // 0 -> 0deg
    // 50 -> 45deg
    const deg = (c / 50) * 45;
    return `rotate(${deg}deg)`;
  }
  
  playTone(freq: number) {
    // Basic tone playback for reference
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(ctx.destination);
    
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5);
    osc.stop(ctx.currentTime + 1.5);
  }

  ngOnDestroy() {
    this.stopTuner();
  }
}
