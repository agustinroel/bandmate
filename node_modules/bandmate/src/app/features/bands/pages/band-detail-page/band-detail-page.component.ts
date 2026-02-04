import { Component, inject, input, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { BandRow, BandsService } from '../../services/bands.service';
import { ShareSongDialogComponent } from '../../ui/share-song-dialog/share-song-dialog.component';
import { AuthStore } from '../../../../core/auth/auth.store';
import { StorageService } from '../../../../core/storage/storage.service';
import { BandEditDialogComponent } from '../../ui/band-edit-dialog/band-edit-dialog.component';
import { NotificationsService } from '../../../../shared/ui/notifications/notifications.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  template: `
    @if (loading() && !band()) {
      <div
        class="d-flex justify-content-center align-items-center"
        style="height: 100vh; background: var(--bm-bg);"
      >
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    }

    @if (band(); as b) {
      <div class="band-page">
        <!-- Premium Header aka 'Hero' -->
        <div class="hero-section">
          <!-- Background Image with Gradient Overlay -->
          <div
            class="hero-bg"
            [style.backgroundImage]="
              b.avatar_url
                ? 'url(' + b.avatar_url + ')'
                : 'linear-gradient(135deg, var(--bm-primary) 0%, #163c40 100%)'
            "
          ></div>
          <div class="hero-overlay"></div>

          <div class="container position-relative h-100 d-flex align-items-end pb-4">
            <div class="d-flex w-100 gap-4 align-items-end flex-wrap flex-md-nowrap">
              <!-- Logo (Overlapping) -->
              <div class="band-avatar shadow-lg rounded-circle">
                @if (b.avatar_url) {
                  <img
                    [src]="b.avatar_url"
                    (error)="b.avatar_url = ''"
                    class="w-100 h-100 object-fit-cover rounded-circle"
                  />
                } @else {
                  <div
                    class="w-100 h-100 d-flex align-items-center justify-content-center bg-dark text-white rounded-circle"
                  >
                    <span class="display-4 fw-bold">{{ b.name.slice(0, 1).toUpperCase() }}</span>
                  </div>
                }
                <!-- Edit Button (Admin only) -->
                @if (isAdmin()) {
                  <button
                    mat-mini-fab
                    color="primary"
                    class="edit-btn shadow-sm"
                    (click)="logoInput.click()"
                  >
                    <mat-icon>photo_camera</mat-icon>
                  </button>
                  <input
                    #logoInput
                    type="file"
                    hidden
                    (change)="onLogoUpload($event)"
                    accept="image/*"
                  />
                }
              </div>

              <!-- Text Info -->
              <div class="text-white mb-2 flex-grow-1">
                <h1 class="display-3 fw-bold mb-0 text-shadow">{{ b.name }}</h1>
                <p class="h5 opacity-75 fw-light mb-3 text-shadow">
                  {{ b.description || 'No description' }}
                </p>

                <div class="d-flex gap-2">
                  @if (isMember()) {
                    <button
                      mat-flat-button
                      class="glass-button rounded-pill"
                      (click)="inviteMember()"
                    >
                      <mat-icon class="me-2">person_add</mat-icon> Invite Member
                    </button>
                  }
                  @if (isAdmin()) {
                    <button
                      mat-icon-button
                      class="glass-icon-button d-flex align-items-center justify-content-center"
                      [matMenuTriggerFor]="settingsMenu"
                    >
                      <mat-icon>settings</mat-icon>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Tabs -->
        <div class="container mt-5 pb-5">
          <mat-tab-group
            mat-stretch-tabs="false"
            animationDuration="200ms"
            class="custom-tabs bm-tabs"
          >
            <!-- Overview Tab -->
            <mat-tab label="Overview">
              <div class="py-4">
                <div class="row g-4 m-0 w-100">
                  <!-- Fixed horizontal scroll by using m-0 and w-100 -->
                  <div class="col-lg-8 p-0">
                    <div class="d-flex align-items-center justify-content-between mb-4">
                      <h3 class="fw-bold m-0 text-primary">Members</h3>
                      <span
                        class="badge rounded-pill px-3 py-2 text-primary"
                        style="background: rgba(38, 70, 83, 0.1);"
                        >{{ members().length }} members</span
                      >
                    </div>

                    <div class="d-flex flex-column gap-3">
                      @for (m of members(); track m.id) {
                        <a
                          [routerLink]="['/u', m.username]"
                          class="text-decoration-none member-card-link"
                        >
                          <div
                            class="d-flex align-items-center gap-3 p-3 bg-white rounded-4 shadow-sm border-0 member-card"
                          >
                            @if (m.avatar_url) {
                              <img
                                [src]="m.avatar_url"
                                (error)="m.avatar_url = null"
                                class="rounded-circle shadow-sm"
                                width="56"
                                height="56"
                                style="object-fit:cover"
                              />
                            } @else {
                              <div
                                class="rounded-circle shadow-sm d-flex align-items-center justify-content-center text-white fw-bold user-select-none"
                                style="width: 56px; height: 56px; min-width: 56px; flex-shrink: 0; font-size: 1.4rem; background: linear-gradient(135deg, var(--bm-primary), #4a7c82);"
                              >
                                {{ (m.full_name || m.username).slice(0, 1).toUpperCase() }}
                              </div>
                            }
                            <div class="flex-grow-1">
                              <div class="d-flex align-items-center gap-2">
                                <h5 class="mb-0 fw-bold text-dark">
                                  {{ m.full_name || m.username }}
                                </h5>
                                <span class="text-muted small">@{{ m.username }}</span>
                                @if (m.instruments && m.instruments.length > 0) {
                                  <span class="text-muted small d-none d-md-inline">•</span>
                                  <span class="text-primary small d-none d-md-inline">{{
                                    m.instruments.join(', ')
                                  }}</span>
                                }
                              </div>
                            </div>
                            <div class="d-flex gap-1 flex-wrap justify-content-end">
                              @for (role of m.roles; track role) {
                                <span
                                  class="badge bg-light text-dark border-0 shadow-sm member-role-badge"
                                  >{{ role }}</span
                                >
                              }
                            </div>
                          </div>
                        </a>
                      }
                    </div>
                  </div>

                  <div class="col-lg-4 p-0 ps-lg-4 mt-lg-0 mt-4">
                    <!-- Stats -->
                    <div class="p-4 bg-white rounded-4 shadow-sm border-0 h-100">
                      <h4 class="fw-bold text-primary mb-4">Band Profile</h4>
                      <div class="d-flex flex-column gap-3">
                        <div
                          class="d-flex justify-content-between align-items-center border-bottom pb-2"
                        >
                          <span class="text-muted">Founded</span>
                          <span class="fw-bold">{{ b.created_at | date: 'yyyy' }}</span>
                        </div>
                        <div
                          class="d-flex justify-content-between align-items-center border-bottom pb-2"
                        >
                          <span class="text-muted">Songs Shared</span>
                          <span class="fw-bold">{{ isMember() ? songs().length : 'Private' }}</span>
                        </div>
                        <div
                          class="d-flex justify-content-between align-items-center border-bottom pb-2"
                        >
                          <span class="text-muted">Setlists</span>
                          <span class="fw-bold">{{ isMember() ? '0' : 'Private' }}</span>
                        </div>
                      </div>

                      <div class="mt-4 p-3 rounded-4 bg-light">
                        <p class="small text-muted mb-0">
                          @if (isMember()) {
                            PRO members can create band setlists and sync arrangements with all
                            members.
                          } @else {
                            Join this band to see shared songs and setlists.
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Shared Songs -->
            @if (isMember()) {
              <mat-tab label="Shared Songs">
                <div class="py-4">
                  <div class="d-flex align-items-center justify-content-between mb-4 px-2">
                    <h3 class="fw-bold m-0 text-primary">Library</h3>
                    <button
                      mat-flat-button
                      color="primary"
                      (click)="shareSong()"
                      class="rounded-pill px-4"
                    >
                      <mat-icon class="me-2">add</mat-icon> Share Song
                    </button>
                  </div>

                  @if (songs().length === 0) {
                    <div class="text-center py-5 bg-white rounded-4 shadow-sm mx-2">
                      <mat-icon class="display-1 text-muted opacity-25 mb-3"
                        >library_music</mat-icon
                      >
                      <p class="h5 text-muted">No songs shared yet</p>
                      <p class="small text-muted">Start building your band's repertoire!</p>
                    </div>
                  } @else {
                    <div class="row g-3 m-0">
                      @for (s of songs(); track s.id) {
                        <div class="col-md-6 col-xl-4 p-2">
                          <div
                            class="p-3 bg-white rounded-4 shadow-sm border-0 h-100 d-flex align-items-center gap-3 song-card"
                          >
                            <div
                              class="avatar-placeholder rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                              style="width: 48px; height: 48px;"
                            >
                              <mat-icon>music_note</mat-icon>
                            </div>
                            <div class="flex-grow-1 overflow-hidden">
                              <h5 class="mb-0 fw-bold text-dark text-truncate">{{ s.title }}</h5>
                              <span class="text-muted small">{{ s.artist }}</span>
                            </div>
                            <div class="text-end">
                              <span
                                class="badge border text-primary"
                                style="background: rgba(38, 70, 83, 0.05);"
                                >{{ s.key || '?' }}</span
                              >
                              <div class="small text-muted mt-1" style="font-size: 0.65rem;">
                                {{ s.shared_at | date: 'shortDate' }}
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- Setlists -->
              <mat-tab label="Setlists">
                <div class="py-5 text-center">
                  <div class="d-inline-flex p-4 rounded-circle bg-white shadow-sm mb-3">
                    <mat-icon class="display-4 text-primary opacity-50">playlist_play</mat-icon>
                  </div>
                  <h3 class="text-primary fw-bold">Band Setlists</h3>
                  <p class="text-muted mx-auto" style="max-width: 400px;">
                    Organize your concerts and rehearsals. This feature will allow syncing setlists
                    across all members devices.
                  </p>
                  <button mat-flat-button color="accent" class="rounded-pill px-4">
                    Waitlist for PRO
                  </button>
                </div>
              </mat-tab>
            }
          </mat-tab-group>
        </div>
      </div>
    } @else if (!loading() && error()) {
      <div class="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
        <mat-icon class="display-1 text-danger mb-3">error_outline</mat-icon>
        <h2 class="text-primary fw-bold">Oops!</h2>
        <p class="text-danger bg-danger-subtle px-4 py-2 rounded-pill fw-medium">{{ error() }}</p>
        <button mat-flat-button color="primary" routerLink="/bands" class="mt-3 rounded-pill">
          <mat-icon class="me-2">arrow_back</mat-icon> Back to Bands
        </button>
      </div>
    }

    <mat-menu #settingsMenu="matMenu">
      <button mat-menu-item (click)="openEditDialog()">
        <mat-icon>edit</mat-icon>
        <span>Edit Band Info</span>
      </button>
      <button mat-menu-item>
        <mat-icon>group_add</mat-icon>
        <span>Manage Members</span>
      </button>
      <button mat-menu-item>
        <mat-icon>delete_forever</mat-icon>
        <span>Delete Band</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: var(--bm-bg);
      }
      .band-page {
        animation: bmFadeIn 0.4s ease-out;
      }
      .hero-section {
        position: relative;
        height: 360px;
        background-color: var(--bm-primary);
        overflow: visible;
        margin-bottom: 60px;
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.4;
        filter: blur(2px);
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          rgba(38, 70, 83, 0.1) 0%,
          rgba(38, 70, 83, 0.95) 100%
        );
      }
      .band-avatar {
        width: 180px;
        height: 180px;
        border: 8px solid var(--bm-bg);
        position: relative;
        z-index: 2;
        background: white;
        transform: translateY(50px);
        transition: transform 0.3s var(--bm-ease-out);
      }
      @media (max-width: 768px) {
        .band-avatar {
          width: 140px;
          height: 140px;
          transform: translateY(30px);
          margin: 0 auto;
        }
        .hero-section {
          height: 320px;
          text-align: center;
        }
      }
      .edit-btn {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background-color: var(--bm-primary) !important;
        color: white !important;
      }
      .text-shadow {
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      /* Glassmorphism Buttons */
      .glass-button {
        background: rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        transition: all 0.2s ease;
      }
      .glass-button:hover {
        background: rgba(255, 255, 255, 0.25) !important;
        transform: translateY(-2px);
      }
      .glass-icon-button {
        background: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
      }

      .member-card,
      .song-card {
        transition:
          transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
          box-shadow 0.2s ease;
        border: 1px solid transparent !important;
      }
      .member-card:hover,
      .song-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--bm-shadow-2) !important;
        border-color: rgba(38, 70, 83, 0.05) !important;
      }

      .member-card-link {
        display: block;
        border-radius: 1rem;
      }

      .member-role-badge {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        padding: 0.4em 0.8em;
      }

      /* Theme Tabs */
      ::ng-deep .bm-tabs .mat-mdc-tab-header {
        border-bottom: 2px solid rgba(38, 70, 83, 0.05) !important;
      }
      ::ng-deep .bm-tabs .mdc-tab {
        font-weight: 700;
        color: var(--bm-muted) !important;
        height: 56px;
      }
      ::ng-deep .bm-tabs .mdc-tab--active {
        color: var(--bm-primary) !important;
      }
      ::ng-deep .bm-tabs .mdc-tab-indicator__content--underline {
        border-color: var(--bm-primary) !important;
        border-width: 3px !important;
        border-radius: 3px 3px 0 0;
      }

      .text-primary {
        color: var(--bm-primary) !important;
      }
      .bg-primary-subtle {
        background-color: rgba(38, 70, 83, 0.08) !important;
      }
    `,
  ],
})
export class BandDetailPageComponent {
  private bandsService = inject(BandsService);
  private dialog = inject(MatDialog);
  private auth = inject(AuthStore);
  private storage = inject(StorageService);
  private notify = inject(NotificationsService);

  id = input<string>();

  band = signal<BandRow | null>(null);
  members = signal<any[]>([]);
  songs = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  isAdmin = computed(() => {
    const user = this.auth.user();
    if (!user) return false;
    const m = this.members().find((m: any) => m.id === user.id);
    return (
      m?.roles?.includes('owner') ||
      m?.roles?.includes('admin') ||
      this.band()?.owner_id === user.id
    );
  });

  isMember = computed(() => {
    const user = this.auth.user();
    if (!user) return false;
    return this.members().some((m: any) => m.id === user.id) || this.band()?.owner_id === user.id;
  });

  constructor() {
    effect(() => {
      const bandId = this.id();
      if (bandId) {
        this.load(bandId);
      }
    });
  }

  async load(id: string) {
    this.loading.set(true);
    try {
      // 1. Load Band Info & Members (Public/Shared)
      const [b, m] = await Promise.all([
        this.bandsService.get(id).toPromise(),
        this.bandsService.getMembers(id).toPromise(),
      ]);

      this.band.set(b || null);
      this.members.set(m || []);

      // 2. Load Private Data only if Member
      const user = this.auth.user();
      const isMember = m?.some((mem: any) => mem.id === user?.id) || b?.owner_id === user?.id;

      if (isMember) {
        const s = await this.bandsService.getSongs(id).toPromise();
        this.songs.set(s || []);
      } else {
        this.songs.set([]);
      }

      this.error.set(null);
    } catch (e: any) {
      console.error(e);
      const msg = e.error?.details ? JSON.stringify(e.error.details) : e.message || 'Unknown error';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  async onLogoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const bandId = this.id();
    if (!bandId) return;

    try {
      this.loading.set(true);
      // Construct a safe path: bands/bandId/logo_timestamp.ext
      const ext = file.name.split('.').pop() || 'png';
      const path = `bands/${bandId}/logo_${Date.now()}.${ext}`;

      const publicUrl = await this.storage.uploadFile('band-logos', path, file);

      const updated = await this.bandsService.update(bandId, { avatar_url: publicUrl }).toPromise();
      if (updated) this.band.set(updated);
    } catch (e) {
      console.error('Failed to upload logo', e);
      alert('Could not upload logo. Check if "band-logos" bucket exists in Supabase Storage.');
    } finally {
      this.loading.set(false);
    }
  }

  openEditDialog() {
    const b = this.band();
    if (!b) return;

    const ref = this.dialog.open(BandEditDialogComponent, {
      width: '450px',
      data: { name: b.name, description: b.description },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      const bandId = this.id();
      if (!bandId) return;

      try {
        this.loading.set(true);
        const updated = await this.bandsService.update(bandId, result).toPromise();
        if (updated) this.band.set(updated);
      } catch (e) {
        console.error('Failed to update band', e);
        alert('Could not update band info');
      } finally {
        this.loading.set(false);
      }
    });
  }

  async inviteMember() {
    const bandId = this.id();
    if (!bandId) return;

    try {
      const { code } = (await this.bandsService.getInviteCode(bandId).toPromise()) as {
        code: string;
      };
      const link = `${window.location.origin}/bands/join/${code}`;

      await navigator.clipboard.writeText(link);
      this.notify.success('Invite link copied to clipboard!');
    } catch (e) {
      console.error('Failed to get invite code', e);
      this.notify.error('Could not generate invite link.');
    }
  }

  shareSong() {
    const ref = this.dialog.open(ShareSongDialogComponent, { width: '450px' });

    ref.afterClosed().subscribe(async (songId) => {
      if (!songId) return;

      const bandId = this.id();
      if (!bandId) return;

      try {
        await this.bandsService.shareSong(bandId, songId).toPromise();
        // Reload only songs, avoid full page flicker
        const s = await this.bandsService.getSongs(bandId).toPromise();
        this.songs.set(s || []);
      } catch (e) {
        console.error('Failed to share', e);
        alert('Could not share song.');
      }
    });
  }
}
