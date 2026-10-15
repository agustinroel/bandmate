/**
 * ============================================================================
 * BANDMATE 2026 ROADMAP — ADVERSARIAL STRESS TEST SUITE (M1 & M2)
 * ============================================================================
 * White-box adversarial verification on Milestone 1 & Milestone 2:
 * 1. LiveBandSyncService & PracticePageComponent:
 *    - Extreme scroll sync values (negative, NaN, Infinity, overflow)
 *    - Rapid broadcast floods (100+ events burst)
 *    - Visual stage cue sanitization, XSS payloads, ultra-long strings & cue floods
 *    - Peer roster joins/leaves churn & rapid reconnection thrashing
 *    - Autonomous follower transposition under rapid song key shifts
 * 2. LoopTrainerService & TunerPageComponent:
 *    - Extreme tempo boundaries (<30 BPM, >300 BPM, inverted targets)
 *    - Rapid pause/resume/reset transport thrashing during active playback
 *    - A4 frequency boundaries & corrupted/malicious localStorage tampering
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  LiveBandSyncService,
  StageRole,
  StageCue,
  LiveStagePeer,
  LiveSongPayload,
  LiveScrollPayload,
} from '../core/services/live-band-sync.service';
import { AuthStore } from '../core/auth/auth.store';
import { supabase } from '../core/supabase/supabase.client';
import { LoopTrainerService } from '../features/practice/services/loop-trainer.service';
import { MetronomeService } from '../features/practice/services/metronome.service';
import { TunerPageComponent, TUNING_PRESETS } from '../features/tools/tuner/tuner-page';
import {
  transposeChordSymbol,
  transposeKey,
} from '../shared/utils/music/chords';

describe('Adversarial Verification Suite: Milestone 1 & Milestone 2', () => {
  let mockChannel: any;
  let realtimeHandlers: Record<string, Function>;

  beforeEach(() => {
    localStorage.clear();
    realtimeHandlers = {};

    mockChannel = {
      on: vi.fn((type: string, filter: any, callback: Function) => {
        const key = filter?.event ? `${type}:${filter.event}` : type;
        realtimeHandlers[key] = callback;
        return mockChannel;
      }),
      subscribe: vi.fn((callback?: Function) => {
        if (callback) callback('SUBSCRIBED');
        return mockChannel;
      }),
      track: vi.fn().mockResolvedValue('ok'),
      send: vi.fn().mockResolvedValue('ok'),
      unsubscribe: vi.fn().mockResolvedValue('ok'),
      presenceState: vi.fn().mockReturnValue({}),
    };

    vi.spyOn(supabase, 'channel').mockReturnValue(mockChannel as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SECTION 1: LIVE BAND REAL-TIME SYNC (MILESTONE 1) ADVERSARIAL STRESS
  // ==========================================================================
  describe('M1: LiveBandSyncService Adversarial Stress', () => {
    let service: LiveBandSyncService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LiveBandSyncService,
          {
            provide: AuthStore,
            useValue: {
              user: () => ({ id: 'usr-adv-1', email: 'adversary@bandmate.live' }),
            },
          },
        ],
      });
      service = TestBed.inject(LiveBandSyncService);
    });

    afterEach(() => {
      service.leaveSession();
    });

    describe('1.1 Extreme Scroll Values & Overflow', () => {
      it('should safely handle negative, NaN, Infinity, and extreme overflow scroll payloads', () => {
        service.joinSession('stress-band', 'follower');

        // Negative scroll values
        realtimeHandlers['broadcast:scroll_sync']?.({
          payload: { scrollTop: -99999, scrollRatio: -1.5 },
        });
        expect(service.remoteScroll()).toEqual({
          scrollTop: -99999,
          scrollRatio: -1.5,
        });

        // NaN scroll values
        realtimeHandlers['broadcast:scroll_sync']?.({
          payload: { scrollTop: NaN, scrollRatio: NaN },
        });
        const nanScroll = service.remoteScroll();
        expect(Number.isNaN(nanScroll?.scrollTop)).toBe(true);
        expect(Number.isNaN(nanScroll?.scrollRatio)).toBe(true);

        // Infinite scroll values
        realtimeHandlers['broadcast:scroll_sync']?.({
          payload: { scrollTop: Infinity, scrollRatio: Infinity },
        });
        expect(service.remoteScroll()?.scrollTop).toBe(Infinity);
        expect(service.remoteScroll()?.scrollRatio).toBe(Infinity);

        // Huge integer overflow
        realtimeHandlers['broadcast:scroll_sync']?.({
          payload: { scrollTop: Number.MAX_SAFE_INTEGER, scrollRatio: 9999999 },
        });
        expect(service.remoteScroll()?.scrollTop).toBe(Number.MAX_SAFE_INTEGER);
        expect(service.remoteScroll()?.scrollRatio).toBe(9999999);
      });

      it('should allow leader to broadcast boundary scroll positions without exception', () => {
        service.joinSession('stress-band', 'leader');

        expect(() => {
          service.broadcastScroll(0, 0);
          service.broadcastScroll(-100, -0.5);
          service.broadcastScroll(999999, 1.0);
          service.broadcastScroll(Number.MAX_SAFE_INTEGER, 100);
        }).not.toThrow();

        expect(mockChannel.send).toHaveBeenCalledTimes(4);
      });
    });

    describe('1.2 Rapid Broadcast Floods', () => {
      it('should survive a flood of 100 simultaneous scroll broadcasts without channel crash', () => {
        service.joinSession('stress-band', 'leader');

        for (let i = 0; i < 100; i++) {
          service.broadcastScroll(i * 10, i / 100);
        }

        expect(mockChannel.send).toHaveBeenCalledTimes(100);
        expect(mockChannel.send).toHaveBeenLastCalledWith({
          type: 'broadcast',
          event: 'scroll_sync',
          payload: { scrollTop: 990, scrollRatio: 0.99 },
        });
      });

      it('should process 100 consecutive incoming song and section updates cleanly', () => {
        service.joinSession('stress-band', 'follower');

        for (let i = 0; i < 100; i++) {
          realtimeHandlers['broadcast:song_change']?.({
            payload: { songId: `song-${i}`, title: `Song Title ${i}`, index: i },
          });
          realtimeHandlers['broadcast:section_jump']?.({
            payload: { sectionId: `sec-${i}`, sectionName: `Section ${i}` },
          });
        }

        expect(service.remoteSongChange()?.songId).toBe('song-99');
        expect(service.remoteSongChange()?.index).toBe(99);
        expect(service.remoteSectionJump()?.sectionId).toBe('sec-99');
      });
    });

    describe('1.3 Visual Stage Cue Sanitization & Floods', () => {
      it('should handle empty, whitespace-only, and special character stage cues', () => {
        service.joinSession('stress-band', 'leader');

        // Empty string cue
        service.broadcastStageCue('', 'custom');
        expect(service.activeCue()?.text).toBe('');

        // Whitespace-only cue
        service.broadcastStageCue('   \t\n   ', 'custom');
        expect(service.activeCue()?.text).toBe('   \t\n   ');

        // HTML / XSS Injection strings
        const xssPayload = '<script>alert("hack")</script><img src=x onerror=alert(1)>';
        service.broadcastStageCue(xssPayload, 'custom');
        expect(service.activeCue()?.text).toBe(xssPayload);

        // Unicode & musical symbols
        const unicodeCue = '🎸🥁 SOLO EN DO# MENOR ⚡🔥 100% ACTIVO 🎶';
        service.broadcastStageCue(unicodeCue, 'solo');
        expect(service.activeCue()?.text).toBe(unicodeCue);
        expect(service.activeCue()?.type).toBe('solo');
      });

      it('should safely handle ultra-long cue strings (5,000+ characters)', () => {
        service.joinSession('stress-band', 'leader');

        const ultraLongText = 'A'.repeat(5000);
        service.broadcastStageCue(ultraLongText, 'custom');

        expect(service.activeCue()?.text.length).toBe(5000);
        expect(mockChannel.send).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'stage_cue',
            payload: expect.objectContaining({ text: ultraLongText }),
          })
        );
      });

      it('should cancel previous cue timers when rapid cue floods occur and maintain final cue', () => {
        try {
          vi.useFakeTimers();
          service.joinSession('stress-band', 'leader');

          // Trigger 20 rapid cues in rapid burst
          for (let i = 0; i < 20; i++) {
            service.broadcastStageCue(`CUE #${i}`, 'custom');
          }

          // Active cue must be the latest one (CUE #19)
          expect(service.activeCue()?.text).toBe('CUE #19');

          // Advance 3000ms -> CUE #19 is still active
          vi.advanceTimersByTime(3000);
          expect(service.activeCue()?.text).toBe('CUE #19');

          // Advance another 1100ms (total 4100ms since CUE #19) -> auto dismissed
          vi.advanceTimersByTime(1100);
          expect(service.activeCue()).toBeNull();
        } finally {
          vi.useRealTimers();
        }
      });
    });

    describe('1.4 Peer Roster Churn & Reconnection Thrashing', () => {
      it('should handle rapid peer joins and leaves (0 to 50 peers and back to 0)', () => {
        service.joinSession('stress-band', 'follower');

        // 50 peers join
        const fiftyPeersState: Record<string, any[]> = {};
        for (let i = 0; i < 50; i++) {
          fiftyPeersState[`peer-${i}`] = [
            {
              userId: `peer-${i}`,
              userName: `Musician ${i}`,
              role: i === 0 ? 'leader' : 'follower',
              instrument: i % 2 === 0 ? 'Guitar' : 'Keyboards',
            },
          ];
        }

        mockChannel.presenceState.mockReturnValue(fiftyPeersState);
        realtimeHandlers['presence:sync']?.();

        expect(service.peers().length).toBe(50);
        expect(service.peerCount()).toBe(50);

        // Immediate mass disconnect (all leave)
        mockChannel.presenceState.mockReturnValue({});
        realtimeHandlers['presence:sync']?.();

        expect(service.peers()).toEqual([]);
        expect(service.peerCount()).toBe(0);
      });

      it('should tolerate corrupted presence states with missing fields gracefully', () => {
        service.joinSession('stress-band', 'follower');

        // Malformed presence entries (missing userName, role, instrument)
        mockChannel.presenceState.mockReturnValue({
          'user-broken-1': [{}],
          'user-broken-2': [{ userId: 'usr-partial' }],
          'user-broken-3': [{ userId: 'usr-anon', userName: null, role: null, instrument: null }],
        });

        expect(() => {
          realtimeHandlers['presence:sync']?.();
        }).not.toThrow();

        const peers = service.peers();
        expect(peers.length).toBe(3);
        // Fallbacks must protect against crashes
        expect(peers[0].userName).toBe('Musician');
        expect(peers[0].role).toBe('follower');
        expect(peers[0].instrument).toBe('Stage');
      });

      it('should withstand rapid session switching and reconnect thrashing without state leakage', () => {
        for (let i = 0; i < 10; i++) {
          service.joinSession(`band-room-${i}`, i % 2 === 0 ? 'leader' : 'follower', `Inst-${i}`);
          expect(service.isConnected()).toBe(true);
        }

        service.leaveSession();
        expect(service.isConnected()).toBe(false);
        expect(service.peers()).toEqual([]);
        expect(service.remoteScroll()).toBeNull();
        expect(service.remoteSongChange()).toBeNull();
        expect(service.remoteSectionJump()).toBeNull();
      });
    });

    describe('1.5 Autonomous Transposition Resiliency', () => {
      it('should preserve autonomous transposition through extreme key shifts (-12 to +12 semitones)', () => {
        // Concert key Eb
        const concertKey = 'Eb';

        // Extreme transpositions
        const transpositions = [-12, -7, -3, 0, 2, 5, 7, 11, 12];
        for (const shift of transpositions) {
          const transposed = transposeKey(concertKey, shift);
          expect(transposed).toBeTruthy();
          expect(typeof transposed).toBe('string');
        }

        // Complex jazz and extended chords under rapid key shifts
        const chords = ['Ebmaj7', 'Fm7b5', 'Bb7#9', 'Gdim7', 'Ab/C', 'Csus4'];
        for (const chord of chords) {
          for (const shift of [-5, 3, 7]) {
            const result = transposeChordSymbol(chord, shift);
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
          }
        }
      });
    });
  });

  // ==========================================================================
  // SECTION 2: PRO AUDIO TOOLKIT (MILESTONE 2) ADVERSARIAL STRESS
  // ==========================================================================
  describe('M2: LoopTrainerService & TunerPageComponent Adversarial Stress', () => {
    describe('2.1 LoopTrainerService Boundaries & Transport Thrashing', () => {
      let loopService: LoopTrainerService;
      let metronome: MetronomeService;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [LoopTrainerService, MetronomeService],
        });
        loopService = TestBed.inject(LoopTrainerService);
        metronome = TestBed.inject(MetronomeService);
        vi.spyOn(metronome, 'start').mockImplementation(async () => {});
      });

      afterEach(() => {
        loopService.stopLoop();
        metronome.stop();
      });

      it('should clamp extreme tempo boundaries (<30 BPM and >300 BPM)', () => {
        loopService.setInitialBpm(-9999);
        expect(loopService.initialBpm()).toBe(30);

        loopService.setInitialBpm(9999);
        expect(loopService.initialBpm()).toBe(300);

        loopService.setTargetBpm(-500);
        expect(loopService.targetBpm()).toBe(30);

        loopService.setTargetBpm(5000);
        expect(loopService.targetBpm()).toBe(300);
      });

      it('should handle inverted target BPM (initial > target) without overshooting or negative increment', () => {
        loopService.setSpeedTrainer(true);
        loopService.setInitialBpm(160);
        loopService.setTargetBpm(120); // target lower than initial
        loopService.setBpmIncrement(5);
        loopService.setRepsPerIncrement(1);

        loopService.startLoop();
        expect(metronome.bpm()).toBe(160);

        // Cycle complete: current >= target -> should not increment
        loopService.completeCycle();
        expect(metronome.bpm()).toBe(160);
        expect(loopService.summary()?.isTargetReached).toBe(true);
      });

      it('should withstand rapid pause/resume/reset thrashing during active transport', () => {
        loopService.setSpeedTrainer(true);
        loopService.setInitialBpm(100);
        loopService.setTargetBpm(150);
        loopService.startLoop();

        // Thrash pause/resume/reset 50 times in rapid succession
        for (let i = 0; i < 50; i++) {
          loopService.pauseLoop();
          expect(loopService.isPaused()).toBe(true);
          loopService.resumeLoop();
          expect(loopService.isPaused()).toBe(false);
          if (i % 5 === 0) {
            loopService.resetLoop();
            expect(loopService.currentRepetition()).toBe(1);
            expect(metronome.bpm()).toBe(100);
          }
        }

        // Final state verification
        expect(loopService.isEnabled()).toBe(true);
        expect(loopService.isPaused()).toBe(false);
      });

      it('should safely handle rapid toggling of the loop system', () => {
        for (let i = 0; i < 20; i++) {
          loopService.toggleLoop();
          expect(loopService.isEnabled()).toBe(i % 2 === 0);
        }
        loopService.stopLoop();
        expect(loopService.isEnabled()).toBe(false);
        expect(loopService.isPaused()).toBe(false);
      });
    });

    describe('2.2 TunerPageComponent A4 Calibration Boundaries & Storage Tampering', () => {
      let fixture: ComponentFixture<TunerPageComponent>;
      let component: TunerPageComponent;

      beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({
          imports: [TunerPageComponent],
          providers: [provideRouter([]), provideHttpClient()],
        }).compileComponents();

        fixture = TestBed.createComponent(TunerPageComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
      });

      afterEach(() => {
        component.ngOnDestroy();
        localStorage.clear();
      });

      it('should clamp A4 adjustments strictly to [432, 446] Hz regardless of extreme inputs', () => {
        // Enormous positive step
        component.adjustA4(100000);
        expect(component.a4Frequency()).toBe(446);
        expect(localStorage.getItem('bandmate_tuner_a4')).toBe('446');

        // Enormous negative step
        component.adjustA4(-100000);
        expect(component.a4Frequency()).toBe(432);
        expect(localStorage.getItem('bandmate_tuner_a4')).toBe('432');

        // Decimal clamping
        component.onA4SliderChange({ target: { value: '445.8' } } as unknown as Event);
        expect(component.a4Frequency()).toBe(445.8);

        component.onA4SliderChange({ target: { value: '430' } } as unknown as Event);
        expect(component.a4Frequency()).toBe(432);

        component.onA4SliderChange({ target: { value: '500' } } as unknown as Event);
        expect(component.a4Frequency()).toBe(446);
      });

      it('should recover to 440 Hz standard on malicious or corrupted localStorage values', async () => {
        const maliciousTestCases = [
          '480', // exceeds max
          '400', // below min
          'NaN',
          '-Infinity',
          'Infinity',
          '<script>alert(1)</script>',
          '{"a4": 440}',
        ];

        for (const malformed of maliciousTestCases) {
          localStorage.setItem('bandmate_tuner_a4', malformed);

          const testFixture = TestBed.createComponent(TunerPageComponent);
          const testComp = testFixture.componentInstance;
          expect(testComp.a4Frequency()).toBe(440);
          testComp.ngOnDestroy();
        }
      });

      it('should correctly calculate open string calibrated frequencies at extreme boundaries (432 Hz and 446 Hz)', () => {
        for (const preset of TUNING_PRESETS) {
          component.selectPreset(preset.id);

          // Test at min boundary (432 Hz)
          component.a4Frequency.set(432);
          const strings432 = component.calibratedStrings();
          expect(strings432.length).toBe(preset.strings.length);
          for (const s of strings432) {
            expect(Number.isFinite(s.calibratedFreq)).toBe(true);
            expect(s.calibratedFreq).toBeGreaterThan(0);
            expect(s.calibratedFreq).toBeLessThan(s.baseFreqAt440); // 432 < 440
          }

          // Test at max boundary (446 Hz)
          component.a4Frequency.set(446);
          const strings446 = component.calibratedStrings();
          expect(strings446.length).toBe(preset.strings.length);
          for (const s of strings446) {
            expect(Number.isFinite(s.calibratedFreq)).toBe(true);
            expect(s.calibratedFreq).toBeGreaterThan(0);
            expect(s.calibratedFreq).toBeGreaterThan(s.baseFreqAt440); // 446 > 440
          }
        }
      });
    });
  });
});
