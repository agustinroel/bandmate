import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BandRow } from '../../services/bands.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Band Info</h2>
    <mat-dialog-content>
      <div class="d-flex flex-column gap-3 py-2">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Band Name</mat-label>
          <input matInput [(ngModel)]="data.name" placeholder="Enter band name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            [(ngModel)]="data.description"
            rows="3"
            placeholder="Tell us about the band..."
          ></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!data.name" (click)="onSave()">
        Save Changes
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        display: block;
      }
    `,
  ],
})
export class BandEditDialogComponent {
  private dialogRef = inject(MatDialogRef<BandEditDialogComponent>);
  public data = { ...inject<{ name: string; description: string }>(MAT_DIALOG_DATA) };

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(this.data);
  }
}
