import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BandsService, BandRow } from '../../services/bands.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

@Component({
  selector: 'app-invite-band-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Invite {{ data.userName }}</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="d-flex justify-content-center p-3">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      } @else if (myBands().length === 0) {
        <div class="text-center p-3 opacity-75">
          <mat-icon class="mb-2">groups</mat-icon>
          <div>You don't have any bands to invite users to.</div>
          <div class="small mt-2">Create a band first!</div>
        </div>
      } @else {
        <p class="mb-2">Select a band to invite them to:</p>
        <mat-selection-list [multiple]="false" (selectionChange)="onSelectionChange($event)">
          @for (band of myBands(); track band.id) {
            <mat-list-option [value]="band">
              <span matListItemTitle>{{ band.name }}</span>
            </mat-list-option>
          }
        </mat-selection-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!selectedBand() || inviting()"
        (click)="invite()"
      >
        @if (inviting()) {
          Inviting...
        } @else {
          Invite
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 300px;
      }
    `,
  ],
})
export class InviteBandDialogComponent implements OnInit {
  private bandsService = inject(BandsService);
  private notify = inject(NotificationsService);
  private dialogRef = inject(MatDialogRef<InviteBandDialogComponent>);

  date = inject(MAT_DIALOG_DATA);

  myBands = signal<BandRow[]>([]);
  loading = signal(true);
  inviting = signal(false);
  selectedBand = signal<BandRow | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { userId: string; userName: string }) {}

  ngOnInit() {
    this.bandsService.listMyBands().subscribe({
      next: (bands) => {
        // Filter bands where I am admin or owner
        const adminBands = bands.filter(
          (b) => b.my_roles.includes('admin') || b.my_roles.includes('owner'),
        );
        this.myBands.set(adminBands);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  onSelectionChange(event: any) {
    this.selectedBand.set(event.options[0].value);
  }

  invite() {
    const band = this.selectedBand();
    if (!band) return;

    this.inviting.set(true);
    this.bandsService.inviteUser(band.id, this.data.userId).subscribe({
      next: () => {
        this.notify.success(`Invited ${this.data.userName} to ${band.name}`, 'OK');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.notify.error(err.error?.message || 'Failed to invite user', 'Close');
        this.inviting.set(false);
      },
    });
  }
}
