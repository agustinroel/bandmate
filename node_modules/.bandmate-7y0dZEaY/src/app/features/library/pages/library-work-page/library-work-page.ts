import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SongsStore } from '../../../songs/state/songs-store';

import { environment } from '../../../../../environments/environment';

const base = environment.apiBaseUrl;

type WorkDto = {
  id: string;
  title: string;
  artist: string;
  rights?: string | null;
  rightsNotes?: string | null;
  updatedAt?: string | null;
};

type ArrangementDto = {
  id: string;
  version?: number | null;
  key?: string | null;
  bpm?: string | number | null;
  durationSec?: number | null;
  notes?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | null;
  isSeed?: boolean;
  authorName?: string | null;
};

type WorkWithArrangementsDto = {
  work: WorkDto;
  arrangements: ArrangementDto[];
};

@Component({
  standalone: true,
  imports: [
    RouterModule,

    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './library-work-page.html',
  styleUrl: './library-work-page.scss',
})
export class LibraryWorkPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly http = inject(HttpClient);
  private readonly songsStore = inject(SongsStore);


  readonly workId = signal<string>('');

  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly error = signal<string | null>(null);

  readonly work = signal<WorkDto | null>(null);
  readonly arrangements = signal<ArrangementDto[]>([]);
  
  readonly myVersions = computed(() => {
    const wId = this.workId();
    if (!wId) return [];
    return this.songsStore.songs().filter((s: any) => s.workId === wId);
  });

  readonly hasArrangements = computed(() => this.arrangements().length > 0);

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('workId') ?? '';
      this.workId.set(id);

      if (id) this.load();
    });
  }

  load() {
    const id = this.workId();
    if (!id) return;

    this.state.set('loading');
    this.error.set(null);

    this.http.get<WorkWithArrangementsDto>(`${base}/works/${id}`).subscribe({
      next: (res) => {
        this.work.set(res.work ?? null);
        this.arrangements.set(res.arrangements ?? []);
        this.state.set('ready');
      },
      error: (err) => {
        this.state.set('error');
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to load work');
      },
    });
  }

  openArrangement(arrangementId: string) {
    this.router.navigate(['/library', this.workId(), 'arrangements', arrangementId]);
  }

  openMyVersion(songId: string) {
    this.router.navigate(['/songs', songId]);
  }

  createMyVersion() {
    const w = this.work();
    if (!w) return;

    // We fork the "Top Arrangement" if it exists, otherwise just the metadata
    const sourceArrangement = this.arrangements()[0] ?? null;

    this.songsStore.createFromWork(w, sourceArrangement).subscribe({
      next: (newSong) => {
        // Navigate to the editor for the new song
        this.router.navigate(['/songs', newSong.id]); 
      },
      error: (err) => {
        console.error('Failed to create version', err);
        // Could show a notification here
      }
    });
  }

  durationLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const totalSeconds = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  ratingLabel(avg?: number | null, count?: number | null) {
    const a = Number(avg ?? 0);
    const c = Number(count ?? 0);
    if (!c) return 'Not rated yet';
    return `${a.toFixed(1)} (${c})`;
  }
}
