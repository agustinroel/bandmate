import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartImportDialogComponent, SmartImportDialogData } from './smart-import-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SongsStore } from '../../state/songs-store';
import { BandsService } from '../../../bands/services/bands.service';
import { Router } from '@angular/router';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { of } from 'rxjs';

describe('SmartImportDialogComponent (Universal & Bulk Files Importer)', () => {
  let component: SmartImportDialogComponent;
  let fixture: ComponentFixture<SmartImportDialogComponent>;
  let songsStoreMock: any;
  let bandsServiceMock: any;
  let dialogRefMock: any;
  let routerMock: any;
  let notifyMock: any;

  beforeEach(async () => {
    songsStoreMock = {
      create: vi.fn().mockReturnValue(of({ id: 'new-song-1', title: 'Test Song' })),
    };
    bandsServiceMock = {
      shareSong: vi.fn().mockReturnValue(of({ success: true })),
      get: vi.fn().mockReturnValue(of({ id: 'band-1', name: 'Mock Band' })),
    };
    dialogRefMock = {
      close: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };
    notifyMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SmartImportDialogComponent],
      providers: [
        { provide: SongsStore, useValue: songsStoreMock },
        { provide: BandsService, useValue: bandsServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: Router, useValue: routerMock },
        { provide: NotificationsService, useValue: notifyMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and default to single mode', () => {
    expect(component).toBeTruthy();
    expect(component.mode()).toBe('single');
    expect(component.bulkItems().length).toBe(0);
  });

  it('should switch between single and bulk mode', () => {
    component.mode.set('bulk');
    expect(component.mode()).toBe('bulk');
    component.mode.set('single');
    expect(component.mode()).toBe('single');
  });

  it('should parse text and load sample', () => {
    component.loadSample('standByMe');
    expect(component.rawText).toContain('Stand By Me');
    expect(component.parsed()).toBeTruthy();
    expect(component.parsed()?.title).toBe('Stand By Me');
  });

  it('should save single song and navigate', () => {
    component.loadSample('oasis');
    component.saveAndPlay();

    expect(songsStoreMock.create).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/songs', 'new-song-1']);
  });

  it('should handle bulk item selection and toggle', () => {
    component.bulkItems.set([
      {
        id: '1',
        fileName: 'song1.pro',
        title: 'Song 1',
        artist: 'Artist 1',
        sectionsCount: 3,
        parsed: { title: 'Song 1', artist: 'Artist 1', sections: [], rawChordPro: '' },
        selected: true,
        status: 'pending',
      },
      {
        id: '2',
        fileName: 'song2.pro',
        title: 'Song 2',
        artist: 'Artist 2',
        sectionsCount: 4,
        parsed: { title: 'Song 2', artist: 'Artist 2', sections: [], rawChordPro: '' },
        selected: false,
        status: 'pending',
      },
    ]);

    expect(component.selectedBulkCount()).toBe(1);
    expect(component.isAllBulkSelected()).toBe(false);
    expect(component.isSomeBulkSelected()).toBe(true);

    component.toggleAllBulk(true);
    expect(component.selectedBulkCount()).toBe(2);
    expect(component.isAllBulkSelected()).toBe(true);

    component.toggleBulkItem('1', false);
    expect(component.selectedBulkCount()).toBe(1);
  });

  it('should import selected bulk items and show notification', async () => {
    component.bulkItems.set([
      {
        id: 'bulk-1',
        fileName: 'track.cho',
        title: 'Track A',
        artist: 'Band A',
        sectionsCount: 2,
        parsed: { title: 'Track A', artist: 'Band A', sections: [], rawChordPro: '' },
        selected: true,
        status: 'pending',
      },
    ]);

    await component.importSelectedBulk();

    expect(songsStoreMock.create).toHaveBeenCalled();
    expect(notifyMock.success).toHaveBeenCalledWith(expect.stringContaining('1'));
    expect(component.bulkItems()[0].status).toBe('done');
  });

  it('should process multi-file ChordPro and OnSong file lists', async () => {
    const mockFile1 = {
      name: 'Song One.pro',
      text: vi.fn().mockResolvedValue('{title: Song One}\n{artist: Band One}\n[G]Hello [C]World'),
    } as unknown as File;

    const mockFile2 = {
      name: 'Artist Two - Song Two.onsong',
      text: vi.fn().mockResolvedValue('Song Two\nArtist Two\n[D]Testing [A]Chord'),
    } as unknown as File;

    await component.processFiles([mockFile1, mockFile2]);

    expect(component.bulkItems().length).toBe(2);
    expect(component.bulkItems()[0].title).toBe('Song One');
    expect(component.bulkItems()[1].title).toBe('Song Two');
    expect(component.bulkItems()[0].status).toBe('pending');
    expect(component.bulkItems()[0].selected).toBe(true);
  });

  describe('with targetBand context', () => {
    let bandComponent: SmartImportDialogComponent;
    let bandFixture: ComponentFixture<SmartImportDialogComponent>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SmartImportDialogComponent],
        providers: [
          { provide: SongsStore, useValue: songsStoreMock },
          { provide: BandsService, useValue: bandsServiceMock },
          { provide: MatDialogRef, useValue: dialogRefMock },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { targetBandId: 'band-42', targetBandName: 'Rockers' } as SmartImportDialogData,
          },
          { provide: Router, useValue: routerMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      bandFixture = TestBed.createComponent(SmartImportDialogComponent);
      bandComponent = bandFixture.componentInstance;
      bandFixture.detectChanges();
    });

    it('should share single song to targetBandId on saveAndPlay', async () => {
      bandComponent.loadSample('oasis');
      bandComponent.saveAndPlay();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(songsStoreMock.create).toHaveBeenCalled();
      expect(bandsServiceMock.shareSong).toHaveBeenCalledWith('band-42', 'new-song-1');
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should share all bulk imported songs to targetBandId and include band in toast', async () => {
      bandComponent.bulkItems.set([
        {
          id: 'b-1',
          fileName: 'tune.pro',
          title: 'Tune 1',
          artist: 'Artist 1',
          sectionsCount: 2,
          parsed: { title: 'Tune 1', artist: 'Artist 1', sections: [], rawChordPro: '' },
          selected: true,
          status: 'pending',
        },
      ]);

      await bandComponent.importSelectedBulk();

      expect(bandsServiceMock.shareSong).toHaveBeenCalledWith('band-42', 'new-song-1');
      expect(notifyMock.success).toHaveBeenCalledWith(expect.stringContaining('Rockers'));
      expect(bandComponent.bulkItems()[0].status).toBe('done');
    });

    it('should display band banner and active context badge in template', () => {
      bandComponent.mode.set('bulk');
      bandFixture.detectChanges();

      const compiled = bandFixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Rockers');
      expect(compiled.textContent).toContain('Contexto de Banda activo');
    });
  });

  describe('with targetBandId only (no name provided)', () => {
    it('should fetch band details and update targetBandName', async () => {
      const getSpy = vi.fn().mockReturnValue(of({ id: 'band-99', name: 'Auto Band Name' }));
      const customBandsService = { ...bandsServiceMock, get: getSpy };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SmartImportDialogComponent],
        providers: [
          { provide: SongsStore, useValue: songsStoreMock },
          { provide: BandsService, useValue: customBandsService },
          { provide: MatDialogRef, useValue: dialogRefMock },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { targetBandId: 'band-99' } as SmartImportDialogData,
          },
          { provide: Router, useValue: routerMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fix = TestBed.createComponent(SmartImportDialogComponent);
      const comp = fix.componentInstance;
      fix.detectChanges();

      expect(getSpy).toHaveBeenCalledWith('band-99');
      expect(comp.targetBandName()).toBe('Auto Band Name');
    });
  });
});
