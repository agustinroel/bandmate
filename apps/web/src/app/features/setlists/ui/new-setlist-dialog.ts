import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { I18nService } from '../../../core/services/i18n.service';

export interface SetlistTemplate {
  id: string;
  name: string;
  icon: string;
  targetDurationMinutes: number;
  description: string;
  recommendedSongCount: string;
  structureNotes: string;
}

export const SETLIST_TEMPLATES: SetlistTemplate[] = [
  {
    id: 'blank',
    name: 'Personalizado',
    icon: 'queue_music',
    targetDurationMinutes: 0,
    description: 'Comenzar con un setlist vacío desde cero.',
    recommendedSongCount: 'Libre',
    structureNotes: '',
  },
  {
    id: 'club-45',
    name: 'Club Set (45 min)',
    icon: 'nightlife',
    targetDurationMinutes: 45,
    description: 'Bloque estándar para pubs y clubes (9-11 canciones).',
    recommendedSongCount: '9-11 temas',
    structureNotes:
      '🎯 Objetivo: 45 min.\nEstructura:\n• 1-2: Apertura enérgica y enganche\n• 3-5: Desarrollo de repertorio / ritmo medio\n• 6: Balada o dinámica baja\n• 7-9: Cierre ascendente y clímax.',
  },
  {
    id: 'festival-60',
    name: 'Festival Block (60 min)',
    icon: 'festival',
    targetDurationMinutes: 60,
    description: 'Set dinámico de alta intensidad sin pausas para festivales.',
    recommendedSongCount: '12-14 temas',
    structureNotes:
      '🎯 Objetivo: 60 min.\nEstructura:\n• 1-3: Arranque explosivo (hits insignia)\n• 4-8: Progresión de tempo ascendente (sin pausas)\n• 9: Momento íntimo o interacción\n• 10-13: Hits principales y final demoledor.',
  },
  {
    id: 'headliner-90',
    name: 'Headliner Concert (90 min)',
    icon: 'stadium',
    targetDurationMinutes: 90,
    description: 'Concierto completo con dos actos y bloque de bises (encore).',
    recommendedSongCount: '18-22 temas',
    structureNotes:
      '🎯 Objetivo: 90 min.\nEstructura:\n• Acto 1 (Temas 1-8): Apertura, presentación y ritmo constante\n• Acto 2 (Temas 9-16): Transición acústica y temas épicos\n• Encore (Temas 17-20): Máximo clímax y despedida.',
  },
  {
    id: 'acoustic-30',
    name: 'Acoustic Showcase (30 min)',
    icon: 'music_note',
    targetDurationMinutes: 30,
    description: 'Sesión íntima o formato acústico para radio o telonero.',
    recommendedSongCount: '6-7 temas',
    structureNotes:
      '🎯 Objetivo: 30 min.\nEstructura:\n• 1-2: Tema cálido de apertura vocal\n• 3-5: Dinámica de matices y arreglos limpios\n• 6-7: Despedida emotiva.',
  },
];

export interface NewSetlistDialogResult {
  name: string;
  notes?: string;
  templateId?: string;
  targetDurationMinutes?: number;
  autoPopulate?: boolean;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="d-flex align-items-center gap-2">
      <mat-icon>queue_music</mat-icon>
      {{ i18n.t('setlists.new_dialog.title', 'Nuevo Setlist') }}
    </h2>

    <div mat-dialog-content class="bm-dialog-content">
      <!-- Selector de Plantillas Rápidas -->
      <div class="template-section">
        <label class="section-label">{{ i18n.t('setlists.new_dialog.templates_label', 'Plantillas Reutilizables de Escenario') }}</label>
        <div class="template-grid">
          @for (tmpl of templates; track tmpl.id) {
            <button
              type="button"
              class="tmpl-card"
              [class.active]="selectedTemplateId() === tmpl.id"
              (click)="applyTemplate(tmpl)"
            >
              <div class="tmpl-head">
                <mat-icon class="tmpl-icon">{{ tmpl.icon }}</mat-icon>
                <span class="tmpl-name">{{ tmplName(tmpl) }}</span>
              </div>
              <div class="tmpl-desc">{{ tmplDesc(tmpl) }}</div>
              @if (tmpl.targetDurationMinutes > 0) {
                <div class="tmpl-badge">
                  <span>{{ tmpl.targetDurationMinutes }} min</span>
                  <span>• {{ tmplCount(tmpl) }}</span>
                </div>
              }
            </button>
          }
        </div>
      </div>

