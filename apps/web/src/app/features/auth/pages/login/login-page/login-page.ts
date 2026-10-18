import {
  Component,
  computed,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { gsap } from 'gsap';

export interface RehearsalChord {
  name: string;
  fullName: string;
  frets: string;
  frequencies: number[];
}

@Component({
  selector: 'bm-login-page',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('headerSection') headerSection!: ElementRef;
  @ViewChild('monitorSection') monitorSection!: ElementRef;
  @ViewChild('checkinSection') checkinSection!: ElementRef;
  @ViewChild('footerSection') footerSection!: ElementRef;

  readonly auth = inject(AuthStore);
  readonly router = inject(Router);

  readonly busy = signal(false);
  readonly soundMuted = signal(false);

  // Rehearsal chart chords: House of the Rising Sun in Am
  readonly chords: RehearsalChord[] = [
    {
      name: 'Am',
      fullName: 'A minor',
      frets: 'x 0 2 2 1 0',
      frequencies: [110.0, 164.81, 220.0, 261.63, 329.63],
    },
    {
      name: 'C',
      fullName: 'C major',
      frets: 'x 3 2 0 1 0',
      frequencies: [130.81, 164.81, 196.0, 261.63, 329.63],
    },
    {
      name: 'D',
      fullName: 'D major',
      frets: 'x x 0 2 3 2',
      frequencies: [146.83, 220.0, 293.66, 369.99],
    },
    {
      name: 'F',
      fullName: 'F major',
      frets: '1 3 3 2 1 1',
      frequencies: [87.31, 130.81, 174.61, 220.0, 261.63, 349.23],
    },
    {
      name: 'E',
      fullName: 'E major',
      frets: '0 2 2 1 0 0',
      frequencies: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63],
    },
  ];

  readonly activeChord = signal<RehearsalChord>(this.chords[0]);
  readonly isPlaying = signal<boolean>(false);

  private audioCtx: AudioContext | null = null;
  private soundTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.auth.ready.then(() => {
      if (this.auth.isAuthed()) {
        this.router.navigateByUrl('/songs');
      }
    });
  }

  ngAfterViewInit() {
    this.initEntranceAnimation();
  }

  ngOnDestroy() {
    if (this.soundTimer) {
      clearTimeout(this.soundTimer);
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // Safe disposal
      }
    }
  }

  selectChord(chord: RehearsalChord) {
    this.activeChord.set(chord);
    this.playChordAudio(chord);
  }

  toggleMute() {
    this.soundMuted.update((m) => !m);
  }

  private playChordAudio(chord: RehearsalChord) {
    if (this.soundMuted() || typeof window === 'undefined') return;

    this.isPlaying.set(true);
    if (this.soundTimer) clearTimeout(this.soundTimer);
    this.soundTimer = setTimeout(() => {
      this.isPlaying.set(false);
    }, 1300);

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Stagger notes to emulate a natural downward acoustic / electric pick strum
      chord.frequencies.forEach((freq, idx) => {
        const noteTime = now + idx * 0.028;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Warm amplifier timbre
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Low-pass filter for vintage warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, noteTime);

        // Natural exponential decay envelope
        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.12, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 1.3);
      });
    } catch (e) {
      console.debug('Chord preview safe fallback:', e);
    }
  }

  private initEntranceAnimation() {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    try {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (this.headerSection?.nativeElement) {
        tl.from(this.headerSection.nativeElement, {
          y: -16,
          opacity: 0,
          duration: 0.5,
        });
      }

      if (this.monitorSection?.nativeElement) {
        tl.from(
          this.monitorSection.nativeElement,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.25',
        );
      }

      if (this.checkinSection?.nativeElement) {
        tl.from(
          this.checkinSection.nativeElement,
          {
            y: 24,
            opacity: 0,
            duration: 0.65,
          },
          '-=0.35',
        );
      }

      if (this.footerSection?.nativeElement) {
        tl.from(
          this.footerSection.nativeElement,
          {
            opacity: 0,
            duration: 0.4,
          },
          '-=0.2',
        );
      }
    } catch {
      // Fallback
    }
  }

  async signIn() {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      await this.auth.signInWithGoogle();
    } catch (e) {
      console.error(e);
      this.busy.set(false);
    }
  }
}
