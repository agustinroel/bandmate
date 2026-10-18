import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';
import { BandsService } from '../../bands/services/bands.service';
import { NotificationsService } from '../../../shared/ui/notifications/notifications.service';
import { Router } from '@angular/router';
import { supabase } from '../../../core/supabase/supabase.client';

export type NotificationType =
  | 'band_invite'
  | 'band_joined'
  | 'band_song'
  | 'follow'
  | 'comment'
  | 'like'
  | 'repost'
  | 'audition'
  | 'audition_status'
  | 'rating'
  | 'info';

export interface Notification {
  id: string;
  user_id?: string;
  type: NotificationType;
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
  private toast = inject(NotificationsService);
  private router = inject(Router);

  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(false);
  readonly pushSupported =
    typeof window !== 'undefined' && 'Notification' in window;
  readonly pushPermission = signal<NotificationPermission>(
    this.pushSupported ? window.Notification.permission : 'denied',
  );

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.is_read).length,
  );

  private seenIds = new Set<string>();
  private hasInitialLoaded = false;

  constructor() {
    effect((onCleanup) => {
      if (this.auth.isAuthed()) {
        this.syncPermissionState();
        this.load();
        const interval = setInterval(() => this.load(), 25000);

        let channel: any = null;
        try {
          const currentUserId = this.auth.user()?.id;
          channel = supabase
            .channel('community_live_feed')
            .on('broadcast', { event: 'new_comment' }, () => this.load())
            .on('broadcast', { event: 'like_update' }, () => this.load())
            .on('broadcast', { event: 'new_repost' }, () => this.load())
            .on('broadcast', { event: 'notif_update' }, (evt: any) => {
              const payload = evt?.payload as Notification | undefined;
              if (
                payload &&
                currentUserId &&
                payload.user_id === currentUserId
              ) {
                this.ingestRealtimeNotification(payload);
              } else {
                this.load();
              }
            })
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
              },
              (change: any) => {
                const row = change?.new as Notification | undefined;
                if (row && currentUserId && row.user_id === currentUserId) {
                  this.ingestRealtimeNotification(row);
                }
              },
            )
            .subscribe();
        } catch (_) {}

        onCleanup(() => {
          clearInterval(interval);
          if (channel) {
            try {
              supabase.removeChannel(channel);
            } catch (_) {}
          }
        });
      } else {
        this.notifications.set([]);
        this.seenIds.clear();
        this.hasInitialLoaded = false;
      }
    });
  }

  private syncPermissionState() {
    if (this.pushSupported) {
      this.pushPermission.set(window.Notification.permission);
    }
  }

  async requestPushPermission(): Promise<boolean> {
    if (!this.pushSupported) {
      this.toast.warning(
        'Tu navegador no soporta notificaciones nativas del sistema.',
      );
      return false;
    }

    try {
      const result = await window.Notification.requestPermission();
      this.pushPermission.set(result);
      if (result === 'granted') {
        this.toast.success(
          '¡Notificaciones push activadas en este dispositivo!',
          'OK',
          2500,
        );
        await this.dispatchNativeNotification({
          id: `push-welcome-${Date.now()}`,
          type: 'info',
          title: 'Bandmate · Alertas Activas 🎸',
          message:
            'Recibirás notificaciones instantáneas cuando te sigan, comenten, den like o te inviten a una banda.',
          is_read: true,
          created_at: new Date().toISOString(),
        });
        return true;
      } else {
        this.toast.warning(
          'Permiso de notificaciones denegado en el navegador.',
        );
        return false;
      }
    } catch {
      return false;
    }
  }

  private ingestRealtimeNotification(incoming: Notification) {
    if (!incoming?.id) return;
    const isNew = !this.seenIds.has(incoming.id);
    this.seenIds.add(incoming.id);

    this.notifications.update((prev) => {
      if (prev.some((n) => n.id === incoming.id)) return prev;
      return [incoming, ...prev];
    });

    if (isNew && !incoming.is_read) {
      this.toast.info(`🔔 ${incoming.title}: ${incoming.message || ''}`, 'Ver', 4000);
      void this.dispatchNativeNotification(incoming);
    }
  }

  private async dispatchNativeNotification(n: Notification) {
    if (!this.pushSupported || window.Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: n.message || '',
      icon: '/assets/brand/transparent-gold.png',
      badge: '/assets/brand/transparent-gold.png',
      tag: n.id,
      data: n,
    };

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(n.title, options);
          return;
        }
      }
    } catch (_) {}

    try {
      const nativeNotif = new window.Notification(n.title, options);
      nativeNotif.onclick = () => {
        window.focus();
        this.handleNotificationClick(n, this.router);
        nativeNotif.close();
      };
    } catch (_) {}
  }

  load() {
    this.http
      .get<Notification[]>(`${environment.apiBaseUrl}/notifications`)
      .subscribe({
        next: (data) => {
          const list = data || [];
          if (this.hasInitialLoaded) {
            for (const item of list) {
              if (!this.seenIds.has(item.id) && !item.is_read) {
                this.seenIds.add(item.id);
                this.toast.info(
                  `🔔 ${item.title}: ${item.message || ''}`,
                  'OK',
                  3500,
                );
                void this.dispatchNativeNotification(item);
              }
            }
          }
          for (const item of list) {
            this.seenIds.add(item.id);
          }
          this.hasInitialLoaded = true;
          this.notifications.set(list);
        },
        error: (e) => console.error('Failed to load notifications', e),
      });
  }

  markRead(id: string) {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );

    this.http
      .patch(`${environment.apiBaseUrl}/notifications/${id}/read`, {})
      .subscribe({
        error: () => this.load(),
      });
  }

  markAllRead() {
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, is_read: true })),
    );
    this.http
      .patch(`${environment.apiBaseUrl}/notifications/read-all`, {})
      .subscribe({
        error: () => this.load(),
      });
  }

  respondToInvite(notification: Notification, accept: boolean) {
    if (notification.type !== 'band_invite' || !notification.data?.inviteId) {
      console.error('Missing inviteId in notification data');
      return;
    }

    const inviteId = notification.data.inviteId;
    return this.bandsService.respondToInvitation(inviteId, accept);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'follow':
        return 'person_add';
      case 'band_invite':
        return 'group_add';
      case 'band_joined':
        return 'groups';
      case 'band_song':
        return 'library_music';
      case 'comment':
        return 'chat_bubble';
      case 'like':
        return 'favorite';
      case 'repost':
        return 'repeat';
      case 'audition':
      case 'audition_status':
        return 'campaign';
      case 'rating':
        return 'star';
      default:
        return 'notifications';
    }
  }

  handleNotificationClick(n: Notification, router: Router) {
    if (!n.is_read) {
      this.markRead(n.id);
    }

    if (n.type === 'follow') {
      const username = n.data?.followerUsername;
      if (username) {
        router.navigate(['/u', username]);
      } else {
        router.navigate(['/community']);
      }
    } else if (
      n.type === 'band_invite' ||
      n.type === 'band_joined' ||
      n.type === 'band_song'
    ) {
      const bandId = n.data?.bandId;
      if (bandId) {
        router.navigate(['/bands', bandId]);
      } else {
        router.navigate(['/bands']);
      }
    } else if (
      n.type === 'comment' ||
      n.type === 'like' ||
      n.type === 'repost' ||
      n.type === 'audition' ||
      n.type === 'audition_status'
    ) {
      const postId = n.data?.postId;
      if (postId) {
        router.navigate(['/community'], { fragment: postId });
      } else {
        router.navigate(['/community']);
      }
    } else if (n.type === 'rating') {
      if (n.data?.workId && n.data?.arrangementId) {
        router.navigate(['/library', n.data.workId, 'arrangements', n.data.arrangementId]);
      } else if (n.data?.songId) {
        router.navigate(['/songs', n.data.songId]);
      } else {
        router.navigate(['/songs']);
      }
    }
  }
}