      <mat-form-field appearance="outline" class="w-100 mt-2">
        <mat-label>{{ i18n.t('setlists.new_dialog.name_label', 'Nombre del Setlist') }}</mat-label>
        <input matInput [formControl]="nameControl" [placeholder]="i18n.t('setlists.new_dialog.name_placeholder', 'Ej. Festival Rock 2026')" />
        @if (nameControl.invalid && nameControl.touched) {
          <mat-error>{{ getNameError() }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>{{ i18n.t('setlists.new_dialog.notes_label', 'Notas y Estructura de Pacing') }}</mat-label>
        <textarea
          matInput
          rows="4"
          [formControl]="notesControl"
          [placeholder]="i18n.t('setlists.new_dialog.notes_placeholder', 'Estructura de tempo, pausas, descansos o notas del director...')"
        ></textarea>
        <mat-hint>{{ i18n.t('setlists.new_dialog.notes_hint', 'Opcional o autocompletado según la plantilla') }}</mat-hint>
      </mat-form-field>

      @if (selectedTemplate() && selectedTemplate()!.targetDurationMinutes > 0) {
        <div class="auto-fill-opt p-2 rounded bg-light-subtle border">
          <label class="d-flex align-items-center gap-2 cursor-pointer m-0">
            <input
              type="checkbox"
              class="form-check-input mt-0"
              [checked]="autoPopulateFromLibrary()"
              (change)="toggleAutoPopulate($event)"
            />
            <span class="small fw-semibold">
              {{ i18n.t('setlists.new_dialog.auto_fill', { minutes: selectedTemplate()!.targetDurationMinutes }) }}
            </span>
          </label>
        </div>
      }
    </div>

    <div mat-dialog-actions align="end" class="bm-dialog-actions">
      <button mat-button type="button" (click)="close()">{{ i18n.t('common.cancel', 'Cancelar') }}</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="nameControl.invalid"
      >
        <mat-icon class="me-1">add</mat-icon>
        {{ i18n.t('setlists.new_dialog.create_btn', 'Crear Setlist') }}
      </button>
    </div>
  `,
  styles: [
    `
      .bm-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 10px 24px 0;
        max-height: 80vh;
      }

      .bm-dialog-actions {
        padding: 16px 24px 18px;
        gap: 10px;
      }

      .section-label {
        font-family: var(--bm-font-mono);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--bm-muted);
        margin-bottom: 8px;
        display: block;
      }

      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        margin-bottom: 6px;
      }

      .tmpl-card {
        border: 1.5px solid rgba(38, 70, 83, 0.14);
        background: #ffffff;
        border-radius: 14px;
        padding: 12px 14px;
        text-align: left;
        cursor: pointer;
        transition: all 0.18s var(--bm-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
        display: flex;
        flex-direction: column;
        gap: 4px;

        &:hover {
          border-color: var(--bm-teal, #2a9d8f);
          background: rgba(42, 157, 143, 0.04);
          transform: translateY(-1px);
        }

        &.active {
          border-color: var(--bm-teal, #2a9d8f);
          background: rgba(42, 157, 143, 0.1);
          box-shadow: 0 4px 12px rgba(42, 157, 143, 0.16);

          .tmpl-name {
            color: var(--bm-wood, #264653);
          }
        }
      }

      .tmpl-head {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .tmpl-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--bm-teal, #2a9d8f);
      }

      .tmpl-name {
        font-size: 13.5px;
        font-weight: 800;
        color: var(--bm-text);
      }

      .tmpl-desc {
        font-size: 11.5px;
        color: var(--bm-muted);
        line-height: 1.35;
      }

      .tmpl-badge {
        font-family: var(--bm-font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 11px;
        font-weight: 700;
        color: var(--bm-teal, #2a9d8f);
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }

      .cursor-pointer {
        cursor: pointer;
      }

      :host-context([data-bs-theme='dark']),
      :host-context(.theme-dark) {
        .tmpl-card {
          background: #0f172a;
          border-color: rgba(255, 255, 255, 0.12);
          color: #f8fafc;

          .tmpl-name {
            color: #f8fafc;
          }
          .tmpl-desc {
            color: #94a3b8;
          }

          &:hover,
          &.active {
            border-color: var(--bm-accent, #e9c46a);
            background: rgba(233, 196, 106, 0.1);
          }
        }
      }
    `,
  ],
})
export class NewSetlistDialogComponent {
  private ref = inject(
    MatDialogRef<NewSetlistDialogComponent, NewSetlistDialogResult | null>,
  );
  private fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);

  readonly templates = SETLIST_TEMPLATES;
  readonly selectedTemplateId = signal<string>('blank');
  readonly autoPopulateFromLibrary = signal<boolean>(false);

  private getTmplKey(id: string): string {
    switch (id) {
      case 'blank': return 'custom';
      case 'club-45': return 'club';
      case 'festival-60': return 'festival';
      case 'headliner-90': return 'headliner';
      case 'acoustic-30': return 'acoustic';
      default: return id;
    }
  }

  tmplName(tmpl: SetlistTemplate): string {
    return this.i18n.t(`setlists.tmpl.${this.getTmplKey(tmpl.id)}`, tmpl.name);
  }

  tmplDesc(tmpl: SetlistTemplate): string {
    return this.i18n.t(`setlists.tmpl.${this.getTmplKey(tmpl.id)}_desc`, tmpl.description);
  }

  tmplCount(tmpl: SetlistTemplate): string {
    return this.i18n.t(`setlists.tmpl.${this.getTmplKey(tmpl.id)}_count`, tmpl.recommendedSongCount);
  }

  readonly selectedTemplate = () =>
    this.templates.find((t) => t.id === this.selectedTemplateId()) ?? null;

  nameControl = this.fb.control('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(60),
  ]);
  notesControl = this.fb.control('');

  applyTemplate(tmpl: SetlistTemplate) {
    this.selectedTemplateId.set(tmpl.id);

    if (tmpl.id === 'blank') {
      if (this.nameControl.value?.startsWith('Set ')) {
        this.nameControl.setValue('');
      }
      return;
    }

    // Set name if empty or default
    if (!this.nameControl.value || this.templates.some((t) => t.name === this.nameControl.value)) {
      this.nameControl.setValue(tmpl.name);
    }

    // Populate notes structure
    this.notesControl.setValue(tmpl.structureNotes);
  }

  toggleAutoPopulate(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.autoPopulateFromLibrary.set(checked);
  }

  save() {
    if (this.nameControl.invalid) return;

    const cleanName = this.nameControl.value?.trim() ?? '';
    const cleanNotes = this.notesControl.value?.trim();
    const tmpl = this.selectedTemplate();

    this.ref.close({
      name: cleanName,
      notes: cleanNotes || undefined,
      templateId: tmpl?.id !== 'blank' ? tmpl?.id : undefined,
      targetDurationMinutes: tmpl && tmpl.targetDurationMinutes > 0 ? tmpl.targetDurationMinutes : undefined,
      autoPopulate: this.autoPopulateFromLibrary(),
    });
  }

  close() {
    this.ref.close(null);
  }

  getNameError(): string {
    if (this.nameControl.hasError('required')) {
      return this.i18n.t('common.field_required', 'El nombre es obligatorio');
    }
    if (this.nameControl.hasError('minlength')) {
      return this.i18n.t('common.too_short', 'El nombre es demasiado corto');
    }
    if (this.nameControl.hasError('maxlength')) {
      return this.i18n.t('common.too_long', 'El nombre es demasiado largo');
    }
    return this.i18n.t('common.invalid', 'Valor inválido');
  }
}
