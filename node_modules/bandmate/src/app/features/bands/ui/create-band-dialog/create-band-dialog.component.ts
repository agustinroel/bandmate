import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BandsService } from '../../services/bands.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Create a Band</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Band Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. The Beetles" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Min 2 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Short bio..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || loading" (click)="save()">
        {{ loading ? 'Creating...' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateBandDialogComponent {
  private fb = inject(FormBuilder);
  private bands = inject(BandsService);
  private dialogRef = inject(MatDialogRef<CreateBandDialogComponent>);

  loading = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  save() {
    if (this.form.invalid) return;

    this.loading = true;
    const { name, description } = this.form.value;

    this.bands.create({ name: name!, description: description || undefined }).subscribe({
      next: (band) => {
        this.dialogRef.close(band);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        // Ideally show toast
      },
    });
  }
}
