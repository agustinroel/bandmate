import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Field, form, required, validate } from '@angular/forms/signals';

type Model = {
  name: string;
  notes: string;
};

@Component({
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    Field,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="d-flex align-items-center gap-2">
      <mat-icon>queue_music</mat-icon>
      New setlist
    </h2>

    <div mat-dialog-content class="bm-dialog-content">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Name</mat-label>
        <input matInput [field]="f.name" placeholder="e.g. Rehearsal Friday" />
        @if (showError(f.name)) {
        <mat-error>{{ firstError(f.name().errors()) }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Notes</mat-label>
        <textarea
          matInput
          rows="3"
          [field]="f.notes"
          placeholder="Optional: vibe, tempos, transitions…"
        ></textarea>
        <mat-hint>Optional</mat-hint>
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end" class="bm-dialog-actions">
      <button mat-button type="button" (click)="close()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="!f().valid()"
      >
        <mat-icon class="me-1">add</mat-icon>
        Create
      </button>
    </div>
  `,
  styles: [
    `
      /* Match Material dialog gutters */
      .bm-dialog-content {
        display: grid;
        gap: 12px;

        /* Misma “columna” que los form-fields */
        padding: 10px 24px 0;
      }

      /* Botonera alineada con inputs + aire alrededor */
      .bm-dialog-actions {
        padding: 12px 24px 18px;
        margin: 0; /* a veces Material mete margin */
        gap: 10px; /* separación entre botones */
      }
    `,
  ],
})
export class NewSetlistDialogComponent {
  private ref = inject(
    MatDialogRef<NewSetlistDialogComponent, { name: string; notes?: string } | null>
  );

  readonly model = signal<Model>({
    name: '',
    notes: '',
  });

  readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Name is required' });

    validate(p.name, ({ value }) => {
      const v = value().trim();
      if (v.length < 2) return { kind: 'min', message: 'Name is too short' };
      if (v.length > 60) return { kind: 'max', message: 'Name is too long' };
      return undefined;
    });
  });

  save() {
    if (!this.f().valid()) return;

    const { name, notes } = this.model();
    const cleanName = name.trim();
    const cleanNotes = notes.trim();

    this.ref.close({
      name: cleanName,
      notes: cleanNotes || undefined,
    });
  }

  close() {
    this.ref.close(null);
  }

  showError(field: any) {
    return field().touched() && !field().valid();
  }

  firstError(errors: unknown): string {
    if (Array.isArray(errors) && errors.length) {
      const e: any = errors[0];
      return e?.message ?? 'Invalid value';
    }
    return 'Invalid value';
  }
}
