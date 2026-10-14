import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { parseSmartTab, ParsedSmartSong } from '@bandmate/shared';
import { SongsStore } from '../../state/songs-store';
import { Router } from '@angular/router';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { firstValueFrom } from 'rxjs';

export interface BulkImportItem {
  id: string;
  fileName: string;
  title: string;
  artist: string;
  key?: string;
  bpm?: number;
  sectionsCount: number;
  parsed: ParsedSmartSong;
  selected: boolean;
  status: 'pending' | 'saving' | 'done' | 'error';
  errorMessage?: string;
}

@Component({
  selector: 'app-smart-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatCheckboxModule,
    FormsModule,
  ],
  template: `
    <div class="smart-import-container p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-primary fs-3">auto_fix_high</mat-icon>
          <div>
            <h2 class="m-0 fs-4 fw-bold">Importador Universal & Masivo</h2>
            <div class="text-muted small">ChordPro, OnSong, CifraClub, Ultimate Guitar y texto plano</div>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Segmented Mode Selector -->
      <div class="btn-group w-100 mb-3" role="group">
        <button
          type="button"
          class="btn"
          [class.btn-primary]="mode() === 'single'"
          [class.btn-outline-secondary]="mode() !== 'single'"
          (click)="mode.set('single')"
        >
          <mat-icon class="align-middle me-1" style="font-size: 18px; width: 18px; height: 18px;">content_paste</mat-icon>
          Pega de Texto Individual
        </button>
        <button
          type="button"
          class="btn"
          [class.btn-primary]="mode() === 'bulk'"
          [class.btn-outline-secondary]="mode() !== 'bulk'"
          (click)="mode.set('bulk')"
        >
          <mat-icon class="align-middle me-1" style="font-size: 18px; width: 18px; height: 18px;">upload_file</mat-icon>
          Subida de Archivos Masiva (.pro, .cho, .txt)
        </button>
      </div>

      <!-- MODE 1: SINGLE TEXT IMPORT -->
      @if (mode() === 'single') {
        <p class="text-muted small mb-2">
          Pega tablaturas o acordes en formato <strong>Ultimate Guitar</strong>, <strong>CifraClub</strong>, <strong>ChordPro</strong> o <strong>texto plano</strong>.
        </p>

        <div class="d-flex gap-2 mb-2">
          <button mat-stroked-button class="btn-sm rounded-pill" (click)="loadSample('oasis')">
            Ejemplo: Oasis (UG)
          </button>
          <button mat-stroked-button class="btn-sm rounded-pill" (click)="loadSample('standByMe')">
            Ejemplo: 2 Líneas Texto
          </button>
        </div>

        <mat-form-field appearance="outline" class="w-100 mb-2">
          <mat-label>Pega aquí el contenido de la canción...</mat-label>
          <textarea
            matInput
            [(ngModel)]="rawText"
            rows="8"
            placeholder="[Verse 1]&#10;G             Em&#10;When the night has come..."
            style="font-family: monospace; font-size: 13px;"
            (ngModelChange)="onTextChange()"
          ></textarea>
        </mat-form-field>

        @if (parsed(); as p) {
          <div class="import-preview bg-light p-3 rounded-3 mb-3 border">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div>
                <div class="fw-bold fs-5 text-primary">{{ p.title }}</div>
                <div class="text-muted small">{{ p.artist }} • Tonalidad: {{ p.key || 'Auto' }} • BPM: {{ p.bpm || '120' }}</div>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                {{ p.sections.length }} Secciones detectadas
              </span>
            </div>

            <div class="sections-preview small font-monospace opacity-75" style="max-height: 120px; overflow-y: auto;">
              @for (sec of p.sections; track sec.id) {
                <div class="mb-1">
                  <strong>[{{ sec.name || sec.type }}]</strong> ({{ sec.lines.length }} líneas)
                </div>
              }
            </div>
          </div>
        }

        <div class="d-flex justify-content-end gap-2 mt-3">
          <button mat-button mat-dialog-close>Cancelar</button>
          <button
            mat-flat-button
            color="primary"
            [disabled]="!parsed() || isSaving()"
            (click)="saveAndPlay()"
            class="rounded-pill px-4"
          >
            <mat-icon class="me-1">play_circle</mat-icon>
            {{ isSaving() ? 'Guardando...' : 'Importar y Tocar' }}
          </button>
        </div>
      }

      <!-- MODE 2: BULK FILES UPLOAD -->
      @if (mode() === 'bulk') {
        <div
          class="bulk-upload-dropzone p-4 text-center border border-2 border-dashed rounded-3 mb-3 bg-light"
          [class.drag-active]="isDraggingOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onFilesDropped($event)"
        >
          <mat-icon class="text-primary mb-2" style="font-size: 44px; width: 44px; height: 44px;">cloud_upload</mat-icon>
          <h5 class="fw-bold mb-1">Arrastra tus archivos de canciones aquí</h5>
          <p class="text-muted small mb-3">
            Soporta archivos <code>.pro</code>, <code>.cho</code>, <code>.chopro</code>, <code>.onsong</code>, <code>.crd</code>, <code>.txt</code>
          </p>
          <input
            #bulkFileInput
            type="file"
            multiple
            accept=".pro,.cho,.chopro,.onsong,.crd,.txt"
            style="display: none;"
            (change)="onFilesSelected($event)"
          />
          <button mat-flat-button color="accent" class="rounded-pill" (click)="bulkFileInput.click()">
            <mat-icon class="me-1">folder_open</mat-icon>
            Seleccionar Archivos del Ordenador
          </button>
        </div>

        @if (bulkItems().length > 0) {
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex align-items-center gap-2">
              <mat-checkbox
                [checked]="isAllBulkSelected()"
                [indeterminate]="isSomeBulkSelected()"
                (change)="toggleAllBulk($event.checked)"
              >
                Seleccionar todos ({{ selectedBulkCount() }} / {{ bulkItems().length }})
              </mat-checkbox>
            </div>
            <button mat-button class="text-danger btn-sm" (click)="clearBulkList()">
              <mat-icon class="me-1" style="font-size: 16px; width: 16px; height: 16px;">delete_sweep</mat-icon>
              Limpiar lista
            </button>
          </div>

          <!-- Progress Bar during bulk import -->
          @if (isSavingBulk()) {
            <div class="mb-3">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Importando repertorio...</span>
                <span>{{ bulkProgress() }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="bulkProgress()"></mat-progress-bar>
            </div>
          }

          <!-- Items list -->
          <div class="bulk-list border rounded-3 p-2 bg-white mb-3" style="max-height: 280px; overflow-y: auto;">
            @for (item of bulkItems(); track item.id) {
              <div class="d-flex align-items-center gap-2 p-2 border-bottom hover-bg">
                <mat-checkbox
                  [checked]="item.selected"
                  [disabled]="isSavingBulk()"
                  (change)="toggleBulkItem(item.id, $event.checked)"
                ></mat-checkbox>
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2">
                    <input
                      type="text"
                      class="form-control form-control-sm fw-bold border-0 p-0 shadow-none bg-transparent"
                      [(ngModel)]="item.title"
                      placeholder="Título de la canción"
                      [disabled]="isSavingBulk()"
                    />
                  </div>
                  <div class="d-flex align-items-center gap-2 small text-muted">
                    <input
                      type="text"
                      class="form-control form-control-sm border-0 p-0 shadow-none text-muted bg-transparent"
                      [(ngModel)]="item.artist"
                      placeholder="Artista"
                      style="width: 140px;"
                      [disabled]="isSavingBulk()"
                    />
                    <span>• {{ item.key || 'Tonalidad ?' }}</span>
                    <span>• {{ item.bpm ? item.bpm + ' BPM' : '120 BPM' }}</span>
                    <span>• {{ item.sectionsCount }} secciones</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                  @if (item.status === 'done') {
                    <span class="badge bg-success"><mat-icon style="font-size: 14px; width: 14px; height: 14px;">check</mat-icon> OK</span>
                  } @else if (item.status === 'saving') {
                    <span class="badge bg-primary">Guardando...</span>
                  } @else if (item.status === 'error') {
                    <span class="badge bg-danger" [title]="item.errorMessage">Error</span>
                  } @else {
                    <span class="badge bg-secondary-subtle text-secondary">{{ item.fileName }}</span>
                    <button
                      mat-icon-button
                      class="text-muted btn-sm"
                      style="width: 28px; height: 28px; line-height: 28px;"
                      [disabled]="isSavingBulk()"
                      (click)="removeBulkItem(item.id)"
                      title="Quitar de la lista"
                    >
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <div class="d-flex justify-content-end gap-2 mt-3">
          <button mat-button mat-dialog-close [disabled]="isSavingBulk()">Cancelar</button>
          <button
            mat-flat-button
            color="primary"
            class="rounded-pill px-4"
            [disabled]="selectedBulkCount() === 0 || isSavingBulk()"
            (click)="importSelectedBulk()"
          >
            <mat-icon class="me-1">library_add</mat-icon>
            {{ isSavingBulk() ? 'Importando canciones...' : 'Importar ' + selectedBulkCount() + ' Canciones' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .smart-import-container {
      max-width: 680px;
    }
    .hover-bg:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    .bulk-upload-dropzone {
      border-color: #cbd5e1 !important;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .bulk-upload-dropzone:hover {
      border-color: #3b82f6 !important;
      background-color: rgba(59, 130, 246, 0.04) !important;
    }
    .bulk-upload-dropzone.drag-active {
      border-color: #2563eb !important;
      background-color: rgba(37, 99, 235, 0.08) !important;
      transform: scale(1.01);
    }
  `],
})
export class SmartImportDialogComponent {
  private dialogRef = inject(MatDialogRef<SmartImportDialogComponent>);
  private songsStore = inject(SongsStore);
  private router = inject(Router);
  private notify = inject(NotificationsService);

