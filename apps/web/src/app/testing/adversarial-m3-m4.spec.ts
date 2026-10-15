import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import {
  TechRiderExportDialogComponent,
  TechRiderExportDialogData,
} from '../features/tools/stage-plot/ui/tech-rider-export-dialog/tech-rider-export-dialog';
import { StagePlotPageComponent } from '../features/tools/stage-plot/stage-plot-page';
import {
  BandEpkDialogComponent,
  BandEpkDialogData,
} from '../features/bands/ui/band-epk-dialog/band-epk-dialog.component';
import { PublicEpkPageComponent } from '../features/bands/pages/public-epk-page/public-epk-page';
import {
  SmartImportDialogComponent,
  SmartImportDialogData,
} from '../features/songs/ui/smart-import-dialog/smart-import-dialog.component';
import {
  SetlistExportDialogComponent,
  SetlistExportDialogData,
} from '../features/setlists/ui/setlist-export-dialog';

import { NotificationsService } from '../shared/ui/notifications/notifications.service';
import { BandsService } from '../features/bands/services/bands.service';
import { EventsService } from '../features/events/services/events.service';
import { SongsStore } from '../features/songs/state/songs-store';
import { parseSmartTab } from '@bandmate/shared';

describe('Adversarial Verification Suite: Milestone 3 & Milestone 4', () => {
  let notifyMock: any;
  let dialogRefMock: any;

  beforeEach(() => {
    notifyMock = {
      success: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    dialogRefMock = {
      close: vi.fn(),
    };
  });

  // =========================================================================
  // MILESTONE 3: TECH RIDER & STAGE PLOT ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('M3: Stage Plot & Tech Rider Stress Tests', () => {
    it('should handle zero-channel stage plots gracefully without errors or NaN', async () => {
      const zeroChannelData: TechRiderExportDialogData = {
        meta: {
          bandName: 'Solo Acoustic',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          venueName: '',
          date: '2026-01-01',
          monitorMixes: 0,
          powerDrops: 0,
        } as any,
        elements: [],
        channelInputList: [],
        stageDimensions: '',
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TechRiderExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: zeroChannelData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      expect(comp).toBeTruthy();
      expect(comp.data.channelInputList.length).toBe(0);

      // Verify plain text generation with 0 channels and fallback monitor mixes
      const patchText = comp.generatePatchSheetText();
      expect(patchText).toContain('3 mezclas independientes');
      expect(patchText).toContain('3 tomas 220V');

      // Verify DOM empty state banner
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No hay entradas registradas en la lista de canales');
      expect(compiled.textContent).toContain('0 CANALES FOH');
    });

    it('should withstand extreme, out-of-bounds, negative, and NaN element coordinates', async () => {
      const extremeElementsData: TechRiderExportDialogData = {
        meta: { bandName: 'Outliers Band', date: '2026-05-10' } as any,
        elements: [
          { id: 'el-neg', type: 'lead_vocals', label: 'Negative Pos', x: -500, y: -999 },
          { id: 'el-huge', type: 'drums', label: 'Huge Pos', x: 9999, y: 15000 },
          { id: 'el-nan', type: 'keyboard', label: 'NaN Pos', x: NaN as any, y: Infinity as any },
        ],
        channelInputList: [
          { channel: 1, id: 'el-neg', label: 'Negative Pos', mic: 'SM58' },
          { channel: 2, id: 'el-huge', label: 'Huge Pos', mic: 'D112' },
          { channel: 3, id: 'el-nan', label: 'NaN Pos', mic: 'DI' },
        ],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TechRiderExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: extremeElementsData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
      const comp = fixture.componentInstance;
      expect(() => fixture.detectChanges()).not.toThrow();

      const compiled = fixture.nativeElement as HTMLElement;
      const tokens = compiled.querySelectorAll('.preview-token');
      expect(tokens.length).toBe(3);
    });

    it('should safely fall back for unrecognized or malicious element types and templates', async () => {
      const invalidTypeData: TechRiderExportDialogData = {
        meta: { bandName: 'Sci-Fi Band', date: '2026-05-10' } as any,
        elements: [
          { id: 'el-laser', type: 'alien_theremin' as any, label: 'Laser Cannon', x: 50, y: 50 },
          { id: 'el-empty', type: '' as any, label: 'Empty Type', x: 40, y: 40 },
          { id: 'el-null', type: null as any, label: 'Null Type', x: 30, y: 30 },
        ],
        channelInputList: [],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TechRiderExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: invalidTypeData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      expect(comp.getIconForType('alien_theremin')).toBe('music_note');
      expect(comp.getIconForType('')).toBe('music_note');
      expect(comp.getIconForType(undefined)).toBe('music_note');
    });

    it('should generate patch sheet safely when metadata has quotes, XSS probes, and special characters', async () => {
      const maliciousData: TechRiderExportDialogData = {
        meta: {
          bandName: '<script>alert("PWNED")</script> & "The Rockers"\'',
          venueName: 'Teatro "El Gran Sueño" <br/> & Co.',
          contactPerson: 'José "Pepe" O\'Connor <test@xss.com>',
          contactPhone: '+34 (600) 12-34-56 / ext. 9#',
          contactEmail: 'foh+stage@live-band.co.uk',
          date: '2026/12/31; DROP TABLE tech_riders;--',
          notes: 'Special chars: € $ % & / ( ) = ? ¡ ¿ * + ~ ^ ` [ ] { }',
          monitorMixes: 5,
          powerDrops: 4,
        },
        elements: [],
        channelInputList: [
          {
            channel: 1,
            id: 'ch-xss',
            label: '<img src=x onerror=alert(1)> Micro "Voz"',
            mic: 'Shure "Beta" 58A',
            stand: 'Trípode & Boom',
            phantom: true,
            monitorNeeds: 'Voz > 100% & Guitarras',
          },
        ],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TechRiderExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: maliciousData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(TechRiderExportDialogComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      const text = comp.generatePatchSheetText();
      expect(text).toContain('THE ROCKERS');
      expect(text).toContain('Teatro "El Gran Sueño"');
      expect(text).toContain('José "Pepe" O\'Connor');
      expect(text).toContain('Special chars: € $ % &');

      // Test download file name sanitization
      const clickSpy = vi.fn();
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      let downloadedFilename = '';
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        set href(val: string) {},
        set download(val: string) { downloadedFilename = val; },
        click: clickSpy,
      } as any);

      comp.downloadPatchSheetTxt();
      expect(clickSpy).toHaveBeenCalled();
      // Filename must not contain harmful filesystem characters (<, >, ", /, \)
      expect(downloadedFilename).not.toMatch(/[<>"/\\?*|:]/);
      expect(downloadedFilename).toContain('_tech_rider.txt');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it('should verify StagePlotPageComponent canvas boundary clamping under adversarial dragging', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [StagePlotPageComponent],
        providers: [{ provide: NotificationsService, useValue: notifyMock }],
      }).compileComponents();

      const fixture = TestBed.createComponent(StagePlotPageComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      // Clear stage and add one item
      comp.clearStage();
      expect(comp.elements().length).toBe(0);
      comp.addElement('lead_vocals');
      expect(comp.elements().length).toBe(1);

      const elId = comp.elements()[0].id;
      comp.startDrag(elId, { stopPropagation: vi.fn() } as any);
      expect(comp.isDragging()).toBe(true);

      // Simulate extreme mouse position far outside the canvas bounds (-1000px and +50000px)
      const mockContainer = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 300 }),
      } as HTMLElement;

      comp.onCanvasMouseMove({
        clientX: -2000,
        clientY: -5000,
        currentTarget: mockContainer,
      } as any);

      let currentEl = comp.elements().find((e) => e.id === elId);
      expect(currentEl?.x).toBe(6); // Clamped to lower bound 6%
      expect(currentEl?.y).toBe(6);

      comp.onCanvasMouseMove({
        clientX: 99999,
        clientY: 88888,
        currentTarget: mockContainer,
      } as any);

      currentEl = comp.elements().find((e) => e.id === elId);
      expect(currentEl?.x).toBe(94); // Clamped to upper bound 94%
      expect(currentEl?.y).toBe(94);

      comp.endDrag();
      expect(comp.isDragging()).toBe(false);
    });
  });

  // =========================================================================
  // MILESTONE 3: EPK & PUBLIC ROUTE ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('M3: EPK Generator & Public EPK Page Stress Tests', () => {
    it('should render BandEpkDialogComponent without crashing for bands with 0 members, 0 songs, 0 gigs, and undefined metadata', async () => {
      const bareBandData: BandEpkDialogData = {
        band: { id: 'bare-band', name: 'Phantom Trio' },
        members: [],
        songs: [],
        events: [],
        genre: undefined,
        genres: undefined,
        bookingContact: undefined,
        stageRiderSummary: undefined,
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [BandEpkDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: bareBandData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(BandEpkDialogComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      // Check fallback genres
      expect(comp.genres()).toEqual(['Rock / Alternativo', 'Indie', 'Directo']);

      // Check fallback stage rider calculation (falls back to 4 members default)
      const rider = comp.stageRider();
      expect(rider.totalChannels).toBe(12);
      expect(rider.monitorMixes).toBe(4);
      expect(rider.minStageDimensions).toContain('8m x 6m');

      // Check fallback contact
      const contact = comp.bookingContact();
      expect(contact.email).toBe('booking@phantomtrio.live');
      expect(contact.phone).toBe('+34 600 000 000');
      expect(contact.managerName).toBe('Producción & Booking');

      // Plain text dossier generation must not crash
      const dossier = comp.generateEpkPlainText();
      expect(dossier).toContain('PHANTOM TRIO — OFFICIAL ELECTRONIC PRESS KIT (EPK)');
      expect(dossier).not.toContain('PRÓXIMOS CONCIERTOS');
      expect(dossier).not.toContain('REPERTORIO DESTACADO');
    });

    it('should sanitize band names with emojis, accents, and punctuation safely for share links and downloads', () => {
      expect(BandEpkDialogComponent.prototype.sanitizeName('¡Los Críticos del Rock & Roll! 🤘 (2026)')).toBe('loscrticosdelrockroll2026');
      expect(BandEpkDialogComponent.prototype.sanitizeName('   ///$$$%%%   ')).toBe('');
    });

    it('should handle PublicEpkPageComponent 404 cleanly when given non-existent or invalid UUID', async () => {
      const bandsServiceMock = {
        get: vi.fn().mockReturnValue(throwError(() => new Error('404 Not Found'))),
        getMembers: vi.fn().mockReturnValue(of([])),
        getSongs: vi.fn().mockReturnValue(of([])),
      };
      const eventsServiceMock = {
        getBandEvents: vi.fn().mockReturnValue(of([])),
      };
      const httpMock = {
        get: vi.fn().mockReturnValue(of([])), // Fallback search returns empty
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [PublicEpkPageComponent],
        providers: [
          { provide: BandsService, useValue: bandsServiceMock },
          { provide: EventsService, useValue: eventsServiceMock },
          { provide: HttpClient, useValue: httpMock },
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: of(convertToParamMap({ id: 'non-existent-uuid-999' })),
            },
          },
          { provide: Title, useValue: { setTitle: vi.fn() } },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(PublicEpkPageComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      await comp.loadEpkData('non-existent-uuid-999');
      fixture.detectChanges();

      expect(comp.loading()).toBe(false);
      expect(comp.notFound()).toBe(true);
      expect(comp.band()).toBeNull();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Banda o Dossier no encontrado');
    });

    it('should successfully load and display PublicEpkPageComponent when valid band ID is resolved', async () => {
      const mockBand = {
        id: 'real-band-123',
        name: 'The Verified Stars',
        description: 'Touring headliner.',
      };
      const bandsServiceMock = {
        get: vi.fn().mockReturnValue(of(mockBand)),
        getMembers: vi.fn().mockReturnValue(of([
          { id: 'm1', full_name: 'Lead Singer', instruments: ['Voice'] }
        ])),
        getSongs: vi.fn().mockReturnValue(of([
          { id: 's1', title: 'Greatest Hit', artist: 'The Verified Stars' }
        ])),
      };
      const eventsServiceMock = {
        getBandEvents: vi.fn().mockReturnValue(of([
          { id: 'ev1', title: 'Summer Fest', event_date: '2026-08-01', location_name: 'Stadium' }
        ])),
      };
      const httpMock = { get: vi.fn().mockReturnValue(of([mockBand])) };
      const titleSpy = { setTitle: vi.fn() };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [PublicEpkPageComponent],
        providers: [
          { provide: BandsService, useValue: bandsServiceMock },
          { provide: EventsService, useValue: eventsServiceMock },
          { provide: HttpClient, useValue: httpMock },
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: of(convertToParamMap({ id: 'real-band-123' })),
            },
          },
          { provide: Title, useValue: titleSpy },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(PublicEpkPageComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      await comp.loadEpkData('real-band-123');
      fixture.detectChanges();

      expect(comp.loading()).toBe(false);
      expect(comp.notFound()).toBe(false);
      expect(comp.band()?.name).toBe('The Verified Stars');
      expect(comp.members().length).toBe(1);
      expect(comp.songs().length).toBe(1);
      expect(comp.events().length).toBe(1);
      expect(titleSpy.setTitle).toHaveBeenCalledWith(expect.stringContaining('The Verified Stars'));
    });
  });

  // =========================================================================
  // MILESTONE 4: UNIVERSAL CATALOG BULK OPERATIONS ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('M4: Universal Catalog Bulk Operations & Setlist Export Stress Tests', () => {
    let songsStoreMock: any;
    let bandsServiceMock: any;
    let routerMock: any;

    beforeEach(() => {
      songsStoreMock = {
        create: vi.fn().mockReturnValue(of({ id: 'created-song-1', title: 'Title' })),
      };
      bandsServiceMock = {
        shareSong: vi.fn().mockReturnValue(of({ success: true })),
        get: vi.fn().mockReturnValue(of({ id: 'band-1', name: 'Mock Band' })),
      };
      routerMock = {
        navigate: vi.fn(),
      };
    });

    it('should process batch files with empty, corrupted, and non-standard ChordPro files resiliently', async () => {
      await TestBed.resetTestingModule();
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

      const fixture = TestBed.createComponent(SmartImportDialogComponent);
      const comp = fixture.componentInstance;
      comp.mode.set('bulk');
      fixture.detectChanges();

      // Batch with:
      // 1. Valid ChordPro
      // 2. Empty file
      // 3. Corrupted / unparseable file with binary-like garbage
      // 4. Non-standard ChordPro tags
      const fileValid = {
        name: 'valid.pro',
        text: vi.fn().mockResolvedValue('{title: Perfect Track}\n{artist: Rockers}\n[C]Verse text'),
      } as unknown as File;

      const fileEmpty = {
        name: 'empty.cho',
        text: vi.fn().mockResolvedValue('   \n\t  '),
      } as unknown as File;

      const fileCorrupted = {
        name: 'broken.txt',
        text: vi.fn().mockRejectedValue(new Error('Corrupted encoding')),
      } as unknown as File;

      const fileNonStandard = {
        name: 'nonstandard.crd',
        text: vi.fn().mockResolvedValue('{unknown_meta: 123}\n{subtitle: Acoustic}\n[Bb/D#]Special chord syntax\n{c: Chorus note}'),
      } as unknown as File;

      await comp.processFiles([fileValid, fileEmpty, fileCorrupted, fileNonStandard]);

      const items = comp.bulkItems();
      expect(items.length).toBe(4);

      // Valid file is pending and selected
      expect(items[0].title).toBe('Perfect Track');
      expect(items[0].status).toBe('pending');
      expect(items[0].selected).toBe(true);

      // Empty file parsed with fallback title from filename
      expect(items[1].title).toBe('empty');
      expect(items[1].status).toBe('pending');

      // Corrupted file rejected during read is marked as error and deselected
      expect(items[2].status).toBe('error');
      expect(items[2].selected).toBe(false);
      expect(items[2].errorMessage).toContain('Corrupted encoding');

      // Non-standard ChordPro file parsed gracefully
      expect(items[3].status).toBe('pending');
    });

    it('should continue bulk import when a single song creation fails on the server', async () => {
      // First song succeeds, second song fails with HTTP 500
      songsStoreMock.create
        .mockReturnValueOnce(of({ id: 's1', title: 'Song 1' }))
        .mockReturnValueOnce(throwError(() => new Error('Server 500: Database constraint violated')));

      await TestBed.resetTestingModule();
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

      const fixture = TestBed.createComponent(SmartImportDialogComponent);
      const comp = fixture.componentInstance;

      comp.bulkItems.set([
        {
          id: 'b-1',
          fileName: 'song1.pro',
          title: 'Song 1',
          artist: 'Artist 1',
          sectionsCount: 1,
          parsed: { title: 'Song 1', artist: 'Artist 1', sections: [], rawChordPro: '' },
          selected: true,
          status: 'pending',
        },
        {
          id: 'b-2',
          fileName: 'song2.pro',
          title: 'Song 2',
          artist: 'Artist 2',
          sectionsCount: 1,
          parsed: { title: 'Song 2', artist: 'Artist 2', sections: [], rawChordPro: '' },
          selected: true,
          status: 'pending',
        },
      ]);

      await comp.importSelectedBulk();

      expect(comp.bulkItems()[0].status).toBe('done');
      expect(comp.bulkItems()[1].status).toBe('error');
      expect(comp.bulkItems()[1].errorMessage).toContain('Server 500');
      expect(notifyMock.success).toHaveBeenCalledWith(expect.stringContaining('1 canciones con éxito'));
    });

    it('should export setlist with 0 songs cleanly and return 0m total duration', async () => {
      const emptySetlistData: SetlistExportDialogData = {
        setlist: {
          id: 'set-empty',
          name: 'Empty Practice Rehearsal',
          items: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        songs: [],
        bandName: 'Rehearsal Band',
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SetlistExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: emptySetlistData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(SetlistExportDialogComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      expect(comp.totalDurationLabel()).toBe('0m');
      const text = comp.generatePlainText();
      expect(text).toContain('Total: 0 canciones (0m) • 0 TEMAS');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('0 TEMAS • 0m');
    });

    it('should accurately format extreme and invalid song durations (0s, 24h, negative, undefined)', async () => {
      const extremeDurationData: SetlistExportDialogData = {
        setlist: {
          id: 'set-dur',
          name: 'Marathon Set',
          items: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        songs: [
          { id: 'd0', title: 'Intro Chime', artist: 'Artist', durationSec: 0 } as any,
          { id: 'd-epic', title: '24 Hour Jam', artist: 'Artist', durationSec: 86400 } as any,
          { id: 'd-neg', title: 'Negative Glitch', artist: 'Artist', durationSec: -60 } as any,
          { id: 'd-nan', title: 'Undefined Dur', artist: 'Artist', durationSec: undefined } as any,
        ],
        bandName: 'Extreme Band',
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SetlistExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: extremeDurationData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(SetlistExportDialogComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      expect(comp.formatDuration(0)).toBe('0:00');
      expect(comp.formatDuration(86400)).toBe('1440:00');
      expect(comp.formatDuration(-60)).toBe('-1:00');
      expect(comp.formatDuration(undefined as any)).toBe('0:00');

      // Ensure total duration doesn't throw and computes sum
      const totalLabel = comp.totalDurationLabel();
      expect(totalLabel).toBeTruthy();
    });

    it('should format setlist with empty titles, missing metadata, and custom security watermarks safely', async () => {
      const edgeCaseSetlistData: SetlistExportDialogData = {
        setlist: {
          id: 'set-anon',
          name: '',
          items: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        songs: [
          {
            id: 's-empty',
            title: '',
            artist: '',
            key: '',
            bpm: undefined,
            durationSec: 180,
            notes: '',
          } as any,
        ],
        bandName: '',
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SetlistExportDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: edgeCaseSetlistData },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: NotificationsService, useValue: notifyMock },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(SetlistExportDialogComponent);
      const comp = fixture.componentInstance;
      comp.watermark = 'SECRET STAGE TOUR 2026';
      fixture.detectChanges();

      const text = comp.generatePlainText();
      expect(text).toContain('[SECRET STAGE TOUR 2026]');
      expect(text).toContain('01.  - ');

      // Verify DOM renders watermark elements
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.watermark-header-alert')?.textContent).toContain('SECRET STAGE TOUR 2026');
      expect(compiled.querySelector('.watermark-badge')?.textContent).toContain('SECRET STAGE TOUR 2026');
      expect(compiled.querySelector('.stage-watermark-overlay')?.textContent).toContain('SECRET STAGE TOUR 2026');
    });
  });
});
