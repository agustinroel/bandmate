import {
  Component,
  Input,
  OnInit,
  signal,
  computed,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

export type StageItemType =
  | 'drums'
  | 'guitar_amp'
  | 'bass_amp'
  | 'keys'
  | 'vocal_mic'
  | 'monitor'
  | 'iem'
  | 'power'
  | 'di';

export interface StagePlotItem {
  id: string;
  type: StageItemType;
  label: string;
  assignedMember?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  inputChannel?: number;
  micType?: string;
  notes?: string;
}

export interface InputChannel {
  channel: number;
  source: string;
  micPreference: string;
  standType: 'Boom' | 'Straight' | 'Short Boom' | 'None';
  phantom48v: boolean;
  notes: string;
}

export interface StagePlotConfig {
  bandName: string;
  techContact: string;
  stageDimensions: string;
  monitorsCount: number;
  iemChannelsCount: number;
  powerDropsCount: number;
  items: StagePlotItem[];
  inputs: InputChannel[];
}

@Component({
  selector: 'app-stage-plot',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatTabsModule,
    MatMenuModule,
    FormsModule,
  ],
  template: `
    <div class="stage-plot-container">
      <!-- Toolbar & Actions -->
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="fw-bold m-0 text-primary d-flex align-items-center gap-2">
            <mat-icon class="text-accent">layers</mat-icon>
            Stage Plot & Rider Técnico
          </h3>
          <p class="text-muted small mb-0">
            Diseñador 2D interactivo de escenario y hoja de parches (Channel Patch Sheet)
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap">
          <div class="dropdown d-inline-block">
            <button
              mat-stroked-button
              class="rounded-pill"
              [matMenuTriggerFor]="presetsMenu"
              #menuTrigger="matMenuTrigger"
            >
              <mat-icon class="me-1">auto_awesome</mat-icon>
              Cargar Plantilla
            </button>
            <mat-menu #presetsMenu="matMenu">
              <button mat-menu-item (click)="loadPreset('rock')">
                <mat-icon>album</mat-icon>
                <span>Rock Band Estándar (4 piezas)</span>
              </button>
              <button mat-menu-item (click)="loadPreset('acoustic')">
                <mat-icon>music_note</mat-icon>
                <span>Trío Acústico (Voz, Guitarra, Cajón)</span>
              </button>
              <button mat-menu-item (click)="loadPreset('pop')">
                <mat-icon>piano</mat-icon>
                <span>Banda Completa (Teclados, 2 Guitarras, Coros)</span>
              </button>
            </mat-menu>
          </div>

          <button mat-stroked-button class="rounded-pill" (click)="clearCanvas()">
            <mat-icon class="me-1">refresh</mat-icon>
            Limpiar
          </button>

          <button mat-flat-button color="primary" class="rounded-pill px-4 shadow-sm" (click)="printRider()">
            <mat-icon class="me-1">print</mat-icon>
            Imprimir Rider / PDF
          </button>
        </div>
      </div>

      <!-- Gear Toolbox -->
      <div class="gear-toolbox p-3 rounded-4 bg-white shadow-sm mb-3 border">
        <div class="small fw-bold text-uppercase tracking-wider text-secondary mb-2">
          Añadir Elemento al Escenario (Click para agregar)
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('drums')"
          >
            🥁 Batería
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('guitar_amp')"
          >
            🎸 Ampli Guitarra
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('bass_amp')"
          >
            🎸 Ampli Bajo
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('keys')"
          >
            🎹 Teclado
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('vocal_mic')"
          >
            🎤 Micrófono Vocal
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('monitor')"
          >
            🔈 Monitor de Cuña
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('iem')"
          >
            🎧 Transmisor IEM
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('power')"
          >
            🔌 Toma 220V
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
            (click)="addItem('di')"
          >
            📦 Caja Directa (DI)
          </button>
        </div>
      </div>

      <!-- Stage Plot Printable Canvas -->
      <div class="stage-plot-sheet bg-white p-4 rounded-4 shadow-sm border mb-4" #printableRider>
        <!-- Rider Header for Print/PDF -->
        <div class="rider-header pb-3 mb-3 border-bottom d-flex justify-content-between align-items-end flex-wrap gap-2">
          <div>
            <div class="text-uppercase fw-bold text-secondary small">Rider Técnico & Stage Plot Oficial</div>
            <h2 class="m-0 fw-black text-dark display-6">{{ bandName || 'Bandmate Live' }}</h2>
            <div class="small text-muted mt-1">
              Contacto Técnico: <strong>{{ techContact || 'Técnico de Banda / Manager' }}</strong> • 
              Dimensiones mínimas: <strong>{{ stageDimensions || '6m x 4m' }}</strong>
            </div>
          </div>
          <div class="text-end">
            <span class="badge bg-dark text-white fs-6 px-3 py-2 rounded-pill">
              {{ items().length }} Elementos en Escenario • {{ inputs().length }} Canales FOH
            </span>
          </div>
        </div>

        <!-- 2D Interactive Stage Box -->
        <div
          class="stage-canvas-wrapper position-relative mx-auto border border-2 rounded-4 mb-4"
          #canvasElement
          (click)="onCanvasClick($event)"
        >
          <!-- Upstage / Drum Riser Label -->
          <div class="stage-wall upstage-wall text-center py-1 fw-bold small text-uppercase">
            FONDO DE ESCENARIO / UPSTAGE (TELÓN / TARIMA BATERÍA)
          </div>

          <div class="stage-lateral-label stage-left fw-bold small">STAGE LEFT (SL)</div>
          <div class="stage-lateral-label stage-right fw-bold small">STAGE RIGHT (SR)</div>

          <!-- Stage Items on Canvas -->
          @for (item of items(); track item.id) {
            <div
              class="stage-item-marker position-absolute text-center select-none"
              [class.selected]="selectedItem()?.id === item.id"
              [style.left.%]="item.x"
              [style.top.%]="item.y"
              (click)="selectItem(item, $event)"
              [title]="item.label + (item.assignedMember ? ' (' + item.assignedMember + ')' : '')"
            >
              <div class="item-icon-bubble shadow-sm" [ngClass]="item.type">
                {{ getItemEmoji(item.type) }}
              </div>
              <div class="item-tag-label fw-bold mt-1 text-truncate" style="max-width: 100px;">
                {{ item.label }}
              </div>
              @if (item.assignedMember) {
                <div class="item-sub-label small text-muted text-truncate" style="max-width: 100px;">
                  {{ item.assignedMember }}
                </div>
              }
            </div>
          }

          <!-- Downstage / Audience Label -->
          <div class="stage-wall downstage-wall text-center py-2 fw-bold small text-uppercase">
            ▼ FRENTE DE ESCENARIO / AUDIENCIA / FOH MIX POSITION ▼
          </div>
        </div>

        <!-- Selected Item Editor Bar -->
        @if (selectedItem(); as sel) {
          <div class="selected-editor bg-light p-3 rounded-3 border mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold small text-primary">
                Editando: {{ sel.label }}
              </span>
              <button mat-button class="text-danger btn-sm p-0" (click)="removeItem(sel.id)">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">delete</mat-icon>
                Eliminar del escenario
              </button>
            </div>
            <div class="row g-2">
              <div class="col-md-4">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="sel.label"
                  (ngModelChange)="saveState()"
                  placeholder="Nombre equipo"
                />
              </div>
              <div class="col-md-4">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="sel.assignedMember"
                  (ngModelChange)="saveState()"
                  placeholder="Músico asignado (ej. Alex)"
                />
              </div>
              <div class="col-md-4">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="sel.notes"
                  (ngModelChange)="saveState()"
                  placeholder="Notas (ej. Mic SM58, Toma 220V)"
                />
              </div>
            </div>
          </div>
        }

        <!-- Channel Input List Table -->
        <div class="input-list-section pt-3 border-top">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="fw-bold m-0 text-dark">
              Patch List & Hoja de Canales (FOH / Monitores)
            </h4>
            <button mat-stroked-button class="btn-sm rounded-pill" (click)="addChannel()">
              <mat-icon class="me-1" style="font-size: 16px; width: 16px; height: 16px;">add</mat-icon>
              Añadir Canal
            </button>
          </div>

          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle border">
              <thead class="table-light">
                <tr class="small text-uppercase tracking-wider">
                  <th style="width: 50px;">CH #</th>
                  <th>Instrumento / Fuente</th>
                  <th>Microfonía / DI Sugerida</th>
                  <th>Soporte</th>
                  <th style="width: 70px;">+48V</th>
                  <th>Observaciones / Monitor Mix</th>
                  <th style="width: 40px;"></th>
                </tr>
              </thead>
              <tbody>
                @for (ch of inputs(); track ch.channel; let idx = $index) {
                  <tr>
                    <td class="fw-bold text-center text-secondary">
                      {{ ch.channel }}
                    </td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm border-0 bg-transparent fw-medium p-1 shadow-none"
                        [(ngModel)]="ch.source"
                        (ngModelChange)="saveState()"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm border-0 bg-transparent p-1 shadow-none"
                        [(ngModel)]="ch.micPreference"
                        (ngModelChange)="saveState()"
                      />
                    </td>
                    <td>
                      <select
                        class="form-select form-select-sm border-0 bg-transparent p-1 shadow-none"
                        [(ngModel)]="ch.standType"
                        (ngModelChange)="saveState()"
                      >
                        <option value="Boom">Jirafa (Boom)</option>
                        <option value="Straight">Recto</option>
                        <option value="Short Boom">Jirafa Corta</option>
                        <option value="None">Sin Soporte</option>
                      </select>
                    </td>
                    <td class="text-center">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        [(ngModel)]="ch.phantom48v"
                        (ngModelChange)="saveState()"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm border-0 bg-transparent p-1 shadow-none small text-muted"
                        [(ngModel)]="ch.notes"
                        (ngModelChange)="saveState()"
                        placeholder="Notas..."
                      />
                    </td>
                    <td class="text-end">
                      <button
                        mat-icon-button
                        class="text-danger btn-sm p-0"
                        style="width: 24px; height: 24px; line-height: 24px;"
                        (click)="removeChannel(idx)"
                      >
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Rider Footer Requirements -->
        <div class="rider-requirements-box mt-3 p-3 bg-light rounded-3 small text-muted">
          <div class="fw-bold text-dark mb-1">Requisitos Generales de Escenario & Monitorización:</div>
          <div>• {{ monitorsCount() }} envíos de monitores de cuña independientes en escenario.</div>
          <div>• {{ iemChannelsCount() }} líneas estéreo XLR para sistemas In-Ear personales de la banda.</div>
          <div>• Mínimo {{ powerDropsCount() }} tomas dobles de corriente 220V/50Hz aisladas de audio en cada posición.</div>
          <div class="mt-2 text-end font-monospace" style="font-size: 0.75rem;">
            Generado con Bandmate Pro • Documento Técnico Oficial
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stage-plot-container {
        width: 100%;
      }
      .fw-black {
        font-weight: 900;
      }
      .tracking-wider {
        letter-spacing: 0.05em;
      }

      /* Stage 2D Box */
      .stage-canvas-wrapper {
        width: 100%;
        max-width: 760px;
        height: 440px;
        background: #0f172a;
        background-image:
          radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.8) 0%, #090d16 100%),
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 100% 100%, 30px 30px, 30px 30px;
        border-color: #334155 !important;
        overflow: hidden;
      }

      .stage-wall {
        position: absolute;
        width: 100%;
        left: 0;
        z-index: 2;
        letter-spacing: 0.1em;
      }
      .upstage-wall {
        top: 0;
        background: rgba(15, 23, 42, 0.95);
        color: #94a3b8;
        border-bottom: 2px dashed #475569;
      }
      .downstage-wall {
        bottom: 0;
        background: linear-gradient(180deg, transparent 0%, rgba(201, 162, 39, 0.25) 100%);
        color: #facc15;
        border-top: 2px solid #eab308;
      }

      .stage-lateral-label {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.25);
        letter-spacing: 0.15em;
        z-index: 1;
        font-size: 0.75rem;
      }
      .stage-left {
        left: 14px;
      }
      .stage-right {
        right: 14px;
      }

      /* Item Marker */
      .stage-item-marker {
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 5;
        transition: transform 0.15s ease;
      }
      .stage-item-marker:hover {
        transform: translate(-50%, -50%) scale(1.1);
        z-index: 10;
      }
      .stage-item-marker.selected .item-icon-bubble {
        box-shadow: 0 0 0 3px #facc15, 0 8px 16px rgba(250, 204, 21, 0.4) !important;
      }

      .item-icon-bubble {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        margin: 0 auto;
        border: 2px solid #cbd5e1;
      }

      .item-tag-label {
        font-size: 0.75rem;
        color: #ffffff;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
      }
      .item-sub-label {
        font-size: 0.65rem;
        color: #94a3b8 !important;
      }

      /* Print Media Styles */
      @media print {
        body * {
          visibility: hidden !important;
        }
        .stage-plot-sheet,
        .stage-plot-sheet * {
          visibility: visible !important;
        }
        .stage-plot-sheet {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .gear-toolbox,
        .selected-editor,
        button {
          display: none !important;
        }
        .stage-canvas-wrapper {
          max-width: 100% !important;
          page-break-inside: avoid;
        }
      }
    `,
  ],
})
export class StagePlotComponent implements OnInit {
  @Input() bandId = '';
  @Input() bandName = 'Bandmate Live';
  @Input() techContact = '';
  @Input() stageDimensions = '6m x 4m';

