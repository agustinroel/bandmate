import { Component, Input, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type LibraryArrangement = {
  id: string;
  key?: string | null;
  bpm?: string | number | null;
  durationSec?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | null;
};

export type LibraryWork = {
  id: string;
  title: string;
  artist: string;
  updatedAt?: string | null;
  topArrangement?: LibraryArrangement | null;
};

@Component({
  selector: 'bm-library-work-card',
  standalone: true,
  imports: [RouterModule, DatePipe, MatCardModule, MatIconModule, MatTooltipModule],
  templateUrl: './library-work-card.html',
  styleUrl: './library-work-card.scss',
  providers: [DatePipe],
})
export class LibraryWorkCardComponent {
  @Input({ required: true }) work!: LibraryWork;

  constructor(private readonly date: DatePipe) {}

  readonly ariaLabel = computed(() => {
    const w = this.work;
    return `Open library song ${w.title} by ${w.artist}`;
  });

  // ---------- labels (uniform UI) ----------
  readonly keyLabel = computed(() => {
    const k = (this.work?.topArrangement?.key ?? '').toString().trim();
    return k || '';
  });

  readonly bpmLabel = computed(() => {
    const v = this.work?.topArrangement?.bpm;
    if (v === null || v === undefined || v === '') return '';
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? String(n) : '';
  });

  readonly durationText = computed(() => {
    const v = this.work?.topArrangement?.durationSec;
    return this.durationLabel(v);
  });

  // ✅ rating helpers
  readonly hasRating = computed(() => {
    const c = Number(this.work?.topArrangement?.ratingCount ?? 0);
    return Number.isFinite(c) && c > 0;
  });

  readonly ratingAvgLabel = computed(() => {
    if (!this.hasRating()) return '—';
    const a = Number(this.work?.topArrangement?.ratingAvg ?? 0);
    return Number.isFinite(a) ? a.toFixed(1) : '—';
  });

  readonly ratingCountLabel = computed(() => {
    const c = Number(this.work?.topArrangement?.ratingCount ?? 0);
    return String(c);
  });

  readonly ratingTooltip = computed(() => {
    const a = Number(this.work?.topArrangement?.ratingAvg ?? 0);
    const c = Number(this.work?.topArrangement?.ratingCount ?? 0);
    if (!c) return 'Not rated yet';
    return `${a.toFixed(1)} (${c})`;
  });

  readonly updatedLabel = computed(() => {
    // ✅ elegimos el “mejor” updatedAt y lo formateamos SIEMPRE
    const raw = this.work?.updatedAt ?? this.work?.topArrangement?.updatedAt ?? '';
    const s = String(raw ?? '').trim();
    if (!s) return '';
    // DatePipe soporta ISO; devolvemos "Jan 28, 2026"
    return this.date.transform(s, 'MMM d, y') ?? '';
  });

  // ---------- helpers ----------
  durationLabel(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const totalSeconds = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  onCardKeyDown(ev: KeyboardEvent) {
    if (ev.key === ' ') {
      ev.preventDefault();
      (ev.currentTarget as HTMLElement)?.click();
    }
  }
}
