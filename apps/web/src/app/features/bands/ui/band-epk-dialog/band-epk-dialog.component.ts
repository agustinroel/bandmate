import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { BandRow } from '../../services/bands.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

export interface StageRiderSummary {
  totalChannels: number;
  monitorMixes: number;
  iemCount: number;
  powerDrops: number;
  minStageDimensions: string;
}

export interface BookingContact {
  email?: string;
  phone?: string;
  managerName?: string;
}

export interface BandEpkDialogData {
  band: Partial<BandRow> & { name: string; [key: string]: any };
  members: any[];
  songs: any[];
  events: any[];
  genre?: string;
  genres?: string[];
  bookingContact?: BookingContact;
  stageRiderSummary?: StageRiderSummary;
  [key: string]: any;
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
      <button mat-icon-button class="epk-close-btn position-absolute top-0 end-0 m-3 z-3 no-print" mat-dialog-close>
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

            <!-- Genre Tags -->
            <div class="d-flex gap-2 flex-wrap mb-3">
              @for (g of genres(); track g) {
                <span class="badge bg-white text-dark fw-bold px-3 py-1 rounded-pill shadow-sm">
                  {{ g }}
                </span>
              }
            </div>

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

        <!-- Band Bio & Stage Rider Summary -->
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

          <!-- Quick Facts, Stage Rider Summary & Booking Contact -->
          <div class="col-lg-4">
            <div class="p-3 bg-light rounded-4 border h-100 d-flex flex-column justify-content-between">
              <div>
                <!-- Dynamic Technical Stage Rider Summary -->
                <div class="rider-summary-card p-3 bg-white rounded-3 border mb-3">
                  <div class="small fw-bold text-uppercase text-secondary mb-2 d-flex align-items-center gap-1">
                    <mat-icon class="fs-6">settings_input_composite</mat-icon>
                    Ficha Técnica de Escenario
                  </div>
                  <div class="d-flex flex-column gap-2 small">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Canales FOH:</span>
                      <span class="badge bg-dark text-white fw-bold">{{ stageRider().totalChannels }} Canales</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Envíos Monitor:</span>
                      <span class="badge bg-secondary text-white">{{ stageRider().monitorMixes }} Envíos</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Líneas IEM:</span>
                      <span class="badge bg-info-subtle text-dark border">{{ stageRider().iemCount }} In-Ear</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Tomas Corriente:</span>
                      <span class="badge bg-warning-subtle text-dark border">{{ stageRider().powerDrops }}x 220V</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Escenario Mín.:</span>
                      <span class="fw-bold text-dark">{{ stageRider().minStageDimensions }}</span>
                    </div>
                  </div>
                </div>

                <!-- Booking Contact Info -->
                <h5 class="fw-bold text-dark mb-2">Booking & Contacto</h5>
                <div class="mb-2 small">
                  <div class="text-muted">Representante:</div>
                  <div class="fw-bold fs-6">{{ bookingContact().managerName }}</div>
                </div>
                <div class="mb-2 small">
                  <div class="text-muted">Email Oficial:</div>
                  <div class="fw-bold fs-6">{{ bookingContact().email }}</div>
                </div>
                <div class="mb-3 small">
                  <div class="text-muted">Teléfono de Producción:</div>
                  <div class="fw-bold fs-6">{{ bookingContact().phone }}</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex flex-column gap-2 pt-2 border-top no-print">
                <button mat-flat-button color="primary" class="w-100 rounded-pill" (click)="printEpk()">
                  <mat-icon class="me-1">print</mat-icon>
                  Imprimir / Guardar PDF
                </button>
                <div class="d-flex gap-2">
                  <button mat-stroked-button class="flex-grow-1 rounded-pill" (click)="downloadEpkTxt()">
                    <mat-icon class="me-1">download</mat-icon>
                    Descargar .txt
                  </button>
                  <button mat-stroked-button class="flex-grow-1 rounded-pill" (click)="copyEpkText()">
                    <mat-icon class="me-1">content_copy</mat-icon>
                    Copiar Dossier
                  </button>
                </div>
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
      .no-print,
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

