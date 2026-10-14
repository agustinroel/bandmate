import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { AuthStore } from '../../../../core/auth/auth.store';

export interface AuditionDialogData {
  postId: string;
  postAuthorName: string;
  postContent: string;
}

@Component({
  selector: 'app-audition-application-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="audition-dialog p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-warning fs-3">campaign</mat-icon>
          <div>
            <h2 class="m-0 fs-5 fw-bold">Postular a la Convocatoria</h2>
            <div class="text-muted small">Banda / Autor: {{ data.postAuthorName }}</div>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Post preview snippet -->
      <div class="p-3 bg-light rounded-3 mb-3 border small text-muted">
        <em>"{{ data.postContent }}"</em>
      </div>

      <!-- Application Form -->
      <form (ngSubmit)="submitApplication()">
        <div class="mb-3">
          <label class="form-label small fw-bold">Tu Instrumento Principal</label>
          <input
            type="text"
            class="form-control"
            [(ngModel)]="instrument"
            name="instrument"
            placeholder="Ej. Bajista (4 y 5 cuerdas) / Guitarra Solista"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold">Años de Experiencia en Directo / Ensayos</label>
          <input
            type="number"
            class="form-control"
            [(ngModel)]="experienceYears"
            name="experienceYears"
            min="0"
            max="60"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold">Enlace a Vídeo, Audio o Reel (Opcional)</label>
          <input
            type="url"
            class="form-control"
            [(ngModel)]="mediaUrl"
            name="mediaUrl"
            placeholder="https://youtube.com/... o instagram.com/reel/..."
          />
          <div class="form-text small">Muestra cómo tocas para que la banda pueda evaluarte rápidamente.</div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold">Mensaje para la Banda</label>
          <textarea
            class="form-control"
            rows="4"
            [(ngModel)]="message"
            name="message"
            placeholder="Cuéntales sobre tu disponibilidad, equipo propio y por qué encajarías en su proyecto..."
            required
          ></textarea>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" mat-button mat-dialog-close [disabled]="isSubmitting()">Cancelar</button>
          <button
            type="submit"
            mat-flat-button
            color="primary"
            class="rounded-pill px-4"
            [disabled]="!instrument || !message || isSubmitting()"
          >
            <mat-icon class="me-1">send</mat-icon>
            {{ isSubmitting() ? 'Enviando...' : 'Enviar Solicitud' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .audition-dialog {
      max-width: 540px;
    }
  `],
})
export class AuditionApplicationDialogComponent {
  readonly data: AuditionDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AuditionApplicationDialogComponent>);
  private http = inject(HttpClient);
  private notify = inject(NotificationsService);
  private auth = inject(AuthStore);

  instrument = '';
  experienceYears = 3;
  mediaUrl = '';
  message = '';
  readonly isSubmitting = signal(false);

  submitApplication() {
    if (!this.instrument.trim() || !this.message.trim()) return;

    this.isSubmitting.set(true);
    const user = this.auth.user();

    const payload = {
      musicianId: user?.id,
      musicianName: user?.user_metadata?.['full_name'] || user?.email?.split('@')[0] || 'Músico',
      musicianUsername: user?.email?.split('@')[0] || 'musico',
      musicianAvatar: user?.user_metadata?.['avatar_url'] || null,
      instrument: this.instrument.trim(),
      experienceYears: Number(this.experienceYears) || 1,
      mediaUrl: this.mediaUrl.trim() || undefined,
      message: this.message.trim(),
    };

    const apiUrl = environment.apiUrl || 'http://localhost:3000';
    this.http.post(`${apiUrl}/auditions/${this.data.postId}/apply`, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notify.success('¡Solicitud enviada con éxito! La banda recibirá tu candidatura.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error submitting application:', err);
        this.isSubmitting.set(false);
        this.notify.error(err?.error?.message || 'Error al enviar la solicitud');
      },
    });
  }
}