  private notify = inject(NotificationsService);

  readonly items = signal<StagePlotItem[]>([]);
  readonly inputs = signal<InputChannel[]>([]);
  readonly selectedItem = signal<StagePlotItem | null>(null);

  readonly monitorsCount = computed(
    () => this.items().filter((i) => i.type === 'monitor').length || 3
  );
  readonly iemChannelsCount = computed(
    () => this.items().filter((i) => i.type === 'iem').length || 2
  );
  readonly powerDropsCount = computed(
    () => this.items().filter((i) => i.type === 'power').length || 4
  );

  ngOnInit() {
    this.loadSavedState();
  }

  loadSavedState() {
    const key = `bandmate_stage_plot_${this.bandId || 'default'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: StagePlotConfig = JSON.parse(saved);
        if (parsed.items?.length) this.items.set(parsed.items);
        if (parsed.inputs?.length) this.inputs.set(parsed.inputs);
        return;
      } catch (e) {
        console.warn('Failed to parse saved stage plot:', e);
      }
    }
    // Default to Standard Rock Band if blank
    this.loadPreset('rock');
  }

  saveState() {
    const key = `bandmate_stage_plot_${this.bandId || 'default'}`;
    const config: StagePlotConfig = {
      bandName: this.bandName,
      techContact: this.techContact,
      stageDimensions: this.stageDimensions,
      monitorsCount: this.monitorsCount(),
      iemChannelsCount: this.iemChannelsCount(),
      powerDropsCount: this.powerDropsCount(),
      items: this.items(),
      inputs: this.inputs(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch (e) {
      console.warn('Could not persist stage plot to localStorage:', e);
    }
  }

  loadPreset(preset: 'rock' | 'acoustic' | 'pop') {
    if (preset === 'rock') {
      this.items.set([
        { id: '1', type: 'drums', label: 'Batería', assignedMember: 'Baterista', x: 50, y: 22 },
        { id: '2', type: 'bass_amp', label: 'Ampli Bajo', assignedMember: 'Bajo', x: 22, y: 26 },
        { id: '3', type: 'guitar_amp', label: 'Ampli Guitarra', assignedMember: 'Guitarra', x: 78, y: 26 },
        { id: '4', type: 'vocal_mic', label: 'Voz Principal', assignedMember: 'Cantante', x: 50, y: 78 },
        { id: '5', type: 'vocal_mic', label: 'Coros / Bajo', assignedMember: 'Bajo', x: 28, y: 72 },
        { id: '6', type: 'vocal_mic', label: 'Coros / Guitarra', assignedMember: 'Guitarra', x: 72, y: 72 },
        { id: '7', type: 'monitor', label: 'Monitor Cuña L', x: 28, y: 84 },
        { id: '8', type: 'monitor', label: 'Monitor Cuña C', x: 50, y: 88 },
        { id: '9', type: 'monitor', label: 'Monitor Cuña R', x: 72, y: 84 },
        { id: '10', type: 'power', label: 'Toma 220V', x: 20, y: 15 },
        { id: '11', type: 'power', label: 'Toma 220V', x: 80, y: 15 },
      ]);

      this.inputs.set([
        { channel: 1, source: 'Bombo (Kick)', micPreference: 'Shure Beta 52A / Audix D6', standType: 'Short Boom', phantom48v: false, notes: 'Compresor rápido' },
        { channel: 2, source: 'Caja (Snare Top)', micPreference: 'Shure SM57', standType: 'Short Boom', phantom48v: false, notes: 'Reverb gated' },
        { channel: 3, source: 'Charles (Hi-Hat)', micPreference: 'AKG C451 / Rode NT5', standType: 'Boom', phantom48v: true, notes: 'HPF 120Hz' },
        { channel: 4, source: 'Overhead L', micPreference: 'Shure KSM137 / Rode NT5', standType: 'Boom', phantom48v: true, notes: 'Panned Hard L' },
        { channel: 5, source: 'Overhead R', micPreference: 'Shure KSM137 / Rode NT5', standType: 'Boom', phantom48v: true, notes: 'Panned Hard R' },
        { channel: 6, source: 'Bajo (Bass DI)', micPreference: 'Radial J48 / XLR Out', standType: 'None', phantom48v: true, notes: 'EQ plana' },
        { channel: 7, source: 'Guitarra Eléctrica', micPreference: 'Sennheiser e609 / SM57', standType: 'Short Boom', phantom48v: false, notes: 'Frente al cono' },
        { channel: 8, source: 'Voz Principal', micPreference: 'Shure Beta 58A', standType: 'Boom', phantom48v: false, notes: 'Monitor Centro con mucha voz' },
        { channel: 9, source: 'Coros Bajo', micPreference: 'Shure SM58', standType: 'Boom', phantom48v: false, notes: 'Monitor Izq' },
        { channel: 10, source: 'Coros Guitarra', micPreference: 'Shure SM58', standType: 'Boom', phantom48v: false, notes: 'Monitor Der' },
      ]);
    } else if (preset === 'acoustic') {
      this.items.set([
        { id: '1', type: 'drums', label: 'Cajón Flamenco / Percusión', assignedMember: 'Percusionista', x: 50, y: 30 },
        { id: '2', type: 'vocal_mic', label: 'Voz & Guitarra Acústica', assignedMember: 'Voz / Guitarra', x: 35, y: 75 },
        { id: '3', type: 'keys', label: 'Teclado / Piano', assignedMember: 'Teclista', x: 65, y: 75 },
        { id: '4', type: 'di', label: 'DI Guitarra Acústica', x: 30, y: 80 },
        { id: '5', type: 'di', label: 'DI Teclado Estéreo', x: 70, y: 80 },
        { id: '6', type: 'monitor', label: 'Monitor L', x: 35, y: 85 },
        { id: '7', type: 'monitor', label: 'Monitor R', x: 65, y: 85 },
      ]);

      this.inputs.set([
        { channel: 1, source: 'Cajón (Grave)', micPreference: 'Shure Beta 91A / D6', standType: 'Short Boom', phantom48v: false, notes: 'Dentro del cajón' },
        { channel: 2, source: 'Cajón (Agudo/Palmas)', micPreference: 'Shure SM57', standType: 'Boom', phantom48v: false, notes: 'Frente superior' },
        { channel: 3, source: 'Guitarra Acústica DI', micPreference: 'Radial ProDI', standType: 'None', phantom48v: false, notes: 'Afinación drop D en tema 4' },
        { channel: 4, source: 'Teclado L', micPreference: 'BSS AR-133 DI', standType: 'None', phantom48v: true, notes: 'Estéreo' },
        { channel: 5, source: 'Teclado R', micPreference: 'BSS AR-133 DI', standType: 'None', phantom48v: true, notes: 'Estéreo' },
        { channel: 6, source: 'Voz Principal', micPreference: 'Neumann KMS 105 / Beta 58', standType: 'Boom', phantom48v: true, notes: 'Reverb Hall corta' },
        { channel: 7, source: 'Coros Teclado', micPreference: 'Shure SM58', standType: 'Boom', phantom48v: false, notes: 'Monitor R' },
      ]);
    } else {
      // Pop Band
      this.items.set([
        { id: '1', type: 'drums', label: 'Batería', x: 68, y: 22 },
        { id: '2', type: 'keys', label: 'Sintetizador / Teclados', x: 20, y: 35 },
        { id: '3', type: 'bass_amp', label: 'Bajo', x: 42, y: 26 },
        { id: '4', type: 'guitar_amp', label: 'Guitarra', x: 85, y: 32 },
        { id: '5', type: 'vocal_mic', label: 'Voz Principal', x: 50, y: 78 },
        { id: '6', type: 'iem', label: 'IEM Transmitter Rack', x: 18, y: 18 },
        { id: '7', type: 'monitor', label: 'Monitor Front Center', x: 50, y: 88 },
      ]);

      this.inputs.set([
        { channel: 1, source: 'Drums Kick', micPreference: 'Beta 52A', standType: 'Short Boom', phantom48v: false, notes: '' },
        { channel: 2, source: 'Drums Snare', micPreference: 'SM57', standType: 'Short Boom', phantom48v: false, notes: '' },
        { channel: 3, source: 'Bass DI', micPreference: 'Radial J48', standType: 'None', phantom48v: true, notes: '' },
        { channel: 4, source: 'Synth L', micPreference: 'DI Box', standType: 'None', phantom48v: false, notes: '' },
        { channel: 5, source: 'Synth R', micPreference: 'DI Box', standType: 'None', phantom48v: false, notes: '' },
        { channel: 6, source: 'Electric Guitar', micPreference: 'e609', standType: 'Short Boom', phantom48v: false, notes: '' },
        { channel: 7, source: 'Lead Vocal', micPreference: 'Wireless Beta 58', standType: 'Straight', phantom48v: false, notes: 'IEM Mix 1' },
      ]);
    }

    this.selectedItem.set(null);
    this.saveState();
    this.notify.info(`Plantilla cargada con éxito`);
  }

  addItem(type: StageItemType) {
    const labels: Record<StageItemType, string> = {
      drums: 'Batería',
      guitar_amp: 'Ampli Guitarra',
      bass_amp: 'Ampli Bajo',
      keys: 'Teclado',
      vocal_mic: 'Micrófono Vocal',
      monitor: 'Monitor Cuña',
      iem: 'Transmisor IEM',
      power: 'Toma 220V',
      di: 'Caja Directa DI',
    };

    const newItem: StagePlotItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      label: labels[type],
      x: 50,
      y: 50,
    };

    this.items.update((list) => [...list, newItem]);
    this.selectedItem.set(newItem);
    this.saveState();
  }

  selectItem(item: StagePlotItem, event: MouseEvent) {
    event.stopPropagation();
    this.selectedItem.set(item);
  }

  removeItem(id: string) {
    this.items.update((list) => list.filter((i) => i.id !== id));
    this.selectedItem.set(null);
    this.saveState();
  }

  clearCanvas() {
    this.items.set([]);
    this.inputs.set([]);
    this.selectedItem.set(null);
    this.saveState();
  }

  onCanvasClick(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

    const sel = this.selectedItem();
    if (sel) {
      // Reposition selected item to clicked spot
      this.items.update((list) =>
        list.map((i) => (i.id === sel.id ? { ...i, x, y } : i))
      );
      this.saveState();
    }
  }

  addChannel() {
    const nextCh = this.inputs().length + 1;
    this.inputs.update((list) => [
      ...list,
      {
        channel: nextCh,
        source: `Canal ${nextCh}`,
        micPreference: 'Mic Dinámico / DI',
        standType: 'Boom',
        phantom48v: false,
        notes: '',
      },
    ]);
    this.saveState();
  }

  removeChannel(index: number) {
    this.inputs.update((list) => {
      const updated = list.filter((_, idx) => idx !== index);
      // Re-number
      return updated.map((ch, idx) => ({ ...ch, channel: idx + 1 }));
    });
    this.saveState();
  }

  getItemEmoji(type: StageItemType): string {
    const emojis: Record<StageItemType, string> = {
      drums: '🥁',
      guitar_amp: '🎸',
      bass_amp: '🎸',
      keys: '🎹',
      vocal_mic: '🎤',
      monitor: '🔈',
      iem: '🎧',
      power: '🔌',
      di: '📦',
    };
    return emojis[type] || '🎵';
  }

  printRider() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
