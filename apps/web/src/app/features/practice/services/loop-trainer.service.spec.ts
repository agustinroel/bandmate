import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoopTrainerService } from './loop-trainer.service';
import { MetronomeService } from './metronome.service';

describe('LoopTrainerService (A-B Looper & Speed Trainer)', () => {
  let service: LoopTrainerService;
  let metronome: MetronomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoopTrainerService, MetronomeService],
    });
    service = TestBed.inject(LoopTrainerService);
    metronome = TestBed.inject(MetronomeService);
    vi.spyOn(metronome, 'start').mockImplementation(async () => {});
  });

  afterEach(() => {
    service.stopLoop();
    metronome.stop();
  });

  it('should initialize with default idle state', () => {
    expect(service.isEnabled()).toBe(false);
    expect(service.startSectionId()).toBeNull();
    expect(service.endSectionId()).toBeNull();
    expect(service.barsPerLoop()).toBe(4);
    expect(service.currentRepetition()).toBe(1);
    expect(service.isSpeedTrainer()).toBe(false);
  });

  it('should set Section A and Section B markers', () => {
    service.setSectionA('sec-intro');
    expect(service.startSectionId()).toBe('sec-intro');
    expect(service.endSectionId()).toBe('sec-intro'); // auto-fills end if null

    service.setSectionB('sec-chorus');
    expect(service.startSectionId()).toBe('sec-intro');
    expect(service.endSectionId()).toBe('sec-chorus');
  });

  it('should trigger callback and scroll to Section A when cycle completes', () => {
    const scrollSpy = vi.fn();
    service.registerLoopScrollHandler(scrollSpy);
    service.setSectionA('sec-chorus');

    service.completeCycle();

    expect(service.currentRepetition()).toBe(2);
    expect(scrollSpy).toHaveBeenCalledWith('sec-chorus');
  });

  it('should increment tempo with Speed Trainer every N repetitions up to target BPM', () => {
    service.setSpeedTrainer(true);
    service.setInitialBpm(100);
    service.setTargetBpm(110);
    service.setBpmIncrement(5);
    service.setRepsPerIncrement(2); // increments every 2 reps

    service.startLoop();
    expect(metronome.bpm()).toBe(100);

    // Rep 1 -> Rep 2: (2 - 1) % 2 !== 0 -> no increment yet
    service.completeCycle();
    expect(service.currentRepetition()).toBe(2);
    expect(metronome.bpm()).toBe(100);

    // Rep 2 -> Rep 3: (3 - 1) % 2 === 0 -> increment by +5 BPM
    service.completeCycle();
    expect(service.currentRepetition()).toBe(3);
    expect(metronome.bpm()).toBe(105);

    // Rep 3 -> Rep 4: (4 - 1) % 2 !== 0 -> no increment
    service.completeCycle();
    expect(service.currentRepetition()).toBe(4);
    expect(metronome.bpm()).toBe(105);

    // Rep 4 -> Rep 5: (5 - 1) % 2 === 0 -> increment by +5 BPM to reach target (110)
    service.completeCycle();
    expect(service.currentRepetition()).toBe(5);
    expect(metronome.bpm()).toBe(110);

    // Rep 5 -> Rep 6: already at target BPM (110), should clamp and not exceed target
    service.completeCycle();
    service.completeCycle();
    expect(metronome.bpm()).toBe(110);
  });

  it('should report correct status summary when active', () => {
    expect(service.statusSummary()).toBeNull();
    expect(service.summary()).toBeNull();

    service.setSpeedTrainer(true);
    service.setInitialBpm(120);
    service.setTargetBpm(130);
    service.startLoop();

    const summary = service.statusSummary();
    expect(summary).toBeTruthy();
    expect(summary?.rep).toBe(1);
    expect(summary?.currentBpm).toBe(120);
    expect(summary?.targetBpm).toBe(130);
    expect(summary?.speedActive).toBe(true);
    expect(summary?.isTargetReached).toBe(false);
    expect(summary?.isPaused).toBe(false);
    expect(service.summary()).toEqual(summary);

    service.stopLoop();
    expect(service.statusSummary()).toBeNull();
    expect(service.summary()).toBeNull();
  });

  it('should pause and resume loop correctly', () => {
    const metronomeStopSpy = vi.spyOn(metronome, 'stop');
    const metronomeStartSpy = vi.spyOn(metronome, 'start');

    service.startLoop();
    expect(service.isPaused()).toBe(false);

    // Pause loop
    service.pauseLoop();
    expect(service.isPaused()).toBe(true);
    expect(metronomeStopSpy).toHaveBeenCalled();
    expect(service.summary()?.isPaused).toBe(true);

    // Resume loop
    service.resumeLoop();
    expect(service.isPaused()).toBe(false);
    expect(metronomeStartSpy).toHaveBeenCalled();
    expect(service.summary()?.isPaused).toBe(false);

    // Stop resets isPaused
    service.pauseLoop();
    expect(service.isPaused()).toBe(true);
    service.stopLoop();
    expect(service.isPaused()).toBe(false);
  });

  it('should reset loop repetition count and restore initial BPM on resetLoop()', () => {
    service.setSpeedTrainer(true);
    service.setInitialBpm(100);
    service.setTargetBpm(130);
    service.setBpmIncrement(5);
    service.setRepsPerIncrement(2);

    service.startLoop();
    expect(service.currentRepetition()).toBe(1);
    expect(metronome.bpm()).toBe(100);

    // Advance 2 cycles -> rep 3, BPM 105
    service.completeCycle();
    service.completeCycle();
    expect(service.currentRepetition()).toBe(3);
    expect(metronome.bpm()).toBe(105);

    // Reset loop
    service.resetLoop();
    expect(service.currentRepetition()).toBe(1);
    expect(metronome.bpm()).toBe(100);
  });
});
