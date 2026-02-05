import { inject, Injectable, signal } from '@angular/core';
import { EventRow, EventsService } from '../services/events.service';
import { TicketingService } from '../services/ticketing.service';
import { finalize, lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventsStore {
  private eventsService = inject(EventsService);
  private ticketingService = inject(TicketingService);

  // State
  readonly discoveryEvents = signal<EventRow[]>([]);
  readonly bandEvents = signal<EventRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Load events for discovery (nearby)
  loadDiscovery(lat?: number, lng?: number, radius?: number) {
    this.loading.set(true);
    this.error.set(null);
    this.eventsService
      .discover(lat, lng, radius)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (events) => this.discoveryEvents.set(events),
        error: (err) => this.error.set(err.message || 'Failed to load events'),
      });
  }

  // Load events for a specific band
  loadBandEvents(bandId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.eventsService
      .getBandEvents(bandId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (events) => this.bandEvents.set(events),
        error: (err) => this.error.set(err.message || 'Failed to load band events'),
      });
  }

  // Create event
  async createEvent(bandId: string, data: Partial<EventRow>) {
    this.loading.set(true);
    try {
      const event = await lastValueFrom(this.eventsService.create(bandId, data));
      if (event) {
        this.bandEvents.update((prev) => [...prev, event]);
      }
      return event;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to create event');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // Setup Payouts (Stripe Onboarding)
  async setupPayouts(bandId: string) {
    this.loading.set(true);
    try {
      const { url } = await lastValueFrom(this.ticketingService.getOnboardingLink(bandId));
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to start Stripe onboarding');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // Buy Ticket (Stripe Checkout)
  async buyTicket(eventId: string, quantity = 1) {
    this.loading.set(true);
    try {
      const { checkoutUrl } = await lastValueFrom(
        this.ticketingService.createCheckoutSession(eventId, quantity),
      );
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to start checkout');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
