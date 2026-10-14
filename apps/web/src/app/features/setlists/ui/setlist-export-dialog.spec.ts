import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetlistExportDialogComponent, SetlistExportDialogData } from './setlist-export-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';

describe('SetlistExportDialogComponent', () => {
  let component: SetlistExportDialogComponent;
  let fixture: ComponentFixture<SetlistExportDialogComponent>;
  let dialogRefMock: any;
  let notifyMock: any;

  const mockData: SetlistExportDialogData = {
    setlist: {
      id: 'set-1',
      name: 'Festival Friday Night',
      items: [{ songId: 's1' }, { songId: 's2' }],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    songs: [
      {
        id: 's1',
        title: 'Highway to Rock',
        artist: 'AC/DC Style',
        key: 'A',
        bpm: 120,
        durationSec: 210,
        notes: 'Lead guitar starts on count 4',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        isSeed: false,
        sections: [{ id: '1', type: 'verse', order: 0, lines: [] }],
      },
      {
        id: 's2',
        title: 'Sweet Ballad',
        artist: 'Guns & Roses',
        key: 'D',
        bpm: 85,
        durationSec: 240,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        isSeed: false,
        sections: [{ id: '2', type: 'chorus', order: 0, lines: [] }],
      },
    ],
    bandName: 'The Rockers',
  };

  beforeEach(async () => {
    dialogRefMock = { close: vi.fn() };
    notifyMock = { success: vi.fn(), info: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SetlistExportDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: NotificationsService, useValue: notifyMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetlistExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize with setlist data', () => {
    expect(component).toBeTruthy();
    expect(component.bandName).toBe('The Rockers');
    expect(component.layout).toBe('giant');
    expect(component.data.songs.length).toBe(2);
  });

  it('should compute correct total duration label', () => {
    // 210s + 240s = 450s = 7m 30s
    expect(component.totalDurationLabel()).toBe('7m 30s');
  });

  it('should format duration accurately', () => {
    expect(component.formatDuration(210)).toBe('3:30');
    expect(component.formatDuration(65)).toBe('1:05');
  });

  it('should generate formatted plain text stage setlist', () => {
    const text = component.generatePlainText();
    expect(text).toContain('THE ROCKERS — FESTIVAL FRIDAY NIGHT');
    expect(text).toContain('01. Highway to Rock - AC/DC Style [A] 120 BPM');
    expect(text).toContain('02. Sweet Ballad - Guns & Roses [D] 85 BPM');
    expect(text).toContain('Lead guitar starts on count 4');
  });

  it('should support switching layouts and toggling metadata columns', () => {
    component.layout = 'structured';
    expect(component.layout).toBe('structured');

    component.showKeys = false;
    expect(component.showKeys).toBe(false);

    const textWithoutKeys = component.generatePlainText();
    expect(textWithoutKeys).not.toContain('[A]');
  });
});
