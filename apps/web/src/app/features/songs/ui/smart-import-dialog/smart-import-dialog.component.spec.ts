import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartImportDialogComponent } from './smart-import-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { SongsStore } from '../../state/songs-store';
import { Router } from '@angular/router';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { of } from 'rxjs';

describe('SmartImportDialogComponent (Universal & Bulk Files Importer)', () => {
  let component: SmartImportDialogComponent;
  let fixture: ComponentFixture<SmartImportDialogComponent>;
  let songsStoreMock: any;
  let dialogRefMock: any;
  let routerMock: any;
  let notifyMock: any;

  beforeEach(async () => {
    songsStoreMock = {
      create: vi.fn().mockReturnValue(of({ id: 'new-song-1', title: 'Test Song' })),
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
        { provide: MatDialogRef, useValue: dialogRefMock },
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
});
