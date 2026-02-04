import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';
import { BandsService } from '../../bands/services/bands.service';

export interface Notification {
  id: string;
  type: 'band_invite' | 'info';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationsService {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private bandsService = inject(BandsService);

  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(false);

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.is_read).length);

  constructor() {
    effect((onCleanup) => {
      if (this.auth.isAuthed()) {
        this.load();
        // Polling (simple version: interval)
        const interval = setInterval(() => this.load(), 30000); // 30s

        onCleanup(() => {
          clearInterval(interval);
        });
      } else {
        this.notifications.set([]);
      }
    });
  }

  load() {
    this.http.get<Notification[]>(`${environment.apiBaseUrl}/notifications`).subscribe({
      next: (data) => this.notifications.set(data),
      error: (e) => console.error('Failed to load notifications', e),
    });
  }

  markRead(id: string) {
    // Optimistic update
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );

    this.http.patch(`${environment.apiBaseUrl}/notifications/${id}/read`, {}).subscribe({
      error: () => this.load(), // Revert on error
    });
  }

  markAllRead() {
    this.notifications.update((list) => list.map((n) => ({ ...n, is_read: true })));
    this.http.patch(`${environment.apiBaseUrl}/notifications/read-all`, {}).subscribe({
      error: () => this.load(),
    });
  }

  respondToInvite(notification: Notification, accept: boolean) {
    if (notification.type !== 'band_invite' || !notification.data?.inviteId) {
      // Fallback: try to find inviteId from pending list?
      // Or if data only has bandId, we assume user fetches invites.
      // My API creates notification with { bandId, bandName }.
      // Wait, the API `inviteUserToBand` passed { bandId, bandName }.
      // It did NOT pass inviteId! That's a GAP.

      // I need to either:
      // 1. Update API to pass inviteId in notification data.
      // 2. Or here fetch pending invites and match bandId.

      // I will FIX the API first to include inviteId.
      // For now, I'll log error.
      console.error('Missing inviteId in notification data');
      return;
    }

    const inviteId = notification.data.inviteId;

    return this.bandsService.respondToInvitation(inviteId, accept);
  }
}
