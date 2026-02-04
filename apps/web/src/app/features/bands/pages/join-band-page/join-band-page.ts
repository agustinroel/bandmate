import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BandsService } from '../../services/bands.service';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  template: `
    <div
      class="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center px-4"
    >
      @if (state() === 'loading') {
        <mat-spinner diameter="50" color="primary"></mat-spinner>
        <p class="mt-4 h5 text-muted animate__animated animate__fadeIn animate__infinite">
          Joining band...
        </p>
      } @else if (state() === 'success') {
        <div class="animate__animated animate__zoomIn">
          <div class="success-icon mb-4">
            <mat-icon class="display-1 text-success">check_circle</mat-icon>
          </div>
          <h1 class="display-4 fw-bold text-primary mb-3">Welcome to the Band!</h1>
          <p class="h5 text-muted mb-5">
            You have successfully joined <strong>{{ bandName() }}</strong
            >.
          </p>
          <button
            mat-flat-button
            color="primary"
            [routerLink]="['/bands', bandId()]"
            class="rounded-pill px-5 py-3 shadow"
          >
            Go to Band Dashboard
          </button>
        </div>
      } @else {
        <div class="animate__animated animate__headShake">
          <mat-icon class="display-1 text-danger mb-4">error_outline</mat-icon>
          <h1 class="display-5 fw-bold text-primary mb-3">Oops!</h1>
          <p class="h5 text-danger bg-danger-subtle px-4 py-2 rounded-pill d-inline-block">
            {{ error() }}
          </p>
          <div class="mt-5">
            <button
              mat-stroked-button
              color="primary"
              routerLink="/bands"
              class="rounded-pill px-4"
            >
              Back to My Bands
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .success-icon mat-icon {
        font-size: 100px;
        width: 100px;
        height: 100px;
      }
      .display-4 {
        font-weight: 850;
        letter-spacing: -0.02em;
      }
    `,
  ],
})
export class JoinBandPageComponent implements OnInit {
  private bandsService = inject(BandsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationsService);
  private auth = inject(AuthStore);

  code = input<string>(); // from route param (Signals)

  state = signal<'loading' | 'success' | 'error'>('loading');
  error = signal('');
  bandId = signal('');
  bandName = signal('');

  async ngOnInit() {
    // Wait for session to be restored before trying to join
    await this.auth.ready;

    // Try signal input first, then falling back to snapshot if signal binding isn't enabled/working
    const codeValue = this.code() || this.route.snapshot.paramMap.get('code');
    console.log('[Join] Starting join with code:', codeValue);

    if (!codeValue) {
      console.warn('[Join] No code found in route');
      this.state.set('error');
      this.error.set('Invalid or missing invite code');
      return;
    }

    this.join(codeValue);
  }

  async join(code: string) {
    try {
      console.log('[Join] Calling service joinBandByCode...');
      const res = await this.bandsService.joinBandByCode(code).toPromise();
      console.log('[Join] Service response:', res);

      if (res?.success) {
        this.bandId.set(res.band.id);
        this.bandName.set(res.band.name);
        this.state.set('success');
        this.notify.success(`Successfully joined ${res.band.name}!`);

        // Optional: auto-redirect after delay
        setTimeout(() => {
          this.router.navigate(['/bands', res.band.id]);
        }, 2000);
      }
    } catch (e: any) {
      console.error(e);
      this.state.set('error');
      this.error.set(e.error?.message || 'Failed to join band. Link might be expired.');
    }
  }
}
