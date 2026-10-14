import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BandEpkDialogComponent, BandEpkDialogData } from './band-epk-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

describe('BandEpkDialogComponent (Electronic Press Kit Generator)', () => {
  let component: BandEpkDialogComponent;
  let fixture: ComponentFixture<BandEpkDialogComponent>;
  let dialogRefMock: any;
  let notifyMock: any;

  const mockData: BandEpkDialogData = {
    band: {
      id: 'band-rock-1',
      name: 'The Sonic Waves',
      description: 'Alternative rock band with indie influences.',
      owner_id: 'usr-1',
    },
    members: [
      { id: 'm1', full_name: 'John Doe', username: 'johndoe', instruments: ['Lead Vocals', 'Guitar'] },
      { id: 'm2', full_name: 'Jane Smith', username: 'janesmith', instruments: ['Bass', 'Backing Vocals'] },
    ],
    songs: [
      { id: 's1', title: 'Summer Breeze', artist: 'The Sonic Waves' },
      { id: 's2', title: 'Midnight Echo', artist: 'The Sonic Waves' },
    ],
    events: [
      { id: 'e1', title: 'Rock Arena Festival', location_name: 'Madrid Arena', event_date: '2026-07-20' },
    ],
  };

  beforeEach(async () => {
    dialogRefMock = { close: vi.fn() };
    notifyMock = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BandEpkDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: NotificationsService, useValue: notifyMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BandEpkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render band information', () => {
    expect(component).toBeTruthy();
    expect(component.data.band.name).toBe('The Sonic Waves');
    expect(component.data.members.length).toBe(2);
    expect(component.data.songs.length).toBe(2);
    expect(component.data.events.length).toBe(1);
  });

  it('should sanitize band name for email and url slugs', () => {
    expect(component.sanitizeName('The Sonic Waves')).toBe('thesonicwaves');
    expect(component.sanitizeName('Rock & Roll 2026!')).toBe('rockroll2026');
  });

  it('should copy public EPK link and notify user', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    component.copyShareLink();
    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('thesonicwaves'));
  });
});
