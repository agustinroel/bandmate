import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PracticePageComponent } from './practice-page';

describe('PracticePageComponent', () => {
  let component: PracticePageComponent;
  let fixture: ComponentFixture<PracticePageComponent>;

  const mockParamMap = convertToParamMap({ setlistId: 'setlist-test-1' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticePageComponent],
      providers: [
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(mockParamMap),
            snapshot: { paramMap: mockParamMap },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePageComponent);
    component = fixture.componentInstance;

    // Provide mock song and setlist so the active practice stage UI renders
    component.songs._songs.set([
      {
        id: 'song-test-1',
        title: 'Comfortably Numb',
        artist: 'Pink Floyd',
        bpm: 120,
        key: 'Bm',
        sections: [{ id: 'sec-intro', name: 'Intro', type: 'intro', order: 0, lines: [] }],
      } as any,
    ]);
    component.setlists._items.set([
      {
        id: 'setlist-test-1',
        title: 'Tour 2026',
        items: [{ songId: 'song-test-1', itemType: 'song' }],
      } as any,
    ]);
    component.setlists._state.set('ready');
    component.p.start('setlist-test-1');

    // Prevent real audio transport calls during specs
    vi.spyOn(component.metronome, 'start').mockImplementation(async () => {});
    vi.spyOn(component.metronome, 'stop').mockImplementation(() => {});

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    component.loopTrainer.stopLoop();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Loop Trainer Active Bar Controls', () => {
    it('should not display loop active bar when loop trainer is disabled', () => {
      component.loopTrainer.stopLoop();
      fixture.detectChanges();

      const activeBar = fixture.nativeElement.querySelector('.p-loop-active-bar');
      expect(activeBar).toBeNull();
    });

    it('should render active loop bar with Pausar, Reiniciar, and Detener buttons when enabled and running', () => {
      component.loopTrainer.isEnabled.set(true);
      component.loopTrainer.isPaused.set(false);
      fixture.detectChanges();

      const activeBar = fixture.nativeElement.querySelector('.p-loop-active-bar');
      expect(activeBar).toBeTruthy();

      const pauseBtn = fixture.nativeElement.querySelector('.p-loop-pause-btn');
      expect(pauseBtn).toBeTruthy();
      expect(pauseBtn.textContent).toContain('Pausar');

      const resumeBtn = fixture.nativeElement.querySelector('.p-loop-resume-btn');
      expect(resumeBtn).toBeNull();

      const resetBtn = fixture.nativeElement.querySelector('.p-loop-reset-btn');
      expect(resetBtn).toBeTruthy();
      expect(resetBtn.textContent).toContain('Reiniciar');

      const stopBtn = fixture.nativeElement.querySelector('.p-loop-stop-btn');
      expect(stopBtn).toBeTruthy();
      expect(stopBtn.textContent).toContain('Detener');
    });

    it('should pause active loop when clicking Pausar button and display Reanudar button with PAUSADO badge', () => {
      component.loopTrainer.isEnabled.set(true);
      component.loopTrainer.isPaused.set(false);
      fixture.detectChanges();

      const pauseBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.p-loop-pause-btn');
      expect(pauseBtn).toBeTruthy();
      pauseBtn.click();
      fixture.detectChanges();

      expect(component.loopTrainer.isPaused()).toBe(true);

      const resumeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.p-loop-resume-btn');
      expect(resumeBtn).toBeTruthy();
      expect(resumeBtn.textContent).toContain('Reanudar');

      const pausedBadge = fixture.nativeElement.querySelector('.badge-paused');
      expect(pausedBadge).toBeTruthy();
      expect(pausedBadge.textContent).toContain('PAUSADO');
    });

    it('should resume active loop when clicking Reanudar button', () => {
      component.loopTrainer.isEnabled.set(true);
      component.loopTrainer.isPaused.set(true);
      fixture.detectChanges();

      const resumeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.p-loop-resume-btn');
      expect(resumeBtn).toBeTruthy();
      resumeBtn.click();
      fixture.detectChanges();

      expect(component.loopTrainer.isPaused()).toBe(false);

      const pauseBtn = fixture.nativeElement.querySelector('.p-loop-pause-btn');
      expect(pauseBtn).toBeTruthy();
      expect(pauseBtn.textContent).toContain('Pausar');

      const pausedBadge = fixture.nativeElement.querySelector('.badge-paused');
      expect(pausedBadge).toBeNull();
    });

    it('should call resetLoop() when clicking Reiniciar button', () => {
      const resetSpy = vi.spyOn(component.loopTrainer, 'resetLoop');
      component.loopTrainer.isEnabled.set(true);
      component.loopTrainer.isPaused.set(false);
      fixture.detectChanges();

      const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.p-loop-reset-btn');
      expect(resetBtn).toBeTruthy();
      resetBtn.click();
      fixture.detectChanges();

      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it('should call stopLoop() and dismiss loop active bar when clicking Detener button', () => {
      const stopSpy = vi.spyOn(component.loopTrainer, 'stopLoop');
      component.loopTrainer.isEnabled.set(true);
      fixture.detectChanges();

      const stopBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.p-loop-stop-btn');
      expect(stopBtn).toBeTruthy();
      stopBtn.click();
      fixture.detectChanges();

      expect(stopSpy).toHaveBeenCalledTimes(1);
      expect(component.loopTrainer.isEnabled()).toBe(false);

      const activeBar = fixture.nativeElement.querySelector('.p-loop-active-bar');
      expect(activeBar).toBeNull();
    });
  });
});