  readonly genres = computed<string[]>(() => {
    if (this.data.genres && this.data.genres.length > 0) {
      return this.data.genres;
    }
    if (this.data.genre) {
      return this.data.genre.split(/[,/|]/).map((g) => g.trim()).filter(Boolean);
    }
    return ['Rock / Alternativo', 'Indie', 'Directo'];
  });

  readonly stageRider = computed<StageRiderSummary>(() => {
    if (this.data.stageRiderSummary) {
      return this.data.stageRiderSummary;
    }
    const count = this.data.members?.length || 4;
    return {
      totalChannels: Math.max(6, count * 3),
      monitorMixes: Math.max(2, Math.min(6, count)),
      iemCount: Math.max(1, count),
      powerDrops: Math.max(2, Math.ceil(count / 2)),
      minStageDimensions: '8m x 6m (Mínimo)',
    };
  });

  readonly bookingContact = computed<Required<BookingContact>>(() => {
    const b = this.data.bookingContact;
    const fallbackEmail = `booking@${this.sanitizeName(this.data.band.name)}.live`;
    return {
      email: b?.email || fallbackEmail,
      phone: b?.phone || '+34 600 000 000',
      managerName: b?.managerName || 'Producción & Booking',
    };
  });

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

  generateEpkPlainText(): string {
    const b = this.data.band;
    const rider = this.stageRider();
    const contact = this.bookingContact();
    const lines: string[] = [
      '================================================================================',
      `${b.name.toUpperCase()} — OFFICIAL ELECTRONIC PRESS KIT (EPK)`,
      '================================================================================',
      `Estilo / Géneros: ${this.genres().join(' • ')}`,
      `Descripción: ${b.description || 'Banda profesional de directo, festivales y salas.'}`,
      `Contacto Booking: ${contact.managerName} (${contact.email} / ${contact.phone})`,
      '================================================================================',
      '',
      '--- FORMACIÓN / MÚSICOS ---',
    ];

    (this.data.members || []).forEach((m) => {
      const name = m.full_name || m.username || 'Músico';
      const inst = m.instruments?.join(', ') || m.roles?.join(', ') || 'Instrumentista';
      lines.push(`• ${name} — ${inst}`);
    });

    lines.push('');
    lines.push('--- FICHA TÉCNICA RESUMIDA (STAGE RIDER SUMMARY) ---');
    lines.push(`• Canales de Entrada FOH: ${rider.totalChannels}`);
    lines.push(`• Envíos de Monitores: ${rider.monitorMixes}`);
    lines.push(`• Sistemas In-Ear Monitor (IEM): ${rider.iemCount}`);
    lines.push(`• Tomas de Corriente: ${rider.powerDrops}x 220V Schuko`);
    lines.push(`• Dimensiones de Escenario Mínimas: ${rider.minStageDimensions}`);

    if (this.data.events && this.data.events.length > 0) {
      lines.push('');
      lines.push('--- PRÓXIMOS CONCIERTOS & GIRA ---');
      this.data.events.slice(0, 5).forEach((ev) => {
        lines.push(`• ${ev.event_date || ''} | ${ev.title} — ${ev.location_name || ''}`);
      });
    }

    if (this.data.songs && this.data.songs.length > 0) {
      lines.push('');
      lines.push('--- REPERTORIO DESTACADO ---');
      this.data.songs.slice(0, 6).forEach((s) => {
        lines.push(`• "${s.title}" — ${s.artist || b.name}`);
      });
    }

    lines.push('');
    lines.push('================================================================================');
    lines.push('Documento Oficial generado por Bandmate Live • www.bandmate.live');
    return lines.join('\n');
  }

  copyEpkText() {
    const text = this.generateEpkPlainText();
    navigator.clipboard?.writeText(text).then(() => {
      this.notify.success('Dossier EPK copiado al portapapeles');
    });
  }

  downloadEpkTxt() {
    const text = this.generateEpkPlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = this.sanitizeName(this.data.band.name) || 'band';
    a.download = `${slug}_epk_dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.success('Dossier EPK descargado correctamente');
  }
}
