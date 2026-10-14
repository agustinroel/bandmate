import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StagePlotPageComponent } from './stage-plot-page';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';

describe('StagePlotPageComponent', () => {
  let component: StagePlotPageComponent;
  let fixture: ComponentFixture<StagePlotPageComponent>;
  let notifyMock: any;

  beforeEach(async () => {
    // Clear localStorage to ensure clean test state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bandmate_stage_plot_data');
    }

    notifyMock = {
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StagePlotPageComponent],
      providers: [{ provide: NotificationsService, useValue: notifyMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(StagePlotPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and initialize with default rock preset', () => {
    expect(component).toBeTruthy();
    expect(component.elements().length).toBeGreaterThan(0);
    expect(component.meta().bandName).toBe('The Rockers Band');
  });

  it('should add a new element to the stage', () => {
    const initialCount = component.elements().length;
    component.addElement('keyboard');

    expect(component.elements().length).toBe(initialCount + 1);
    const added = component.elements()[component.elements().length - 1];
    expect(added.type).toBe('keyboard');
    expect(added.label).toBe('Teclado Estéreo');
    expect(component.selectedElementId()).toBe(added.id);
  });

  it('should select an element and delete it', () => {
    const firstEl = component.elements()[0];
    component.selectElement(firstEl.id);

    expect(component.selectedElementId()).toBe(firstEl.id);
    expect(component.selectedElement()).toEqual(firstEl);

    component.deleteSelectedElement();
    expect(component.elements().some((el) => el.id === firstEl.id)).toBe(false);
    expect(component.selectedElementId()).toBeNull();
  });

  it('should clear the entire stage', () => {
    expect(component.elements().length).toBeGreaterThan(0);
    component.clearStage();

    expect(component.elements().length).toBe(0);
    expect(component.selectedElementId()).toBeNull();
    expect(component.channelInputList().length).toBe(0);
  });

  it('should derive the Channel Input List for audio sources and calculate channel numbers', () => {
    component.applyPreset('acoustic');
    const inputList = component.channelInputList();

    expect(inputList.length).toBe(2); // 2 vocals with D.I.
    expect(inputList[0].channel).toBe(1);
    expect(inputList[0].label).toContain('Voz 1');
    expect(inputList[1].channel).toBe(2);
    expect(inputList[1].label).toContain('Voz 2');
  });

  it('should switch between band presets (acoustic, pop6, rock4)', () => {
    component.applyPreset('pop6');
    expect(component.meta().bandName).toBe('Groove & Pop Sextet');
    expect(component.elements().some((el) => el.type === 'keyboard')).toBe(true);

    component.applyPreset('acoustic');
    expect(component.meta().bandName).toBe('Acoustic Soul Duo');
    expect(component.elements().length).toBe(4);
  });

  it('should invoke window.print on printTechRider', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printTechRider();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
