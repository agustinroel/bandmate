import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const base = environment.apiBaseUrl;

export interface ExternalMatch {
  id: string;
  title: string;
  artist: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ImportApiService {
  private http = inject(HttpClient);

  searchExternal(query: string) {
    return this.http.get<ExternalMatch[]>(`${base}/import/search`, {
      params: { q: query },
    });
  }

  ingest(mbid: string) {
    return this.http.post<any>(`${base}/import/ingest/${mbid}`, {});
  }
}
