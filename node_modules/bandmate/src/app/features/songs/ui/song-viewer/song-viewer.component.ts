import { Component, computed, effect, inject, input } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SongsStore } from '../../state/songs-store';
import { ChordLineViewComponent } from '../../../../shared/ui/chord-line-view/chord-line-view';

@Component({
  selector: 'app-song-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TitleCasePipe,
    ChordLineViewComponent,
  ],
  templateUrl: './song-viewer.component.html',
  styleUrl: './song-viewer.component.scss',
})
export class SongViewerComponent {
  readonly songId = input.required<string>();
  readonly transpose = input<number>(0);

  readonly store = inject(SongsStore);

  readonly detail = computed(() => {
    const s = this.store.selected();
    // Ensure we are showing the requested song
    if (s?.id === this.songId()) return s;
    return null;
  });

  readonly loading = computed(() => {
    const st = this.store.detailState();
    return st === 'loading' && !this.detail();
  });

  readonly error = computed(() => {
    return this.store.detailState() === 'error' ? this.store.error() : null;
  });

  constructor() {
    effect(() => {
      const id = this.songId();
      if (id) {
        // Use untracked if we don't want re-runs on other store changes, 
        // strictly load when ID changes.
        this.store.loadDetail(id);
      }
    });
  }
}
