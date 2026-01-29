import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bm-first-run-hero',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './first-run-hero.html',
  styleUrl: './first-run-hero.scss',
})
export class FirstRunHeroComponent {
  @Input() libraryCount = 0;

  @Output() createSong = new EventEmitter<void>();
  @Output() browseLibrary = new EventEmitter<void>();

  readonly subtitle = computed(() => {
    const n = this.libraryCount ?? 0;
    if (n > 0) return `You also have ${n} curated songs in the Library to explore.`;
    return `Explore the Library and start practicing in seconds.`;
  });

  onCreate() {
    this.createSong.emit();
  }

  onBrowse() {
    this.browseLibrary.emit();
  }
}
