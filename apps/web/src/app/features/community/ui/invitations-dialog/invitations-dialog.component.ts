import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BandsService } from '../../../bands/services/bands.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

@Component({
  selector: 'app-invitations-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="d-flex align-items-center gap-2">
      <mat-icon color="primary">mail</mat-icon>
      Manage Invitations
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="d-flex justify-content-center p-4">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else if (invites().length === 0) {
        <div class="p-4 text-center opacity-50">
          <mat-icon style="font-size: 48px; width: 48px; height: 48px" class="mb-2"
            >mail_outline</mat-icon
          >
          <div>No pending invitations</div>
        </div>
      } @else {
        <mat-list>
          @for (invite of invites(); track invite.id) {
            <mat-list-item>
              <mat-icon matListItemIcon color="accent">groups</mat-icon>
              <div matListItemTitle class="fw-bold">{{ invite.band?.name }}</div>
              <div matListItemLine class="small text-muted">Invited by owner</div>
              <div matListItemMeta class="d-flex gap-2">
                <button
                  mat-stroked-button
                  color="warn"
                  size="small"
                  (click)="respond(invite, false)"
                >
                  Decline
                </button>
                <button
                  mat-flat-button
                  color="primary"
                  size="small"
                  (click)="respond(invite, true)"
                >
                  Accept
                </button>
              </div>
            </mat-list-item>
          }
        </mat-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-list-item {
        height: auto !important;
        padding: 12px 0 !important;
      }
    `,
  ],
})
export class InvitationsDialogComponent {
  private bandsService = inject(BandsService);
  private notify = inject(NotificationsService);
  private dialogRef = inject(MatDialogRef<InvitationsDialogComponent>);

  invites = signal<any[]>([]);
  loading = signal(true);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.bandsService.listMyInvitations().subscribe({
      next: (data) => {
        this.invites.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  respond(invite: any, accept: boolean) {
    this.bandsService.respondToInvitation(invite.id, accept).subscribe({
      next: () => {
        this.notify.success(accept ? 'Joined band!' : 'Invitation declined');
        this.load();
        if (this.invites().length === 1 && !this.loading()) {
          // If it was the last one, we might want to auto-close or just let user see empty state
        }
      },
      error: () => {
        this.notify.error('Failed to respond to invitation');
      },
    });
  }
}
