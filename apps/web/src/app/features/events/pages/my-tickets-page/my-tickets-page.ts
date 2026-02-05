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
      <header class="d-flex align-items-center gap-4 mb-5 animate-fade-in">
        <div class="header-icon-container">
          <mat-icon>confirmation_number</mat-icon>
        </div>
        <div>
          <h1 class="page-title mb-0">My Tickets</h1>
          <p class="page-subtitle mb-0">
            @if (loading()) {
              Checking your reservations...
            } @else {
              You have <span class="highlight">{{ tickets().length }}</span> active
              @if (tickets().length === 1) {
                ticket
              } @else {
                tickets
              }
            }
          </p>
        </div>
      </header>

      @if (loading()) {
        <div class="loader-state d-flex flex-column align-items-center justify-content-center py-5">
          <mat-spinner diameter="40" strokeWidth="3"></mat-spinner>
          <p class="mt-4 text-muted letter-spacing-1">SYNCING WITH VAULT...</p>
        </div>
      } @else if (tickets().length === 0) {
        <div class="empty-state animate-up">
          <div class="empty-icon-wrapper mb-4">
            <mat-icon>local_activity</mat-icon>
            <div class="pulse-ring"></div>
          </div>
          <h2 class="fw-bold mb-3">No tickets found</h2>
          <p class="text-secondary mb-5 mx-auto" style="max-width: 320px;">
            Your upcoming live shows and digital passes will appear here after purchase.
          </p>
          <button mat-flat-button routerLink="/community" class="premium-btn rounded-pill px-5">
            Explore Events
          </button>
        </div>
      } @else {
        <div class="row g-5">
          @for (t of tickets(); track t.id) {
            <div class="col-lg-6 col-xl-4 animate-up" [style.animation-delay]="$index * 100 + 'ms'">
              <div class="ticket-entity">
                <!-- Ticket Top Section (The "Stub") -->
                <div class="ticket-visual-top">
                  <div class="brand-overlay"></div>
                  <div class="ticket-header-content p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <div class="event-type-badge">LIVE PASS</div>
                      <div class="status-indicator" [class.status-active]="t.status === 'active'">
                        {{ t.status.toUpperCase() }}
                      </div>
                    </div>
                    <h3 class="ticket-title mb-1">{{ t.events?.title }}</h3>
                    <p class="ticket-artist mb-0 text-uppercase letter-spacing-2">
                      {{ t.events?.bands?.name }}
                    </p>
                  </div>
                </div>

                <!-- Ticket Connector (The "Perforation") -->
                <div class="ticket-perf">
                  <div class="notch notch-left"></div>
                  <div class="line"></div>
                  <div class="notch notch-right"></div>
                </div>

                <!-- Ticket Bottom Section (The "Body") -->
                <div class="ticket-visual-bottom p-4">
                  <div class="row mb-4">
                    <div class="col-7 border-end">
                      <div class="info-label">DATE & TIME</div>
                      <div class="info-value">{{ t.events?.event_date | date: 'MMM d, yyyy' }}</div>
                      <div class="info-sub">{{ t.events?.event_date | date: 'EEEE, h:mm a' }}</div>
                    </div>
                    <div class="col-5 ps-4">
                      <div class="info-label">LOCATION</div>
                      <div class="info-value text-truncate">{{ t.events?.location_name }}</div>
                      <div class="info-sub">Main Venue</div>
                    </div>
                  </div>

                  <div class="qr-vault rounded-4 mb-4">
                    <div class="qr-container p-3">
                      <mat-icon class="qr-icon">qr_code_2</mat-icon>
                    </div>
                    <div class="qr-meta">
                      <div class="entry-code">ENTRY CODE</div>
                      <code class="code-value">{{ t.qr_hash.slice(0, 8).toUpperCase() }}</code>
                    </div>
                  </div>

                  <div class="d-flex justify-content-between align-items-center">
                    <div class="purchase-info">
                      <span class="info-label d-block">PURCHASED FOR</span>
                      <span class="info-value">{{
                        t.purchase_price === 0 ? 'FREE' : (t.purchase_price | currency: 'EUR')
                      }}</span>
                    </div>
                    <button mat-button class="view-details-btn">
                      VIEW FULL DETAILS <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: var(--bm-bg);
      }

      .page-title {
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--bm-text-main);
      }

      .page-subtitle {
        color: var(--bm-text-muted);
        font-size: 1.1rem;
      }

      .highlight {
        color: var(--bm-primary);
        font-weight: 700;
      }

      .header-icon-container {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, var(--bm-primary), #1a4d52);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 20px rgba(13, 169, 185, 0.2);
        color: white;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      /* TICKET STYLES */
      .ticket-entity {
        position: relative;
        filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.08));
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        cursor: default;
      }

      .ticket-entity:hover {
        transform: translateY(-10px) scale(1.02);
      }

      .ticket-visual-top {
        background-color: #1a1a1a;
        color: white;
        border-radius: 24px 24px 0 0;
        position: relative;
        overflow: hidden;
        min-height: 160px;
      }

      .brand-overlay {
        position: absolute;
        top: 0;
        right: 0;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle at 70% 30%, var(--bm-primary), transparent 70%);
        opacity: 0.15;
        filter: blur(40px);
      }

      .event-type-badge {
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        padding: 4px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 100px;
      }

      .status-indicator {
        font-size: 0.7rem;
        font-weight: 700;
        color: #ff9800;
      }

      .status-active {
        color: #4caf50;
      }

      .ticket-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .ticket-artist {
        font-size: 0.8rem;
        font-weight: 500;
        opacity: 0.7;
      }

      /* Perforation */
      .ticket-perf {
        height: 48px;
        background-color: white;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ticket-perf .line {
        width: 80%;
        height: 2px;
        border-top: 2px dashed #eee;
      }

      .notch {
        position: absolute;
        width: 32px;
        height: 32px;
        background-color: var(--bm-bg);
        border-radius: 50%;
        z-index: 5;
      }

      .notch-left {
        left: -16px;
      }

      .notch-right {
        right: -16px;
      }

      .ticket-visual-bottom {
        background-color: white;
        border-radius: 0 0 24px 24px;
      }

      .info-label {
        font-size: 0.65rem;
        font-weight: 800;
        color: #999;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      }

      .info-value {
        font-weight: 700;
        color: #333;
        font-size: 1rem;
      }

      .info-sub {
        font-size: 0.75rem;
        color: #666;
      }

      .qr-vault {
        background-color: #f8f9fa;
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #f1f1f1;
      }

      .qr-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

        .qr-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #333;
          opacity: 0.8;
        }
      }

      .qr-meta {
        padding-left: 20px;

        .entry-code {
          font-size: 0.65rem;
          font-weight: 800;
          color: #bbb;
        }

        .code-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          color: var(--bm-primary);
          letter-spacing: 2px;
        }
      }

      .view-details-btn {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--bm-primary) !important;
        letter-spacing: 0.05em;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-left: 4px;
        }
      }

      /* EMPTY STATE */
      .empty-state {
        background: white;
        border-radius: 40px;
        padding: 80px 40px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.04);
      }

      .empty-icon-wrapper {
        position: relative;
        width: 100px;
        height: 100px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 60px;
          width: 60px;
          height: 60px;
          color: #eee;
          z-index: 10;
        }
      }

      .pulse-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: var(--bm-primary);
        opacity: 0.1;
        animation: pulse 2s infinite linear;
      }

      .premium-btn {
        background-color: #1a1a1a !important;
        color: white !important;
        padding: 12px 40px !important;
        font-weight: 600;
        letter-spacing: 0.05em;
        transition: all 0.3s;
      }

      .premium-btn:hover {
        background-color: var(--bm-primary) !important;
        box-shadow: 0 10px 20px rgba(13, 169, 185, 0.3);
      }

      /* ANIMATIONS */
      @keyframes pulse {
        0% {
          transform: scale(0.8);
          opacity: 0.1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.2;
        }
        100% {
          transform: scale(1.4);
          opacity: 0;
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.8s ease-out forwards;
      }

      .animate-up {
        animation: fadeInUp 0.8s ease-out forwards;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .letter-spacing-1 {
        letter-spacing: 1px;
      }
      .letter-spacing-2 {
        letter-spacing: 2px;
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
