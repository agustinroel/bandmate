import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BandEpkDialogComponent,
  BandEpkDialogData,
  StageRiderSummary,
} from './band-epk-dialog.component';
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
    genre: 'Indie Rock / Post-Punk',
    bookingContact: {
      email: 'mgmt@sonicwaves.com',
      phone: '+34 611 222 333',
      managerName: 'Laura Gomez (Indie Tours)',
    },
    stageRiderSummary: {
      totalChannels: 12,
      monitorMixes: 4,
      iemCount: 2,
      powerDrops: 3,
      minStageDimensions: '10m x 8m',
    },
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

  it('should parse and display genre badges', () => {
    const genres = component.genres();
    expect(genres).toContain('Indie Rock');
    expect(genres).toContain('Post-Punk');
  });

  it('should render custom stage rider summary when provided', () => {
    const rider = component.stageRider();
    expect(rider.totalChannels).toBe(12);
    expect(rider.monitorMixes).toBe(4);
    expect(rider.iemCount).toBe(2);
    expect(rider.powerDrops).toBe(3);
    expect(rider.minStageDimensions).toBe('10m x 8m');
  });

  it('should compute fallback stage rider summary when not provided', () => {
    const fallbackData: BandEpkDialogData = {
      band: { id: 'b2', name: 'Trio Acoustic', owner_id: 'u2' },
      members: [{ id: '1' }, { id: '2' }, { id: '3' }],
      songs: [],
      events: [],
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BandEpkDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: fallbackData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: NotificationsService, useValue: notifyMock },
      ],
    });

    const f = TestBed.createComponent(BandEpkDialogComponent);
    const comp = f.componentInstance;
    f.detectChanges();

    const rider = comp.stageRider();
    expect(rider.totalChannels).toBe(9); // 3 * 3
    expect(rider.monitorMixes).toBe(3);
    expect(rider.iemCount).toBe(3);
  });

  it('should render custom booking contact info', () => {
    const contact = component.bookingContact();
    expect(contact.email).toBe('mgmt@sonicwaves.com');
    expect(contact.phone).toBe('+34 611 222 333');
    expect(contact.managerName).toBe('Laura Gomez (Indie Tours)');
  });

  it('should generate formatted plain text press dossier', () => {
    const text = component.generateEpkPlainText();
    expect(text).toContain('THE SONIC WAVES — OFFICIAL ELECTRONIC PRESS KIT (EPK)');
    expect(text).toContain('Indie Rock • Post-Punk');
    expect(text).toContain('John Doe — Lead Vocals, Guitar');
    expect(text).toContain('Jane Smith — Bass, Backing Vocals');
    expect(text).toContain('Canales de Entrada FOH: 12');
    expect(text).toContain('Rock Arena Festival');
    expect(text).toContain('"Summer Breeze"');
  });

  it('should copy public EPK link and notify user', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    component.copyShareLink();
    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('thesonicwaves'));
  });

  it('should copy EPK text to clipboard', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    component.copyEpkText();
    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('THE SONIC WAVES'));
    await Promise.resolve();
    expect(notifyMock.success).toHaveBeenCalledWith('Dossier EPK copiado al portapapeles');
  });

  it('should download EPK text file', () => {
    const clickSpy = vi.fn();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      set href(val: string) {},
      set download(val: string) {},
      click: clickSpy,
    } as any);

    component.downloadEpkTxt();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    expect(notifyMock.success).toHaveBeenCalledWith('Dossier EPK descargado correctamente');

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('should call window.print on printEpk', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printEpk();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
