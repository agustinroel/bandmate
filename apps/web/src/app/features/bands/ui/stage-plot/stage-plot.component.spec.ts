import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StagePlotComponent } from './stage-plot.component';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { MatMenuModule } from '@angular/material/menu';

describe('StagePlotComponent (Interactive 2D Stage Plot & Tech Rider)', () => {
  let component: StagePlotComponent;
  let fixture: ComponentFixture<StagePlotComponent>;
  let notifyMock: any;

  beforeEach(async () => {
    localStorage.clear();
    notifyMock = {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StagePlotComponent, MatMenuModule],
      providers: [{ provide: NotificationsService, useValue: notifyMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(StagePlotComponent);
    component = fixture.componentInstance;
    component.bandId = 'band-testing-123';
    component.bandName = 'The Audio Architects';
    fixture.detectChanges();
  });

  it('should create and load default rock preset', () => {
    expect(component).toBeTruthy();
    expect(component.items().length).toBeGreaterThan(0);
    expect(component.inputs().length).toBeGreaterThan(0);
    expect(component.items().some((i) => i.type === 'drums')).toBe(true);
  });

  it('should switch presets between rock, acoustic, and pop', () => {
    component.loadPreset('acoustic');
    expect(component.items().some((i) => i.label.includes('Cajón'))).toBe(true);
    expect(component.inputs().some((c) => c.source.includes('Cajón'))).toBe(true);

    component.loadPreset('pop');
    expect(component.items().some((i) => i.type === 'iem')).toBe(true);
  });

  it('should add gear items to the stage', () => {
    const initialCount = component.items().length;
    component.addItem('vocal_mic');

    expect(component.items().length).toBe(initialCount + 1);
    const added = component.selectedItem();
    expect(added).toBeTruthy();
    expect(added?.type).toBe('vocal_mic');
  });

  it('should remove items from the stage', () => {
    const initial = component.items()[0];
    component.removeItem(initial.id);
    expect(component.items().some((i) => i.id === initial.id)).toBe(false);
    expect(component.selectedItem()).toBeNull();
  });

  it('should manage input channels (add, remove, and renumber)', () => {
    const initialChannels = component.inputs().length;
    component.addChannel();

    expect(component.inputs().length).toBe(initialChannels + 1);
    expect(component.inputs()[component.inputs().length - 1].channel).toBe(initialChannels + 1);

    component.removeChannel(0);
    expect(component.inputs().length).toBe(initialChannels);
    expect(component.inputs()[0].channel).toBe(1); // Auto-renumbered
  });

  it('should persist and reload state in localStorage', () => {
    component.addItem('power');
    component.saveState();

    const secondFixture = TestBed.createComponent(StagePlotComponent);
    const newComponent = secondFixture.componentInstance;
    newComponent.bandId = 'band-testing-123';
    newComponent.loadSavedState();

    expect(newComponent.items().some((i) => i.type === 'power')).toBe(true);
  });
});
