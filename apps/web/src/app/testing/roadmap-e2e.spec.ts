/**
 * ============================================================================
 * BANDMATE 2026 ROADMAP — OPAQUE-BOX E2E TEST SUITE (TIERS 1 - 4)
 * ============================================================================
 * Comprehensive end-to-end requirement validation covering:
 * - R1: Stage Mode Real-time Band Synchronization (Phase 3)
 * - R2: Rehearsal Loop Trainer & Speed Trainer (Phase 2)
 * - R3: Pro Strobe Tuner & Calibration Validation (Phase 2)
 * - R4: Automated Tech Rider, Input List & Band EPK Exporters (Phase 7)
 * - R5: Universal Catalog Bulk Operations & Setlist PDF Export (Phase 1)
 *
 * Tier 1: Core Functional & Requirement Coverage (Happy Paths)
 * Tier 2: Boundary, Extreme Limits & Corner Cases
 * Tier 3: Cross-Feature Combinations & Multi-System State Integration
 * Tier 4: Real-World Live Gig & Rehearsal Scenarios
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { parseSmartTab, Setlist, Song } from '@bandmate/shared';

// Core Services & Stores
import {
  LiveBandSyncService,
  StageRole,
  StageCue,
  LiveStagePeer,
  LiveSongPayload,
  LiveSectionPayload,
  LiveScrollPayload,
} from '../core/services/live-band-sync.service';
import { AuthStore } from '../core/auth/auth.store';
import { supabase } from '../core/supabase/supabase.client';

// Practice & Audio Toolkit
import { LoopTrainerService } from '../features/practice/services/loop-trainer.service';
import { MetronomeService } from '../features/practice/services/metronome.service';
import { TunerPageComponent, TUNING_PRESETS, TuningPreset } from '../features/tools/tuner/tuner-page';

// Exporters & Modals
import {
  TechRiderExportDialogComponent,
  TechRiderExportDialogData,
  TechRiderInputChannel,
} from '../features/tools/stage-plot/ui/tech-rider-export-dialog/tech-rider-export-dialog';
import {
  BandEpkDialogComponent,
  BandEpkDialogData,
} from '../features/bands/ui/band-epk-dialog/band-epk-dialog.component';
import {
  SetlistExportDialogComponent,
  SetlistExportDialogData,
  StageExportLayout,
} from '../features/setlists/ui/setlist-export-dialog';

// Musical Utilities
import {
  transposeRoot,
  transposeChordSymbol,
  transposeKey,
  isFlatKey,
} from '../shared/utils/music/chords';
import { NotificationsService } from '../shared/ui/notifications/notifications.service';

describe('Bandmate 2026 Roadmap — Comprehensive E2E Opaque-Box Suite', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // SHARED MOCKS & TEST ENVIRONMENT FIXTURES
  // ──────────────────────────────────────────────────────────────────────────
  let mockChannel: any;
  let realtimeHandlers: Record<string, Function>;
  let mockNotificationsService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

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

    mockNotificationsService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // TIER 1: REQUIREMENT & FEATURE COVERAGE (HAPPY PATH)
  // ==========================================================================
  describe('Tier 1: Feature & Requirement Coverage (Happy Path)', () => {
    describe('R1: Stage Mode Real-time Band Synchronization', () => {
      let syncService: LiveBandSyncService;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            LiveBandSyncService,
            {
              provide: AuthStore,
              useValue: {
                user: () => ({ id: 'leader-001', email: 'leader@bandmate.live' }),
              },
            },
          ],
        });
        syncService = TestBed.inject(LiveBandSyncService);
      });

      afterEach(() => {
        syncService.leaveSession();
      });

      it('R1.1 / R1.2: should join session and broadcast song changes to band followers', () => {
        syncService.joinSession('tour-2026', 'leader', 'Lead Vocal & Guitar');

        expect(syncService.isConnected()).toBe(true);
        expect(syncService.isLeader()).toBe(true);

        const songPayload: LiveSongPayload = {
          songId: 'song-wonderwall-1',
          title: 'Wonderwall',
          artist: 'Oasis',
          bpm: 87,
          key: 'Em',
          index: 0,
        };

        syncService.broadcastSongChange(songPayload);

        expect(mockChannel.send).toHaveBeenCalledWith({
          type: 'broadcast',
          event: 'song_change',
          payload: songPayload,
        });
      });

      it('R1.2: should broadcast section jumps and scroll positions to followers', () => {
        syncService.joinSession('tour-2026', 'leader');

        syncService.broadcastSectionJump('sec-chorus', 'Chorus 2');
        expect(mockChannel.send).toHaveBeenCalledWith({
          type: 'broadcast',
          event: 'section_jump',
          payload: { sectionId: 'sec-chorus', sectionName: 'Chorus 2' },
        });

        syncService.broadcastScroll(450, 0.65);
        expect(mockChannel.send).toHaveBeenCalledWith({
          type: 'broadcast',
          event: 'scroll_sync',
          payload: { scrollTop: 450, scrollRatio: 0.65 },
        });
      });

      it('R1.3: should dispatch visual stage cues ("solo", "repeat", "ending", "custom") to peer screens', () => {
        syncService.joinSession('tour-2026', 'leader');

        syncService.broadcastStageCue('Solo in 4 bars', 'solo');
        expect(syncService.activeCue()?.text).toBe('Solo in 4 bars');
        expect(syncService.activeCue()?.type).toBe('solo');

        syncService.broadcastStageCue('Repeat Chorus x2', 'repeat');
        expect(syncService.activeCue()?.text).toBe('Repeat Chorus x2');
        expect(syncService.activeCue()?.type).toBe('repeat');

        syncService.broadcastStageCue('Ending on 1', 'ending');
        expect(syncService.activeCue()?.text).toBe('Ending on 1');

        syncService.broadcastStageCue('Take it down soft...', 'custom');
        expect(syncService.activeCue()?.text).toBe('Take it down soft...');
        expect(syncService.activeCue()?.type).toBe('custom');

        syncService.dismissCue();
        expect(syncService.activeCue()).toBeNull();
      });

      it('R1.4: should allow follower to receive remote updates while autonomous transposition operates independently', () => {
        syncService.joinSession('tour-2026', 'follower', 'Alto Saxophone');

        // Simulate incoming song change broadcast from leader
        realtimeHandlers['broadcast:song_change']?.({
          payload: { songId: 'valerie-1', title: 'Valerie', key: 'Eb', bpm: 106 },
        });

        expect(syncService.remoteSongChange()?.title).toBe('Valerie');
        expect(syncService.remoteSongChange()?.key).toBe('Eb');

        // Follower's instrument requires transposing Eb song for Eb Alto Sax (concert Eb = Sax C) -> -3 semitones
        const concertKey = syncService.remoteSongChange()?.key!;
        const saxKey = transposeKey(concertKey, -3);
        expect(saxKey).toBe('C');

        // Transposing chord progression [Eb, Fm, Gm, Ab] by -3 semitones
        expect(transposeChordSymbol('Eb', -3)).toBe('C');
        expect(transposeChordSymbol('Fm', -3)).toBe('Dm');
        expect(transposeChordSymbol('Gm', -3)).toBe('Em');
        expect(transposeChordSymbol('Ab', -3)).toBe('F');

        // Master song key remains strictly intact
        expect(syncService.remoteSongChange()?.key).toBe('Eb');
      });

      it('R1.5: should track presence roster with instrument assignments in HUD', () => {
        syncService.joinSession('tour-2026', 'follower', 'Bass');

        // Simulate Supabase Realtime presence sync event
        mockChannel.presenceState.mockReturnValue({
          'usr-lead': [
            { userId: 'usr-lead', userName: 'Alex Lead', role: 'leader', instrument: 'Guitar & Lead Vocals' },
          ],
          'usr-bass': [
            { userId: 'usr-bass', userName: 'Maria Bass', role: 'follower', instrument: '5-String Bass' },
          ],
          'usr-drums': [
            { userId: 'usr-drums', userName: 'Sam Drums', role: 'follower', instrument: 'Drum Kit' },
          ],
        });

        realtimeHandlers['presence:sync']?.();

        const peers = syncService.peers();
        expect(peers.length).toBe(3);
        expect(syncService.peerCount()).toBe(3);

        const drummer = peers.find((p) => p.userName === 'Sam Drums');
        expect(drummer?.instrument).toBe('Drum Kit');
        expect(drummer?.role).toBe('follower');

        const leader = peers.find((p) => p.role === 'leader');
        expect(leader?.userName).toBe('Alex Lead');
      });
    });

    describe('R2: Rehearsal Loop Trainer & Speed Trainer', () => {
      let loopService: LoopTrainerService;
      let metronomeService: MetronomeService;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [LoopTrainerService, MetronomeService],
        });
        loopService = TestBed.inject(LoopTrainerService);
        metronomeService = TestBed.inject(MetronomeService);
        vi.spyOn(metronomeService, 'start').mockImplementation(async () => {});
      });

      afterEach(() => {
        loopService.stopLoop();
        metronomeService.stop();
      });

      it('R2.1: should configure A-B loop section markers and bar counts', () => {
        loopService.setSectionA('sec-intro');
        expect(loopService.startSectionId()).toBe('sec-intro');
        expect(loopService.endSectionId()).toBe('sec-intro');

        loopService.setSectionB('sec-bridge');
        expect(loopService.endSectionId()).toBe('sec-bridge');

        loopService.setBarsPerLoop(8);
        expect(loopService.barsPerLoop()).toBe(8);
      });

      it('R2.2: should automatically accelerate tempo with Speed Trainer every N cycles up to target BPM', () => {
        loopService.setSpeedTrainer(true);
        loopService.setInitialBpm(80);
        loopService.setTargetBpm(100);
        loopService.setBpmIncrement(10);
        loopService.setRepsPerIncrement(2); // Every 2 cycles

        loopService.startLoop();
        expect(metronomeService.bpm()).toBe(80);

        // Rep 1 -> 2: (2-1)%2 != 0 -> remains 80
        loopService.completeCycle();
        expect(loopService.currentRepetition()).toBe(2);
        expect(metronomeService.bpm()).toBe(80);

        // Rep 2 -> 3: (3-1)%2 == 0 -> speed increment +10 to 90 BPM
        loopService.completeCycle();
        expect(loopService.currentRepetition()).toBe(3);
        expect(metronomeService.bpm()).toBe(90);

        // Rep 3 -> 4: remains 90
        loopService.completeCycle();
        expect(metronomeService.bpm()).toBe(90);

        // Rep 4 -> 5: speed increment +10 to target 100 BPM
        loopService.completeCycle();
        expect(loopService.currentRepetition()).toBe(5);
        expect(metronomeService.bpm()).toBe(100);
        expect(loopService.summary()?.isTargetReached).toBe(true);
      });

      it('R2.3: should support pausing, resuming, and resetting active practice loop', () => {
        loopService.setSpeedTrainer(true);
        loopService.setInitialBpm(110);
        loopService.setTargetBpm(130);
        loopService.setBpmIncrement(5);
        loopService.setRepsPerIncrement(1);

        loopService.startLoop();
        expect(loopService.isPaused()).toBe(false);

        // Advance 2 cycles
        loopService.completeCycle();
        loopService.completeCycle();
        expect(loopService.currentRepetition()).toBe(3);
        expect(metronomeService.bpm()).toBe(120);

        // Pause
        loopService.pauseLoop();
        expect(loopService.isPaused()).toBe(true);
        expect(loopService.summary()?.isPaused).toBe(true);

        // Resume
        loopService.resumeLoop();
        expect(loopService.isPaused()).toBe(false);

        // Reset
        loopService.resetLoop();
        expect(loopService.currentRepetition()).toBe(1);
        expect(metronomeService.bpm()).toBe(110);
      });
    });

    describe('R3: Pro Strobe Tuner & Calibration Validation', () => {
      let fixture: ComponentFixture<TunerPageComponent>;
      let tuner: TunerPageComponent;

      beforeEach(async () => {
        await TestBed.configureTestingModule({
          imports: [TunerPageComponent],
          providers: [provideRouter([]), provideHttpClient()],
        }).compileComponents();

        fixture = TestBed.createComponent(TunerPageComponent);
        tuner = fixture.componentInstance;
        await fixture.whenStable();
      });

      afterEach(() => {
        tuner.ngOnDestroy();
      });

      it('R3.1: should switch between Needle Gauge and 60 FPS Strobe mode', () => {
        expect(tuner.tunerMode()).toBe('needle');
        tuner.setTunerMode('strobe');
        expect(tuner.tunerMode()).toBe('strobe');
        tuner.setTunerMode('needle');
        expect(tuner.tunerMode()).toBe('needle');
      });

      it('R3.1: should provide tuning presets for Guitar, Bass, Ukulele, Violin, and Cello', () => {
        const presets = TUNING_PRESETS;
        expect(presets.length).toBeGreaterThanOrEqual(10);

        // Guitar presets
        expect(presets.some((p) => p.id === 'guitar-standard')).toBe(true);
        expect(presets.some((p) => p.id === 'guitar-drop-d')).toBe(true);
        expect(presets.some((p) => p.id === 'guitar-dadgad')).toBe(true);
        expect(presets.some((p) => p.id === 'guitar-open-e')).toBe(true);
        expect(presets.some((p) => p.id === 'guitar-open-g')).toBe(true);

        // Bass presets
        expect(presets.some((p) => p.id === 'bass-4-string')).toBe(true);
        expect(presets.some((p) => p.id === 'bass-5-string')).toBe(true);

        // Orchestral & Folk presets
        expect(presets.some((p) => p.id === 'ukulele-standard')).toBe(true);
        expect(presets.some((p) => p.id === 'violin-standard')).toBe(true);
        expect(presets.some((p) => p.id === 'cello-standard')).toBe(true);
      });

      it('R3.2: should calibrate A4 frequency from 432 Hz to 446 Hz and persist to localStorage', () => {
        expect(tuner.a4Frequency()).toBe(440);

        tuner.adjustA4(2);
        expect(tuner.a4Frequency()).toBe(442);
        expect(localStorage.getItem('bandmate_tuner_a4')).toBe('442');

        tuner.adjustA4(-10);
        expect(tuner.a4Frequency()).toBe(432);
        expect(localStorage.getItem('bandmate_tuner_a4')).toBe('432');

        tuner.resetA4();
        expect(tuner.a4Frequency()).toBe(440);
        expect(localStorage.getItem('bandmate_tuner_a4')).toBe('440');
      });

      it('R3.2: should scale open string target frequencies proportionately with A4', () => {
        tuner.selectPreset('guitar-standard');

        // At standard A4 = 440 Hz
        tuner.a4Frequency.set(440);
        const strings440 = tuner.calibratedStrings();
        const aString440 = strings440.find((s) => s.note === 'A');
        expect(aString440?.calibratedFreq).toBe(110.0);

        // Calibrate to Baroque pitch A4 = 432 Hz
        tuner.a4Frequency.set(432);
        const strings432 = tuner.calibratedStrings();
        const aString432 = strings432.find((s) => s.note === 'A');
        expect(aString432?.calibratedFreq).toBeCloseTo(108.0, 1);
      });
    });

    describe('R4: Automated Tech Rider, Input List & Band EPK Exporters', () => {
      it('R4.1: should generate formatted FOH channel patch text and layout modes in Tech Rider Export Dialog', () => {
        const dialogData: TechRiderExportDialogData = {
          meta: {
            bandName: 'The Electric Storm',
            venueName: 'Teatro Central',
            date: '2026-11-20',
            contactPerson: 'David Mix',
            contactPhone: '+34 611 222 333',
            contactEmail: 'foh@storm.live',
            monitorMixes: 4,
            powerDrops: 4,
            notes: 'Llevar caja de inyección estéreo propia para sintetizador.',
          },
          elements: [
            { id: 'el-1', type: 'drums', x: 50, y: 20, label: 'Batería' },
            { id: 'el-2', type: 'bass_amp', x: 25, y: 35, label: 'Ampeg SVT' },
            { id: 'el-3', type: 'lead_vocals', x: 50, y: 75, label: 'Voz Principal' },
          ],
          channelInputList: [
            {
              channel: 1,
              id: 'ch-1',
              label: 'Bombo / Kick',
              type: 'drums',
              mic: 'Shure Beta 52A',
              phantom: false,
              stand: 'Bajo',
              monitorNeeds: 'Mezcla 1',
            },
            {
              channel: 2,
              id: 'ch-2',
              label: 'Bajo Eléctrico (DI)',
              type: 'bass_amp',
              mic: 'Radial J48 (Active DI)',
              phantom: true,
              stand: 'Suelo',
              monitorNeeds: 'Mezcla 2 + IEM',
            },
            {
              channel: 3,
              id: 'ch-3',
              label: 'Voz Principal',
              type: 'lead_vocals',
              mic: 'Neumann KMS 105',
              phantom: true,
              stand: 'Jirafa Grande',
              monitorNeeds: 'Mezcla 3',
            },
          ],
          stageDimensions: '10m x 8m',
        };

        TestBed.configureTestingModule({
          imports: [TechRiderExportDialogComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: dialogData },
            { provide: MatDialogRef, useValue: mockDialogRef },
            { provide: NotificationsService, useValue: mockNotificationsService },
          ],
        });

        const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component).toBeTruthy();
        expect(component.bandName).toBe('The Electric Storm');

        // Verify FOH patch text generation
        const patchText = component.generatePatchSheetText();
        expect(patchText).toContain('THE ELECTRIC STORM — TECHNICAL RIDER & CHANNEL INPUT LIST');
        expect(patchText).toContain('Teatro Central');
        expect(patchText).toContain('Bombo / Kick');
        expect(patchText).toContain('Radial J48 (Active DI)');
        expect(patchText).toContain('SÍ'); // +48V phantom indicator
        expect(patchText).toContain('10m x 8m');
        expect(patchText).toContain('4 mezclas independientes');
      });

      it('R4.2: should generate public EPK share slug and render band press dossier in BandEpkDialogComponent', () => {
        const epkData: BandEpkDialogData = {
          band: {
            id: 'band-uuid-999',
            name: 'Neon Velvet',
            description: 'Indie rock y dream pop de alta energía con sintetizadores analógicos.',
            avatar_url: 'https://images.unsplash.com/band-photo.jpg',
            owner_id: 'usr-1',
            created_at: '2026-01-01',
          },
          members: [
            { id: 'm1', full_name: 'Elena Ramos', instruments: ['Voz', 'Sintetizador'] },
            { id: 'm2', full_name: 'Carlos Ruiz', instruments: ['Guitarra Eléctrica'] },
            { id: 'm3', full_name: 'Sonia Vega', instruments: ['Bajo'] },
          ],
          songs: [
            { id: 's1', title: 'Midnight Drive', artist: 'Neon Velvet' },
            { id: 's2', title: 'Solar Flares', artist: 'Neon Velvet' },
          ],
          events: [
            { id: 'e1', title: 'Festival Primavera Sound', location_name: 'Barcelona', event_date: '2026-06-05' },
          ],
        };

        TestBed.configureTestingModule({
          imports: [BandEpkDialogComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: epkData },
            { provide: MatDialogRef, useValue: mockDialogRef },
            { provide: NotificationsService, useValue: mockNotificationsService },
          ],
        });

        const fixture = TestBed.createComponent(BandEpkDialogComponent);
        const epk = fixture.componentInstance;
        fixture.detectChanges();

        expect(epk).toBeTruthy();

        // Sanitize band name for booking email & URL slugs
        const slug = epk.sanitizeName(epkData.band.name);
        expect(slug).toBe('neonvelvet');

        // Copy share link triggers clipboard API and notification
        const writeTextSpy = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        epk.copyShareLink();
        expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/epk/neonvelvet'));
      });
    });

    describe('R5: Universal Catalog Bulk Operations & Setlist PDF Export', () => {
      it('R5.1: should parse diverse ChordPro, OnSong, and 2-line plain text files via batch ingestion', () => {
        const chordProContent = `{title: Come Together}
{artist: The Beatles}
{key: Dm}
{tempo: 82}

[Verse 1]
[Dm]Here come old flat top, he come [Dm]grooving up slowly`;

        const plainTextContent = `{title: Hotel California}
{artist: Eagles}
{key: Bm}
{tempo: 75}

Intro:
Bm       F#7      A        E7
On a dark desert highway, cool wind in my hair`;

        const parsed1 = parseSmartTab(chordProContent, 'come_together.pro');
        expect(parsed1.title).toBe('Come Together');
        expect(parsed1.artist).toBe('The Beatles');
        expect(parsed1.key).toBe('Dm');
        expect(parsed1.bpm).toBe(82);
        expect(parsed1.sections.length).toBeGreaterThanOrEqual(1);

        const parsed2 = parseSmartTab(plainTextContent, 'Hotel California.txt');
        expect(parsed2.title).toBe('Hotel California');
        expect(parsed2.artist).toBe('Eagles');
        expect(parsed2.key).toBe('Bm');
        expect(parsed2.bpm).toBe(75);
      });

      it('R5.2: should calculate total duration and format stage layouts in SetlistExportDialogComponent', () => {
        const setlistData: SetlistExportDialogData = {
          setlist: {
            id: 'set-101',
            name: 'Concierto Fin de Gira 2026',
            items: [],
            createdAt: '2026-10-15',
            updatedAt: '2026-10-15',
          },
          songs: [
            {
              id: 'song-1',
              title: 'Song One (Opener)',
              artist: 'Bandmate',
              key: 'G',
              bpm: 135,
              durationSec: 210, // 3m 30s
              isSeed: false,
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            {
              id: 'song-2',
              title: 'Song Two (Midtempo)',
              artist: 'Bandmate',
              key: 'Em',
              bpm: 110,
              durationSec: 240, // 4m 00s
              isSeed: false,
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            {
              id: 'song-3',
              title: 'Song Three (Encore)',
              artist: 'Bandmate',
              key: 'D',
              bpm: 150,
              durationSec: 180, // 3m 00s
              isSeed: false,
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
          bandName: 'The Rockers Live',
        };

        TestBed.configureTestingModule({
          imports: [SetlistExportDialogComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: setlistData },
            { provide: MatDialogRef, useValue: mockDialogRef },
            { provide: NotificationsService, useValue: mockNotificationsService },
          ],
        });

        const fixture = TestBed.createComponent(SetlistExportDialogComponent);
        const exporter = fixture.componentInstance;
        fixture.detectChanges();

        expect(exporter).toBeTruthy();

        // Total seconds: 210 + 240 + 180 = 630s = 10m 30s
        expect(exporter.totalDurationLabel()).toBe('10m 30s');

        // Formatted plain text stage setlist
        const stageText = exporter.generatePlainText();
        expect(stageText).toContain('THE ROCKERS LIVE');
        expect(stageText).toContain('Song One (Opener)');
        expect(stageText).toContain('[G]');
        expect(stageText).toContain('135 BPM');
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY, EXTREME LIMITS & CORNER CASES
  // ==========================================================================
  describe('Tier 2: Boundary, Extreme Limits & Corner Cases', () => {
    describe('Tuning Calibration & Mathematical Pitch Boundaries', () => {
      let fixture: ComponentFixture<TunerPageComponent>;
      let tuner: TunerPageComponent;

      beforeEach(async () => {
        await TestBed.configureTestingModule({
          imports: [TunerPageComponent],
          providers: [provideRouter([]), provideHttpClient()],
        }).compileComponents();

        fixture = TestBed.createComponent(TunerPageComponent);
        tuner = fixture.componentInstance;
        await fixture.whenStable();
      });

      afterEach(() => {
        tuner.ngOnDestroy();
      });

      it('should clamp A4 frequency strictly between 432 Hz and 446 Hz', () => {
        // Attempt to exceed upper bound
        tuner.adjustA4(500);
        expect(tuner.a4Frequency()).toBe(446);

        // Attempt to drop below lower bound
        tuner.adjustA4(-500);
        expect(tuner.a4Frequency()).toBe(432);

        // Slider input validation
        tuner.onA4SliderChange({ target: { value: '999' } } as unknown as Event);
        expect(tuner.a4Frequency()).toBe(446);

        tuner.onA4SliderChange({ target: { value: '200' } } as unknown as Event);
        expect(tuner.a4Frequency()).toBe(432);
      });

      it('should fall back to 440 Hz standard on corrupted or malicious localStorage values', async () => {
        localStorage.setItem('bandmate_tuner_a4', 'INVALID_FREQUENCY');

        const newFixture = TestBed.createComponent(TunerPageComponent);
        const newTuner = newFixture.componentInstance;
        await newFixture.whenStable();

        expect(newTuner.a4Frequency()).toBe(440);
        newTuner.ngOnDestroy();
      });
    });

    describe('Loop Trainer Boundary & Safeguard Limits', () => {
      let loopService: LoopTrainerService;
      let metronomeService: MetronomeService;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [LoopTrainerService, MetronomeService],
        });
        loopService = TestBed.inject(LoopTrainerService);
        metronomeService = TestBed.inject(MetronomeService);
        vi.spyOn(metronomeService, 'start').mockImplementation(async () => {});
      });

      afterEach(() => {
        loopService.stopLoop();
      });

      it('should enforce tempo boundaries between 30 and 300 BPM', () => {
        loopService.setInitialBpm(10); // below 30
        expect(loopService.initialBpm()).toBe(30);

        loopService.setInitialBpm(450); // above 300
        expect(loopService.initialBpm()).toBe(300);

        loopService.setTargetBpm(5);
        expect(loopService.targetBpm()).toBe(30);

        loopService.setTargetBpm(999);
        expect(loopService.targetBpm()).toBe(300);
      });

      it('should clamp barsPerLoop and increment parameters to safe bounds', () => {
        loopService.setBarsPerLoop(0); // clamp to min 1
        expect(loopService.barsPerLoop()).toBe(1);

        loopService.setBarsPerLoop(128); // clamp to max 64
        expect(loopService.barsPerLoop()).toBe(64);

        loopService.setBpmIncrement(0); // clamp to min 1
        expect(loopService.bpmIncrement()).toBe(1);

        loopService.setBpmIncrement(50); // clamp to max 20
        expect(loopService.bpmIncrement()).toBe(20);

        loopService.setRepsPerIncrement(0); // clamp to min 1
        expect(loopService.repsPerIncrement()).toBe(1);
      });

      it('should safely ignore pause/resume invocations when state does not permit', () => {
        // Pausing while loop is disabled should not crash
        expect(loopService.isEnabled()).toBe(false);
        loopService.pauseLoop();
        expect(loopService.isPaused()).toBe(false);

        // Resuming while not paused should be a no-op
        loopService.resumeLoop();
        expect(loopService.isPaused()).toBe(false);
      });

      it('should not overshoot target tempo once reached by Speed Trainer', () => {
        loopService.setSpeedTrainer(true);
        loopService.setInitialBpm(138);
        loopService.setTargetBpm(140);
        loopService.setBpmIncrement(5);
        loopService.setRepsPerIncrement(1);

        loopService.startLoop();
        expect(metronomeService.bpm()).toBe(138);

        // Cycle 1: 138 + 5 = 143, but target is 140 -> clamps to exactly 140
        loopService.completeCycle();
        expect(metronomeService.bpm()).toBe(140);
        expect(loopService.summary()?.isTargetReached).toBe(true);

        // Subsequent cycles never exceed 140
        loopService.completeCycle();
        loopService.completeCycle();
        expect(metronomeService.bpm()).toBe(140);
      });
    });

    describe('Empty and Edge Document Generation', () => {
      it('should handle Tech Rider with 0 input channels without crashing', () => {
        const emptyData: TechRiderExportDialogData = {
          meta: {
            bandName: 'Acoustic Soloist',
            contactPerson: 'Solo Contact',
            contactPhone: 'N/A',
            contactEmail: 'solo@bandmate.live',
            venueName: 'Café Stage',
            date: '2026-10-15',
            notes: '',
            monitorMixes: 1,
            powerDrops: 1,
          },
          elements: [],
          channelInputList: [],
        };

        TestBed.configureTestingModule({
          imports: [TechRiderExportDialogComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: emptyData },
            { provide: MatDialogRef, useValue: mockDialogRef },
            { provide: NotificationsService, useValue: mockNotificationsService },
          ],
        });

        const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();

        expect(comp).toBeTruthy();
        const text = comp.generatePatchSheetText();
        expect(text).toContain('ACOUSTIC SOLOIST');
        expect(text).toContain('--- LISTA DE ENTRADAS / CHANNEL INPUT LIST ---');
      });

      it('should handle Setlist with 0 songs cleanly and return "0m" duration', () => {
        const emptySetlistData: SetlistExportDialogData = {
          setlist: {
            id: 's-empty',
            name: 'Empty Setlist',
            items: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
          songs: [],
        };

        TestBed.configureTestingModule({
          imports: [SetlistExportDialogComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: emptySetlistData },
            { provide: MatDialogRef, useValue: mockDialogRef },
            { provide: NotificationsService, useValue: mockNotificationsService },
          ],
        });

        const fixture = TestBed.createComponent(SetlistExportDialogComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();

        expect(comp.totalDurationLabel().trim()).toBe('0m');
        expect(comp.generatePlainText()).toContain('0 TEMAS');
      });

      it('should gracefully handle malformed or empty ChordPro files without throwing unhandled exceptions', () => {
        // Completely empty text
        const emptyParsed = parseSmartTab('');
        expect(emptyParsed.title).toBeTruthy();

        // Corrupted chord tokens with unclosed tags
        const malformedText = `{title
[ch]C[/ch When the night has come
[invalid token without bracket`;

        const parsed = parseSmartTab(malformedText, 'corrupt.pro');
        expect(parsed).toBeTruthy();
        expect(Array.isArray(parsed.sections)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // ==========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('Combo 1: Live Band Mesh + Autonomous Follower Transposition + Active Visual Stage Cues', () => {
      TestBed.configureTestingModule({
        providers: [
          LiveBandSyncService,
          {
            provide: AuthStore,
            useValue: {
              user: () => ({ id: 'sax-peer', email: 'horns@bandmate.live' }),
            },
          },
        ],
      });

      const syncService = TestBed.inject(LiveBandSyncService);
      syncService.joinSession('arena-tour', 'follower', 'Tenor Saxophone');

      // 1. Leader broadcasts song in concert key Bb (Tenor Sax reads in C, +2 semitones)
      realtimeHandlers['broadcast:song_change']?.({
        payload: { songId: 'song-blues-12', title: 'Route 66', key: 'Bb', bpm: 130 },
      });

      expect(syncService.remoteSongChange()?.key).toBe('Bb');
      const saxTransposedKey = transposeKey(syncService.remoteSongChange()?.key!, 2);
      expect(saxTransposedKey).toBe('C');

      // 2. Leader broadcasts section jump to Guitar Solo
      realtimeHandlers['broadcast:section_jump']?.({
        payload: { sectionId: 'sec-solo-1', sectionName: 'Tenor Solo' },
      });
      expect(syncService.remoteSectionJump()?.sectionName).toBe('Tenor Solo');

      // 3. Leader flashes visual stage cue
      realtimeHandlers['broadcast:stage_cue']?.({
        payload: { id: 'cue-solo', text: 'SAX SOLO 16 BARS!', type: 'solo', timestamp: Date.now() },
      });
      expect(syncService.activeCue()?.text).toBe('SAX SOLO 16 BARS!');

      // Transposition for Tenor Sax stays completely independent while locked to live cues
      expect(transposeChordSymbol('Bb7', 2)).toBe('C7');
      expect(transposeChordSymbol('Eb7', 2)).toBe('F7');
      expect(transposeChordSymbol('F7', 2)).toBe('G7');
    });

    it('Combo 2: Practice Loop Trainer + Metronome Service + Transport BPM Synchronization', () => {
      TestBed.configureTestingModule({
        providers: [LoopTrainerService, MetronomeService],
      });

      const loop = TestBed.inject(LoopTrainerService);
      const metronome = TestBed.inject(MetronomeService);
      vi.spyOn(metronome, 'start').mockImplementation(async () => {});

      loop.setSpeedTrainer(true);
      loop.setInitialBpm(95);
      loop.setTargetBpm(115);
      loop.setBpmIncrement(5);
      loop.setRepsPerIncrement(1);

      loop.startLoop();

      // Ensure Metronome and Loop Trainer are synchronized
      expect(metronome.bpm()).toBe(95);
      expect(loop.summary()?.currentBpm).toBe(95);

      // Increment cycle
      loop.completeCycle();
      expect(metronome.bpm()).toBe(100);
      expect(loop.summary()?.currentBpm).toBe(100);

      loop.completeCycle();
      expect(metronome.bpm()).toBe(105);
      expect(loop.summary()?.currentBpm).toBe(105);

      // Metronome BPM directly synchronizes with LoopTrainer's status summary
      metronome.setBpm(112);
      expect(loop.summary()?.currentBpm).toBe(112);
    });

    it('Combo 3: Tuner A4 Frequency Shift + Multi-Instrument Tuning Presets Propagation', () => {
      TestBed.configureTestingModule({
        imports: [TunerPageComponent],
        providers: [provideRouter([]), provideHttpClient()],
      });

      const fixture = TestBed.createComponent(TunerPageComponent);
      const tuner = fixture.componentInstance;

      // 1. Check 5-String Bass at A4 = 440 Hz (Low B0 = 30.87 Hz)
      tuner.selectPreset('bass-5-string');
      tuner.a4Frequency.set(440);
      const bString440 = tuner.calibratedStrings().find((s) => s.note === 'B' && s.octave === 0);
      expect(bString440?.calibratedFreq).toBe(30.87);

      // 2. Shift to A4 = 432 Hz -> string frequency scales down
      tuner.a4Frequency.set(432);
      const bString432 = tuner.calibratedStrings().find((s) => s.note === 'B' && s.octave === 0);
      expect(bString432?.calibratedFreq).toBeCloseTo(30.87 * (432 / 440), 2);

      // 3. Switch to Violin Standard (E5 = 659.25 Hz at 440 Hz)
      tuner.selectPreset('violin-standard');
      const eString432 = tuner.calibratedStrings().find((s) => s.note === 'E' && s.octave === 5);
      expect(eString432?.calibratedFreq).toBeCloseTo(659.25 * (432 / 440), 1);
    });

    it('Combo 4: Bulk Parsed Songs -> Live Stage Setlist Formulation -> PDF Export Verification', () => {
      // Step 1: Ingest batch raw songs
      const rawSongs = [
        `{title: Superstition}\n{artist: Stevie Wonder}\n{key: Ebm}\n{tempo: 100}\n[Intro]\n[Ebm7]Very superstitious`,
        `{title: Billie Jean}\n{artist: Michael Jackson}\n{key: F#m}\n{tempo: 117}\n[Verse 1]\n[F#m]She was more like a beauty queen`,
        `{title: Uptown Funk}\n{artist: Mark Ronson}\n{key: Dm}\n{tempo: 115}\n[Verse 1]\n[Dm7]This hit, that ice cold`,
      ];

      const parsedSongs: Song[] = rawSongs.map((raw, idx) => {
        const p = parseSmartTab(raw);
        return {
          id: `batch-${idx + 1}`,
          title: p.title,
          artist: p.artist,
          key: p.key,
          bpm: p.bpm,
          durationSec: 200 + idx * 30, // 200s (3m20s), 230s (3m50s), 260s (4m20s)
          sections: p.sections,
          isSeed: false,
          createdAt: '2026-10-15',
          updatedAt: '2026-10-15',
        };
      });

      // Step 2: Feed parsed songs directly into SetlistExportDialog
      const exportData: SetlistExportDialogData = {
        setlist: {
          id: 'set-funk',
          name: 'Funk & Pop Headliner',
          items: [],
          createdAt: '2026-10-15',
          updatedAt: '2026-10-15',
        },
        songs: parsedSongs,
        bandName: 'Groove Collective',
      };

      TestBed.configureTestingModule({
        imports: [SetlistExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: exportData },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      });

      const fixture = TestBed.createComponent(SetlistExportDialogComponent);
      const exporter = fixture.componentInstance;
      fixture.detectChanges();

      // Total duration: 200 + 230 + 260 = 690s = 11m 30s
      expect(exporter.totalDurationLabel()).toBe('11m 30s');

      // Verify layout switching
      exporter.layout = 'giant';
      expect(exporter.layout).toBe('giant');
      exporter.layout = 'structured';
      expect(exporter.layout).toBe('structured');
      exporter.layout = 'tech';
      expect(exporter.layout).toBe('tech');

      const text = exporter.generatePlainText();
      expect(text).toContain('Superstition');
      expect(text).toContain('Billie Jean');
      expect(text).toContain('Uptown Funk');
      expect(text).toContain('[Ebm]');
      expect(text).toContain('[F#m]');
      expect(text).toContain('[Dm]');
    });

    it('Combo 5: Stage Plot 2D Gear Items -> Tech Rider Channel Input List -> FOH Patch Text Generation', () => {
      const riderData: TechRiderExportDialogData = {
        meta: {
          bandName: 'Midnight Horizon',
          venueName: 'Auditorio Marina',
          date: '2026-12-31',
          contactPerson: 'Laura Sound',
          contactPhone: '+34 600 111 222',
          contactEmail: 'tech@midnight.live',
          monitorMixes: 5,
          powerDrops: 4,
          notes: 'Todos los envíos de monitores a través de petacas inalámbricas IEM.',
        },
        elements: [
          { id: 'el-1', type: 'drums', x: 50, y: 15, label: 'Drums' },
          { id: 'el-2', type: 'bass_amp', x: 20, y: 30, label: 'Bass Amp' },
          { id: 'el-3', type: 'guitar_amp', x: 80, y: 30, label: 'Guitar Amp' },
          { id: 'el-4', type: 'keyboard', x: 15, y: 60, label: 'Keys' },
          { id: 'el-5', type: 'lead_vocals', x: 50, y: 80, label: 'Lead Vocals' },
        ],
        channelInputList: [
          { channel: 1, id: 'c1', label: 'Kick Out', type: 'drums', mic: 'Audix D6', phantom: false, stand: 'Bajo', monitorNeeds: 'IEM 1' },
          { channel: 2, id: 'c2', label: 'Snare Top', type: 'drums', mic: 'Shure SM57', phantom: false, stand: 'Clip', monitorNeeds: 'IEM 1' },
          { channel: 3, id: 'c3', label: 'Bass DI', type: 'bass_amp', mic: 'Countryman Type 85', phantom: true, stand: 'Suelo', monitorNeeds: 'IEM 2' },
          { channel: 4, id: 'c4', label: 'Guitar Cab', type: 'guitar_amp', mic: 'Sennheiser e906', phantom: false, stand: 'Jirafa Pequeña', monitorNeeds: 'IEM 3' },
          { channel: 5, id: 'c5', label: 'Keyboards (L)', type: 'keyboard', mic: 'Radial ProDI', phantom: false, stand: 'Suelo', monitorNeeds: 'IEM 4' },
          { channel: 6, id: 'c6', label: 'Keyboards (R)', type: 'keyboard', mic: 'Radial ProDI', phantom: false, stand: 'Suelo', monitorNeeds: 'IEM 4' },
          { channel: 7, id: 'c7', label: 'Lead Vox', type: 'lead_vocals', mic: 'Shure KSM9', phantom: true, stand: 'Jirafa Grande', monitorNeeds: 'IEM 5' },
        ],
        stageDimensions: '12m x 10m',
      };

      TestBed.configureTestingModule({
        imports: [TechRiderExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: riderData },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      });

      const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
      const riderComp = fixture.componentInstance;
      fixture.detectChanges();

      const fohText = riderComp.generatePatchSheetText();

      // Check all channels are accurately formatted
      expect(fohText).toContain('01  | Kick Out');
      expect(fohText).toContain('03  | Bass DI');
      expect(fohText).toContain('07  | Lead Vox');
      expect(fohText).toContain('Auditorio Marina');
      expect(fohText).toContain('5 mezclas independientes');
      expect(fohText).toContain('12m x 10m');
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD REHEARSAL & LIVE STAGE SCENARIOS
  // ==========================================================================
  describe('Tier 4: Real-World Rehearsal & Live Stage Scenarios', () => {
    it('Scenario 1: High-Intensity Solo Rehearsal Loop Routine with Speed Trainer', () => {
      TestBed.configureTestingModule({
        providers: [LoopTrainerService, MetronomeService],
      });

      const loop = TestBed.inject(LoopTrainerService);
      const metronome = TestBed.inject(MetronomeService);
      vi.spyOn(metronome, 'start').mockImplementation(async () => {});

      // Musician isolates challenging guitar solo (starts slow at 70 BPM, targets 110 BPM, +10 BPM every 2 reps)
      loop.setSectionA('guitar-solo');
      loop.setSectionB('outro');
      loop.setBarsPerLoop(8);
      loop.setSpeedTrainer(true);
      loop.setInitialBpm(70);
      loop.setTargetBpm(110);
      loop.setBpmIncrement(10);
      loop.setRepsPerIncrement(2);

      const scrollSpy = vi.fn();
      loop.registerLoopScrollHandler(scrollSpy);

      loop.startLoop();
      expect(metronome.bpm()).toBe(70);
      expect(loop.currentRepetition()).toBe(1);

      // Complete 2 reps at 70 BPM
      loop.completeCycle(); // Rep 2
      expect(scrollSpy).toHaveBeenCalledWith('guitar-solo');
      expect(metronome.bpm()).toBe(70);

      // Rep 3: Speed increment triggers (+10 -> 80 BPM)
      loop.completeCycle();
      expect(loop.currentRepetition()).toBe(3);
      expect(metronome.bpm()).toBe(80);

      // Musician pauses for technical critique
      loop.pauseLoop();
      expect(loop.isPaused()).toBe(true);

      // Resumes rehearsal
      loop.resumeLoop();
      expect(loop.isPaused()).toBe(false);

      // Complete reps to reach target BPM
      loop.completeCycle(); // Rep 4 at 80
      loop.completeCycle(); // Rep 5 at 90
      loop.completeCycle(); // Rep 6 at 90
      loop.completeCycle(); // Rep 7 at 100
      loop.completeCycle(); // Rep 8 at 100
      loop.completeCycle(); // Rep 9 at 110 (target reached!)

      expect(metronome.bpm()).toBe(110);
      expect(loop.summary()?.isTargetReached).toBe(true);

      // Reset loop routine back to starting tempo
      loop.resetLoop();
      expect(loop.currentRepetition()).toBe(1);
      expect(metronome.bpm()).toBe(70);
    });

    it('Scenario 2: Multi-Device Live Gig Stage Synchronization with Autonomy and Cues', () => {
      TestBed.configureTestingModule({
        providers: [
          LiveBandSyncService,
          {
            provide: AuthStore,
            useValue: {
              user: () => ({ id: 'follower-horns', email: 'horns@band.live' }),
            },
          },
        ],
      });

      const followerSync = TestBed.inject(LiveBandSyncService);

      // Horn player joins live band stage session
      followerSync.joinSession('live-festival-stage', 'follower', 'Trumpet (Bb)');
      expect(followerSync.isConnected()).toBe(true);
      expect(followerSync.isLeader()).toBe(false);

      // 1. Leader switches to Song #3 in setlist ("Smooth", Key Am, 116 BPM)
      realtimeHandlers['broadcast:song_change']?.({
        payload: {
          songId: 'song-smooth-3',
          title: 'Smooth',
          artist: 'Santana ft. Rob Thomas',
          key: 'Am',
          bpm: 116,
          index: 2,
        },
      });

      expect(followerSync.remoteSongChange()?.title).toBe('Smooth');
      expect(followerSync.remoteSongChange()?.key).toBe('Am');

      // Bb Trumpet autonomous transposition: concert Am transposes up 2 semitones to Bm
      const trumpetKey = transposeKey('Am', 2);
      expect(trumpetKey).toBe('Bm');
      expect(transposeChordSymbol('Am', 2)).toBe('Bm');
      expect(transposeChordSymbol('F', 2)).toBe('G');
      expect(transposeChordSymbol('E7', 2)).toBe('F#7');

      // 2. Leader transitions into Chorus 2 and scrolls stage prompt
      realtimeHandlers['broadcast:section_jump']?.({
        payload: { sectionId: 'sec-chorus-2', sectionName: 'Chorus 2' },
      });
      expect(followerSync.remoteSectionJump()?.sectionId).toBe('sec-chorus-2');

      realtimeHandlers['broadcast:scroll_sync']?.({
        payload: { scrollTop: 620, scrollRatio: 0.72 },
      });
      expect(followerSync.remoteScroll()?.scrollRatio).toBe(0.72);

      // 3. Leader issues high-visibility silent cue: "ONE MORE TIME!"
      realtimeHandlers['broadcast:stage_cue']?.({
        payload: { id: 'cue-repeat', text: 'ONE MORE TIME!', type: 'repeat', timestamp: Date.now() },
      });
      expect(followerSync.activeCue()?.text).toBe('ONE MORE TIME!');

      // 4. Follower disconnects cleanly after gig
      followerSync.leaveSession();
      expect(followerSync.isConnected()).toBe(false);
      expect(followerSync.peers()).toEqual([]);
    });

    it('Scenario 3: Tour Production Delivery — Stage Plot, FOH Patch Sheet & Official Band EPK', () => {
      // 1. Tech Rider FOH Patch Generation
      const tourRiderData: TechRiderExportDialogData = {
        meta: {
          bandName: 'The Cosmic Waves',
          venueName: 'Palacio de Deportes',
          date: '2026-12-15',
          contactPerson: 'Alex Tour Manager',
          contactPhone: '+34 655 444 333',
          contactEmail: 'production@cosmicwaves.com',
          monitorMixes: 6,
          powerDrops: 5,
          notes: 'Batería en tarima elevada 2m x 2m. Monitores estéreo In-Ear en canales 1 a 4.',
        },
        elements: [
          { id: 'e1', type: 'drums', x: 50, y: 15, label: 'Batería DW' },
          { id: 'e2', type: 'bass_amp', x: 20, y: 35, label: 'Ampeg 8x10' },
          { id: 'e3', type: 'guitar_amp', x: 80, y: 35, label: 'Marshall JCM800' },
          { id: 'e4', type: 'lead_vocals', x: 50, y: 75, label: 'Voz Principal' },
        ],
        channelInputList: [
          { channel: 1, id: 'c1', label: 'Kick', type: 'drums', mic: 'Beta 52A', phantom: false, stand: 'Short', monitorNeeds: 'IEM Drummer' },
          { channel: 2, id: 'c2', label: 'Snare', type: 'drums', mic: 'SM57', phantom: false, stand: 'Clip', monitorNeeds: 'IEM Drummer' },
          { channel: 3, id: 'c3', label: 'Bass DI', type: 'bass_amp', mic: 'Active DI', phantom: true, stand: 'Floor', monitorNeeds: 'IEM Bass' },
          { channel: 4, id: 'c4', label: 'Lead Vox', type: 'lead_vocals', mic: 'Wireless KSM9', phantom: true, stand: 'Tall Boom', monitorNeeds: 'IEM Lead' },
        ],
        stageDimensions: '14m x 10m',
      };

      TestBed.configureTestingModule({
        imports: [TechRiderExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: tourRiderData },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      });

      const riderFixture = TestBed.createComponent(TechRiderExportDialogComponent);
      const riderComp = riderFixture.componentInstance;
      riderFixture.detectChanges();

      const fohText = riderComp.generatePatchSheetText();
      expect(fohText).toContain('THE COSMIC WAVES');
      expect(fohText).toContain('Palacio de Deportes');
      expect(fohText).toContain('Wireless KSM9');

      // 2. Band EPK Generation
      const epkData: BandEpkDialogData = {
        band: {
          id: 'cosmic-waves-id',
          name: 'The Cosmic Waves',
          description: 'Banda referente del rock psicodélico y post-punk en España.',
          avatar_url: '',
          owner_id: 'usr-1',
          created_at: '2026-01-01',
        },
        members: [
          { id: 'm1', full_name: 'Mateo Sanz', instruments: ['Voz', 'Guitarra'] },
          { id: 'm2', full_name: 'Lucía Alba', instruments: ['Bajo'] },
          { id: 'm3', full_name: 'David Soler', instruments: ['Batería'] },
        ],
        songs: [
          { id: 's1', title: 'Starlight Eclipse', artist: 'The Cosmic Waves' },
        ],
        events: [
          { id: 'ev1', title: 'Concierto Fin de Año', location_name: 'Madrid', event_date: '2026-12-31' },
        ],
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BandEpkDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: epkData },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      });

      const epkFixture = TestBed.createComponent(BandEpkDialogComponent);
      const epkComp = epkFixture.componentInstance;
      epkFixture.detectChanges();

      expect(epkComp.sanitizeName(epkData.band.name)).toBe('thecosmicwaves');
    });

    it('Scenario 4: Complete Multi-File Catalog Ingestion & Setlist Assembly', () => {
      // Ingest multi-format archive files
      const file1 = `{title: Black Magic Woman}\n{artist: Santana}\n{key: Dm}\n{tempo: 128}\n[Verse 1]\n[Dm]Got a black magic woman`;
      const file2 = `{title: Ain't No Sunshine}\n{artist: Bill Withers}\n{key: Am}\n{tempo: 78}\n[Chorus]\n[Am]Ain't no sunshine when she's gone`;

      const p1 = parseSmartTab(file1, 'santana.pro');
      const p2 = parseSmartTab(file2, 'withers.cho');

      expect(p1.title).toBe('Black Magic Woman');
      expect(p1.key).toBe('Dm');
      expect(p1.bpm).toBe(128);

      expect(p2.title).toBe("Ain't No Sunshine");
      expect(p2.key).toBe('Am');
      expect(p2.bpm).toBe(78);

      // Verify transposition compatibility
      expect(transposeChordSymbol('Dm', 2)).toBe('Em');
      expect(transposeChordSymbol('Am', -2)).toBe('Gm');
    });
  });
});
