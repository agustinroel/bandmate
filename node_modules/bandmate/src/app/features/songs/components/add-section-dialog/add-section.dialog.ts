import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import type { SongSectionType } from '@bandmate/shared';

type AddSectionResult = { type: SongSectionType; name?: string } | null;

@Component({
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title class="bm-dlg-title">
      {{ mode() === 'edit' ? 'Edit section' : 'Add section' }}
    </h2>

    <div mat-dialog-content class="bm-dlg-body">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Section type</mat-label>
        <mat-select [value]="type()" (selectionChange)="type.set($event.value)">
          @for (t of types; track t.value) {
            <mat-option [value]="t.value">{{ t.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Custom name (optional)</mat-label>
        <input matInput [value]="name()" (input)="name.set($any($event.target).value)" />
        <mat-hint>Leave empty to auto-name (e.g. "Verse 2")</mat-hint>
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end" class="bm-dlg-actions">
      <button mat-button type="button" (click)="close(null)">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="submit()">
        <mat-icon class="bm-ic">{{ mode() === 'edit' ? 'save' : 'add' }}</mat-icon>
        {{ mode() === 'edit' ? 'Save' : 'Add' }}
      </button>
    </div>
  `,
  styles: [
    `
      .bm-dlg-title {
        font-weight: 800;
        letter-spacing: 0.2px;
      }
      .bm-dlg-body {
        display: grid;
        gap: 12px;
        padding-top: 6px;
        min-width: min(520px, 92vw);
      }
      .bm-dlg-actions {
        padding: 8px 4px 4px;
      }
      .bm-ic {
        font-size: 18px;
        height: 18px;
        width: 18px;
        margin-right: 6px;
      }
    `,
  ],
})
export class AddSectionDialogComponent {
  readonly ref = inject(MatDialogRef<AddSectionDialogComponent, AddSectionResult>);
  readonly data = inject(MAT_DIALOG_DATA, { optional: true }) as {
    mode?: 'add' | 'edit';
    initialType?: SongSectionType;
    initialName?: string;
  } | null;

  readonly mode = signal<'add' | 'edit'>(this.data?.mode ?? 'add');
  readonly type = signal<SongSectionType>(this.data?.initialType ?? 'verse');
  readonly name = signal(this.data?.initialName ?? '');

  readonly types: { value: SongSectionType; label: string }[] = [
    { value: 'intro', label: 'Intro' },
    { value: 'verse', label: 'Verse' },
    { value: 'prechorus', label: 'Pre-chorus' },
    { value: 'chorus', label: 'Chorus' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'solo', label: 'Solo' },
    { value: 'outro', label: 'Outro' },
    { value: 'other', label: 'Other' },
  ];

  close(result: AddSectionResult) {
    this.ref.close(result);
  }

  submit() {
    const n = this.name().trim();
    this.close({ type: this.type(), name: n || undefined });
  }
}
