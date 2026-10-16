import { Component, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { Setlist, Song } from '@bandmate/shared';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';

export type StageExportLayout = 'giant' | 'structured' | 'tech';
export type StageFontSize = 'standard' | 'large' | 'giant';

export interface SetlistExportOptions {
  bandName: string;
  watermark: string;
  layout: StageExportLayout;
  fontSize: StageFontSize;
  showKeys: boolean;
  showBpms: boolean;
  showDurations: boolean;
  showNotes: boolean;
}

export interface SetlistExportDialogData {
  setlist: Setlist;
  songs: Song[];
  bandName?: string;
}

@Component({
  selector: 'app-setlist-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
  ],
  template: `
    <div class="setlist-export-container p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-primary fs-3">picture_as_pdf</mat-icon>
          <div>
            <h2 class="m-0 fs-4 fw-bold">Exportador de Setlist de Escenario</h2>
            <div class="text-muted small">Genera hojas de ruta impresas y PDFs de alta legibilidad para directos</div>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Settings Toolbar -->
      <div class="row g-2 mb-3 bg-light p-3 rounded-3 border">
        <div class="col-md-3">
          <label class="form-label small fw-bold mb-1">Nombre de la Banda / Cabecera</label>
          <input
            type="text"
            class="form-control form-control-sm"
            [(ngModel)]="bandName"
            placeholder="Ej. The Rockers Live"
          />
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold mb-1">Diseño de Hoja de Escenario</label>
          <select class="form-select form-select-sm" [(ngModel)]="layout">
            <option value="giant">Escenario (Letra Gigante / Stand)</option>
            <option value="structured">Completo (Con Estructura &amp; Cues)</option>
            <option value="tech">Ficha Técnica (Sonido &amp; Tiempos)</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold mb-1">Tamaño de Fuente (Stand)</label>
          <select class="form-select form-select-sm" [(ngModel)]="fontSize" data-testid="stage-font-size-select">
            <option value="standard">Normal (1.0rem)</option>
            <option value="large">Grande (1.25rem)</option>
            <option value="giant">Gigante (1.75rem)</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold mb-1">Marca de Agua / Subtítulo</label>
          <input
            type="text"
            class="form-control form-control-sm"
            [(ngModel)]="watermark"
            placeholder="Ej. GIRA 2026 - CONFIDENCIAL"
          />
        </div>

        <div class="col-12 mt-2 pt-2 border-top d-flex gap-3 flex-wrap small">
          <mat-checkbox [(ngModel)]="showKeys">Mostrar Tonalidades</mat-checkbox>
          <mat-checkbox [(ngModel)]="showBpms">Mostrar BPM / Tempo</mat-checkbox>
          <mat-checkbox [(ngModel)]="showDurations">Mostrar Duraciones</mat-checkbox>
          <mat-checkbox [(ngModel)]="showNotes">Mostrar Notas de Ensayo</mat-checkbox>
        </div>
      </div>

      <!-- Setlist Stage Sheet Live Preview -->
      <div class="sheet-preview-wrapper border rounded-3 p-4 mb-3 bg-white shadow-sm position-relative overflow-hidden" #stageSheet>
        <!-- Stage Watermark Background Overlay -->
        @if (watermark) {
          <div class="stage-watermark-overlay" aria-hidden="true">
            {{ watermark }}
          </div>
        }

        <!-- Print Header -->
        <div class="d-flex justify-content-between align-items-end pb-3 mb-3 border-bottom border-dark border-2 position-relative">
          <div>
            <div class="text-uppercase fw-bold tracking-widest text-secondary small">{{ bandName || 'BANDMATE LIVE' }}</div>
            <h1 class="m-0 fw-black display-6">{{ data.setlist.name }}</h1>
            @if (watermark) {
              <!-- Watermark Header Alert -->
              <div class="watermark-header-alert d-flex align-items-center gap-1 text-danger fw-bold text-uppercase tracking-wider small mt-1">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">lock</mat-icon>
                <span>{{ watermark }}</span>
              </div>
            }
          </div>
          <div class="text-end d-flex flex-column align-items-end gap-2">
            @if (watermark) {
              <!-- High-Contrast Watermark Badge -->
              <div class="watermark-badge badge bg-danger text-white text-uppercase fw-bold px-3 py-1 tracking-wider shadow-sm border border-light">
                <mat-icon class="align-middle me-1" style="font-size: 14px; width: 14px; height: 14px;">security</mat-icon>
                {{ watermark }}
              </div>
            }
            <div class="badge bg-dark text-white fs-6 px-3 py-2 rounded-pill">
              {{ data.songs.length }} TEMAS • {{ totalDurationLabel() }}
            </div>
          </div>
        </div>

        <!-- Song Rows based on Layout & FontSize -->
        <div class="stage-songs-list position-relative" [ngClass]="'font-size-' + fontSize">
          @for (song of data.songs; track song.id; let idx = $index) {
            <div
              class="song-print-row d-flex align-items-center justify-content-between py-2 border-bottom"
              [class.py-3]="layout === 'giant' || fontSize === 'giant'"
            >
              <div class="d-flex align-items-center gap-3">
                <span class="song-index fw-black text-secondary" [class.fs-4]="layout === 'giant' && fontSize === 'standard'">
                  {{ (idx + 1) < 10 ? '0' + (idx + 1) : (idx + 1) }}
                </span>
                <div>
                  <div
                    class="song-title fw-bold"
                    [class.fs-4]="layout === 'giant' && fontSize === 'standard'"
                    [class.fs-5]="layout !== 'giant' && fontSize === 'standard'"
                  >
                    {{ song.title }}
                  </div>
                  <div class="song-sub small text-muted">
                    {{ song.artist }}
                    @if (showNotes && song.notes) {
                      <span class="text-primary fw-medium ms-2">• {{ song.notes }}</span>
                    }
                  </div>
                  @if (layout === 'structured' && song.sections && song.sections.length > 0) {
                    <div class="song-structure mt-1 small font-monospace text-secondary">
                      @for (s of song.sections; track s.id) {
                        <span class="badge bg-light text-dark border me-1">{{ s.name || s.type }}</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="d-flex align-items-center gap-2 text-end">
                @if (showKeys && song.key) {
                  <span class="badge bg-warning-subtle text-dark border border-warning fw-bold px-2 py-1 stage-badge-key" [class.fs-6]="layout === 'giant' && fontSize === 'standard'">
                    {{ song.key }}
                  </span>
                }
                @if (showBpms && song.bpm) {
                  <span class="badge bg-secondary-subtle text-secondary px-2 py-1 stage-badge-bpm" [class.fs-6]="layout === 'giant' && fontSize === 'standard'">
                    {{ song.bpm }} BPM
                  </span>
                }
                @if (showDurations && song.durationSec) {
                  <span class="badge bg-light text-muted border px-2 py-1 stage-badge-dur">
                    {{ formatDuration(song.durationSec) }}
                  </span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center pt-3 mt-4 border-top text-muted small position-relative">
          <span>Generado con Bandmate • www.bandmate.live</span>
          <span>Duración total estimada: <strong>{{ totalDurationLabel() }}</strong></span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-between align-items-center gap-2">
        <div class="d-flex gap-2">
          <button mat-stroked-button class="rounded-pill" (click)="copySetlistText()">
            <mat-icon class="me-1">content_copy</mat-icon>
            Copiar Texto
          </button>
          <button mat-stroked-button class="rounded-pill" (click)="downloadSetlistTxt()">
            <mat-icon class="me-1">download</mat-icon>
            Descargar .txt
          </button>
        </div>

        <div class="d-flex gap-2">
          <button mat-button mat-dialog-close>Cerrar</button>
          <button mat-flat-button color="primary" class="rounded-pill px-4" (click)="printStageSheet()">
            <mat-icon class="me-1">print</mat-icon>
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setlist-export-container {
      max-width: 780px;
    }
    .sheet-preview-wrapper {
      max-height: 480px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .song-print-row:last-child {
      border-bottom: none !important;
    }
    .tracking-widest {
      letter-spacing: 0.15em;
    }
    .fw-black {
      font-weight: 900;
    }
    .watermark-badge {
      font-size: 0.75rem;
      letter-spacing: 0.12em;
    }
    .watermark-header-alert {
      letter-spacing: 0.08em;
    }
    .stage-watermark-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 3.5rem;
      font-weight: 900;
      color: rgba(220, 38, 38, 0.07);
      text-transform: uppercase;
      letter-spacing: 0.25em;
      pointer-events: none;
      white-space: nowrap;
      user-select: none;
      z-index: 0;
    }

    .song-index,
    .stage-badge-key,
    .stage-badge-bpm,
    .stage-badge-dur {
      font-family: var(--bm-font-mono);
      font-variant-numeric: tabular-nums;
    }

    /* Stage Font Size Independent Controls */
    .font-size-standard .song-title {
      font-size: 1.05rem;
      line-height: 1.3;
    }
    .font-size-standard .song-index {
      font-size: 1.05rem;
    }
    .font-size-standard .song-sub {
      font-size: 0.85rem;
    }
    .font-size-standard .stage-badge-key,
    .font-size-standard .stage-badge-bpm {
      font-size: 0.85rem;
    }

    .font-size-large .song-title {
      font-size: 1.35rem;
      line-height: 1.3;
    }
    .font-size-large .song-index {
      font-size: 1.35rem;
    }
    .font-size-large .song-sub {
      font-size: 0.95rem;
    }
    .font-size-large .stage-badge-key,
    .font-size-large .stage-badge-bpm {
      font-size: 0.95rem;
      padding: 0.35rem 0.65rem !important;
    }

    .font-size-giant .song-title {
      font-size: 1.75rem;
      line-height: 1.25;
    }
    .font-size-giant .song-index {
      font-size: 1.75rem;
    }
    .font-size-giant .song-sub {
      font-size: 1.05rem;
    }
    .font-size-giant .stage-badge-key,
    .font-size-giant .stage-badge-bpm {
      font-size: 1.15rem;
      padding: 0.4rem 0.8rem !important;
    }

    @media print {
      @page {
        margin: 10mm;
        size: auto;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden !important;
      }
      .sheet-preview-wrapper,
      .sheet-preview-wrapper * {
        visibility: visible !important;
      }
      .sheet-preview-wrapper {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .stage-watermark-overlay {
        color: rgba(220, 38, 38, 0.12) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .watermark-badge {
        background-color: #dc2626 !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .song-print-row {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `],
})
export class SetlistExportDialogComponent {
  readonly data: SetlistExportDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<SetlistExportDialogComponent>);
  private notify = inject(NotificationsService);

  bandName = this.data.bandName || 'Bandmate Band';
  watermark = 'ESCENARIO / DIRECTO 2026';
  layout: StageExportLayout = 'giant';
  fontSize: StageFontSize = 'large';

  showKeys = true;
  showBpms = true;
  showDurations = true;
  showNotes = true;

  totalDurationLabel(): string {
    if (!this.data.songs || this.data.songs.length === 0) {
      return '0m';
    }
    const totalSec = this.data.songs.reduce((acc, s) => acc + (Number(s.durationSec) || 210), 0);
    if (totalSec === 0) {
      return '0m';
    }
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs ? secs + 's' : ''}`.trim();
  }

  formatDuration(sec: number | string): string {
    const s = Number(sec) || 0;
    const mins = Math.floor(s / 60);
    const remain = s % 60;
    return `${mins}:${remain < 10 ? '0' + remain : remain}`;
  }

  printStageSheet() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  generatePlainText(): string {
    const headerLines: string[] = [
      `========================================`,
      `${this.bandName.toUpperCase()} — ${this.data.setlist.name.toUpperCase()}`,
    ];
    if (this.watermark) {
      headerLines.push(`[${this.watermark.toUpperCase()}]`);
    }
    headerLines.push(`Total: ${this.data.songs.length} canciones (${this.totalDurationLabel()}) • ${this.data.songs.length} TEMAS`);
    headerLines.push(`========================================`);
    headerLines.push('');

    const lines: string[] = [...headerLines];

    this.data.songs.forEach((song, idx) => {
      const num = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      const key = this.showKeys && song.key ? `[${song.key}]` : '';
      const bpm = this.showBpms && song.bpm ? `${song.bpm} BPM` : '';
      const dur = this.showDurations && song.durationSec ? `(${this.formatDuration(song.durationSec)})` : '';
      const notes = this.showNotes && song.notes ? `// ${song.notes}` : '';

      lines.push(`${num}. ${song.title} - ${song.artist} ${key} ${bpm} ${dur} ${notes}`.trim());
    });

    lines.push('');
    lines.push('Generado con Bandmate • www.bandmate.live');
    return lines.join('\n');
  }

  copySetlistText() {
    const text = this.generatePlainText();
    navigator.clipboard?.writeText(text).then(() => {
      this.notify.success('Setlist copiado al portapapeles');
    });
  }

  downloadSetlistTxt() {
    const text = this.generatePlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.data.setlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_stage_setlist.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.success('Archivo de setlist descargado');
  }
}
