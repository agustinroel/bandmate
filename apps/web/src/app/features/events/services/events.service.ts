import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface EventRow {
  id: string;
  band_id: string;
  title: string;
  description?: string;
  event_date: string;
  location_name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ticket_price: number;
  currency: string;
  capacity?: number;
  tickets_sold: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  bands?: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}`;

  discover(lat?: number, lng?: number, radius?: number): Observable<EventRow[]> {
    const params: any = {};
    if (lat) params.lat = lat;
    if (lng) params.lng = lng;
    if (radius) params.radius = radius;
    return this.http.get<EventRow[]>(`${this.apiUrl}/events/discovery`, { params });
  }

  get(id: string): Observable<EventRow> {
    return this.http.get<EventRow>(`${this.apiUrl}/events/${id}`);
  }

  getBandEvents(bandId: string): Observable<EventRow[]> {
    return this.http.get<EventRow[]>(`${this.apiUrl}/bands/${bandId}/events`);
  }

  create(bandId: string, data: Partial<EventRow>): Observable<EventRow> {
    return this.http.post<EventRow>(`${this.apiUrl}/bands/${bandId}/events`, data);
  }

  update(id: string, data: Partial<EventRow>): Observable<EventRow> {
    return this.http.patch<EventRow>(`${this.apiUrl}/events/${id}`, data);
  }

  // Alias for component usage
  getById(id: string): Observable<EventRow> {
    return this.get(id);
  }
}
