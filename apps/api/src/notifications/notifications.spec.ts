import { describe, it, expect } from 'vitest';
import {
  createNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.repo.js';

describe('Notifications Repository Tests', { timeout: 20000 }, () => {
  const testUser = `usr-notif-test-${Date.now()}`;

  it('should create, list, and mark notifications as read across all interaction types', async () => {
    const n1 = await createNotification(
      testUser,
      'follow',
      'Nuevo seguidor',
      'Lucas Mendizábal ha comenzado a seguirte.',
      { followerId: 'usr-lucas-cerati', followerUsername: 'lucas_stereo' }
    );
    const n2 = await createNotification(
      testUser,
      'band_invite',
      'Invitación a banda',
      'Te han invitado a unirte a la banda Vértigo Solar.',
      { bandId: 'band-1', bandName: 'Vértigo Solar', inviteId: 'inv-1' }
    );
    const n3 = await createNotification(
      testUser,
      'rating',
      'Nueva calificación en tu arreglo',
      'Un músico calificó tu arreglo con 5 ⭐.',
      { arrangementId: 'arr-1', rating: 5 }
    );

    expect(n1.id).toBeDefined();
    expect(n2.id).toBeDefined();
    expect(n3.id).toBeDefined();

    const list = await listNotifications(testUser);
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.some((n) => n.id === n1.id && !n.is_read)).toBe(true);

    await markNotificationRead(n1.id, testUser);
    const afterSingleRead = await listNotifications(testUser);
    expect(afterSingleRead.find((n) => n.id === n1.id)?.is_read).toBe(true);
    expect(afterSingleRead.find((n) => n.id === n2.id)?.is_read).toBe(false);

    await markAllNotificationsRead(testUser);
    const afterAllRead = await listNotifications(testUser);
    expect(afterAllRead.every((n) => n.is_read)).toBe(true);
  });
});
