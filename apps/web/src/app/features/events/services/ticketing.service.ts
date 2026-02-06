import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface TicketRow {
  id: string;
  event_id: string;
  user_id: string;
  qr_hash: string;
  status: 'active' | 'used' | 'refunded';
  purchase_price: number;
  stripe_payment_intent_id?: string;
  created_at: string;
  used_at?: string;
  events?: {
    id: string;
    title: string;
    event_date: string;
    location_name: string;
    bands: {
      name: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class TicketingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}`;

  getMyTickets(): Observable<TicketRow[]> {
    return this.http.get<TicketRow[]>(`${this.apiUrl}/me/tickets`);
  }

  getTicket(id: string): Observable<TicketRow> {
    return this.http.get<TicketRow>(`${this.apiUrl}/tickets/${id}`);
  }

  getOnboardingLink(bandId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/bands/${bandId}/payouts/onboarding`, {});
  }

  createCheckoutSession(eventId: string, quantity = 1): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(`${this.apiUrl}/events/${eventId}/checkout`, {
      quantity,
    });
  }

  validateTicket(
    qrHash: string,
    bandId: string,
  ): Observable<{
    success: boolean;
    message: string;
    ticket: any;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      ticket: any;
    }>(`${this.apiUrl}/tickets/validate`, { qrHash, bandId });
  }
}
