import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import type { CreateSongDto, UpdateSongDto } from '@bandmate/shared';
import { SongsStore } from '../../songs/state/songs-store';
import { SongFormComponent } from '../../songs/features/songs/components/song-form/song-form';

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    SongFormComponent,
  ],
  template: `
    <header class="bm-page-header">
      <div class="d-flex align-items-start gap-3">
        <button mat-icon-button class="bm-back" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>

        <div class="bm-mark" aria-hidden="true">
          <mat-icon>{{ isEdit() ? 'edit' : 'note_add' }}</mat-icon>
        </div>

        <div class="flex-grow-1 min-w-0">
          <h2 class="m-0">{{ isEdit() ? 'Edit song' : 'New song' }}</h2>

          @if (isEdit() && initial()) {
          <div class="small opacity-75 mt-1">{{ initial()!.title }} — {{ initial()!.artist }}</div>
          } @else if (!isEdit()) {
          <div class="small opacity-75 mt-1">
            Add details now, and you’ll thank yourself at rehearsal.
          </div>
          }
        </div>

        <div class="bm-header-actions">
          @if (saving()) {
          <span class="small opacity-75">Saving…</span>
          }
        </div>
      </div>
    </header>

    @if (saving()) {
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <mat-card class="bm-editor-card mt-3">
      <div class="bm-card-inner">
        @if (store.error()) {
        <div class="alert alert-danger mb-3">
          {{ store.error() }}
        </div>
        } @if (!isEdit() || initial()) {
        <app-song-form [initial]="initial()" [onSubmit]="save" [onCancel]="goBack" />
        } @else {
        <div class="text-center py-5">
          <mat-icon style="font-size: 56px; height: 56px; width: 56px" class="opacity-50">
            error_outline
          </mat-icon>

          <div class="mt-3 fw-semibold">Song not found</div>
          <div class="small opacity-75 mb-3">
            This can happen if you opened the editor directly without loading the list.
          </div>

          <button mat-stroked-button color="primary" (click)="goBack()">Back to songs</button>
        </div>
        }
      </div>
    </mat-card>
  `,
  styles: [
    `
      .bm-page-header {
        margin-bottom: 12px;
      }

      .bm-back {
        margin-top: 2px;
      }

      .bm-mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: rgba(201, 162, 39, 0.16);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .bm-header-actions {
        padding-top: 8px;
      }

      .bm-editor-card {
        border-radius: 16px;
        overflow: hidden;
      }

      .bm-card-inner {
        padding: 16px;
      }

      @media (min-width: 768px) {
        .bm-card-inner {
          padding: 24px;
        }
      }
      /* Botón primary deshabilitado (Song editor) */
      :host ::ng-deep .p-controls .mat-mdc-raised-button.mat-mdc-button-disabled {
        background-color: rgba(0, 0, 0, 0.08) !important;
        color: rgba(0, 0, 0, 0.38) !important;
        box-shadow: none !important;
        cursor: not-allowed;
      }

      :host ::ng-deep .p-controls .mat-mdc-raised-button.mat-mdc-button-disabled .mat-icon {
        color: rgba(0, 0, 0, 0.38) !important;
      }
    `,
  ],
})
export class SongEditorPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  readonly store = inject(SongsStore);

  readonly saving = signal(false);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => !!this.id() && this.id() !== 'new');

  readonly initial = computed(() => {
    const id = this.id();
    if (!id || id === 'new') return undefined;
    return this.store.getById(id) ?? undefined;
  });

  constructor() {
    // Optional UX: minimize "not found" if user refreshes on edit route
    effect(() => {
      if (this.store.state() === 'idle') this.store.load();
    });
  }

  save = (dto: CreateSongDto) => {
    this.saving.set(true);

    const id = this.id();
    const req$ =
      id && id !== 'new' ? this.store.update(id, dto as UpdateSongDto) : this.store.create(dto);

    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snack.open('Song saved', 'OK', { duration: 2000 });
        this.router.navigate(['/songs']);
      },
      error: () => this.snack.open('Could not save song', 'OK', { duration: 3000 }),
    });
  };

  goBack = () => this.router.navigate(['/songs']);
}
