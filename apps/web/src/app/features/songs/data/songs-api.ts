import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { CreateSongDto, Song, UpdateSongDto } from '@bandmate/shared';
import { environment } from '../../../../environments/environment';

const base = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class SongsApiService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Song[]>(`${base}/songs`);
  }

  get(id: string) {
    return this.http.get<Song>(`${base}/songs/${id}`);
  }

  create(dto: CreateSongDto) {
    return this.http.post<Song>(`${base}/songs`, dto);
  }

  update(id: string, dto: UpdateSongDto) {
    return this.http.patch<Song>(`${base}/songs/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete<void>(`${base}/songs/${id}`);
  }
}
