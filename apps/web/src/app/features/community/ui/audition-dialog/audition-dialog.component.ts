import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { AuthStore } from '../../../../core/auth/auth.store';

export type AuditionStatus = 'pending' | 'shortlisted' | 'accepted' | 'declined';

export interface AuditionCandidate {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar?: string;
  instrument: string;
  experienceLevel: 'Amateur' | 'Semi-Pro' | 'Profesional / Gira';
  demoLinks: string;
  message: string;
  privateNotes: string;
  rating: number; // 1 to 5
  status: AuditionStatus;
  appliedAt: string;
}

export interface AuditionDialogData {
  postId: string;
  postTitle: string;
  bandName?: string;
  mode: 'apply' | 'review';
}

@Component({
  selector: 'app-audition-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    FormsModule,
  ],
  template: `
    <div class="audition-container p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-warning fs-3">how_to_reg</mat-icon>
          <div>
            <h2 class="m-0 fs-4 fw-bold">
              {{ data.mode === 'apply' ? 'Postular a Convocatoria' : 'Gestión de Audiciones & Candidatos' }}
            </h2>
            <div class="text-muted small">
              {{ data.bandName ? 'Banda: ' + data.bandName : 'Convocatoria: ' + data.postTitle }}
            </div>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- MODE 1: APPLY FORM -->
      @if (data.mode === 'apply') {
        <div class="apply-form">
          <p class="text-muted small mb-3">
            Envía tu perfil de músico directamente a la banda. Podrán revisar tu experiencia, enlaces a directos y ponerse en contacto para una prueba.
          </p>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label small fw-bold">Instrumento Principal</label>
              <select class="form-select" [(ngModel)]="applyInstrument">
                <option value="Guitarra Eléctrica">Guitarra Eléctrica</option>
                <option value="Bajo">Bajo</option>
                <option value="Batería">Batería</option>
                <option value="Teclados / Sintetizador">Teclados / Sintetizador</option>
                <option value="Voz Principal">Voz Principal</option>
                <option value="Coros / Varios">Coros / Multi-instrumentista</option>
                <option value="Saxo / Viento">Saxo / Viento</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Nivel de Experiencia</label>
              <select class="form-select" [(ngModel)]="applyExperience">
                <option value="Amateur">Amateur / Local</option>
                <option value="Semi-Pro">Semi-Pro (Salas & Directos habituales)</option>
                <option value="Profesional / Gira">Profesional / Experiencia en Gira</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold">Enlaces de Audio / Video (YouTube, Spotify, Instagram, etc.)</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="applyDemoLinks"
              placeholder="https://youtube.com/watch?v=... o https://instagram.com/..."
            />
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold">Mensaje / Carta de Presentación</label>
            <textarea
              class="form-control"
              rows="4"
              [(ngModel)]="applyMessage"
              placeholder="Cuéntale a la banda sobre tu equipo, disponibilidad para ensayos y qué te motiva de su música..."
            ></textarea>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button mat-button mat-dialog-close>Cancelar</button>
            <button
              mat-flat-button
              color="accent"
              class="rounded-pill px-4"
              [disabled]="!applyMessage.trim() || isSubmitting()"
              (click)="submitApplication()"
            >
              <mat-icon class="me-1">send</mat-icon>
              {{ isSubmitting() ? 'Enviando postulación...' : 'Enviar Postulación' }}
            </button>
          </div>
        </div>
      }

      <!-- MODE 2: CANDIDATES DASHBOARD (FOR BAND LEADERS) -->
      @if (data.mode === 'review') {
        <div class="review-dashboard">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-primary-subtle text-primary border border-primary px-3 py-1 fs-6 rounded-pill">
              {{ candidates().length }} Candidatos recibidos
            </span>
            <div class="small text-muted">
              <mat-icon class="align-middle me-1 fs-6">lock</mat-icon>
              Las notas y valoraciones son privadas para la banda
            </div>
          </div>

          @if (candidates().length === 0) {
            <div class="text-center py-5 bg-light rounded-4 border">
              <mat-icon class="text-muted" style="font-size: 48px; width: 48px; height: 48px;">person_search</mat-icon>
              <h5 class="fw-bold mt-2">Aún no hay postulaciones registradas</h5>
              <p class="text-muted small">Los músicos que respondan a tu convocatoria aparecerán en esta lista.</p>
            </div>
          } @else {
            <div class="candidates-list d-flex flex-column gap-3" style="max-height: 440px; overflow-y: auto;">
              @for (c of candidates(); track c.id) {
                <div class="candidate-card p-3 rounded-4 border bg-white shadow-sm">
                  <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div class="d-flex align-items-center gap-3">
                      <div
                        class="rounded-circle d-flex align-items-center justify-content-center bg-dark text-white fw-bold"
                        style="width: 44px; height: 44px;"
                      >
                        {{ c.applicantName.slice(0, 1).toUpperCase() }}
                      </div>
                      <div>
                        <h5 class="m-0 fw-bold text-dark">{{ c.applicantName }}</h5>
                        <div class="small text-muted">
                          <span class="badge bg-warning-subtle text-dark border border-warning me-1">{{ c.instrument }}</span>
                          <span>{{ c.experienceLevel }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Status Selector Pill -->
                    <div class="d-flex align-items-center gap-2">
                      <select
                        class="form-select form-select-sm rounded-pill fw-bold"
                        [ngClass]="{
                          'bg-warning-subtle text-warning-emphasis': c.status === 'pending',
                          'bg-info-subtle text-info-emphasis': c.status === 'shortlisted',
                          'bg-success-subtle text-success-emphasis': c.status === 'accepted',
                          'bg-danger-subtle text-danger-emphasis': c.status === 'declined'
                        }"
                        [(ngModel)]="c.status"
                        (ngModelChange)="saveCandidates()"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="shortlisted">Preseleccionado</option>
                        <option value="accepted">Aceptado para Ensayo</option>
                        <option value="declined">Descartado</option>
                      </select>
                    </div>
                  </div>

                  <!-- Applicant Message & Demos -->
                  <div class="p-2 bg-light rounded-3 small mb-2 text-dark">
                    "{{ c.message }}"
                  </div>
                  @if (c.demoLinks) {
                    <div class="small mb-2">
                      <strong class="text-secondary">Enlaces / Demos:</strong>
                      <a [href]="c.demoLinks" target="_blank" class="text-decoration-none ms-1 text-primary fw-medium">
                        {{ c.demoLinks }}
                        <mat-icon class="align-middle fs-6" style="width: 14px; height: 14px;">open_in_new</mat-icon>
                      </a>
                    </div>
                  }

                  <!-- Private Band Notes & Rating -->
                  <div class="border-top pt-2 mt-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="small fw-bold text-primary">
                        <mat-icon class="align-middle me-1" style="font-size: 16px; width: 16px; height: 16px;">lock</mat-icon>
                        Notas Privadas de la Banda
                      </span>
                      <!-- Star Rating (1 to 5) -->
                      <div class="rating-stars">
                        @for (star of [1, 2, 3, 4, 5]; track star) {
                          <mat-icon
                            class="star-icon cursor-pointer"
                            [class.text-warning]="star <= c.rating"
                            [class.text-muted]="star > c.rating"
                            (click)="setRating(c, star)"
                            style="font-size: 18px; width: 18px; height: 18px; cursor: pointer;"
                          >
                            star
                          </mat-icon>
                        }
                      </div>
                    </div>
                    <input
                      type="text"
                      class="form-control form-control-sm border-0 bg-light"
                      [(ngModel)]="c.privateNotes"
                      (ngModelChange)="saveCandidates()"
                      placeholder="Escribe comentarios internos sobre afinación, actitud o disponibilidad..."
                    />
                  </div>
                </div>
              }
            </div>
          }

          <div class="d-flex justify-content-end mt-4">
            <button mat-flat-button color="primary" class="rounded-pill px-4" mat-dialog-close>
              Listo / Cerrar
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .audition-container {
      max-width: 680px;
    }
    .cursor-pointer {
      cursor: pointer;
    }
  `],
})
export class AuditionDialogComponent {
  readonly data: AuditionDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AuditionDialogComponent>);
  private notify = inject(NotificationsService);
  private authStore = inject(AuthStore);

  // Apply Form Model
  applyInstrument = 'Guitarra Eléctrica';
  applyExperience: AuditionCandidate['experienceLevel'] = 'Semi-Pro';
  applyDemoLinks = '';
  applyMessage = '';
  isSubmitting = signal(false);

  // Candidates Model
  readonly candidates = signal<AuditionCandidate[]>([]);

  constructor() {
    this.loadCandidates();
  }

  loadCandidates() {
    const key = `bandmate_auditions_${this.data.postId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.candidates.set(parsed);
      } catch (e) {
        console.warn('Could not parse auditions from storage:', e);
      }
    }
  }

  saveCandidates() {
    const key = `bandmate_auditions_${this.data.postId}`;
    localStorage.setItem(key, JSON.stringify(this.candidates()));
  }

  submitApplication() {
    this.isSubmitting.set(true);

    const user = this.authStore.user();
    const candidate: AuditionCandidate = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      applicantId: user?.id || 'anon-musician',
      applicantName: user?.email?.split('@')[0] || 'Músico Postulante',
      instrument: this.applyInstrument,
      experienceLevel: this.applyExperience,
      demoLinks: this.applyDemoLinks,
      message: this.applyMessage,
      privateNotes: '',
      rating: 4,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    // Append to candidates list
    this.candidates.update((list) => [candidate, ...list]);
    this.saveCandidates();

    this.isSubmitting.set(false);
    this.notify.success('¡Tu postulación ha sido enviada con éxito a la banda!');
    this.dialogRef.close();
  }

  setRating(c: AuditionCandidate, stars: number) {
    c.rating = stars;
    this.saveCandidates();
  }
}
