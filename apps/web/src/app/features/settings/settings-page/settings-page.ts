import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../../core/auth/auth.store';
import { SubscriptionStore } from '../../../core/subscription/subscription.store';
import { environment } from '../../../../environments/environment';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';
import { UpgradeDialogComponent } from '../../../core/subscription/upgrade-dialog/upgrade-dialog.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPageComponent {
  private readonly auth = inject(AuthStore);
  private readonly subscriptionStore = inject(SubscriptionStore);
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationsService);
  private readonly dialog = inject(MatDialog);

  readonly user = this.auth.user;
  readonly tier = this.subscriptionStore.tier;
  readonly loadingPortal = signal(false);

  async manageSubscription() {
    this.loadingPortal.set(true);
    try {
      this.http
        .post<{ url: string }>(`${environment.apiBaseUrl}/subscriptions/portal`, {})
        .subscribe({
          next: (res) => {
            if (res.url) {
              window.location.href = res.url;
            }
          },
          error: (err) => {
            console.error('Portal failed', err);
            this.notify.error('Could not open billing portal. Please try again.');
            this.loadingPortal.set(false);
          },
        });
    } catch (e) {
      console.error(e);
      this.loadingPortal.set(false);
    }
  }

  onLogout() {
    this.auth.signOut();
  }

  onUpgrade(data?: any) {
    this.dialog.open(UpgradeDialogComponent, {
      maxWidth: '90vw',
      panelClass: 'bm-upgrade-dialog-container',
      data: data,
    });
  }

  saveProfile() {
    this.notify.success('Profile preferences saved locally');
  }
}
