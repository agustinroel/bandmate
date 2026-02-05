import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_LOCALE,
  DateAdapter,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
  ],
  template: `
    <h2 mat-dialog-title class="fw-bold text-primary">Create Live Event</h2>
    <mat-dialog-content class="py-3">
      <form [formGroup]="form" (ngSubmit)="submit()" class="d-flex flex-column gap-2">
        <mat-form-field appearance="outline">
          <mat-label>Event Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g. Summer Gig at The Cave" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Event Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="event_date" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if (form.get('event_date')?.invalid && form.get('event_date')?.touched) {
            <mat-error>Date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Location Name</mat-label>
          <mat-icon matPrefix class="me-2">location_on</mat-icon>
          <input
            matInput
            formControlName="location_name"
            placeholder="e.g. Madison Square Garden"
          />
        </mat-form-field>

        <div class="row g-2">
          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Ticket Price ({{ form.get('currency')?.value | uppercase }})</mat-label>
              <input matInput type="number" formControlName="ticket_price" />
              <span matPrefix class="me-1">$</span>
            </mat-form-field>
          </div>
          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Capacity</mat-label>
              <input
                matInput
                type="number"
                formControlName="capacity"
                placeholder="Leave empty for unlimited"
              />
            </mat-form-field>
          </div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Additional details..."
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="pb-3 px-3">
      <button mat-button (click)="cancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || loading()"
        (click)="submit()"
        class="rounded-pill px-4"
      >
        {{ loading() ? 'Creating...' : 'Create Event' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class EventCreateDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EventCreateDialogComponent>);

  loading = signal(false);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    event_date: [new Date(), [Validators.required]],
    location_name: ['', [Validators.required]],
    description: [''],
    ticket_price: [0, [Validators.min(0)]],
    currency: ['usd'],
    capacity: [null as number | null, [Validators.min(1)]],
  });

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.valid) {
      // In a real app we'd handle time too, for now we just take the date.
      this.dialogRef.close(this.form.value);
    }
  }
}
