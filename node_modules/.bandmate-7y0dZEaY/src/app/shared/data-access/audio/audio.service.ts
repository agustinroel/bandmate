import { Injectable } from '@angular/core';
import * as Tone from 'tone';
import { GuitarShape } from '../../utils/music/guitar-shapes';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;

  private async init() {
    if (this.isInitialized) return;
    await Tone.start();
    
    // Create a reverb for more "room" feel
    const reverb = new Tone.Reverb({
      decay: 1.5,
      preDelay: 0.01,
      wet: 0.2
    }).toDestination();
    await reverb.generate();

    // Create a synth with a pluckier sound
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'amtriangle', // richer sound
      },
      envelope: {
        attack: 0.005, // fast attack
        decay: 0.2,
        sustain: 0.1,
        release: 1.5 // long release
      }
    }).connect(reverb);
    
    // Volume adjustment
    this.synth.volume.value = -8;
    
    this.isInitialized = true;
  }

  async playShape(shape: GuitarShape) {
    await this.init();
    if (!this.synth) return;

    // Standard Tuning: E A D G B E
    // MIDI numbers:
    // E2 = 40
    // A2 = 45
    // D3 = 50
    // G3 = 55
    // B3 = 59
    // E4 = 64
    const OPEN_STRINGS_MIDI = [40, 45, 50, 55, 59, 64];

    const notesToPlay: string[] = [];
    const now = Tone.now();

    // Stagger the strum slightly for realism
    const strumDuration = 0.05; 

    shape.frets.forEach((fret, stringIndex) => {
      if (fret >= 0) { // -1 is muted/not played
        const midiNote = OPEN_STRINGS_MIDI[stringIndex] + fret;
        const frequency = Tone.Frequency(midiNote, "midi").toNote();
        notesToPlay.push(frequency);
        
        // Trigger attack with slight delay per string (strumming effect)
        this.synth!.triggerAttackRelease(
          frequency, 
          "8n", 
          now + (stringIndex * strumDuration)
        );
      }
    });
  }
}
