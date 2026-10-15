import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  StageElement,
  StageElementType,
  STAGE_ELEMENT_TEMPLATES,
  TechRiderMeta,
} from '../../stage-plot.model';
import { NotificationsService } from '../../../../../shared/ui/notifications/notifications.service';

export type TechRiderLayout = 'full' | 'compact' | 'patch-only';

export interface TechRiderInputChannel {
  channel: number;
  id: string;
  label: string;
  type?: StageElementType | string;
  mic?: string;
  phantom?: boolean;
  stand?: string;
  monitorNeeds?: string;
  [key: string]: any;
}

export interface TechRiderExportDialogData {
  meta: TechRiderMeta | (TechRiderMeta & { [key: string]: any });
  elements: StageElement[] | any[];
  channelInputList: TechRiderInputChannel[];
  stageDimensions?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-tech-rider-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="tech-rider-dialog-container p-4">
      <!-- Modal Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 no-print">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-primary fs-3">picture_as_pdf</mat-icon>
          <div>
            <h2 class="m-0 fs-4 fw-bold">Exportador de Tech Rider & Input List</h2>
            <div class="text-muted small">Genera fichas técnicas de escenario y lista de canales para FOH / PA</div>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Settings Toolbar -->
      <div class="row g-2 mb-3 bg-light p-3 rounded-3 border no-print">
        <div class="col-md-4">
          <label class="form-label small fw-bold mb-1">Nombre de la Banda / Artista</label>
          <input
            type="text"
            class="form-control form-control-sm"
            [(ngModel)]="bandName"
            placeholder="Ej. The Rockers Band"
          />
        </div>
        <div class="col-md-4">
          <label class="form-label small fw-bold mb-1">Formato de Exportación</label>
          <select class="form-select form-select-sm" [(ngModel)]="layout">
            <option value="full">📄 Completo (Escenario + Canales + Requisitos)</option>
            <option value="compact">⚡ Compacto (Escenario y Canales Principales)</option>
            <option value="patch-only">🎛️ Solo Patch Sheet (Lista de Canales FOH)</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label small fw-bold mb-1">Dimensiones de Escenario</label>
          <input
            type="text"
            class="form-control form-control-sm"
            [(ngModel)]="stageDimensions"
            placeholder="Ej. 8m x 6m (Mínimo)"
          />
        </div>

        <div class="col-12 mt-2 pt-2 border-top d-flex gap-3 flex-wrap small">
          <mat-checkbox [(ngModel)]="includeStagePlot">Incluir Plano 2D</mat-checkbox>
          <mat-checkbox [(ngModel)]="includeChannelList">Incluir Input List</mat-checkbox>
          <mat-checkbox [(ngModel)]="includeTechnicalSpecs">Incluir Requisitos Técnicos</mat-checkbox>
          <mat-checkbox [(ngModel)]="includeHospitality">Incluir Hospitalidad / Camerinos</mat-checkbox>
        </div>
      </div>

      <!-- Live Sheet Preview (Rendered as Printable PDF Sheet) -->
      <div class="rider-preview-wrapper border rounded-3 p-4 mb-3 bg-white shadow-sm" #riderSheet>
        <!-- Rider Header Banner -->
        <div class="d-flex justify-content-between align-items-start pb-3 mb-3 border-bottom border-dark border-2">
          <div>
            <div class="text-uppercase fw-bold text-secondary small tracking-widest">
              BANDMATE TECH RIDER & STAGE SPECIFICATION
            </div>
            <h1 class="m-0 fw-black display-6">{{ bandName || data.meta.bandName }}</h1>
            <div class="text-primary small fw-bold mt-1">
              {{ watermark }}
            </div>
          </div>
          <div class="text-end small">
            <div class="fw-bold">{{ data.meta.venueName || 'Sala / Festival' }}</div>
            <div class="text-muted">{{ data.meta.date }}</div>
            <div class="badge bg-dark text-white px-2 py-1 mt-1">
              {{ data.channelInputList.length }} CANALES FOH
            </div>
          </div>
        </div>

