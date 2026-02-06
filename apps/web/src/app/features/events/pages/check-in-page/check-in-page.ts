import { Component, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZXingScannerModule, ZXingScannerComponent } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { TicketingService } from '../../services/ticketing.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ZXingScannerModule,
  ],
  template: `
    <div class="check-in-container container py-4">
      <header class="d-flex align-items-center gap-3 mb-4">
        <button mat-icon-button routerLink=".." matTooltip="Back to Event">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="h3 fw-bold mb-0">Check-in Scanner</h1>
          <p class="text-secondary small mb-0">Validate tickets for this event</p>
        </div>
      </header>

      <div class="row g-4 justify-content-center">
        <!-- Scanner Section -->
        <div class="col-md-8 col-lg-6">
          <mat-card class="scanner-card border-0 shadow-sm overflow-hidden rounded-4">
            <div class="scanner-wrapper position-relative bg-dark">
              @if (hasDevices() && isScanning()) {
                <zxing-scanner
                  #scanner
                  [formats]="allowedFormats"
                  (scanSuccess)="onCodeResult($event)"
                  (camerasFound)="onCamerasFound($event)"
                  (permissionResponse)="onHasPermission($event)"
                ></zxing-scanner>

                <!-- Target Overlay -->
                <div class="scanner-overlay d-flex align-items-center justify-content-center">
                  <div class="target-box"></div>
                </div>
              } @else if (processing()) {
                <div
                  class="processing-overlay d-flex flex-column align-items-center justify-content-center h-100 py-5 text-white"
                >
                  <mat-spinner diameter="40" color="accent"></mat-spinner>
                  <p class="mt-3 letter-spacing-2 small">VALIDATING...</p>
                </div>
              } @else {
                <div
                  class="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-white opaque"
                >
                  <mat-icon class="display-1 mb-3 opacity-25">videocam_off</mat-icon>
                  <button
                    mat-flat-button
                    color="accent"
                    (click)="toggleScanner()"
                    class="rounded-pill"
                  >
                    START SCANNER
                  </button>
                </div>
              }
            </div>

            <div
              class="card-footer p-3 bg-white border-top-0 d-flex justify-content-between align-items-center"
            >
              <span class="small text-muted fw-semibold">
                @if (isScanning()) {
                  <span class="pulse-dot me-2"></span> SCANNING ACTIVE
                } @else {
                  SCANNER READY
                }
              </span>
              <button mat-button (click)="toggleScanner()">
                {{ isScanning() ? 'STOP' : 'START' }}
              </button>
            </div>
          </mat-card>
        </div>

        <!-- Result Sidebar (Optional but helpful) -->
        <div class="col-md-4">
          <div class="last-result-card animate-up" *ngIf="lastResult()">
            <mat-card
              class="border-0 shadow-sm rounded-4"
              [ngClass]="{
                'border-success': lastResult()?.success,
                'border-danger': !lastResult()?.success,
              }"
            >
              <div class="p-4 text-center">
                <div
                  class="result-icon-wrapper mx-auto mb-3"
                  [ngClass]="{
                    'bg-success-subtle text-success': lastResult()?.success,
                    'bg-danger-subtle text-danger': !lastResult()?.success,
                  }"
                >
                  <mat-icon>{{ lastResult()?.success ? 'check_circle' : 'error' }}</mat-icon>
                </div>
                <h3 class="fw-bold h5 mb-1">
                  {{ lastResult()?.success ? 'VALID TICKET' : 'INVALID TICKET' }}
                </h3>
                <p class="small text-secondary mb-3">{{ lastResult()?.message }}</p>

                <div
                  class="ticket-info-mini p-2 bg-light rounded text-start"
                  *ngIf="lastResult()?.ticket"
                >
                  <div class="small fw-bold">{{ lastResult()?.ticket.profiles?.full_name }}</div>
                  <div class="xs-text text-muted">
                    {{ lastResult()?.ticket.qr_hash.slice(0, 8) }}
                  </div>
                </div>

                <button mat-button class="w-100 mt-3" (click)="clearResult()">DISMISS</button>
              </div>
            </mat-card>
          </div>

          <div *ngIf="!lastResult()" class="text-center p-5 opacity-25">
            <mat-icon style="font-size: 3rem; width: 3rem; height: 3rem;">qr_code_scanner</mat-icon>
            <p class="small mt-2">No scans yet</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .scanner-wrapper {
        aspect-ratio: 4/3;
        min-height: 300px;
      }
      .scanner-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .target-box {
        width: 200px;
        height: 200px;
        border: 2px solid var(--bm-accent);
        border-radius: 20px;
        box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.5);
      }
      .pulse-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #4caf50;
        border-radius: 50%;
        animation: pulse-ring 1.5s infinite;
      }
      @keyframes pulse-ring {
        0% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.2);
          opacity: 1;
        }
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
      }
      .result-icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }
      .xs-text {
        font-size: 0.7rem;
      }
    `,
  ],
})
export class CheckInPageComponent {
  private route = inject(ActivatedRoute);
  private ticketingService = inject(TicketingService);
  private snackBar = inject(MatSnackBar);

  readonly allowedFormats = [BarcodeFormat.QR_CODE];

  isScanning = signal(false);
  processing = signal(false);
  hasDevices = signal(false);
  lastResult = signal<any>(null);

  bandId = signal('');
  eventId = signal('');

  constructor() {
    this.bandId.set(this.route.snapshot.queryParams['bandId'] || '');
    this.eventId.set(this.route.snapshot.params['id'] || '');
  }

  toggleScanner() {
    this.isScanning.set(!this.isScanning());
    if (this.isScanning()) this.clearResult();
  }

  onCamerasFound(devices: MediaDeviceInfo[]) {
    this.hasDevices.set(devices && devices.length > 0);
  }

  onHasPermission(has: boolean) {
    if (!has) {
      this.snackBar.open('Camera permission denied', 'OK', { duration: 3000 });
    }
  }

  onCodeResult(resultString: string) {
    if (this.processing()) return;

    this.isScanning.set(false);
    this.processing.set(true);

    this.ticketingService.validateTicket(resultString, this.bandId()).subscribe({
      next: (res) => {
        this.lastResult.set(res);
        this.processing.set(false);
        this.snackBar.open(res.message, 'OK', {
          duration: 3000,
          panelClass: res.success ? 'bm-toast--success' : 'bm-toast--warn',
        });
      },
      error: (err) => {
        this.lastResult.set({
          success: false,
          message: err.error?.message || 'Error validating ticket',
        });
        this.processing.set(false);
        this.snackBar.open('Validation failed', 'OK', {
          duration: 3000,
          panelClass: 'bm-toast--error',
        });
      },
    });
  }

  clearResult() {
    this.lastResult.set(null);
  }
}
