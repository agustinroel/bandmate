import { Component, inject, signal, computed, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EventsStore } from '../../state/events.store';
import { EventsService, EventRow } from '../../services/events.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    FormsModule,
  ],
  template: `
    <div class="event-detail-page">
      @if (loading()) {
        <div class="d-flex justify-content-center align-items-center" style="min-height: 60vh">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (event()) {
        <!-- Premium Hero Section -->
        <div class="event-hero">
          <div class="hero-overlay"></div>
          <div class="container position-relative z-1 py-5">
            <!-- Navigation -->
            <a
              routerLink="/community"
              class="d-flex align-items-center text-white text-decoration-none mb-4 opacity-75 hover-opacity-100"
              style="transition: opacity 0.2s"
            >
              <mat-icon class="me-2">arrow_back</mat-icon>
              <span class="fw-medium">Back to Community</span>
            </a>

            <div class="row align-items-center g-4">
              <!-- Band Avatar (Large & Premium) -->
              <div class="col-auto">
                <div
                  class="rounded-circle d-flex align-items-center justify-content-center shadow-lg position-relative"
                  style="width: 140px; height: 140px; background: #1a1a1a; border: 4px solid rgba(255,255,255,0.1)"
                >
                  @if (event()!.bands?.avatar_url) {
                    <img
                      [src]="event()!.bands?.avatar_url"
                      class="rounded-circle"
                      style="width: 100%; height: 100%; object-fit: cover"
                    />
                  } @else {
                    <mat-icon class="text-accent" style="font-size: 64px; width: 64px; height: 64px"
                      >music_note</mat-icon
                    >
                  }

                  <!-- Band Name Badge -->
                  <div
                    class="position-absolute start-50 translate-middle-x badge bg-dark text-white border border-secondary shadow-sm px-3 py-2 rounded-pill"
                    style="bottom: -16px; white-space: nowrap"
                  >
                    <div class="d-flex align-items-center gap-1">
                      <mat-icon style="font-size: 14px; width: 14px; height: 14px">groups</mat-icon>
                      {{ event()!.bands?.name || 'Unknown Band' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Event Title & Status -->
              <div class="col">
                <h1 class="display-4 fw-bold text-white mb-2 text-shadow">{{ event()!.title }}</h1>
                <div class="d-flex align-items-center gap-3 text-white-50 fs-5 mb-3">
                  <span class="d-flex align-items-center gap-2">
                    <mat-icon>location_on</mat-icon>
                    {{ event()!.location_name }}
                  </span>
                </div>

                <div class="d-flex gap-2">
                  <div
                    class="bg-white text-dark rounded-pill px-3 py-1 fw-bold fs-6 shadow-sm d-inline-flex align-items-center"
                  >
                    @if (event()!.ticket_price > 0) {
                      {{ event()!.ticket_price | currency: event()!.currency || 'EUR' }}
                    } @else {
                      FREE
                    }
                  </div>
                  @if (event()!.status === 'published') {
                    <div
                      class="bg-success text-white rounded-pill px-3 py-1 fw-bold fs-6 shadow-sm d-inline-flex align-items-center gap-1"
                    >
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px"
                        >check_circle</mat-icon
                      >
                      On Sale
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Section -->
        <div class="container py-5 mt-n5 position-relative z-2">
          <div class="row g-5">
            <!-- Main Content -->
            <div class="col-lg-8">
              <!-- About Card -->
              <mat-card class="p-4 rounded-4 shadow-sm border-0 mb-4 bg-white mt-4">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <h3 class="fw-bold m-0">About This Event</h3>
                </div>
                <p class="text-secondary lh-lg mb-0" style="white-space: pre-wrap">
                  {{ event()!.description || 'No description provided.' }}
                </p>
              </mat-card>

              <!-- Photos Card -->
              <mat-card class="p-4 rounded-4 shadow-sm border-0 bg-white">
                <div class="d-flex align-items-center gap-2 mb-3 text-muted">
                  <mat-icon>photo_library</mat-icon>
                  <span class="fw-bold text-dark h5 m-0">Gallery</span>
                </div>

                @if (eventPhotos().length > 0) {
                  <div class="d-flex gap-3 overflow-auto pb-2">
                    @for (photo of eventPhotos(); track photo) {
                      <img
                        [src]="photo"
                        class="rounded-3 shadow-sm"
                        style="height: 200px; object-fit: cover"
                      />
                    }
                  </div>
                } @else {
                  <div class="rounded-3 bg-light p-5 text-center text-muted border border-dashed">
                    <mat-icon
                      style="font-size: 48px; width: 48px; height: 48px"
                      class="opacity-25 mb-2"
                      >image</mat-icon
                    >
                    <p class="mb-0 small">No photos available for this event.</p>
                  </div>
                }
              </mat-card>
            </div>

            <!-- Sidebar Details -->
            <div class="col-lg-4">
              <mat-card class="p-4 rounded-4 shadow border-0 sticky-top bg-white" style="top: 24px">
                <h4 class="fw-bold mb-4">Event Details</h4>

                <div class="detail-row mb-3">
                  <div class="icon-box rounded-3 shadow-sm">
                    <mat-icon>calendar_today</mat-icon>
                  </div>
                  <div>
                    <div class="label text-muted">Date</div>
                    <div class="value fw-semibold text-dark">
                      {{ event()!.event_date | date: 'EEEE, MMMM d, yyyy' }}
                    </div>
                  </div>
                </div>

                <div class="detail-row mb-3">
                  <div class="icon-box rounded-3 shadow-sm">
                    <mat-icon>location_on</mat-icon>
                  </div>
                  <div>
                    <div class="label text-muted">Location</div>
                    <div class="value fw-semibold text-dark">{{ event()!.location_name }}</div>
                    @if (event()!.address) {
                      <div class="small text-muted">{{ event()!.address }}</div>
                    }
                  </div>
                </div>

                @if (event()!.capacity) {
                  <div class="detail-row mb-4">
                    <div class="icon-box rounded-3 shadow-sm">
                      <mat-icon>people</mat-icon>
                    </div>
                    <div>
                      <div class="label text-muted">Capacity</div>
                      <div class="value fw-semibold text-dark">
                        {{ event()!.capacity }} attendees
                      </div>
                      <div class="small text-success fw-bold">
                        {{ event()!.capacity! - event()!.tickets_sold }} spots left
                      </div>
                    </div>
                  </div>
                }

                <mat-divider class="my-4"></mat-divider>

                <!-- Ticket Purchase Section -->
                <div class="text-center mb-4">
                  <div class="display-5 fw-bold text-primary mb-1">
                    @if (event()!.ticket_price > 0) {
                      {{ event()!.ticket_price | currency: event()!.currency || 'EUR' }}
                    } @else {
                      FREE
                    }
                  </div>
                  <div class="small text-muted">per ticket</div>
                </div>

                <!-- Quantity Selector -->
                <div
                  class="d-flex align-items-center justify-content-between bg-light rounded-pill p-2 mb-3 border"
                >
                  <button
                    mat-icon-button
                    (click)="decrementQuantity()"
                    [disabled]="quantity() <= 1"
                  >
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="fw-bold fs-5">{{ quantity() }}</span>
                  <button
                    mat-icon-button
                    (click)="incrementQuantity()"
                    [disabled]="quantity() >= 10"
                  >
                    <mat-icon>add</mat-icon>
                  </button>
                </div>

                <button
                  mat-flat-button
                  class="w-100 py-3 rounded-pill fs-5 shadow-sm btn-gold position-relative overflow-hidden"
                  (click)="openConfirmDialog(confirmDialog)"
                  [disabled]="purchasing()"
                >
                  <div
                    class="d-flex align-items-center justify-content-center w-100 h-100 position-relative z-1"
                  >
                    @if (purchasing()) {
                      <mat-spinner diameter="24" class="me-2 custom-spinner"></mat-spinner>
                      <span>PROCESSING...</span>
                    } @else {
                      <mat-icon
                        class="me-2 material-icons-round"
                        style="font-size: 22px; width: 22px; height: 22px"
                        >confirmation_number</mat-icon
                      >
                      <span class="tracking-wide">GET TICKETS</span>
                    }
                  </div>
                  <div class="shine-effect"></div>
                </button>
              </mat-card>
            </div>
          </div>
        </div>
      } @else {
        <div class="container py-5 text-center mt-5">
          <div class="opacity-25 mb-3">
            <mat-icon style="font-size: 64px; width: 64px; height: 64px">event_busy</mat-icon>
          </div>
          <h3>Event not found</h3>
          <a routerLink="/community" mat-button color="primary">Back to Community</a>
        </div>
      }
    </div>

    <!-- Confirmation Dialog Template -->
    <ng-template #confirmDialog>
      <h2 mat-dialog-title class="fw-bold">Confirm Purchase</h2>
      <mat-dialog-content>
        <p class="mb-3">You are about to purchase tickets for:</p>
        <div class="card p-3 bg-light border-0 rounded-3 mb-3">
          <h5 class="fw-bold mb-1">{{ event()?.title }}</h5>
          <div class="text-muted small">{{ event()?.event_date | date: 'mediumDate' }}</div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-muted">Quantity</span>
          <span class="fw-bold"
            >{{ quantity() }} x {{ event()?.ticket_price | currency: event()?.currency }}</span
          >
        </div>
        <mat-divider class="mb-2"></mat-divider>
        <div class="d-flex justify-content-between align-items-center fs-5">
          <span class="fw-bold">Total</span>
          <span class="fw-bold text-primary">{{
            (event()?.ticket_price || 0) * quantity() | currency: event()?.currency
          }}</span>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="pb-3 px-3">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" (click)="confirmPurchase()" cdkFocusInitial>
          Confirm Payment
        </button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [
    `
      .event-hero {
        background: radial-gradient(circle at top right, #2a9d8f 0%, #264653 60%);
        min-height: 300px;
        padding-bottom: 3rem;
        position: relative;
        overflow: hidden;
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        opacity: 0.3;
      }
      .text-shadow {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .detail-row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      .icon-box {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background-color: var(--bm-primary);
        color: var(--bm-accent);
        border-radius: 12px !important;
      }
      .detail-row .label {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .detail-row .value {
        font-size: 1rem;
      }
      .hover-opacity-100:hover {
        opacity: 1 !important;
      }
      .mt-n5 {
        margin-top: -3rem !important;
      }

      /* Premium Gold Button Styles */
      .btn-gold {
        background: linear-gradient(135deg, #ffe75cff 0%, var(--bm-accent) 100%) !important;
        color: #1a1a1a !important; /* Dark text for contrast */
        font-weight: 800 !important;
        letter-spacing: 0.5px;
        border: none !important;
        box-shadow: 0 4px 15px rgba(253, 185, 49, 0.4) !important;
        transition:
          transform 0.2s,
          box-shadow 0.2s !important;
      }
      .btn-gold:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(253, 185, 49, 0.6) !important;
        filter: brightness(1.05);
      }
      .btn-gold:active {
        transform: translateY(0);
        box-shadow: 0 2px 10px rgba(253, 185, 49, 0.4) !important;
      }
      .tracking-wide {
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      /* Spinner color override */
      ::ng-deep .custom-spinner circle {
        stroke: #1a1a1a !important;
      }

      /* Shine Effect Animation */
      .shine-effect {
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.3) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        transform: skewX(-25deg);
        animation: shine 6s infinite;
        pointer-events: none;
      }
      @keyframes shine {
        0% {
          left: -100%;
        }
        20% {
          left: 200%;
        }
        100% {
          left: 200%;
        }
      }
    `,
  ],
})
export class EventDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventsService = inject(EventsService);
  public eventsStore = inject(EventsStore);
  private dialog = inject(MatDialog);

  readonly event = signal<(EventRow & { bands?: { name: string; avatar_url?: string } }) | null>(
    null,
  );
  readonly loading = signal(true);
  readonly purchasing = signal(false);
  readonly eventPhotos = signal<string[]>([]);
  readonly quantity = signal(1);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(id);
    } else {
      this.loading.set(false);
    }
  }

  loadEvent(id: string) {
    this.loading.set(true);
    this.eventsService.getById(id).subscribe({
      next: (data) => {
        this.event.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  incrementQuantity() {
    if (this.quantity() < 10) {
      this.quantity.update((v) => v + 1);
    }
  }

  decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update((v) => v - 1);
    }
  }

  openConfirmDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      width: '400px',
      panelClass: 'rounded-4',
    });
  }

  async confirmPurchase() {
    this.dialog.closeAll();
    const ev = this.event();
    if (!ev) return;

    this.purchasing.set(true);
    try {
      await this.eventsStore.buyTicket(ev.id, this.quantity());
    } catch (e) {
      console.error(e);
    } finally {
      this.purchasing.set(false);
    }
  }
}
