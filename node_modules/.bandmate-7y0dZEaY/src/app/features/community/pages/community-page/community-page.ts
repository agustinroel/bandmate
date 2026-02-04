import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ErrorBoundaryComponent } from '../../../../shared/errors/error-boundary.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

type ProfileDto = {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  instruments?: string[];
};

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    ErrorBoundaryComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './community-page.html',
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: var(--bm-bg);
      }

      /* Hero Section */
      .community-hero {
        position: relative;
        background: radial-gradient(circle at top right, #2a9d8f 0%, #264653 60%);
        padding: 4rem 0 6rem; /* Extra padding bottom for overlap */
        color: white;
        text-align: center;
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        opacity: 0.1;
        background-image: radial-gradient(#fff 1px, transparent 1px);
        background-size: 20px 20px;
      }
      .hero-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(8px);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }
      .text-accent {
        color: var(--bm-accent);
      }

      /* Filters Section */
      .main-content {
        padding-bottom: 80px;
        margin-top: -3rem; /* Partial Overlap */
        position: relative;
        z-index: 10;
      }
      .filters-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }

      /* Premium Card */
      .premium-card {
        background: white;
        border-radius: 16px;
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
        border: 1px solid rgba(0, 0, 0, 0.06);
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .card-hover-wrapper:hover .premium-card {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
      }

      .card-gradient {
        height: 80px;
        background: linear-gradient(
          135deg,
          rgba(38, 70, 83, 0.08) 0%,
          rgba(233, 196, 106, 0.15) 100%
        );
      }

      .card-avatar-wrapper {
        width: 90px;
        height: 90px;
        margin: -45px auto 0;
        border-radius: 50%;
        background: white;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .card-avatar-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        background: #f8f9fa;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #adb5bd;
      }

      .bm-chip-sm {
        font-size: 0.75rem;
        padding: 6px 14px;
        border-radius: 20px;
        background-color: #f1f3f5;
        color: var(--bm-primary);
        font-weight: 600;
      }

      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class CommunityPageComponent {
  private http = inject(HttpClient);

  readonly profiles = signal<ProfileDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Filters
  readonly query = signal('');
  readonly instruments = signal<string[]>([]);
  readonly genres = signal<string[]>([]);
  readonly sings = signal(false);

  // Options
  readonly instrumentOptions = [
    'Guitar',
    'Bass',
    'Drums',
    'Keys',
    'Vocals',
    'Saxophone',
    'Violin',
    'Trumpet',
  ];
  readonly genreOptions = [
    'Rock',
    'Pop',
    'Metal',
    'Jazz',
    'Blues',
    'Indie',
    'Alternative',
    'Classical',
    'Electronic',
  ];

  constructor() {
    this.load();
  }

  clearFilters() {
    this.query.set('');
    this.instruments.set([]);
    this.genres.set([]);
    this.sings.set(false);
    this.load();
  }

  load() {
    this.loading.set(true);

    // Build query params
    const params: any = {};
    if (this.query().trim()) params.q = this.query().trim();
    if (this.instruments().length) params.instruments = this.instruments().join(',');
    if (this.genres().length) params.genres = this.genres().join(',');
    if (this.sings()) params.sings = 'true';

    this.http.get<ProfileDto[]>(`${environment.apiBaseUrl}/profiles`, { params }).subscribe({
      next: (data) => {
        this.profiles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load profiles');
        this.loading.set(false);
      },
    });
  }
}
