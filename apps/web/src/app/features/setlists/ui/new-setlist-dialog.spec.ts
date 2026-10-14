import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  NewSetlistDialogComponent,
  SETLIST_TEMPLATES,
} from './new-setlist-dialog';

describe('NewSetlistDialogComponent (Setlist Templates)', () => {
  let component: NewSetlistDialogComponent;
  let fixture: ComponentFixture<NewSetlistDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NewSetlistDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(NewSetlistDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create with blank template selected by default', () => {
    expect(component).toBeTruthy();
    expect(component.selectedTemplateId()).toBe('blank');
    expect(component.nameControl.value).toBe('');
    expect(component.notesControl.value).toBe('');
    expect(component.autoPopulateFromLibrary()).toBe(false);
  });

  it('should apply 45-min Club Set template and auto-fill structure notes', () => {
    const clubTmpl = SETLIST_TEMPLATES.find((t) => t.id === 'club-45')!;
    component.applyTemplate(clubTmpl);

    expect(component.selectedTemplateId()).toBe('club-45');
    expect(component.nameControl.value).toBe('Club Set (45 min)');
    expect(component.notesControl.value).toContain('🎯 Objetivo: 45 min');
    expect(component.notesControl.value).toContain('Apertura enérgica');
  });

  it('should apply 60-min Festival Block template', () => {
    const festTmpl = SETLIST_TEMPLATES.find((t) => t.id === 'festival-60')!;
    component.applyTemplate(festTmpl);

    expect(component.selectedTemplateId()).toBe('festival-60');
    expect(component.nameControl.value).toBe('Festival Block (60 min)');
    expect(component.notesControl.value).toContain('🎯 Objetivo: 60 min');
  });

  it('should toggle autoPopulateFromLibrary', () => {
    const festTmpl = SETLIST_TEMPLATES.find((t) => t.id === 'festival-60')!;
    component.applyTemplate(festTmpl);

    expect(component.autoPopulateFromLibrary()).toBe(false);
    component.toggleAutoPopulate({ target: { checked: true } } as any);
    expect(component.autoPopulateFromLibrary()).toBe(true);
  });

  it('should save and return template metadata', () => {
    const clubTmpl = SETLIST_TEMPLATES.find((t) => t.id === 'club-45')!;
    component.applyTemplate(clubTmpl);
    component.toggleAutoPopulate({ target: { checked: true } } as any);

    component.save();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      name: 'Club Set (45 min)',
      notes: expect.stringContaining('Objetivo: 45 min'),
      templateId: 'club-45',
      targetDurationMinutes: 45,
      autoPopulate: true,
    });
  });

  it('should close dialog with null on cancel', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
