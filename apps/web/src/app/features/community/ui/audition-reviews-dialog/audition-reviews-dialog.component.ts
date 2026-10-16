import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

export interface AuditionReviewsData {
  postId: string;
  postContent: string;
}

export interface CandidateApplication {
  id: string;
  postId: string;
  musicianId: string;
  musicianName: string;
  musicianUsername?: string;
  musicianAvatar?: string | null;
  instrument: string;
  experienceYears: number;
  mediaUrl?: string;
  message: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected';
  privateNotes?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-audition-reviews-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="audition-reviews-dialog p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-primary fs-3">assignment_ind</mat-icon>
          <div>
            <h2 class="m-0 fs-5 fw-bold">Candidaturas para tu Convocatoria</h2>
            <div class="text-muted small">Evalúa candidatos y añade notas privadas para la banda</div>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (isLoading()) {
        <div class="text-center py-5">
          <mat-spinner diameter="36" class="mx-auto mb-2"></mat-spinner>
          <div class="text-muted small">Cargando candidatos...</div>
        </div>
      } @else if (applications().length === 0) {
        <div class="text-center py-5 bg-light rounded-3 border">
          <mat-icon class="text-muted mb-2" style="font-size: 40px; width: 40px; height: 40px;">inbox</mat-icon>
          <h6 class="fw-bold">Aún no hay solicitudes</h6>
          <p class="text-muted small mb-0">Cuando los músicos de la comunidad postulen, aparecerán aquí.</p>
        </div>
      } @else {
        <div class="applications-list" style="max-height: 480px; overflow-y: auto;">
          @for (app of applications(); track app.id) {
            <div class="card p-3 mb-3 border rounded-3 shadow-sm">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-circle">
                    @if (app.musicianAvatar) {
                      <img src="assets/brand/avatar-fallback.svg" [src]="app.musicianAvatar" class="avatar-img" [alt]="app.musicianName" />
                    } @else {
                      <mat-icon class="text-muted">person</mat-icon>
                    }
                  </div>
                  <div>
                    <div class="fw-bold">{{ app.musicianName }}</div>
                    <div class="text-muted small">
                      {{ app.instrument }} • {{ app.experienceYears }} años de experiencia
                    </div>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                  <select
                    class="form-select form-select-sm"
                    [(ngModel)]="app.status"
                    (change)="updateStatus(app)"
                    style="width: 165px;"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="shortlisted">Preseleccionado</option>
                    <option value="accepted">Convocado Ensayo</option>
                    <option value="rejected">Descartado</option>
                  </select>
                </div>
              </div>

              <!-- Message -->
              <div class="p-2 bg-light rounded-2 small text-dark mb-2">
                "{{ app.message }}"
              </div>

              <!-- Media Link -->
              @if (app.mediaUrl) {
                <div class="mb-2">
                  <a
                    [href]="app.mediaUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-outline-primary btn-sm rounded-pill text-decoration-none d-inline-flex align-items-center gap-1"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">play_circle</mat-icon>
                    Ver Vídeo / Escuchar Audio
                  </a>
                </div>
              }

              <!-- Private Notes for Band Leader -->
              <div class="mt-2 pt-2 border-top">
                <label class="form-label small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">lock</mat-icon>
                  Notas Privadas de Evaluación (Solo visibles para ti y la banda)
                </label>
                <div class="d-flex gap-2">
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Escribe notas (ej: Buen tempo, probar temas 3 y 4 en ensayo)..."
                    [(ngModel)]="app.privateNotes"
                  />
                  <button
                    mat-flat-button
                    color="primary"
                    class="btn-sm"
                    (click)="saveNotes(app)"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <div class="d-flex justify-content-end mt-3">
        <button mat-button mat-dialog-close>Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .audition-reviews-dialog {
      max-width: 640px;
    }
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `],
})
export class AuditionReviewsDialogComponent implements OnInit {
  readonly data: AuditionReviewsData = inject(MAT_DIALOG_DATA);
  private http = inject(HttpClient);
  private notify = inject(NotificationsService);

  readonly applications = signal<CandidateApplication[]>([]);
  readonly isLoading = signal(true);

  ngOnInit() {
    this.fetchApplications();
  }

  fetchApplications() {
    this.isLoading.set(true);
    const apiUrl = environment.apiUrl || 'http://localhost:3000';
    this.http.get<CandidateApplication[]>(`${apiUrl}/auditions/${this.data.postId}/applications`).subscribe({
      next: (apps) => {
        this.applications.set(apps || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching applications:', err);
        this.isLoading.set(false);
      },
    });
  }

  updateStatus(app: CandidateApplication) {
    const apiUrl = environment.apiUrl || 'http://localhost:3000';
    this.http.patch(`${apiUrl}/auditions/applications/${app.id}`, { status: app.status }).subscribe({
      next: () => {
        this.notify.success('Estado del candidato actualizado');
      },
      error: () => {
        this.notify.error('Error al actualizar estado');
      },
    });
  }

  saveNotes(app: CandidateApplication) {
    const apiUrl = environment.apiUrl || 'http://localhost:3000';
    this.http.patch(`${apiUrl}/auditions/applications/${app.id}`, { privateNotes: app.privateNotes }).subscribe({
      next: () => {
        this.notify.success('Notas privadas guardadas');
      },
      error: () => {
        this.notify.error('Error al guardar notas');
      },
    });
  }
}