        <!-- Technical & Venue Specs HUD -->
        <div class="row g-2 p-2 mb-3 bg-light rounded-3 border small">
          <div class="col-sm-3">
            <div class="text-muted">Contacto Técnico / FOH:</div>
            <div class="fw-bold">{{ data.meta.contactPerson || 'Por definir' }}</div>
          </div>
          <div class="col-sm-3">
            <div class="text-muted">Teléfono / Móvil:</div>
            <div class="fw-bold">{{ data.meta.contactPhone || 'N/A' }}</div>
          </div>
          <div class="col-sm-3">
            <div class="text-muted">Email de Gira:</div>
            <div class="fw-bold">{{ data.meta.contactEmail || 'N/A' }}</div>
          </div>
          <div class="col-sm-3">
            <div class="text-muted">Dimensiones Escenario:</div>
            <div class="fw-bold text-primary">{{ stageDimensions }}</div>
          </div>
        </div>

        <!-- Stage Plot 2D Diagram (if toggled and layout permits) -->
        @if (includeStagePlot && layout !== 'patch-only') {
          <div class="stage-plot-section mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <h6 class="fw-bold text-uppercase m-0 small text-secondary">
                1. Plano de Escenario (Distribución 2D)
              </h6>
              <span class="badge bg-secondary-subtle text-secondary small">
                UPSTAGE / BACKLINE (FONDO)
              </span>
            </div>

            <div class="preview-stage-canvas position-relative rounded-3 border">
              <div class="preview-backdrop-grid" aria-hidden="true"></div>
              <div class="preview-center-line" aria-hidden="true"></div>
              <div class="preview-side-marker left">STAGE RIGHT (P.A. L)</div>
              <div class="preview-side-marker right">STAGE LEFT (P.A. R)</div>

              @for (el of data.elements; track el.id) {
                <div
                  class="preview-token position-absolute"
                  [style.left.%]="el.x"
                  [style.top.%]="el.y"
                >
                  <div class="preview-bubble">
                    <mat-icon>{{ getIconForType(el.type) }}</mat-icon>
                  </div>
                  <div class="preview-label">{{ el.label }}</div>
                </div>
              }
            </div>

            <div class="text-center mt-1">
              <span class="badge bg-primary text-white px-3 py-1 text-uppercase fw-bold" style="font-size: 10px;">
                DOWNSTAGE / FRENTE DE ESCENARIO & PÚBLICO
              </span>
            </div>
          </div>
        }

