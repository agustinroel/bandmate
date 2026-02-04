import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AchievementService } from '../../../core/services/achievement.service';
import { tap } from 'rxjs';

export interface BandRow {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  owner_id: string;
  created_at?: string;
}

export interface BandMemberRow {
  band: BandRow;
  my_roles: string[];
}

@Injectable({ providedIn: 'root' })
export class BandsService {
  private http = inject(HttpClient);
  private achievements = inject(AchievementService);
  private apiUrl = `${environment.apiBaseUrl}/bands`;

  create(data: { name: string; description?: string }) {
    return this.http
      .post<BandRow>(this.apiUrl, data)
      .pipe(tap(() => this.achievements.unlock('first_band')));
  }

  listMyBands() {
    return this.http.get<(BandRow & { my_roles: string[] })[]>(
      `${environment.apiBaseUrl}/me/bands`,
    );
  }

  listUserBands(userId: string) {
    return this.http.get<(BandRow & { my_roles: string[] })[]>(
      `${environment.apiBaseUrl}/profiles/${userId}/bands`,
    );
  }

  get(id: string) {
    return this.http.get<BandRow>(`${this.apiUrl}/${id}`);
  }

  getMembers(id: string) {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/members`);
  }

  getSongs(id: string) {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/songs`);
  }

  shareSong(bandId: string, songId: string) {
    return this.http.post(`${this.apiUrl}/${bandId}/songs`, { songId });
  }

  unshareSong(bandId: string, songId: string) {
    return this.http.delete(`${this.apiUrl}/${bandId}/songs/${songId}`);
  }

  update(id: string, data: Partial<BandRow>) {
    return this.http.patch<BandRow>(`${this.apiUrl}/${id}`, data);
  }

  getInviteCode(id: string) {
    return this.http.post<{ code: string }>(`${this.apiUrl}/${id}/invite`, {});
  }

  joinBandByCode(code: string) {
    return this.http.post<{ success: true; band: BandRow }>(`${this.apiUrl}/join`, { code });
  }

  inviteUser(bandId: string, userId: string) {
    return this.http
      .post(`${this.apiUrl}/${bandId}/users`, { userId })
      .pipe(tap(() => this.achievements.unlock('first_invite')));
  }

  listMyInvitations() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/me/invitations`);
  }

  respondToInvitation(inviteId: string, accept: boolean) {
    return this.http.post(`${environment.apiBaseUrl}/invitations/${inviteId}/respond`, { accept });
  }
}