  readonly mode = signal<'single' | 'bulk'>('single');

  // Single mode state
  rawText = '';
  readonly parsed = signal<ParsedSmartSong | null>(null);
  readonly isSaving = signal(false);

  // Bulk mode state
  readonly bulkItems = signal<BulkImportItem[]>([]);
  readonly isSavingBulk = signal(false);
  readonly bulkProgress = signal(0);
  readonly isDraggingOver = signal(false);

  readonly selectedBulkCount = computed(
    () => this.bulkItems().filter((item) => item.selected && item.status !== 'done').length
  );

  readonly isAllBulkSelected = computed(() => {
    const items = this.bulkItems().filter((i) => i.status !== 'done');
    return items.length > 0 && items.every((i) => i.selected);
  });

  readonly isSomeBulkSelected = computed(() => {
    const items = this.bulkItems().filter((i) => i.status !== 'done');
    const count = items.filter((i) => i.selected).length;
    return count > 0 && count < items.length;
  });

  onTextChange() {
    if (!this.rawText.trim()) {
      this.parsed.set(null);
      return;
    }
    try {
      const res = parseSmartTab(this.rawText);
      this.parsed.set(res);
    } catch (e) {
      console.warn('Error parsing tab:', e);
    }
  }

  loadSample(sample: 'oasis' | 'standByMe') {
    if (sample === 'oasis') {
      this.rawText = `{title: Wonderwall}
{artist: Oasis}
{key: Em}
{tempo: 87}
{capo: 2}

[Verse 1]
[ch]Em7[/ch]Today is gonna be the day that they're [ch]G[/ch]gonna throw it back to [ch]Dsus4[/ch]you [ch]A7sus4[/ch]
[ch]Em7[/ch]By now you should've somehow realized [ch]G[/ch]what you gotta [ch]Dsus4[/ch]do [ch]A7sus4[/ch]

[Chorus]
Because [ch]C[/ch]maybe, [ch]Em7[/ch] [ch]G[/ch] you're gonna be the one that [ch]Em7[/ch]saves me`;
    } else {
      this.rawText = `Stand By Me
Ben E. King

Verse 1:
A                                 F#m
When the night has come and the land is dark
         D             E                A
And the moon is the only light we'll see

Chorus:
                 A                         F#m
So darling, darling stand by me, oh stand by me
     D        E        A
Oh, stand, stand by me`;
    }
    this.onTextChange();
  }