        <!-- Numbered Channel Input List Table -->
        @if (includeChannelList) {
          <div class="channel-list-section mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold text-uppercase m-0 small text-secondary">
                2. Lista de Canales & Parcheo (Channel Input List)
              </h6>
              <span class="badge bg-info-subtle text-dark border small">
                Patch Mesa de Sonido (FOH & Monitores)
              </span>
            </div>

            <table class="table table-sm table-bordered align-middle font-monospace small mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 50px;" class="text-center">CH</th>
                  <th>Instrumento / Fuente</th>
                  <th>Micrófono / Entrada</th>
                  <th>Soporte</th>
                  <th style="width: 60px;" class="text-center">+48V</th>
                  <th>Requisitos Monitor</th>
                </tr>
              </thead>
              <tbody>
                @for (ch of data.channelInputList; track ch.id) {
                  <tr>
                    <td class="text-center fw-bold text-primary">
                      {{ ch.channel < 10 ? '0' + ch.channel : ch.channel }}
                    </td>
                    <td class="fw-bold">{{ ch.label }}</td>
                    <td>{{ ch.mic }}</td>
                    <td>{{ ch.stand }}</td>
                    <td class="text-center">
                      @if (ch.phantom) {
                        <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-1">SÍ</span>
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td>{{ ch.monitorNeeds }}</td>
                  </tr>
                }
                @if (data.channelInputList.length === 0) {
                  <tr>
                    <td colspan="6" class="text-center py-2 text-muted">
                      No hay entradas registradas en la lista de canales.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Technical & Hospitality Specs -->
        @if (includeTechnicalSpecs && layout !== 'patch-only') {
          <div class="technical-specs-section mb-3">
            <h6 class="fw-bold text-uppercase mb-2 small text-secondary">
              3. Requisitos Técnicos, Audio & Electricidad
            </h6>
            <div class="row g-2 small">
              <div class="col-md-6">
                <div class="p-2 border rounded-2 bg-light h-100">
                  <div class="fw-bold text-dark mb-1">🎛️ Sistema de Monitores & P.A.</div>
                  <ul class="m-0 ps-3 text-secondary">
                    <li><strong>{{ data.meta.monitorMixes || 3 }}</strong> envíos de monitor independientes (pre-fader).</li>
                    <li>P.A. estéreo calibrada y con suficiente headroom para la sala.</li>
                    <li>Técnico de monitores / FOH disponible durante prueba de sonido (mín. 45 min).</li>
                  </ul>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-2 border rounded-2 bg-light h-100">
                  <div class="fw-bold text-dark mb-1">⚡ Tomas de Corriente AC</div>
                  <ul class="m-0 ps-3 text-secondary">
                    <li><strong>{{ data.meta.powerDrops || 3 }}</strong> tomas Schuko 220V independientes de la línea de luces.</li>
                    <li>Puntos de corriente limpios con toma de tierra verificada.</li>
                    <li>Ubicación en batería, bajo y pedalera de guitarra principal.</li>
                  </ul>
                </div>
              </div>
            </div>

            @if (data.meta.notes) {
              <div class="p-2 mt-2 border rounded-2 bg-light small">
                <div class="fw-bold text-dark">Observaciones adicionales:</div>
                <div class="text-secondary">{{ data.meta.notes }}</div>
              </div>
            }
          </div>
        }

        @if (includeHospitality && layout === 'full') {
          <div class="hospitality-section mb-3">
            <h6 class="fw-bold text-uppercase mb-2 small text-secondary">
              4. Hospitalidad & Camerinos
            </h6>
            <div class="p-2 border rounded-2 bg-light small text-secondary">
              Camerino cerrado con llave, espejo de cuerpo entero, toallas limpias para escenario y agua mineral a temperatura ambiente.
            </div>
          </div>
        }

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center pt-2 mt-3 border-top text-muted small">
          <span>Generado con Bandmate • www.bandmate.live</span>
          <span>Ficha Técnica Oficial para Directos</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-between align-items-center gap-2 no-print">
        <div class="d-flex gap-2">
          <button mat-stroked-button class="rounded-pill" (click)="copyPatchSheetText()">
            <mat-icon class="me-1">content_copy</mat-icon>
            Copiar Texto FOH
          </button>
          <button mat-stroked-button class="rounded-pill" (click)="downloadPatchSheetTxt()">
            <mat-icon class="me-1">download</mat-icon>
            Descargar .txt
          </button>
        </div>

        <div class="d-flex gap-2">
          <button mat-button mat-dialog-close>Cerrar</button>
          <button mat-flat-button color="primary" class="rounded-pill px-4" (click)="printRiderSheet()">
            <mat-icon class="me-1">print</mat-icon>
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tech-rider-dialog-container {
      max-width: 860px;
    }
    .rider-preview-wrapper {
      max-height: 520px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .tracking-widest {
      letter-spacing: 0.15em;
    }
    .fw-black {
      font-weight: 900;
    }

    /* ───── Preview Stage Canvas ───── */
    .preview-stage-canvas {
      width: 100%;
      height: 260px;
      background: #0f172a;
      overflow: hidden;
    }
    .preview-backdrop-grid {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 24px 24px;
      pointer-events: none;
    }
    .preview-center-line {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      border-left: 1px dashed rgba(255, 255, 255, 0.2);
      pointer-events: none;
    }
    .preview-side-marker {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 9px;
      letter-spacing: 1.5px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.2);
      writing-mode: vertical-rl;
      pointer-events: none;
      &.left { left: 8px; }
      &.right { right: 8px; }
    }
    .preview-token {
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }
    .preview-bubble {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #334155;
      border: 1.5px solid #94a3b8;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    .preview-label {
      margin-top: 2px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 99px;
      white-space: nowrap;
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ───── PRINT MEDIA ISOLATION ───── */
    @media print {
      body * {
        visibility: hidden !important;
      }
      .rider-preview-wrapper,
      .rider-preview-wrapper * {
        visibility: visible !important;
      }
      .rider-preview-wrapper {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        background: #fff !important;
        color: #000 !important;
      }
      .no-print, button, mat-dialog-actions, .dialog-header-controls {
        display: none !important;
      }
      .preview-stage-canvas {
        background: #fff !important;
        border: 2px solid #000 !important;
      }
      .preview-backdrop-grid {
        background-image: linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px) !important;
      }
      .preview-bubble {
        background: #fff !important;
        border: 1.5px solid #000 !important;
        color: #000 !important;
      }
      .preview-label {
        background: #fff !important;
        color: #000 !important;
        border: 1px solid #000 !important;
      }
      .table {
        border-color: #000 !important;
      }
      .table-light {
        background-color: #eee !important;
        color: #000 !important;
      }
    }
  `],
})
export class TechRiderExportDialogComponent {
  readonly data: TechRiderExportDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<TechRiderExportDialogComponent>);
  private notify = inject(NotificationsService);

  bandName = this.data.meta.bandName || 'Bandmate Artist';
  watermark = 'RIDER TÉCNICO OFICIAL — GIRA 2026';
  layout: TechRiderLayout = 'full';
  stageDimensions = this.data.stageDimensions || '8m x 6m (Mínimo recomendado)';

  includeStagePlot = true;
  includeChannelList = true;
  includeTechnicalSpecs = true;
  includeHospitality = true;

  getIconForType(type?: StageElementType | string): string {
    if (!type) return 'music_note';
    if (type.includes('drum')) return 'album';
    if (type.includes('vocal') || type.includes('vox')) return 'mic';
    if (type.includes('guitar')) return 'speaker';
    if (type.includes('bass')) return 'volume_up';
    if (type.includes('key')) return 'piano';
    if (type.includes('monitor') || type.includes('wedge')) return 'surround_sound';
    if (type.includes('iem')) return 'headphones';
    if (type.includes('di')) return 'settings_input_component';
    if (type.includes('power')) return 'power';
    const tmpl = STAGE_ELEMENT_TEMPLATES.find((t) => t.type === (type as any));
    return tmpl?.icon || 'music_note';
  }

  printRiderSheet() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  generatePatchSheetText(): string {
    const lines: string[] = [
      '================================================================================',
      `${(this.bandName || 'BANDMATE').toUpperCase()} — TECHNICAL RIDER & CHANNEL INPUT LIST`,
      '================================================================================',
      `Lugar / Venue: ${this.data.meta.venueName || 'Sala Principal'}`,
      `Fecha / Date: ${this.data.meta.date}`,
      `Contacto Técnico / FOH: ${this.data.meta.contactPerson || 'Por definir'} (${this.data.meta.contactPhone || 'N/A'}, ${this.data.meta.contactEmail || 'N/A'})`,
      `Dimensiones de Escenario: ${this.stageDimensions}`,
      `Envíos de Monitor: ${this.data.meta.monitorMixes || 3} mezclas independientes`,
      `Puntos de Corriente: ${this.data.meta.powerDrops || 3} tomas 220V Schuko`,
      '================================================================================',
      '',
      '--- LISTA DE ENTRADAS / CHANNEL INPUT LIST ---',
      'CH  | INSTRUMENTO / FUENTE       | MICRÓFONO / ENTRADA        | SOPORTE     | +48V | MEZCLA MONITOR',
      '--------------------------------------------------------------------------------',
    ];

    this.data.channelInputList.forEach((ch) => {
      const chNum = (ch.channel < 10 ? '0' : '') + ch.channel;
      const phantom = ch.phantom ? 'SÍ  ' : 'NO  ';
      const label = (ch.label || 'Fuente').padEnd(26, ' ').slice(0, 26);
      const mic = (ch.mic || 'Mic Estándar').padEnd(26, ' ').slice(0, 26);
      const stand = (ch.stand || 'Directo').padEnd(11, ' ').slice(0, 11);
      const mon = ch.monitorNeeds || 'Mezcla estándar';
      lines.push(`${chNum}  | ${label} | ${mic} | ${stand} | ${phantom} | ${mon}`);
    });

    lines.push('--------------------------------------------------------------------------------');
    lines.push('');
    lines.push('--- REQUISITOS TÉCNICOS & ELECTRICIDAD ---');
    lines.push(`• Monitores: ${this.data.meta.monitorMixes || 3} mezclas independientes pre-fader.`);
    lines.push(`• Tomas de Corriente: ${this.data.meta.powerDrops || 3} líneas de 220V Schuko aisladas de iluminación.`);
    if (this.data.meta.notes) {
      lines.push(`• Observaciones: ${this.data.meta.notes}`);
    }
    lines.push('');
    lines.push('Generado con Bandmate • www.bandmate.live');
    return lines.join('\n');
  }

  copyPatchSheetText() {
    const text = this.generatePatchSheetText();
    navigator.clipboard?.writeText(text).then(() => {
      this.notify.success('Lista de canales y rider técnico copiado al portapapeles');
    });
  }

  downloadPatchSheetTxt() {
    const text = this.generatePatchSheetText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (this.bandName || 'band').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_tech_rider.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.success('Ficha técnica descargada correctamente');
  }
}
