import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { CreateSongDto, Song, SongDetail, UpdateSongDto } from '@bandmate/shared';

@Injectable({ providedIn: 'root' })
export class SongsApiService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Song[]>('/api/songs');
  }

  get(id: string) {
    return this.http.get<SongDetail>(`/api/songs/${id}`);
  }

  create(dto: CreateSongDto) {
    return this.http.post<Song>('/api/songs', dto);
  }

  update(id: string, dto: UpdateSongDto) {
    return this.http.patch<Song>(`/api/songs/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete<void>(`/api/songs/${id}`);
  }
}