  saveAndPlay() {
    const p = this.parsed();
    if (!p) return;

    this.isSaving.set(true);

    this.songsStore.create({
      title: p.title,
      artist: p.artist,
      key: p.key,
      bpm: p.bpm,
      durationSec: 180,
      notes: p.capo ? `Capo ${p.capo}. Importado con Smart Parser` : 'Importado con Smart Parser',
      sections: p.sections,
    }).subscribe({
      next: (song: any) => {
        this.isSaving.set(false);
        this.dialogRef.close();
        if (song?.id) {
          this.router.navigate(['/songs', song.id]);
        }
      },
      error: (err) => {
        console.error('Failed to create song:', err);
        this.isSaving.set(false);
      },
    });
  }

  // --- Bulk Import Handling ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
  }

  onFilesDropped(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    await this.processFiles(files);
    input.value = ''; // Reset input to allow re-selection
  }

  async processFiles(files: FileList | File[]) {
    const newItems: BulkImportItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const parsed = parseSmartTab(text, file.name);
        newItems.push({
          id: `bulk-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          title: parsed.title,
          artist: parsed.artist,
          key: parsed.key,
          bpm: parsed.bpm,
          sectionsCount: parsed.sections.length,
          parsed,
          selected: true,
          status: 'pending',
        });
      } catch (err: any) {
        console.warn(`Could not parse file ${file.name}:`, err);
        newItems.push({
          id: `bulk-err-${Date.now()}-${i}`,
          fileName: file.name,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Desconocido',
          sectionsCount: 0,
          parsed: {
            title: file.name,
            artist: 'Desconocido',
            sections: [],
            rawChordPro: '',
          },
          selected: false,
          status: 'error',
          errorMessage: err?.message || 'Error de lectura',
        });
      }
    }

    this.bulkItems.set([...this.bulkItems(), ...newItems]);
  }

  removeBulkItem(id: string) {
    this.bulkItems.update((items) => items.filter((i) => i.id !== id));
  }

  toggleAllBulk(checked: boolean) {
    this.bulkItems.update((items) =>
      items.map((item) => (item.status === 'done' ? item : { ...item, selected: checked }))
    );
  }

  toggleBulkItem(id: string, checked: boolean) {
    this.bulkItems.update((items) =>
      items.map((item) => (item.id === id ? { ...item, selected: checked } : item))
    );
  }

  clearBulkList() {
    this.bulkItems.set([]);
  }

  async importSelectedBulk() {
    const itemsToImport = this.bulkItems().filter((i) => i.selected && i.status !== 'done');
    if (itemsToImport.length === 0) return;

    this.isSavingBulk.set(true);
    this.bulkProgress.set(0);

    let successCount = 0;

    for (let idx = 0; idx < itemsToImport.length; idx++) {
      const item = itemsToImport[idx];
      this.updateItemStatus(item.id, 'saving');

      try {
        await firstValueFrom(
          this.songsStore.create({
            title: item.title,
            artist: item.artist,
            key: item.key,
            bpm: item.bpm,
            durationSec: 180,
            notes: item.parsed.capo
              ? `Capo ${item.parsed.capo}. Importado de ${item.fileName}`
              : `Importado de ${item.fileName}`,
            sections: item.parsed.sections,
          })
        );
        this.updateItemStatus(item.id, 'done');
        successCount++;
      } catch (err: any) {
        console.error(`Error importing ${item.title}:`, err);
        this.updateItemStatus(item.id, 'error', err?.message || 'Error al guardar');
      }

      this.bulkProgress.set(Math.round(((idx + 1) / itemsToImport.length) * 100));
    }

    this.isSavingBulk.set(false);
    this.notify.success(`¡Se han importado ${successCount} canciones con éxito!`);

    // Auto-close if all imported successfully
    if (successCount === itemsToImport.length) {
      setTimeout(() => this.dialogRef.close(), 600);
    }
  }

  private updateItemStatus(id: string, status: BulkImportItem['status'], errorMessage?: string) {
    this.bulkItems.update((items) =>
      items.map((item) => (item.id === id ? { ...item, status, errorMessage } : item))
    );
  }
}
