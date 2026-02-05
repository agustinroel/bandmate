import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TicketingService, TicketRow } from '../../services/ticketing.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  template: `
    <div class="tickets-container container py-5">
      <div class="d-flex align-items-center gap-3 mb-5">
        <div class="icon-box rounded-4 bg-primary text-white p-3 shadow-sm">
          <mat-icon style="font-size: 32px; width: 32px; height: 32px;"
            >confirmation_number</mat-icon
          >
        </div>
        <div>
          <h1 class="display-5 fw-bold mb-0 text-primary">My Tickets</h1>
          <p class="text-muted mb-0">You have {{ tickets().length }} active tickets</p>
        </div>
      </div>

      @if (loading()) {
        <div class="d-flex justify-content-center py-5">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else if (tickets().length === 0) {
        <div class="text-center py-5 bg-white rounded-5 shadow-sm border-0">
          <mat-icon class="display-1 text-muted opacity-25 mb-4">event_seat</mat-icon>
          <h3 class="text-dark fw-bold">No tickets yet</h3>
          <p class="text-muted mb-4 mx-auto" style="max-width: 300px;">
            Your upcoming live shows will appear here. Ready to see some talent?
          </p>
          <button
            mat-flat-button
            color="primary"
            routerLink="/community"
            class="rounded-pill px-5 py-2"
          >
            Explore Events
          </button>
        </div>
      } @else {
        <div class="row g-4">
          @for (t of tickets(); track t.id) {
            <div class="col-lg-6 col-xl-4">
              <mat-card class="ticket-card rounded-5 border-0 shadow-sm overflow-hidden h-100">
                <div
                  class="ticket-header p-4 text-white"
                  style="background: linear-gradient(135deg, var(--bm-primary), #163c40);"
                >
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge bg-white text-primary rounded-pill px-3">{{
                      $any(t).status | titlecase
                    }}</span>
                    <mat-icon class="opacity-50">music_note</mat-icon>
                  </div>
                  <h3 class="fw-bold mb-1 text-truncate">{{ $any(t).events?.title }}</h3>
                  <div class="small opacity-75">by {{ $any(t).events?.bands?.name }}</div>
                </div>

                <div class="ticket-body p-4 position-relative">
                  <!-- Decorative ticket notch -->
                  <div class="notch notch-left"></div>
                  <div class="notch notch-right"></div>

                  <div class="d-flex align-items-center gap-2 mb-3 text-muted">
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;"
                      >calendar_today</mat-icon
                    >
                    <span class="small fw-semibold">{{
                      $any(t).events?.event_date | date: 'fullDate'
                    }}</span>
                  </div>

                  <div class="d-flex align-items-center gap-2 mb-4 text-muted">
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;"
                      >location_on</mat-icon
                    >
                    <span class="small">{{ $any(t).events?.location_name }}</span>
                  </div>

                  <div
                    class="qr-placeholder rounded-4 d-flex flex-column align-items-center justify-content-center p-4 bg-light"
                  >
                    <!-- Simple QR placeholder for now -->
                    <div class="qr-code-box mb-3 p-2 bg-white rounded-3 shadow-sm">
                      <mat-icon
                        style="font-size: 100px; width: 100px; height: 100px;"
                        class="text-dark opacity-10"
                        >qr_code_2</mat-icon
                      >
                    </div>
                    <code class="small text-muted letter-spacing-2"
                      >{{ t.qr_hash.slice(0, 8).toUpperCase() }}-XXXX</code
                    >
                  </div>
                </div>

                <div
                  class="ticket-footer p-3 bg-light border-top d-flex justify-content-between align-items-center"
                >
                  <span class="small text-muted">Price: {{ t.purchase_price | currency }}</span>
                  <button mat-button color="primary" class="rounded-pill">Details</button>
                </div>
              </mat-card>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ticket-card {
        transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
      }
      .ticket-card:hover {
        transform: translateY(-8px);
      }
      .ticket-body {
        background: white;
      }
      .notch {
        position: absolute;
        top: 0;
        width: 24px;
        height: 24px;
        background: var(--bm-bg);
        border-radius: 50%;
        transform: translateY(-50%);
        z-index: 2;
      }
      .notch-left {
        left: -12px;
      }
      .notch-right {
        right: -12px;
      }
      .qr-placeholder {
        border: 2px dashed rgba(0, 0, 0, 0.05);
      }
      .letter-spacing-2 {
        letter-spacing: 2px;
      }
      .icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class MyTicketsPageComponent {
  private ticketService = inject(TicketingService);

  tickets = signal<TicketRow[]>([]);
  loading = signal(true);

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.ticketService.getMyTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }
}
