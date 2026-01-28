import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../../environments/environment';
import { ChordLineViewComponent } from '../../../../shared/ui/chord-line-view/chord-line-view';
import { TransposeBarComponent } from '../../../../shared/ui/transpose-bar/transpose-bar';

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
  workId: string;
  version?: number | null;
  sections?: any[] | null;

  key?: string | null;
  bpm?: string | number | null;
  durationSec?: number | null;
  notes?: string | null;

  ratingAvg?: number | null;
  ratingCount?: number | null;

  updatedAt?: string | null;
  createdAt?: string | null;
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
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ChordLineViewComponent,
    TransposeBarComponent,
  ],
  templateUrl: './arrangement-view.html',
  styleUrl: './arrangement-view.scss',
})
export class ArrangementViewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  readonly workId = signal<string>('');
  readonly arrangementId = signal<string>('');

  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly error = signal<string | null>(null);

  readonly work = signal<WorkDto | null>(null);
  readonly arrangements = signal<ArrangementDto[]>([]);

  readonly arrangement = computed(() => {
    const id = this.arrangementId();
    const list = this.arrangements();
    return list.find((a) => a.id === id) ?? null;
  });

  readonly transpose = signal<number>(0);

  constructor() {
    // params
    effect(() => {
      const workId = this.route.snapshot.paramMap.get('workId') ?? '';
      const arrangementId = this.route.snapshot.paramMap.get('arrangementId') ?? '';
      this.workId.set(workId);
      this.arrangementId.set(arrangementId);

      if (workId && arrangementId) this.load();
    });
  }

  load() {
    const workId = this.workId();
    if (!workId) return;

    this.state.set('loading');
    this.error.set(null);

    this.http.get<WorkWithArrangementsDto>(`${base}/works/${workId}`).subscribe({
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

  readonly setTranspose = (next: number) => {
    this.transpose.set(next);
  };

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

  rate(value: number) {
    const arrangementId = this.arrangementId();
    if (!arrangementId) return;

    this.http
      .post<ArrangementDto>(`${base}/arrangements/${arrangementId}/rate`, { rating: value })
      .subscribe({
        next: (updated) => {
          // update local list
          const list = this.arrangements();
          const nextList = list.map((a) => (a.id === arrangementId ? { ...a, ...updated } : a));
          this.arrangements.set(nextList);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? err?.message ?? 'Failed to rate arrangement');
        },
      });
  }

  stars(avg?: number | null) {
    const a = Number(avg ?? 0);
    // redondeo al entero más cercano para pintar estrellas llenas
    return Math.round(a);
  }
}
