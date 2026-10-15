import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { MetronomeService } from './metronome.service';

export interface LoopSectionOption {
  id: string;
  name: string;
  type: string;
}

export interface LoopStatusSummary {
  rep: number;
  currentBpm: number;
  targetBpm: number;
  speedActive: boolean;
  isTargetReached: boolean;
  isPaused: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoopTrainerService {
  private readonly metronome = inject(MetronomeService);

  // Core Loop State
  readonly isEnabled = signal(false);
  readonly isPaused = signal(false);
  readonly startSectionId = signal<string | null>(null);
  readonly endSectionId = signal<string | null>(null);
  readonly barsPerLoop = signal(4); // default 4 bars per cycle
  readonly currentRepetition = signal(1);

  // Speed Trainer Options
  readonly isSpeedTrainer = signal(false);
  readonly initialBpm = signal(100);
  readonly targetBpm = signal(140);
  readonly bpmIncrement = signal(5);
  readonly repsPerIncrement = signal(2); // every N reps

  // Internal tracking
  private initialBar = 0;
  private onLoopCycleCallback: ((startId: string) => void) | null = null;

  // Status Summary for UI
  readonly statusSummary = computed<LoopStatusSummary | null>(() => {
    if (!this.isEnabled()) return null;
    const currentBpm = this.metronome.bpm();
    const target = this.targetBpm();
    const rep = this.currentRepetition();
    const speedActive = this.isSpeedTrainer();

    return {
      rep,
      currentBpm,
      targetBpm: target,
      speedActive,
      isTargetReached: speedActive && currentBpm >= target,
      isPaused: this.isPaused(),
    };
  });
  readonly summary = this.statusSummary;

  constructor() {
    // Monitor Metronome bar progression strictly synchronized with Tone.Transport
    effect(() => {
      const currentBar = this.metronome.bar();
      const isPlaying = this.metronome.isPlaying();

      if (this.isEnabled() && !this.isPaused() && isPlaying && currentBar > this.initialBar) {
        const elapsedBars = currentBar - this.initialBar;
        const cycleLength = Math.max(1, this.barsPerLoop());

        if (elapsedBars >= cycleLength) {
          this.completeCycle();
          this.initialBar = currentBar;
        }
      }
    });
  }

  registerLoopScrollHandler(handler: (startSectionId: string) => void) {
    this.onLoopCycleCallback = handler;
  }

  setSectionA(sectionId: string | null) {
    this.startSectionId.set(sectionId);
    if (!this.endSectionId() && sectionId) {
      this.endSectionId.set(sectionId);
    }
  }

  setSectionB(sectionId: string | null) {
    this.endSectionId.set(sectionId);
  }

  setBarsPerLoop(bars: number) {
    this.barsPerLoop.set(Math.max(1, Math.min(64, bars)));
  }

  setSpeedTrainer(enabled: boolean) {
    this.isSpeedTrainer.set(enabled);
  }

  setInitialBpm(bpm: number) {
    this.initialBpm.set(Math.max(30, Math.min(300, bpm)));
  }

  setTargetBpm(bpm: number) {
    this.targetBpm.set(Math.max(30, Math.min(300, bpm)));
  }

  setBpmIncrement(increment: number) {
    this.bpmIncrement.set(Math.max(1, Math.min(20, increment)));
  }

  setRepsPerIncrement(reps: number) {
    this.repsPerIncrement.set(Math.max(1, Math.min(10, reps)));
  }

  startLoop() {
    this.isEnabled.set(true);
    this.isPaused.set(false);
    this.currentRepetition.set(1);
    this.initialBar = this.metronome.bar();

    // If speed trainer is enabled, set starting tempo
    if (this.isSpeedTrainer()) {
      this.metronome.setBpm(this.initialBpm());
    }

    // Scroll to section A immediately
    const a = this.startSectionId();
    if (a && this.onLoopCycleCallback) {
      this.onLoopCycleCallback(a);
    }

    // Ensure metronome is running
    if (!this.metronome.isPlaying()) {
      this.metronome.start();
    }
  }

  stopLoop() {
    this.isEnabled.set(false);
    this.isPaused.set(false);
  }

  pauseLoop() {
    if (!this.isEnabled()) return;
    this.isPaused.set(true);
    this.metronome.stop();
  }

  resumeLoop() {
    if (!this.isEnabled() || !this.isPaused()) return;
    this.isPaused.set(false);
    this.initialBar = this.metronome.bar();
    this.metronome.start();
  }

  resetLoop() {
    this.currentRepetition.set(1);
    this.initialBar = this.metronome.bar();
    if (this.isSpeedTrainer()) {
      this.metronome.setBpm(this.initialBpm());
    }
  }

  toggleLoop() {
    if (this.isEnabled()) {
      this.stopLoop();
    } else {
      this.startLoop();
    }
  }

  completeCycle() {
    const nextRep = this.currentRepetition() + 1;
    this.currentRepetition.set(nextRep);

    // Speed Trainer progression
    if (this.isSpeedTrainer()) {
      const repsStep = Math.max(1, this.repsPerIncrement());
      if ((nextRep - 1) % repsStep === 0) {
        const current = this.metronome.bpm();
        const target = this.targetBpm();
        if (current < target) {
          const nextBpm = Math.min(target, current + this.bpmIncrement());
          this.metronome.setBpm(nextBpm);
        }
      }
    }

    // Smooth scroll back to section A
    const a = this.startSectionId();
    if (a && this.onLoopCycleCallback) {
      this.onLoopCycleCallback(a);
    }
  }
}
