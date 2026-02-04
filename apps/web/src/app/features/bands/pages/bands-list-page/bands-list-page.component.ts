import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateBandDialogComponent } from '../../ui/create-band-dialog/create-band-dialog.component';
import { BandRow, BandsService } from '../../services/bands.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
  ],
  template: `
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex align-items-start gap-3 mb-5">
        <div class="bm-mark" aria-hidden="true">
          <mat-icon>diversity_3</mat-icon>
        </div>
        <div class="flex-grow-1">
          <h2 class="m-0">My Bands</h2>
          <div class="small opacity-75">Manage your musical groups</div>
        </div>
        <button mat-raised-button color="primary" (click)="createBand()">
          <mat-icon class="me-2">add</mat-icon> New Band
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-5 opacity-50">
          <mat-icon class="spin mb-2">sync</mat-icon>
          <div>Loading bands...</div>
        </div>
      }

      @if (!loading() && bands().length === 0) {
        <div class="text-center py-5 border rounded bg-light">
          <mat-icon class="display-4 text-muted mb-3">diversity_3</mat-icon>
          <h3 class="h5">Unlock your potential with Bands</h3>
          <p class="text-muted mb-4" style="max-width: 400px; margin: 0 auto;">
            Create a setlist, share songs, and manage your rehearsals like a pro.
          </p>
          <button mat-stroked-button color="primary" (click)="createBand()">
            Create First Band
          </button>
        </div>
      }

      <!-- Content -->
      @if (!loading() && bands().length > 0) {
        <!-- Hero Card (First Band) -->
        <div class="mb-5">
          <mat-card
            class="hero-card cursor-pointer overflow-hidden"
            [routerLink]="['/bands', bands()[0].id]"
          >
            <div class="row g-0 h-100">
              <!-- Left: Image/Color -->
              <div
                class="col-md-4 bg-dark text-white d-flex align-items-center justify-content-center hero-cover"
                [style.backgroundImage]="
                  bands()[0].avatar_url ? 'url(' + bands()[0].avatar_url + ')' : null
                "
              >
                @if (!bands()[0].avatar_url) {
                  <span class="display-1 fw-bold opacity-25">{{
                    bands()[0].name.slice(0, 1).toUpperCase()
                  }}</span>
                }
              </div>
              <!-- Right: Content -->
              <div class="col-md-8">
                <div class="p-4 d-flex flex-column h-100 justify-content-center">
                  <div class="mb-2">
                    @if (bands()[0].my_roles.includes('owner')) {
                      <span
                        class="badge bg-primary-subtle text-primary border border-primary-subtle mb-2"
                        >Owner</span
                      >
                    } @else {
                      <span
                        class="badge bg-secondary-subtle text-secondary border border-secondary-subtle mb-2"
                        >Member</span
                      >
                    }
                  </div>
                  <h2 class="display-5 fw-bold mb-2">{{ bands()[0].name }}</h2>
                  <p class="text-muted mb-4 fs-5">
                    {{ bands()[0].description || 'No description provided.' }}
                  </p>

                  <div class="d-flex gap-3">
                    <button mat-flat-button color="primary">Open Dashboard</button>
                    <button mat-stroked-button (click)="$event.stopPropagation(); createBand()">
                      Invite Members
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Grid for other bands -->
        @if (bands().length > 1) {
          <h3 class="h5 text-muted mb-3">Other Bands</h3>
          <div class="row g-3">
            @for (band of bands().slice(1); track band.id) {
              <div class="col-12 col-md-6 col-lg-4">
                <mat-card class="h-100 cursor-pointer band-card" [routerLink]="['/bands', band.id]">
                  <div
                    class="card-cover bg-secondary text-white d-flex align-items-center justify-content-center"
                    [style.backgroundImage]="
                      band.avatar_url ? 'url(' + band.avatar_url + ')' : null
                    "
                  >
                    @if (!band.avatar_url) {
                      <span class="h2 fw-bold opacity-50">{{
                        band.name.slice(0, 1).toUpperCase()
                      }}</span>
                    }
                  </div>
                  <mat-card-content class="p-3">
                    <h3 class="h6 fw-bold mb-1">{{ band.name }}</h3>
                    <p class="small text-muted mb-2 line-clamp-2">
                      {{ band.description || 'No description.' }}
                    </p>
                    <div class="small">
                      {{ band.my_roles.includes('owner') ? 'Owner' : 'Member' }}
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .spin {
        animation: spin 1s infinite linear;
      }
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .cursor-pointer {
        cursor: pointer;
      }

      .hero-card {
        min-height: 250px;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }
      .hero-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }
      .hero-cover {
        background-size: cover;
        background-position: center;
        min-height: 250px;
      }

      .band-card {
        transition: transform 0.2s;
      }
      .band-card:hover {
        transform: translateY(-2px);
      }
      .card-cover {
        height: 120px;
        background-color: #eee;
        background-size: cover;
        background-position: center;
      }

      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class BandsListPageComponent {
  private bandsService = inject(BandsService);
  private dialog = inject(MatDialog);

  bands = signal<(BandRow & { my_roles: string[] })[]>([]);
  loading = signal(true);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.bandsService.listMyBands().subscribe({
      next: (data) => {
        this.bands.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  createBand() {
    const ref = this.dialog.open(CreateBandDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe((res) => {
      if (res) this.load();
    });
  }
}
