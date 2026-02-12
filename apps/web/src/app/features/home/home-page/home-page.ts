import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PracticeSessionService } from '../../../core/services/practice-session.service';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePageComponent implements OnInit {
  readonly practiceStats = inject(PracticeSessionService);
  private readonly router = inject(Router);

  readonly lastSong = signal<{
    song: { id: string; title: string; artist: string; key?: string; bpm?: number };
    started_at: string;
  } | null>(null);

  async ngOnInit() {
    // Load practice stats
    this.practiceStats.loadStats();

    // Load last practiced song
    const last = await this.practiceStats.getLastPracticedSong();
    if (last) {
      this.lastSong.set(last);
    }
  }

  continueSession() {
    const s = this.lastSong();
    if (s?.song?.id) {
      this.router.navigate(['/songs', s.song.id]);
    }
  }

  get relativeTime(): string {
    const s = this.lastSong();
    if (!s) return '';

    // Simple relative time
    const date = new Date(s.started_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }
}
