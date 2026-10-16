import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BandsService, BandRow } from '../../services/bands.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

export type BandWithRoles = BandRow & { my_roles?: string[] };

@Component({
  selector: 'app-invite-band-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="invite-modal-container">
      <div class="dialog-header">
        <div class="header-icon-badge">
          <mat-icon>group_add</mat-icon>
        </div>
        <div class="header-text">
          <h2 class="dialog-title">Invitar a una banda</h2>
          <p class="dialog-subtitle">
            Selecciona la banda a la que deseas invitar a <strong>{{ data.userName }}</strong>
          </p>
        </div>
      </div>

      <mat-dialog-content class="modal-body custom-scrollbar">
        @if (loading()) {
          <div class="loading-box">
            <mat-spinner diameter="32"></mat-spinner>
            <span>Cargando tus bandas...</span>
          </div>
        } @else if (myBands().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrap">
              <mat-icon>groups</mat-icon>
            </div>
            <div class="empty-title">No administras ninguna banda</div>
            <p class="empty-desc">Crea una banda primero para poder invitar a otros músicos.</p>
          </div>
        } @else {
          <label class="list-label">Tus Bandas Disponibles</label>
          <div class="bands-selection-list">
            @for (band of myBands(); track band.id) {
              <div
                class="band-select-card"
                [class.selected]="selectedBand()?.id === band.id"
                (click)="selectedBand.set(band)"
                tabindex="0"
                role="radio"
                [attr.aria-checked]="selectedBand()?.id === band.id"
              >
                <div class="band-avatar-wrap">
                  @if (band.avatar_url) {
                    <img
                      src="assets/brand/avatar-fallback.svg"
                      [src]="band.avatar_url"
                      [alt]="band.name"
                      class="band-avatar"
                    />
                  } @else {
                    <mat-icon>diversity_3</mat-icon>
                  }
                </div>
                <div class="band-info flex-grow-1">
                  <div class="band-name">{{ band.name }}</div>
                  <div class="band-meta">
                    Rol: {{ (band.my_roles ?? []).includes('owner') ? 'Propietario' : 'Administrador' }}
                  </div>
                </div>
                <div class="radio-indicator">
                  <mat-icon>{{ selectedBand()?.id === band.id ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                </div>
              </div>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="modal-actions">
        <button mat-stroked-button class="bm-cancel-btn" mat-dialog-close>
          Cancelar
        </button>
        <button
          mat-flat-button
          class="bm-confirm-btn"
          [disabled]="!selectedBand() || inviting()"
          (click)="invite()"
        >
          @if (inviting()) {
            <span>Invitando...</span>
          } @else {
            <span class="d-inline-flex align-items-center">
              <mat-icon class="me-1">send</mat-icon>
              Enviar Invitación
            </span>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .invite-modal-container {
        padding: 4px;
        min-width: 320px;
        max-width: 440px;
      }

      .dialog-header {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 8px 12px 14px;
        border-bottom: 1px solid var(--bm-border, rgba(0, 0, 0, 0.08));
      }

      .header-icon-badge {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(233, 196, 106, 0.16);
        color: #b47c13;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .dialog-title {
        margin: 0;
        font-family: var(--bm-font-display, 'Space Grotesk', sans-serif);
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--bm-text-primary, #1e293b);
      }

      .dialog-subtitle {
        margin: 2px 0 0;
        font-size: 0.85rem;
        color: var(--bm-text-secondary, #64748b);
        line-height: 1.35;
      }

      .modal-body {
        padding: 16px 12px !important;
        margin: 0 !important;
        max-height: 60vh;
      }

      .loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 28px 0;
        color: var(--bm-text-secondary, #64748b);
        font-size: 0.9rem;
      }

      .empty-state {
        text-align: center;
        padding: 24px 12px;

        .empty-icon-wrap {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bm-text-secondary, #64748b);
        }

        .empty-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--bm-text-primary, #1e293b);
          margin-bottom: 4px;
        }

        .empty-desc {
          font-size: 0.825rem;
          color: var(--bm-text-secondary, #64748b);
          margin: 0;
        }
      }

      .list-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--bm-text-secondary, #64748b);
        margin-bottom: 10px;
      }

      .bands-selection-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .band-select-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1.5px solid var(--bm-border, rgba(0, 0, 0, 0.08));
        background: var(--bm-surface, #ffffff);
        cursor: pointer;
        transition: all 0.18s ease;

        &:hover {
          background: rgba(233, 196, 106, 0.05);
          border-color: rgba(233, 196, 106, 0.4);
          transform: translateY(-1px);
        }

        &.selected {
          border-color: var(--bm-accent, #e9c46a);
          background: rgba(233, 196, 106, 0.12);

          .radio-indicator mat-icon {
            color: #b47c13;
          }
        }
      }

      .band-avatar-wrap {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        overflow: hidden;
        background: rgba(38, 70, 83, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--bm-primary, #264653);
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .band-name {
        font-weight: 700;
        font-size: 0.925rem;
        color: var(--bm-text-primary, #1e293b);
      }

      .band-meta {
        font-size: 0.75rem;
        color: var(--bm-text-secondary, #64748b);
      }

      .radio-indicator {
        color: var(--bm-border, #cbd5e1);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .modal-actions {
        padding: 12px 12px 6px !important;
        border-top: 1px solid var(--bm-border, rgba(0, 0, 0, 0.08));
        gap: 8px;
      }

      .bm-cancel-btn {
        border-color: rgba(148, 163, 184, 0.4) !important;
        color: var(--bm-text-secondary, #64748b) !important;
        border-radius: 10px !important;

        &:hover {
          color: var(--bm-text-primary, #1e293b) !important;
          background: rgba(0, 0, 0, 0.04) !important;
        }
      }

      .bm-confirm-btn {
        background: linear-gradient(135deg, #e9c46a, #c8963e) !important;
        color: #141a16 !important;
        font-weight: 700 !important;
        border-radius: 10px !important;
        box-shadow: 0 2px 8px rgba(200, 150, 62, 0.25) !important;

        &:disabled {
          opacity: 0.55;
          box-shadow: none !important;
        }
      }

      /* Dark Mode Specific Overrides */
      :host-context([data-theme='dark']),
      :host-context([data-bs-theme='dark']),
      :host-context(.theme-dark) {
        .dialog-header {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .header-icon-badge {
          background: rgba(233, 196, 106, 0.18);
          color: #e9c46a;
        }

        .dialog-title {
          color: #f8fafc;
        }

        .dialog-subtitle {
          color: #94a3b8;
        }

        .band-select-card {
          border-color: rgba(255, 255, 255, 0.08);
          background: #181d26;

          &:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(233, 196, 106, 0.35);
          }

          &.selected {
            border-color: #e9c46a;
            background: rgba(233, 196, 106, 0.14);

            .radio-indicator mat-icon {
              color: #e9c46a;
            }
          }
        }

        .band-avatar-wrap {
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }

        .band-name {
          color: #f8fafc;
        }

        .band-meta {
          color: #94a3b8;
        }

        .modal-actions {
          border-top-color: rgba(255, 255, 255, 0.08);
        }

        .bm-cancel-btn {
          border-color: rgba(255, 255, 255, 0.18) !important;
          color: #94a3b8 !important;

          &:hover {
            color: #ffffff !important;
            background: rgba(255, 255, 255, 0.06) !important;
          }
        }
      }
    `,
  ],
})
export class InviteBandDialogComponent implements OnInit {
  private bandsService = inject(BandsService);
  private notify = inject(NotificationsService);
  private dialogRef = inject(MatDialogRef<InviteBandDialogComponent>);

  date = inject(MAT_DIALOG_DATA);

  myBands = signal<BandWithRoles[]>([]);
  loading = signal(true);
  inviting = signal(false);
  selectedBand = signal<BandWithRoles | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { userId: string; userName: string }) {}

  ngOnInit() {
    this.bandsService.listMyBands().subscribe({
      next: (bands) => {
        // Filter bands where I am admin or owner
        const adminBands = (bands || []).filter(
          (b) => (b.my_roles ?? []).includes('admin') || (b.my_roles ?? []).includes('owner'),
        );
        this.myBands.set(adminBands);
        if (adminBands.length === 1) {
          this.selectedBand.set(adminBands[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  invite() {
    const band = this.selectedBand();
    if (!band) return;

    this.inviting.set(true);
    this.bandsService.inviteUser(band.id, this.data.userId).subscribe({
      next: () => {
        this.notify.success(`¡Invitación enviada a ${this.data.userName} para ${band.name}!`, 'OK');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.notify.error(err.error?.message || 'Error al enviar invitación', 'Cerrar');
        this.inviting.set(false);
      },
    });
  }
}
