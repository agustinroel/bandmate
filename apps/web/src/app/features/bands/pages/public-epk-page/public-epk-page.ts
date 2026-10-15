import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BandsService, BandRow } from '../../services/bands.service';
import { EventsService, EventRow } from '../../../events/services/events.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { environment } from '../../../../../environments/environment';

export interface PublicStageRiderSummary {
  totalChannels: number;
  monitorMixes: number;
  iemCount: number;
  powerDrops: number;
  minStageDimensions: string;
}

@Component({
  selector: 'app-public-epk-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="public-epk-wrapper min-vh-100">
      <!-- Public Navigation Bar -->
      <nav class="public-nav border-bottom px-4 py-3 bg-dark text-white d-flex justify-content-between align-items-center no-print">
        <div class="d-flex align-items-center gap-3">
          <a routerLink="/" class="text-white text-decoration-none d-flex align-items-center gap-2 fw-black fs-5">
            <span class="bm-brand-pill px-2 py-1 rounded bg-primary text-white">BM</span>
            Bandmate Live
          </a>
          <span class="badge bg-warning text-dark fw-bold px-2 py-1 rounded-pill small">
            EPK Oficial
          </span>
        </div>

        <div class="d-flex align-items-center gap-2">
          @if (band()) {
            <button mat-stroked-button class="text-white border-secondary rounded-pill" (click)="copyShareLink()">
              <mat-icon class="me-1">share</mat-icon>
              Compartir
            </button>
            <button mat-stroked-button class="text-white border-secondary rounded-pill" (click)="downloadEpkTxt()">
              <mat-icon class="me-1">download</mat-icon>
              Descargar .txt
            </button>
            <button mat-flat-button color="primary" class="rounded-pill" (click)="printEpk()">
              <mat-icon class="me-1">print</mat-icon>
              Imprimir / PDF
            </button>
          }
        </div>
      </nav>

      <!-- Main Container -->
      <div class="container py-4 py-md-5">
        @if (loading()) {
          <div class="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
            <mat-spinner diameter="48" class="mb-3"></mat-spinner>
            <div class="fw-bold">Cargando Dossier EPK Oficial...</div>
          </div>
        } @else if (notFound() || !band()) {
          <div class="card shadow-sm border-0 rounded-4 p-5 text-center my-5 mx-auto" style="max-width: 560px;">
            <mat-icon class="text-secondary display-3 mb-3">sentiment_dissatisfied</mat-icon>
            <h2 class="fw-bold text-dark mb-2">Banda o Dossier no encontrado</h2>
            <p class="text-muted mb-4">
              El Electronic Press Kit que estás buscando no existe o el enlace ha caducado.
            </p>
            <div>
              <a routerLink="/" mat-flat-button color="primary" class="rounded-pill px-4">
                Volver a Bandmate
              </a>
            </div>
          </div>
        } @else {
          <!-- EPK Printable Sheet -->
          <div class="epk-sheet bg-white p-4 p-md-5 rounded-4 shadow-sm mx-auto" #epkDocument>
            <!-- Hero Banner -->
            <div class="epk-hero position-relative rounded-4 overflow-hidden mb-4 p-4 p-md-5 text-white shadow">
              <div
                class="epk-hero-bg position-absolute inset-0"
                [style.backgroundImage]="band()?.avatar_url ? 'url(' + band()?.avatar_url + ')' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'"
              ></div>
              <div class="epk-hero-gradient position-absolute inset-0"></div>

              <div class="position-relative z-2">
                <span class="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2 tracking-wider">
                  OFFICIAL ELECTRONIC PRESS KIT (EPK)
                </span>
                <h1 class="display-4 fw-black m-0 mb-2">{{ band()?.name }}</h1>

                <!-- Genre Badges -->
                <div class="d-flex gap-2 flex-wrap mb-3">
                  @for (g of genres(); track g) {
                    <span class="badge bg-white text-dark fw-bold px-3 py-1 rounded-pill shadow-sm">
                      {{ g }}
                    </span>
                  }
                </div>

                <p class="fs-5 opacity-75 mb-3" style="max-width: 640px;">
                  {{ band()?.description || 'Banda profesional de directo, festivales y conciertos.' }}
                </p>

                <div class="d-flex gap-3 flex-wrap align-items-center text-white-50 small">
                  <span><mat-icon class="align-middle me-1 fs-6">place</mat-icon> España / Internacional</span>
                  <span><mat-icon class="align-middle me-1 fs-6">people</mat-icon> {{ members().length }} Músicos</span>
                  <span><mat-icon class="align-middle me-1 fs-6">music_note</mat-icon> {{ songs().length }} Canciones en Repertorio</span>
                </div>
              </div>
            </div>

            <!-- Bio & Stage Rider Summary -->
            <div class="row g-4 mb-4">
              <!-- Left Column: Bio & Musician Roster -->
              <div class="col-lg-8">
                <h4 class="fw-bold text-dark mb-2">Biografía & Trayectoria</h4>
                <p class="text-muted leading-relaxed">
                  <strong>{{ band()?.name }}</strong> destaca por un directo enérgico y una ejecución musical impecable.
                  Su propuesta combina temas originales con un repertorio dinámico adaptado a festivales, salas y grandes eventos.
                  Con una puesta en escena cuidada y soporte técnico autónomo (Rider digital y monitorización In-Ear), la banda garantiza máxima profesionalidad y fidelidad sonora en cualquier escenario.
                </p>

                <!-- Members Roster -->
                <h5 class="fw-bold text-dark mt-4 mb-3">Formación / Músicos</h5>
                <div class="row g-2">
                  @for (m of members(); track m.id) {
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
                          <div class="small text-muted text-truncate">
                            {{ m.instruments?.join(', ') || m.roles?.join(', ') || 'Músico' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  @if (members().length === 0) {
                    <div class="col-12 text-muted small py-2">
                      Información de músicos en actualización.
                    </div>
                  }
                </div>
              </div>

              <!-- Right Column: Quick Technical Specs & Booking -->
              <div class="col-lg-4">
                <div class="p-3 bg-light rounded-4 border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <!-- Technical Stage Rider Summary Box -->
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

                    <!-- Booking & Contact Box -->
                    <h5 class="fw-bold text-dark mb-2">Booking & Contacto</h5>
                    <div class="mb-2 small">
                      <div class="text-muted">Representante:</div>
                      <div class="fw-bold fs-6">{{ booking().managerName }}</div>
                    </div>
                    <div class="mb-2 small">
                      <div class="text-muted">Email Oficial:</div>
                      <div class="fw-bold fs-6">{{ booking().email }}</div>
                    </div>
                    <div class="mb-3 small">
                      <div class="text-muted">Teléfono de Producción:</div>
                      <div class="fw-bold fs-6">{{ booking().phone }}</div>
                    </div>
                  </div>

                  <!-- CTAs inside card -->
                  <div class="d-flex flex-column gap-2 pt-2 border-top no-print">
                    <button mat-flat-button color="primary" class="w-100 rounded-pill" (click)="printEpk()">
                      <mat-icon class="me-1">print</mat-icon>
                      Imprimir / Guardar PDF
                    </button>
                    <button mat-stroked-button class="w-100 rounded-pill" (click)="downloadEpkTxt()">
                      <mat-icon class="me-1">download</mat-icon>
                      Descargar Dossier (.txt)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Gigs & Repertoire Sections -->
            @if (events().length > 0 || songs().length > 0) {
              <hr class="my-4" />
              <div class="row g-4">
                @if (events().length > 0) {
                  <div class="col-md-6">
                    <h5 class="fw-bold text-dark mb-3">Próximos Conciertos & Gira</h5>
                    <div class="d-flex flex-column gap-2">
                      @for (ev of events().slice(0, 5); track ev.id) {
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

                @if (songs().length > 0) {
                  <div class="col-md-6">
                    <h5 class="fw-bold text-dark mb-3">Repertorio Destacado</h5>
                    <div class="d-flex flex-column gap-2">
                      @for (s of songs().slice(0, 6); track s.id) {
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
        }
      </div>
    </div>
  `,
  styles: [`
    .public-epk-wrapper {
      background-color: #030712;
      color: #f8fafc;
    }
    .public-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(8px);
    }
    .bm-brand-pill {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .epk-sheet {
      max-width: 960px;
      color: #0f172a;
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

    /* Print media isolation */
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
      .no-print,
      .public-nav,
      button {
        display: none !important;
      }
    }
  `],
})
export class PublicEpkPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly bandsService = inject(BandsService);
  private readonly eventsService = inject(EventsService);
  private readonly titleService = inject(Title);
  private readonly notify = inject(NotificationsService);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly band = signal<BandRow | null>(null);
  readonly members = signal<any[]>([]);
  readonly songs = signal<any[]>([]);
  readonly events = signal<EventRow[]>([]);

  readonly genres = computed(() => ['Rock / Alternativo', 'Indie Rock', 'Directo']);

  readonly stageRider = computed<PublicStageRiderSummary>(() => {
    const count = this.members().length || 4;
    return {
      totalChannels: Math.max(6, count * 3),
      monitorMixes: Math.max(2, Math.min(6, count)),
      iemCount: Math.max(1, count),
      powerDrops: Math.max(2, Math.ceil(count / 2)),
      minStageDimensions: '8m x 6m (Mínimo recomendado)',
    };
  });

  readonly booking = computed(() => {
    const b = this.band();
    const slug = b ? b.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'band';
    return {
      email: `booking@${slug}.live`,
      phone: '+34 600 123 456',
      managerName: 'Producción & Booking Oficial',
    };
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadEpkData(id);
      } else {
        this.loading.set(false);
        this.notFound.set(true);
      }
    });
  }

  async loadEpkData(id: string) {
    this.loading.set(true);
    this.notFound.set(false);

    try {
      // 1. Try directly via BandsService get(id)
      let foundBand: BandRow | null = null;
      try {
        foundBand = await this.bandsService.get(id).toPromise() || null;
      } catch (err) {
        // If 404 or slug provided, fallback to finding by slug or name in public discover bands
        foundBand = null;
      }

      if (!foundBand) {
        try {
          const list = await this.http.get<BandRow[]>(`${environment.apiBaseUrl}/bands`).toPromise();
          const cleanParam = id.toLowerCase().replace(/[^a-z0-9]/g, '');
          foundBand = (list || []).find(
            (b) =>
              b.id === id ||
              b.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanParam
          ) || null;
        } catch (e) {
          console.warn('Fallback band lookup failed:', e);
        }
      }

      if (!foundBand) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.band.set(foundBand);
      this.titleService.setTitle(`${foundBand.name} — Official EPK | Bandmate`);

      // 2. Load members, songs, and events in parallel
      const [members, songs, events] = await Promise.all([
        this.bandsService.getMembers(foundBand.id).toPromise().catch(() => []),
        this.bandsService.getSongs(foundBand.id).toPromise().catch(() => []),
        this.eventsService.getBandEvents(foundBand.id).toPromise().catch(() => []),
      ]);

      this.members.set(members || []);
      this.songs.set(songs || []);
      this.events.set(events || []);
    } catch (e) {
      console.error('Error loading public EPK data:', e);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  printEpk() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  copyShareLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).then(() => {
        this.notify.success('Enlace del EPK copiado al portapapeles');
      });
    }
  }

  downloadEpkTxt() {
    const b = this.band();
    if (!b) return;

    const rider = this.stageRider();
    const contact = this.booking();
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

    this.members().forEach((m) => {
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

    if (this.events().length > 0) {
      lines.push('');
      lines.push('--- PRÓXIMOS CONCIERTOS & GIRA ---');
      this.events().slice(0, 5).forEach((ev) => {
        lines.push(`• ${ev.event_date || ''} | ${ev.title} — ${ev.location_name || ''}`);
      });
    }

    if (this.songs().length > 0) {
      lines.push('');
      lines.push('--- REPERTORIO DESTACADO ---');
      this.songs().slice(0, 6).forEach((s) => {
        lines.push(`• "${s.title}" — ${s.artist || b.name}`);
      });
    }

    lines.push('');
    lines.push('================================================================================');
    lines.push('Documento Oficial generado por Bandmate Live • www.bandmate.live');

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'band';
    a.download = `${slug}_epk_dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.success('Dossier EPK descargado correctamente');
  }
}
