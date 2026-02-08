import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [
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
      New setlist
    </h2>

    <div mat-dialog-content class="bm-dialog-content">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Name</mat-label>
        <input matInput [formControl]="nameControl" placeholder="e.g. Rehearsal Friday" />
        @if (nameControl.invalid && nameControl.touched) {
          <mat-error>{{ getNameError() }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Notes</mat-label>
        <textarea
          matInput
          rows="3"
          [formControl]="notesControl"
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
        [disabled]="nameControl.invalid"
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

        /* Misma "columna" que los form-fields */
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
    MatDialogRef<NewSetlistDialogComponent, { name: string; notes?: string } | null>,
  );
  private fb = inject(FormBuilder);

  nameControl = this.fb.control('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(60),
  ]);
  notesControl = this.fb.control('');

  save() {
    if (this.nameControl.invalid) return;

    const cleanName = this.nameControl.value?.trim() ?? '';
    const cleanNotes = this.notesControl.value?.trim();

    this.ref.close({
      name: cleanName,
      notes: cleanNotes || undefined,
    });
  }

  close() {
    this.ref.close(null);
  }

  getNameError(): string {
    if (this.nameControl.hasError('required')) {
      return 'Name is required';
    }
    if (this.nameControl.hasError('minlength')) {
      return 'Name is too short';
    }
    if (this.nameControl.hasError('maxlength')) {
      return 'Name is too long';
    }
    return 'Invalid value';
  }
}
