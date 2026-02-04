import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { SongsApiService } from '../../../songs/data/songs-api';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
  ],
  template: `
    <h2 mat-dialog-title>Share Song</h2>
    <mat-dialog-content>
      <p class="mb-3">Select a song from your library to share with the band.</p>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Search my songs</mat-label>
        <input
          matInput
          [(ngModel)]="query"
          (ngModelChange)="filter()"
          placeholder="Title, artist..."
        />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div
        class="list-group list-group-flush border rounded overflow-auto"
        style="max-height: 300px;"
      >
        @if (loading()) {
          <div class="text-center py-4">Loading...</div>
        } @else if (filteredSongs().length === 0) {
          <div class="text-center py-4 text-muted">No songs found.</div>
        }

        @for (s of filteredSongs(); track s.id) {
          <button
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
            (click)="selectedId.set(s.id)"
            [class.active]="selectedId() === s.id"
          >
            <div>
              <div class="fw-bold">{{ s.title }}</div>
              <div class="small">{{ s.artist }}</div>
            </div>
            @if (selectedId() === s.id) {
              <mat-icon>check</mat-icon>
            }
          </button>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!selectedId()" (click)="confirm()">
        Share
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .list-group-item.active {
        background-color: var(--bm-primary);
        border-color: var(--bm-primary);
        color: white;
      }
      .list-group-item.active .small {
        color: rgba(255, 255, 255, 0.8);
      }
    `,
  ],
})
export class ShareSongDialogComponent {
  private songsApi = inject(SongsApiService);
  private dialogRef = inject(MatDialogRef<ShareSongDialogComponent>);

  songs = signal<any[]>([]);
  filteredSongs = signal<any[]>([]);
  selectedId = signal<string | null>(null);
  loading = signal(true);
  query = '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    // Fetch all user songs without pagination for MVP
    // Assuming listMine fetches basic list
    this.songsApi.list().subscribe({
      next: (data) => {
        this.songs.set(data || []);
        this.filter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filter() {
    const q = this.query.toLowerCase();
    const all = this.songs();
    if (!q) {
      this.filteredSongs.set(all);
      return;
    }
    this.filteredSongs.set(
      all.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)),
    );
  }

  confirm() {
    this.dialogRef.close(this.selectedId());
  }
}
