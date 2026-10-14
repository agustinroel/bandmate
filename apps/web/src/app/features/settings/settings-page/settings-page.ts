import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ThemeService, AppTheme } from '../../../core/services/theme.service';
import { I18nService, SupportedLang } from '../../../core/services/i18n.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
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
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);

  readonly user = this.auth.user;
  readonly tier = this.subscriptionStore.tier;
  readonly loadingPortal = signal(false);

  setTheme(mode: AppTheme) {
    this.theme.setTheme(mode);
    this.notify.success(
      this.i18n.currentLang() === 'es' ? 'Preferencia de tema actualizada' : 'Theme preference updated',
      'OK',
      1500
    );
  }

  setLanguage(lang: SupportedLang) {
    this.i18n.setLang(lang);
    this.notify.success(
      lang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English',
      'OK',
      1500
    );
  }

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
