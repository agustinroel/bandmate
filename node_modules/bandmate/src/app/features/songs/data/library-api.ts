import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const base = environment.apiBaseUrl;

export type LibraryWorkListItem = {
  id: string;
  title: string;
  artist: string;
  rights?: 'unknown' | 'public-domain' | 'copyrighted' | 'licensed';
  source?: 'musicbrainz' | 'wikidata' | 'user' | 'import';

  ratingAvg?: number;
  ratingCount?: number;

  updatedAt: string;

  // opcional: si tu backend ya lo manda
  topArrangement?: {
    id: string;
    key?: string | null;
    bpm?: string | number | null;
    durationSec?: number | null;
    ratingAvg?: number | null;
    ratingCount?: number | null;
  } | null;
};

@Injectable({ providedIn: 'root' })
export class LibraryApiService {
  private http = inject(HttpClient);

  listWorks() {
    return this.http.get<LibraryWorkListItem[]>(`${base}/works`);
  }

  // para el detalle /library/:id (si ya lo tenés)
  getWork(id: string) {
    return this.http.get<any>(`${base}/works/${id}`);
  }
}
