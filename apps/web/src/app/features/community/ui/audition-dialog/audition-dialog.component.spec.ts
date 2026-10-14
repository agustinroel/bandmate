import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditionDialogComponent, AuditionDialogData } from './audition-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { AuthStore } from '../../../../core/auth/auth.store';

describe('AuditionDialogComponent (Auditions & Private Notes)', () => {
  let component: AuditionDialogComponent;
  let fixture: ComponentFixture<AuditionDialogComponent>;
  let dialogRefMock: any;
  let notifyMock: any;
  let authStoreMock: any;

  const mockData: AuditionDialogData = {
    postId: 'post-audition-99',
    postTitle: 'Buscamos Baterista para Rock/Metal',
    bandName: 'Iron Resonance',
    mode: 'apply',
  };

  beforeEach(async () => {
    localStorage.clear();
    dialogRefMock = { close: vi.fn() };
    notifyMock = { success: vi.fn(), info: vi.fn() };
    authStoreMock = {
      user: () => ({ id: 'usr-guitarist', email: 'alex@bandmate.live' }),
    };

    await TestBed.configureTestingModule({
      imports: [AuditionDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: NotificationsService, useValue: notifyMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in apply mode', () => {
    expect(component).toBeTruthy();
    expect(component.data.mode).toBe('apply');
    expect(component.applyInstrument).toBe('Guitarra Eléctrica');
  });

  it('should submit audition application and save to candidates store', () => {
    component.applyMessage = 'Tengo 10 años tocando y disponibilidad total los fines de semana.';
    component.applyDemoLinks = 'https://youtube.com/my-solo';
    component.submitApplication();

    expect(notifyMock.success).toHaveBeenCalledWith(expect.stringContaining('enviada'));
    expect(dialogRefMock.close).toHaveBeenCalled();

    // Verify stored
    const stored = JSON.parse(localStorage.getItem('bandmate_auditions_post-audition-99') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].applicantName).toBe('alex');
    expect(stored[0].message).toContain('10 años');
  });

  it('should support rating and private notes updates', () => {
    const candidate = {
      id: 'c1',
      applicantId: 'u1',
      applicantName: 'Carlos',
      instrument: 'Batería',
      experienceLevel: 'Semi-Pro' as const,
      demoLinks: '',
      message: 'Listo para probar',
      privateNotes: 'Muy buen tempo',
      rating: 3,
      status: 'pending' as const,
      appliedAt: new Date().toISOString(),
    };
    component.candidates.set([candidate]);
    component.setRating(candidate, 5);

    expect(candidate.rating).toBe(5);
    const stored = JSON.parse(localStorage.getItem('bandmate_auditions_post-audition-99') || '[]');
    expect(stored[0].rating).toBe(5);
  });
});
