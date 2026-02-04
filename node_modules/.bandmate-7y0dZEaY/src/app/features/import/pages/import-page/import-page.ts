import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <div class="bm-page-header mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="bm-mark" aria-hidden="true">
          <mat-icon>sync</mat-icon>
        </div>
        <div>
          <h2 class="m-0">Spotify Import</h2>
          <div class="small opacity-75">Connect your music world to Bandmate.</div>
        </div>
      </div>
    </div>

    <mat-card class="bm-card p-4" *ngIf="!spotifyToken()">
      <div class="text-center py-5">
        <mat-icon style="font-size: 64px; width: 64px; height: 64px;" color="accent">lock</mat-icon>
        <h3>Authentication Required</h3>
        <p class="opacity-75">Connect with Spotify to browse your playlists and import songs.</p>
        <button mat-raised-button color="primary" (click)="login()">
          Connect Spotify
        </button>
      </div>
    </mat-card>

    <div *ngIf="spotifyToken()">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="m-0">Found Tracks</h4>
        <button mat-flat-button color="accent" [disabled]="selectedTracks().size === 0" (click)="sync()">
          Sync {{ selectedTracks().size }} tracks
        </button>
      </div>

      <div class="grid-layout">
        <mat-card *ngFor="let track of tracks()" class="track-card p-3 mb-2">
          <div class="d-flex align-items-center gap-3">
            <mat-checkbox 
              [checked]="selectedTracks().has(track.id)" 
              (change)="toggleTrack(track.id)">
            </mat-checkbox>
            <div class="flex-grow-1">
              <div class="fw-bold">{{ track.name }}</div>
              <div class="small opacity-75">{{ track.artist }} • {{ track.album }}</div>
            </div>
            <div class="small opacity-50">{{ durationLabel(track.durationMs) }}</div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .grid-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .track-card {
      border-radius: 12px;
      transition: transform 0.2s ease;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(10px);
    }
    .track-card:hover {
      transform: translateX(4px);
    }
  `]
})
export class ImportPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly spotifyToken = signal<string | null>(null);
  readonly tracks = signal<any[]>([]);
  readonly selectedTracks = signal<Set<string>>(new Set());

  ngOnInit() {
    // Check for token in URL (from Spotify Auth callback)
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('spotify_token');
      if (token) {
        this.spotifyToken.set(token);
        // Clear query params without reload
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
        // Auto-fetch some tracks (for MVP, let's say from a default playlist or search)
        this.fetchMockPlaylist(token);
      }
    });
  }

  login() {
    window.location.href = 'http://localhost:3000/auth/spotify/login';
  }

  fetchMockPlaylist(token: string) {
    // For now, let's fetch tracks from a "Library" or search
    // In a real app, we'd list the user's playlists first.
    // Hardcoding a playlist ID for demo purposes if needed, or using search.
    this.http.get<any[]>('http://localhost:3000/import/spotify/playlist/37i9dQZF1DXcBWIGoYBM3M', {
      headers: { 'x-spotify-token': token }
    }).subscribe(tracks => this.tracks.set(tracks));
  }

  toggleTrack(id: string) {
    const next = new Set(this.selectedTracks());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedTracks.set(next);
  }

  sync() {
    const toSync = this.tracks().filter(t => this.selectedTracks().has(t.id));
    this.http.post('http://localhost:3000/import/spotify/sync', { tracks: toSync }).subscribe(() => {
      this.snack.open(`Successfully synced ${toSync.length} tracks!`, 'Great!', { duration: 3000 });
      this.router.navigate(['/songs']);
    });
  }

  durationLabel(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
