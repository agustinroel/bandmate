import { Component, Input, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

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

  // lo que te devuelve GET /works
  topArrangement?: LibraryArrangement | null;
};

@Component({
  selector: 'bm-library-work-card',
  standalone: true,
  imports: [RouterModule, DatePipe, DecimalPipe, MatCardModule, MatIconModule, MatTooltipModule],
  templateUrl: './library-work-card.html',
  styleUrl: './library-work-card.scss',
})
export class LibraryWorkCardComponent {
  @Input({ required: true }) work!: LibraryWork;

  readonly ariaLabel = computed(() => {
    const w = this.work;
    return `Open library song ${w.title} by ${w.artist}`;
  });

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

  onCardKeyDown(ev: KeyboardEvent) {
    // el RouterLink ya maneja Enter normalmente; esto es por accesibilidad extra.
    if (ev.key === ' ') {
      ev.preventDefault();
      (ev.currentTarget as HTMLElement)?.click();
    }
  }
}
