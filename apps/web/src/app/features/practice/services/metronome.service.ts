import { Injectable, signal, effect, untracked } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MetronomeService {
  readonly isPlaying = signal(false);
  readonly bpm = signal(100);
  readonly beat = signal(0);

  private audioCtx: AudioContext | null = null;
  private nextNoteTime = 0;
  private timerId: number | null = null;
  private lookaheadWrapper: (() => void) | null = null;

  // How frequently to call scheduling function (in milliseconds)
  private readonly lookahead = 25;

  // How far ahead to schedule audio (sec)
  private readonly scheduleAheadTime = 0.1;

  constructor() {
    // Stop if bpm changes significantly or cleanup?
    // Actually simplicity first: just keep playing if bpm updates.
  }

  toggle() {
    if (this.isPlaying()) this.stop();
    else this.start();
  }

  async start() {
    if (this.isPlaying()) return;

    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.isPlaying.set(true);
    this.nextNoteTime = this.audioCtx!.currentTime;

    this.timerId = window.setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    this.isPlaying.set(false);
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  setBpm(val: number) {
    // Clamp basic safe values
    const safe = Math.max(30, Math.min(300, val));
    this.bpm.set(safe);
  }

  private scheduler() {
    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioCtx!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime);
      this.nextNote();
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm();
    this.nextNoteTime += secondsPerBeat;
  }

  private scheduleNote(time: number) {
    const osc = this.audioCtx!.createOscillator();
    const envelope = this.audioCtx!.createGain();

    osc.frequency.value = 1000;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.connect(envelope);
    envelope.connect(this.audioCtx!.destination);

    osc.start(time);
    osc.stop(time + 0.03);

    // Sync UI beat signal exactly when note plays
    const now = this.audioCtx!.currentTime;
    const msToNote = Math.max(0, (time - now) * 1000);

    setTimeout(() => {
      if (this.isPlaying()) {
        this.beat.update((v) => v + 1);
      }
    }, msToNote);
  }
}
