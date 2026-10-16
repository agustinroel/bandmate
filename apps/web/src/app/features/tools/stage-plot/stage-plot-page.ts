import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';
import {
  StageElement,
  StageElementType,
  STAGE_ELEMENT_TEMPLATES,
  TechRiderMeta,
} from './stage-plot.model';
import { TechRiderExportDialogComponent } from './ui/tech-rider-export-dialog/tech-rider-export-dialog';
import { I18nService } from '../../../core/services/i18n.service';

const STORAGE_KEY = 'bandmate_stage_plot_data';

@Component({
  selector: 'app-stage-plot-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
  ],
  templateUrl: './stage-plot-page.html',
  styleUrl: './stage-plot-page.scss',
})
export class StagePlotPageComponent {
  readonly i18n = inject(I18nService);
  private readonly notify = inject(NotificationsService);
  private readonly dialog = inject(MatDialog);

  readonly templates = STAGE_ELEMENT_TEMPLATES;

  // State Signals
  readonly elements = signal<StageElement[]>([]);
  readonly selectedElementId = signal<string | null>(null);
  readonly isDragging = signal(false);
  private draggingId: string | null = null;

  readonly meta = signal<TechRiderMeta>({
    bandName: 'The Rockers',
    contactPerson: 'Alex Rivera (FOH / Tour Manager)',
    contactPhone: '+34 600 123 456',
    contactEmail: 'tour@bandmatelive.com',
    venueName: 'Sala Principal',
    date: new Date().toISOString().substring(0, 10),
    notes: 'Requerimos 2 envíos de monitores independientes y 3 tomas 220V Schuko en escenario.',
    monitorMixes: 3,
    powerDrops: 3,
  });

  // Selected element computed
  readonly selectedElement = computed(() => {
    const id = this.selectedElementId();
    return this.elements().find((el) => el.id === id) || null;
  });

  // Derived Channel Input List
  readonly channelInputList = computed(() => {
    const audioElements = this.elements().filter((el) => {
      const tmpl = this.templates.find((t) => t.type === el.type);
      return tmpl?.hasInput ?? true;
    });

    return audioElements.map((el, idx) => ({
      channel: idx + 1,
      id: el.id,
      label: el.label,
      type: el.type,
      mic: el.micType || 'Mic Estándar',
      phantom: el.phantomPower || false,
      stand: el.standType || 'Trípode',
      monitorNeeds: el.monitorNeeds || 'Mezcla estándar',
    }));
  });

