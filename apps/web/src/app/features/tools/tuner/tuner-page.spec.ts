import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TunerPageComponent, TUNING_PRESETS } from './tuner-page';

describe('TunerPageComponent', () => {
  let component: TunerPageComponent;
  let fixture: ComponentFixture<TunerPageComponent>;

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

  it('should create the tuner component', () => {
    expect(component).toBeTruthy();
    expect(component.selectedPresetId()).toBe('guitar-standard');
    expect(component.a4Frequency()).toBe(440);
    expect(component.tunerMode()).toBe('needle');
  });

  it('should support switching between needle and strobe modes', () => {
    expect(component.tunerMode()).toBe('needle');
    component.setTunerMode('strobe');
    expect(component.tunerMode()).toBe('strobe');
    component.setTunerMode('needle');
    expect(component.tunerMode()).toBe('needle');
  });

  it('should adjust A4 frequency within range 432 Hz - 446 Hz', () => {
    component.adjustA4(2);
    expect(component.a4Frequency()).toBe(442);

    // Test upper clamp
    component.adjustA4(100);
    expect(component.a4Frequency()).toBe(446);

    // Test lower clamp
    component.adjustA4(-100);
    expect(component.a4Frequency()).toBe(432);

    // Reset back to 440
    component.resetA4();
    expect(component.a4Frequency()).toBe(440);
  });

  it('should switch tuning presets across multiple instruments', () => {
    component.selectPreset('bass-5-string');
    expect(component.activePreset().id).toBe('bass-5-string');
    expect(component.activePreset().strings.length).toBe(5);
    expect(component.activePreset().strings[0].note).toBe('B');

    component.selectPreset('ukulele-standard');
    expect(component.activePreset().id).toBe('ukulele-standard');
    expect(component.activePreset().strings.length).toBe(4);

    component.selectPreset('violin-standard');
    expect(component.activePreset().id).toBe('violin-standard');
    expect(component.activePreset().strings.length).toBe(4);

    component.selectPreset('guitar-drop-d');
    expect(component.activePreset().id).toBe('guitar-drop-d');
    expect(component.activePreset().strings[0].note).toBe('D');
  });

  it('should dynamically calibrate open string frequencies with A4 slider', () => {
    component.selectPreset('guitar-standard');
    component.a4Frequency.set(440);

    const standardStrings = component.calibratedStrings();
    const aString = standardStrings.find((s) => s.note === 'A');
    expect(aString?.calibratedFreq).toBe(110.0);

    // Recalibrate to A4 = 444 Hz
    component.a4Frequency.set(444);
    const calibratedStrings444 = component.calibratedStrings();
    const aString444 = calibratedStrings444.find((s) => s.note === 'A');
    expect(aString444?.calibratedFreq).toBe(111.0);
  });

  it('should accurately calculate note and cents deviation from pitch', () => {
    // 440 Hz at A4=440 is MIDI note 69 (A) with 0 cents deviation
    const noteA = component.noteFromPitch(440, 440);
    expect(noteA).toBe(69);

    const centsA = component.centsOffFromPitch(440, 69, 440);
    expect(centsA).toBe(0);

    // Slightly sharp A (442.5 Hz) -> positive cents
    const centsSharp = component.centsOffFromPitch(442.5, 69, 440);
    expect(centsSharp).toBeGreaterThan(0);

    // Slightly flat A (437.5 Hz) -> negative cents
    const centsFlat = component.centsOffFromPitch(437.5, 69, 440);
    expect(centsFlat).toBeLessThan(0);
  });

  it('should persist A4 frequency to localStorage when adjusted, changed via slider, or reset', () => {
    component.adjustA4(3);
    expect(component.a4Frequency()).toBe(443);
    expect(localStorage.getItem('bandmate_tuner_a4')).toBe('443');

    component.onA4SliderChange({ target: { value: '435' } } as unknown as Event);
    expect(component.a4Frequency()).toBe(435);
    expect(localStorage.getItem('bandmate_tuner_a4')).toBe('435');

    component.resetA4();
    expect(component.a4Frequency()).toBe(440);
    expect(localStorage.getItem('bandmate_tuner_a4')).toBe('440');
  });

  it('should initialize A4 frequency from localStorage if present and in valid range', async () => {
    localStorage.setItem('bandmate_tuner_a4', '436');
    const newFixture = TestBed.createComponent(TunerPageComponent);
    const newComponent = newFixture.componentInstance;
    await newFixture.whenStable();

    expect(newComponent.a4Frequency()).toBe(436);
    newComponent.ngOnDestroy();
  });

  it('should ignore invalid or out-of-range A4 values in localStorage and fallback to 440 Hz', async () => {
    localStorage.setItem('bandmate_tuner_a4', '480'); // exceeds max 446
    const fixtureHigh = TestBed.createComponent(TunerPageComponent);
    const compHigh = fixtureHigh.componentInstance;
    await fixtureHigh.whenStable();
    expect(compHigh.a4Frequency()).toBe(440);
    compHigh.ngOnDestroy();

    localStorage.setItem('bandmate_tuner_a4', '400'); // below min 432
    const fixtureLow = TestBed.createComponent(TunerPageComponent);
    const compLow = fixtureLow.componentInstance;
    await fixtureLow.whenStable();
    expect(compLow.a4Frequency()).toBe(440);
    compLow.ngOnDestroy();

    localStorage.setItem('bandmate_tuner_a4', 'non-numeric');
    const fixtureInvalid = TestBed.createComponent(TunerPageComponent);
    const compInvalid = fixtureInvalid.componentInstance;
    await fixtureInvalid.whenStable();
    expect(compInvalid.a4Frequency()).toBe(440);
    compInvalid.ngOnDestroy();
  });

  it('should persist selected preset and tuner mode in localStorage', async () => {
    component.selectPreset('guitar-dadgad');
    expect(localStorage.getItem('bandmate_tuner_preset')).toBe('guitar-dadgad');

    component.setTunerMode('strobe');
    expect(localStorage.getItem('bandmate_tuner_mode')).toBe('strobe');

    const newFixture = TestBed.createComponent(TunerPageComponent);
    const newComponent = newFixture.componentInstance;
    await newFixture.whenStable();

    expect(newComponent.selectedPresetId()).toBe('guitar-dadgad');
    expect(newComponent.tunerMode()).toBe('strobe');
    newComponent.ngOnDestroy();
  });
});
