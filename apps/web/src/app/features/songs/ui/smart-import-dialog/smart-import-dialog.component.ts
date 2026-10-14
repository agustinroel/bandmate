import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { parseSmartTab, ParsedSmartSong } from '@bandmate/shared';
import { SongsStore } from '../../state/songs-store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-smart-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <div class="smart-import-container p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="text-primary fs-3">auto_fix_high</mat-icon>
          <h2 class="m-0 fs-4 fw-bold">Importador Universal</h2>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <p class="text-muted small mb-3">
        Pega tablaturas o acordes en formato <strong>Ultimate Guitar</strong>, <strong>CifraClub</strong>, <strong>ChordPro</strong> o <strong>texto plano (acordes sobre letra)</strong>. Bandmate convertirá y alineará todo automáticamente.
      </p>

      <div class="d-flex gap-2 mb-2">
        <button mat-stroked-button class="btn-sm rounded-pill" (click)="loadSample('oasis')">
          Ejemplo: Oasis (UG)
        </button>
        <button mat-stroked-button class="btn-sm rounded-pill" (click)="loadSample('standByMe')">
          Ejemplo: 2 Líneas Texto
        </button>
      </div>

      <mat-form-field appearance="outline" class="w-100 mb-2">
        <mat-label>Pega aquí el contenido de la canción...</mat-label>
        <textarea
          matInput
          [(ngModel)]="rawText"
          rows="8"
          placeholder="[Verse 1]&#10;G             Em&#10;When the night has come..."
          style="font-family: monospace; font-size: 13px;"
          (ngModelChange)="onTextChange()"
        ></textarea>
      </mat-form-field>

      @if (parsed(); as p) {
        <div class="import-preview bg-light p-3 rounded-3 mb-3 border">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div>
              <div class="fw-bold fs-5 text-primary">{{ p.title }}</div>
              <div class="text-muted small">{{ p.artist }} • Tonalidad: {{ p.key || 'Auto' }} • BPM: {{ p.bpm || '120' }}</div>
            </div>
            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
              {{ p.sections.length }} Secciones detectadas
            </span>
          </div>

          <div class="sections-preview small font-monospace opacity-75" style="max-height: 120px; overflow-y: auto;">
            @for (sec of p.sections; track sec.id) {
              <div class="mb-1">
                <strong>[{{ sec.name || sec.type }}]</strong> ({{ sec.lines.length }} líneas)
              </div>
            }
          </div>
        </div>
      }

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="!parsed() || isSaving()"
          (click)="saveAndPlay()"
          class="rounded-pill px-4"
        >
          <mat-icon class="me-1">play_circle</mat-icon>
          {{ isSaving() ? 'Guardando...' : 'Importar y Tocar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .smart-import-container {
      max-width: 600px;
    }
  `],
})
export class SmartImportDialogComponent {
  private dialogRef = inject(MatDialogRef<SmartImportDialogComponent>);
  private songsStore = inject(SongsStore);
  private router = inject(Router);

  rawText = '';
  readonly parsed = signal<ParsedSmartSong | null>(null);
  readonly isSaving = signal(false);

  onTextChange() {
    if (!this.rawText.trim()) {
      this.parsed.set(null);
      return;
    }
    try {
      const res = parseSmartTab(this.rawText);
      this.parsed.set(res);
    } catch (e) {
      console.warn('Error parsing tab:', e);
    }
  }

  loadSample(sample: 'oasis' | 'standByMe') {
    if (sample === 'oasis') {
      this.rawText = `{title: Wonderwall}
{artist: Oasis}
{key: Em}
{tempo: 87}
{capo: 2}

[Verse 1]
[ch]Em7[/ch]Today is gonna be the day that they're [ch]G[/ch]gonna throw it back to [ch]Dsus4[/ch]you [ch]A7sus4[/ch]
[ch]Em7[/ch]By now you should've somehow realized [ch]G[/ch]what you gotta [ch]Dsus4[/ch]do [ch]A7sus4[/ch]

[Chorus]
Because [ch]C[/ch]maybe, [ch]Em7[/ch] [ch]G[/ch] you're gonna be the one that [ch]Em7[/ch]saves me`;
    } else {
      this.rawText = `Stand By Me
Ben E. King

Verse 1:
A                                 F#m
When the night has come and the land is dark
         D             E                A
And the moon is the only light we'll see

Chorus:
                 A                         F#m
So darling, darling stand by me, oh stand by me
     D        E        A
Oh, stand, stand by me`;
    }
    this.onTextChange();
  }

  saveAndPlay() {
    const p = this.parsed();
    if (!p) return;

    this.isSaving.set(true);

    this.songsStore.create({
      title: p.title,
      artist: p.artist,
      key: p.key,
      bpm: p.bpm,
      durationSec: 180,
      notes: p.capo ? `Capo ${p.capo}. Importado con Smart Parser` : 'Importado con Smart Parser',
      sections: p.sections,
    }).subscribe({
      next: (song: any) => {
        this.isSaving.set(false);
        this.dialogRef.close();
        if (song?.id) {
          this.router.navigate(['/songs', song.id]);
        }
      },
      error: (err) => {
        console.error('Failed to create song:', err);
        this.isSaving.set(false);
      },
    });
  }
}