  constructor() {
    this.loadFromStorage();

    // Auto-save changes to localStorage
    effect(() => {
      const data = {
        elements: this.elements(),
        meta: this.meta(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    });
  }

  loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.elements && Array.isArray(parsed.elements)) {
          this.elements.set(parsed.elements);
        }
        if (parsed.meta) {
          this.meta.set(parsed.meta);
        }
        return;
      }
    } catch (e) {
      console.warn('Could not load stage plot from storage:', e);
    }

    // Default: Apply Standard 4-Piece Rock Band
    this.applyPreset('rock4');
  }

  // --- Element Management ---

  addElement(type: StageElementType) {
    const tmpl = this.templates.find((t) => t.type === type);
    if (!tmpl) return;

    // Randomize initial center location slightly to avoid perfect overlap
    const offset = (Math.random() - 0.5) * 10;
    const newEl: StageElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      label: tmpl.defaultLabel,
      x: Math.min(88, Math.max(12, 50 + offset)),
      y: Math.min(88, Math.max(12, 50 + offset)),
      micType: tmpl.defaultMic,
      phantomPower: tmpl.needsPhantom,
      standType: tmpl.defaultStand,
      monitorNeeds: 'Mezcla estándar',
    };

    this.elements.update((list) => [...list, newEl]);
    this.selectedElementId.set(newEl.id);
    this.notify.info(`Añadido: ${tmpl.name}`);
  }

  selectElement(id: string, event?: MouseEvent) {
    event?.stopPropagation();
    this.selectedElementId.set(id);
  }

  deselectAll() {
    this.selectedElementId.set(null);
  }

  deleteSelectedElement() {
    const id = this.selectedElementId();
    if (!id) return;
    this.elements.update((list) => list.filter((el) => el.id !== id));
    this.selectedElementId.set(null);
    this.notify.info('Elemento eliminado del escenario');
  }

  clearStage() {
    this.elements.set([]);
    this.selectedElementId.set(null);
    this.notify.info('Escenario despejado');
  }

  // --- Canvas Dragging Logic ---

  startDrag(id: string, event: MouseEvent | TouchEvent) {
    event.stopPropagation();
    this.draggingId = id;
    this.selectedElementId.set(id);
    this.isDragging.set(true);
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.isDragging() || !this.draggingId) return;
    this.updateDraggedPosition(event.clientX, event.clientY, event.currentTarget as HTMLElement);
  }

  onCanvasTouchMove(event: TouchEvent) {
    if (!this.isDragging() || !this.draggingId || event.touches.length === 0) return;
    const touch = event.touches[0];
    this.updateDraggedPosition(touch.clientX, touch.clientY, event.currentTarget as HTMLElement);
  }

  endDrag() {
    this.isDragging.set(false);
    this.draggingId = null;
  }

  private updateDraggedPosition(clientX: number, clientY: number, container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    // Clamp coordinates safely within the stage borders
    const clampedX = Math.round(Math.min(94, Math.max(6, rawX)));
    const clampedY = Math.round(Math.min(94, Math.max(6, rawY)));

    this.elements.update((list) =>
      list.map((el) => (el.id === this.draggingId ? { ...el, x: clampedX, y: clampedY } : el))
    );
  }

  // --- Presets ---

  applyPreset(preset: 'rock4' | 'acoustic' | 'pop6') {
    if (preset === 'rock4') {
      this.elements.set([
        {
          id: 'drums-1',
          type: 'drums',
          label: 'Batería (5 Cuerpos)',
          x: 50,
          y: 20,
          micType: 'Kit Completo (Kick D112, Snare SM57, Toms e604, OH L/R)',
          phantomPower: true,
          standType: 'Short Booms',
          monitorNeeds: 'Bajo y Guitarras',
        },
        {
          id: 'bass-1',
          type: 'bass_amp',
          label: 'Amp Bajo (Ampeg SVT)',
          x: 20,
          y: 25,
          micType: 'D.I. XLR Balanceado',
          phantomPower: false,
          standType: 'Directo',
          monitorNeeds: 'Bombo y Voz Principal',
        },
        {
          id: 'guitar-1',
          type: 'guitar_amp',
          label: 'Amp Guitarra (Marshall)',
          x: 80,
          y: 25,
          micType: 'Shure SM57 / Sennheiser e906',
          phantomPower: false,
          standType: 'Trípode Corto',
          monitorNeeds: 'Voz Principal y Bajo',
        },
        {
          id: 'vox-lead',
          type: 'lead_vocals',
          label: 'Voz Principal (Alex)',
          x: 50,
          y: 75,
          micType: 'Shure Beta 58A',
          phantomPower: false,
          standType: 'Trípode Boom',
          monitorNeeds: 'Voz alta, Guitarra y Bombo',
        },
        {
          id: 'mon-lead',
          type: 'monitor_wedge',
          label: 'Monitor Cuña Voz',
          x: 50,
          y: 88,
          micType: 'N/A',
          phantomPower: false,
          standType: 'Piso',
        },
        {
          id: 'mon-bass',
          type: 'monitor_wedge',
          label: 'Monitor Cuña Bajo',
          x: 25,
          y: 80,
          micType: 'N/A',
          phantomPower: false,
          standType: 'Piso',
        },
        {
          id: 'mon-gtr',
          type: 'monitor_wedge',
          label: 'Monitor Cuña Guitarra',
          x: 75,
          y: 80,
          micType: 'N/A',
          phantomPower: false,
          standType: 'Piso',
        },
        {
          id: 'pwr-1',
          type: 'power_drop',
          label: 'Toma AC Pedalboard',
          x: 45,
          y: 78,
          micType: 'N/A',
          phantomPower: false,
          standType: 'Piso',
        },
      ]);
      this.meta.update((m) => ({ ...m, bandName: 'The Rockers Band', monitorMixes: 3 }));
    } else if (preset === 'acoustic') {
      this.elements.set([
        {
          id: 'vox-1',
          type: 'lead_vocals',
          label: 'Voz 1 + Guitarra Acústica',
          x: 35,
          y: 70,
          micType: 'Shure SM58 + D.I. Acústica',
          phantomPower: true,
          standType: 'Trípode Boom',
          monitorNeeds: 'Mezcla Equilibrada',
        },
        {
          id: 'vox-2',
          type: 'backing_vocals',
          label: 'Voz 2 + Teclado',
          x: 65,
          y: 70,
          micType: 'Shure SM58 + D.I. Estéreo',
          phantomPower: true,
          standType: 'Trípode Boom',
          monitorNeeds: 'Mezcla Equilibrada',
        },
        {
          id: 'mon-1',
          type: 'monitor_wedge',
          label: 'Monitor Acústico 1',
          x: 35,
          y: 85,
          micType: 'N/A',
          phantomPower: false,
          standType: 'Piso',
        },
        {
          id: 'mon-2',
          type: 'monitor_wedge',
          label: 'Monitor Acústico 2',
          x: 65,
          y: 85,
          micType: 'N/A',
          phantomPower: false,
          standType: 'Piso',
        },
      ]);
      this.meta.update((m) => ({ ...m, bandName: 'Acoustic Soul Duo', monitorMixes: 2 }));
    } else if (preset === 'pop6') {
      this.applyPreset('rock4');
      this.elements.update((list) => [
        ...list,
        {
          id: 'keys-1',
          type: 'keyboard',
          label: 'Teclado Nord Stage 3',
          x: 18,
          y: 55,
          micType: '2x D.I. Box Balanceadas',
          phantomPower: true,
          standType: 'Soporte Tijera',
          monitorNeeds: 'Teclado y Guitarras',
        },
        {
          id: 'vox-backing',
          type: 'backing_vocals',
          label: 'Coros / Pandereta',
          x: 78,
          y: 65,
          micType: 'Shure SM58',
          phantomPower: false,
          standType: 'Trípode Boom',
          monitorNeeds: 'Voz Principal y Coros',
        },
      ]);
      this.meta.update((m) => ({ ...m, bandName: 'Groove & Pop Sextet', monitorMixes: 4 }));
    }

    this.deselectAll();
    this.notify.success('Plantilla cargada con éxito');
  }

  // --- Export and Printing ---

  openExportDialog() {
    this.dialog.open(TechRiderExportDialogComponent, {
      width: '920px',
      maxWidth: '96vw',
      data: {
        meta: this.meta(),
        elements: this.elements(),
        channelInputList: this.channelInputList(),
        stageDimensions: '8m x 6m (Mínimo recomendado)',
      },
    });
  }

  printTechRider() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  getIconForType(type: StageElementType): string {
    const tmpl = this.templates.find((t) => t.type === type);
    return tmpl?.icon || 'music_note';
  }
}
