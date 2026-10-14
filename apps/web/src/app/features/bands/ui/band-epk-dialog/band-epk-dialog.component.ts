import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { BandRow } from '../../services/bands.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

export interface BandEpkDialogData {
  band: BandRow;
  members: any[];
  songs: any[];
  events: any[];
}

@Component({
  selector: 'app-band-epk-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="epk-container position-relative">
      <!-- Close Button -->
      <button mat-icon-button class="epk-close-btn position-absolute top-0 end-0 m-3 z-3" mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>

      <!-- Printable EPK One-Sheet Document -->
      <div class="epk-sheet bg-white p-4 p-md-5 rounded-4 shadow-sm" #epkDocument>
        <!-- Header Banner / Hero -->
        <div class="epk-hero position-relative rounded-4 overflow-hidden mb-4 p-4 p-md-5 text-white shadow">
          <div
            class="epk-hero-bg position-absolute inset-0"
            [style.backgroundImage]="data.band.avatar_url ? 'url(' + data.band.avatar_url + ')' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'"
          ></div>
          <div class="epk-hero-gradient position-absolute inset-0"></div>

          <div class="position-relative z-2">
            <span class="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2 tracking-wider">
              OFFICIAL ELECTRONIC PRESS KIT (EPK)
            </span>
            <h1 class="display-4 fw-black m-0 mb-2">{{ data.band.name }}</h1>
            <p class="fs-5 opacity-75 mb-3" style="max-width: 600px;">
              {{ data.band.description || 'Banda profesional de directo, festivales y conciertos.' }}
            </p>

            <div class="d-flex gap-3 flex-wrap align-items-center text-white-50 small">
              <span><mat-icon class="align-middle me-1 fs-6">place</mat-icon> España / Internacional</span>
              <span><mat-icon class="align-middle me-1 fs-6">people</mat-icon> {{ data.members.length }} Músicos</span>
              <span><mat-icon class="align-middle me-1 fs-6">music_note</mat-icon> {{ data.songs.length }} Canciones en Repertorio</span>
            </div>
          </div>
        </div>

        <!-- Band Bio Section -->
        <div class="row g-4 mb-4">
          <div class="col-lg-8">
            <h4 class="fw-bold text-dark mb-2">Biografía & Trayectoria</h4>
            <p class="text-muted leading-relaxed">
              <strong>{{ data.band.name }}</strong> destaca por un directo enérgico y una ejecución musical impecable.
              Su propuesta combina temas originales con un repertorio dinámico adaptado a festivales, salas y grandes eventos.
              Con una puesta en escena cuidada y soporte técnico autónomo (Rider digital y monitorización In-Ear), la banda garantiza máxima profesionalidad y fidelidad sonora.
            </p>

            <!-- Band Members Roster -->
            <h5 class="fw-bold text-dark mt-4 mb-3">Formación / Músicos</h5>
            <div class="row g-2">
              @for (m of data.members; track m.id) {
                <div class="col-sm-6">
                  <div class="d-flex align-items-center gap-3 p-2 rounded-3 border bg-light">
                    <div
                      class="rounded-circle d-flex align-items-center justify-content-center bg-dark text-white fw-bold"
                      style="width: 40px; height: 40px; min-width: 40px;"
                    >
                      {{ (m.full_name || m.username || 'M').slice(0, 1).toUpperCase() }}
                    </div>
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="fw-bold small text-truncate">{{ m.full_name || m.username }}</div>
                      <div class="small text-muted text-truncate">{{ m.instruments?.join(', ') || m.roles?.join(', ') || 'Músico' }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Quick Facts & Booking Contact -->
          <div class="col-lg-4">
            <div class="p-3 bg-light rounded-4 border h-100">
              <h5 class="fw-bold text-dark mb-3">Booking & Contacto</h5>
              <div class="mb-3 small">
                <div class="text-muted">Representante / Contratación:</div>
                <div class="fw-bold fs-6">booking&#64;{{ sanitizeName(data.band.name) }}.live</div>
              </div>
              <div class="mb-3 small">
                <div class="text-muted">Teléfono de Producción:</div>
                <div class="fw-bold fs-6">+34 600 000 000</div>
              </div>
              <div class="mb-3 small">
                <div class="text-muted">Rider Técnico & Stage Plot:</div>
                <span class="badge bg-success-subtle text-success border border-success px-2 py-1">
                  ✓ Disponible en Bandmate
                </span>
              </div>

              <hr class="my-3" />

              <div class="d-flex flex-column gap-2">
                <button mat-flat-button color="primary" class="w-100 rounded-pill" (click)="printEpk()">
                  <mat-icon class="me-1">print</mat-icon>
                  Imprimir / Guardar PDF
                </button>
                <button mat-stroked-button class="w-100 rounded-pill" (click)="copyShareLink()">
                  <mat-icon class="me-1">share</mat-icon>
                  Copiar Enlace Público
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Featured Gigs & Repertoire Highlights -->
        @if (data.events.length > 0 || data.songs.length > 0) {
          <hr class="my-4" />
          <div class="row g-4">
            @if (data.events.length > 0) {
              <div class="col-md-6">
                <h5 class="fw-bold text-dark mb-3">Próximos Conciertos & Gira</h5>
                <div class="d-flex flex-column gap-2">
                  @for (ev of data.events.slice(0, 4); track ev.id) {
                    <div class="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between">
                      <div>
                        <div class="fw-bold small">{{ ev.title }}</div>
                        <div class="small text-muted">{{ ev.location_name }}</div>
                      </div>
                      <span class="badge bg-secondary-subtle text-secondary small">
                        {{ ev.event_date | date: 'dd MMM yyyy' }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }

            @if (data.songs.length > 0) {
              <div class="col-md-6">
                <h5 class="fw-bold text-dark mb-3">Repertorio Destacado</h5>
                <div class="d-flex flex-column gap-2">
                  @for (s of data.songs.slice(0, 4); track s.id) {
                    <div class="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between">
                      <div class="d-flex align-items-center gap-2">
                        <mat-icon class="text-primary small">audiotrack</mat-icon>
                        <span class="fw-medium small">{{ s.title }}</span>
                      </div>
                      <span class="text-muted small">{{ s.artist }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Footer -->
        <div class="epk-footer text-center mt-5 pt-3 border-top text-muted small">
          Electronic Press Kit verificado por <strong>Bandmate Live</strong> • www.bandmate.live
        </div>
      </div>
    </div>
  `,
  styles: [`
    .epk-container {
      max-width: 860px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .inset-0 {
      top: 0; left: 0; right: 0; bottom: 0;
    }
    .epk-hero-bg {
      background-size: cover;
      background-position: center;
      filter: blur(4px);
      opacity: 0.35;
    }
    .epk-hero-gradient {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.85) 100%);
    }
    .fw-black {
      font-weight: 900;
    }
    .tracking-wider {
      letter-spacing: 0.1em;
    }

    @media print {
      body * {
        visibility: hidden !important;
      }
      .epk-sheet,
      .epk-sheet * {
        visibility: visible !important;
      }
      .epk-sheet {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      .epk-close-btn,
      button {
        display: none !important;
      }
    }
  `],
})
export class BandEpkDialogComponent {
  readonly data: BandEpkDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<BandEpkDialogComponent>);
  private notify = inject(NotificationsService);

  sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  printEpk() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  copyShareLink() {
    const slug = this.sanitizeName(this.data.band.name);
    const url = `${window.location.origin}/epk/${slug || this.data.band.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      this.notify.success('¡Enlace público del EPK copiado al portapapeles!');
    });
  }
}
