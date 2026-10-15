import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  TechRiderExportDialogComponent,
  TechRiderExportDialogData,
} from './tech-rider-export-dialog';
import { NotificationsService } from '../../../../../shared/ui/notifications/notifications.service';

describe('TechRiderExportDialogComponent', () => {
  let component: TechRiderExportDialogComponent;
  let fixture: ComponentFixture<TechRiderExportDialogComponent>;
  let notifyMock: any;
  let dialogRefMock: any;

  const mockData: TechRiderExportDialogData = {
    meta: {
      bandName: 'The Rockers',
      contactPerson: 'Alex Rivera',
      contactPhone: '+34 600 123 456',
      contactEmail: 'tour@bandmate.live',
      venueName: 'Sala Razzmatazz',
      date: '2026-08-15',
      notes: 'Monitores con envío separado para batería y voz.',
      monitorMixes: 4,
      powerDrops: 3,
    },
    elements: [
      {
        id: 'el-1',
        type: 'drums',
        label: 'Batería Acústica',
        x: 50,
        y: 20,
        micType: 'Kit Mics',
        phantomPower: true,
        standType: 'Short Booms',
        monitorNeeds: 'Mezcla Batería',
      },
      {
        id: 'el-2',
        type: 'lead_vocals',
        label: 'Voz Principal',
        x: 50,
        y: 75,
        micType: 'Shure Beta 58A',
        phantomPower: false,
        standType: 'Trípode Boom',
        monitorNeeds: 'Voz alta',
      },
    ],
    channelInputList: [
      {
        channel: 1,
        id: 'el-1',
        label: 'Batería Acústica',
        type: 'drums',
        mic: 'Kit Mics',
        phantom: true,
        stand: 'Short Booms',
        monitorNeeds: 'Mezcla Batería',
      },
      {
        channel: 2,
        id: 'el-2',
        label: 'Voz Principal',
        type: 'lead_vocals',
        mic: 'Shure Beta 58A',
        phantom: false,
        stand: 'Trípode Boom',
        monitorNeeds: 'Voz alta',
      },
    ],
    stageDimensions: '10m x 8m',
  };

  beforeEach(async () => {
    notifyMock = {
      success: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    dialogRefMock = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TechRiderExportDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: NotificationsService, useValue: notifyMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TechRiderExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize with data', () => {
    expect(component).toBeTruthy();
    expect(component.bandName).toBe('The Rockers');
    expect(component.stageDimensions).toBe('10m x 8m');
    expect(component.data.channelInputList.length).toBe(2);
  });

  it('should return correct icons for stage element types', () => {
    expect(component.getIconForType('drums')).toBe('album');
    expect(component.getIconForType('lead_vocals')).toBe('mic');
    expect(component.getIconForType('keyboard')).toBe('piano');
  });

  it('should generate formatted plain text patch sheet for sound engineers', () => {
    const text = component.generatePatchSheetText();
    expect(text).toContain('THE ROCKERS — TECHNICAL RIDER & CHANNEL INPUT LIST');
    expect(text).toContain('Sala Razzmatazz');
    expect(text).toContain('Alex Rivera');
    expect(text).toContain('Batería Acústica');
    expect(text).toContain('Voz Principal');
    expect(text).toContain('Kit Mics');
    expect(text).toContain('Shure Beta 58A');
    expect(text).toContain('4 mezclas independientes');
  });

  it('should copy patch sheet text to clipboard', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    component.copyPatchSheetText();
    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('THE ROCKERS'));
    await Promise.resolve();
    expect(notifyMock.success).toHaveBeenCalledWith('Lista de canales y rider técnico copiado al portapapeles');
  });

  it('should trigger txt download', () => {
    const clickSpy = vi.fn();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      set href(val: string) {},
      set download(val: string) {},
      click: clickSpy,
    } as any);

    component.downloadPatchSheetTxt();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    expect(notifyMock.success).toHaveBeenCalledWith('Ficha técnica descargada correctamente');

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('should call window.print on printRiderSheet', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printRiderSheet();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('should support switching layouts and toggles', () => {
    component.layout = 'patch-only';
    component.includeStagePlot = false;
    component.includeHospitality = false;

    fixture.detectChanges();

    expect(component.layout).toBe('patch-only');
    expect(component.includeStagePlot).toBe(false);
  });
});
