import { Injectable, signal } from '@angular/core';
import * as Tone from 'tone';

@Injectable({ providedIn: 'root' })
export class MetronomeService {
  readonly isPlaying = signal(false);
  readonly bpm = signal(100);
  readonly beat = signal(0);
  readonly bar = signal(1);
  readonly beatInBar = signal(1);

  private synth: Tone.MembraneSynth | null = null;
  private repeatEventId: number | null = null;
  private isAudioUnlocked = false;

  constructor() {}

  /**
   * Unlock AudioContext safely for mobile/Capacitor/web gestures.
   */
  async unlockAudio(): Promise<void> {
    if (this.isAudioUnlocked) return;
    await Tone.start();
    if (Tone.context.state === 'suspended') {
      await Tone.context.rawContext.resume();
    }
    this.isAudioUnlocked = true;
  }

  private initSynth() {
    if (!this.synth) {
      this.synth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0,
          release: 0.05,
        },
      }).toDestination();
      this.synth.volume.value = -6;
    }
  }

  async toggle() {
    if (this.isPlaying()) {
      this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    if (this.isPlaying()) return;

    await this.unlockAudio();
    this.initSynth();

    // Synchronize Tone.Transport tempo
    Tone.getTransport().bpm.value = this.bpm();

    // Reset beat counts
    this.beat.set(0);
    this.bar.set(1);
    this.beatInBar.set(1);

    // Schedule strict clock ticks via Tone.Transport with 0 audio-visual latency
    if (this.repeatEventId !== null) {
      Tone.getTransport().clear(this.repeatEventId);
    }

    this.repeatEventId = Tone.getTransport().scheduleRepeat((time) => {
      const currentBeat = this.beat();
      const currentBeatInBar = (currentBeat % 4) + 1;
      const currentBar = Math.floor(currentBeat / 4) + 1;
      const isDownbeat = currentBeatInBar === 1;

      // Click sound: higher pitch for downbeat
      const note = isDownbeat ? 'C5' : 'G4';
      this.synth?.triggerAttackRelease(note, '32n', time);

      // Use Tone.Draw to fire GSAP / Signal visual updates strictly on the next animation frame
      // synchronized with the audio clock (zero latency)
      Tone.getDraw().schedule(() => {
        if (this.isPlaying()) {
          this.beat.set(currentBeat + 1);
          this.beatInBar.set(currentBeatInBar);
          this.bar.set(currentBar);
        }
      }, time);
    }, '4n');

    Tone.getTransport().start();
    this.isPlaying.set(true);
  }

  stop() {
    this.isPlaying.set(false);
    if (this.repeatEventId !== null) {
      Tone.getTransport().clear(this.repeatEventId);
      this.repeatEventId = null;
    }
    Tone.getTransport().stop();
    this.beat.set(0);
    this.beatInBar.set(1);
  }

  setBpm(val: number) {
    const safe = Math.max(30, Math.min(300, val));
    this.bpm.set(safe);
    Tone.getTransport().bpm.value = safe;
  }
}
