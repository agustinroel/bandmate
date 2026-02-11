import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  effect,
  signal,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { CreateSongDto } from '@bandmate/shared';

@Component({
  selector: 'app-song-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="songForm" (ngSubmit)="submit()" class="bm-form">
      <div class="bm-form-section">
        <div class="bm-section-title">
          <mat-icon class="bm-sec-ic">library_music</mat-icon>
          <div>
            <div class="bm-sec-h">Song details</div>
            <div class="bm-sec-sub">Enough to find it fast and play it right.</div>
          </div>
        </div>

        <!-- GRID -->
        <div class="bm-grid">
          <!-- Row 1 -->
          <mat-form-field appearance="outline" class="bm-span-6">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" placeholder="e.g. Something" />
            @if (songForm.get('title')?.invalid && songForm.get('title')?.touched) {
              <mat-error>Title is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="bm-span-6">
            <mat-label>Artist</mat-label>
            <input matInput formControlName="artist" placeholder="e.g. The Beatles" />
            @if (songForm.get('artist')?.invalid && songForm.get('artist')?.touched) {
              <mat-error>Artist is required</mat-error>
            }
          </mat-form-field>

          <!-- Row 2 (Key + BPM + Duration) -->
          <mat-form-field appearance="outline" class="bm-span-4">
            <mat-label>Key</mat-label>
            <input matInput formControlName="key" placeholder="e.g. Gm, C, Am" />
            <mat-hint>Optional</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="bm-span-4">
            <mat-label>BPM</mat-label>
            <input matInput type="number" formControlName="bpm" placeholder="e.g. 120" />
            <mat-hint>Optional</mat-hint>
            @if (songForm.get('bpm')?.invalid && songForm.get('bpm')?.touched) {
              <mat-error>BPM must be >= 1</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="bm-span-4">
            <mat-label>Duration</mat-label>
            <input matInput type="number" formControlName="durationSec" placeholder="e.g. 185" />
            <mat-hint>Seconds (optional)</mat-hint>
            @if (songForm.get('durationSec')?.invalid && songForm.get('durationSec')?.touched) {
              <mat-error>Duration must be >= 1 sec</mat-error>
            }
          </mat-form-field>
        </div>
      </div>

      <div class="bm-form-section">
        <div class="bm-section-title">
          <mat-icon class="bm-sec-ic">sticky_note_2</mat-icon>
          <div>
            <div class="bm-sec-h">Notes</div>
            <div class="bm-sec-sub">Cues, harmonies, intro/outro, gear — anything useful.</div>
          </div>
        </div>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Notes</mat-label>
          <textarea
            matInput
            rows="6"
            formControlName="notes"
            placeholder="e.g. Start on the bridge, watch the ritardando, vocal harmony on chorus…"
          ></textarea>
          <mat-hint>Optional — keep it short and actionable.</mat-hint>
        </mat-form-field>
      </div>

      <div class="bm-actions">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>

        <button mat-raised-button color="primary" type="submit" [disabled]="songForm.invalid">
          <mat-icon class="me-1">save</mat-icon>
          Save
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .bm-form {
        display: grid;
        gap: 18px;
      }

      .bm-form-section {
        display: grid;
        gap: 12px;
      }

      .bm-section-title {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 2px;
      }

      .bm-sec-ic {
        opacity: 0.85;
        margin-top: 2px;
      }

      .bm-sec-h {
        font-weight: 650;
        letter-spacing: -0.01em;
      }

      .bm-sec-sub {
        font-size: 0.9rem;
        opacity: 0.7;
        margin-top: 1px;
      }

      /* 12-col grid in desktop, stacked in mobile */
      .bm-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr;
      }

      /* Desktop */
      @media (min-width: 900px) {
        .bm-grid {
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 14px;
          align-items: start;
        }

        .bm-span-6 {
          grid-column: span 6;
        }
        .bm-span-4 {
          grid-column: span 4;
        }
      }

      /* Mobile/tablet: keep order nice */
      .bm-span-6,
      .bm-span-4 {
        width: 100%;
      }

      .bm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 6px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
      }
    `,
  ],
})
export class SongFormComponent implements OnChanges {
  @Input() initial?: Partial<CreateSongDto>;
  @Input({ required: true }) onSubmit!: (dto: CreateSongDto) => void;
  @Input({ required: true }) onCancel!: () => void;
  @Input() onDraftChange?: (patch: Partial<CreateSongDto>) => void;

  private fb = inject(FormBuilder);
  private _draftTimer: any = null;
  private _lastDraftKey = '';
  private _hydrating = false;

  songForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    artist: ['', Validators.required],
    key: [''],
    bpm: [null, Validators.min(1)],
    durationSec: [null, Validators.min(1)],
    notes: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initial'] && this.initial) {
      this._hydrating = true;
      this.songForm.patchValue({
        title: this.initial.title ?? '',
        artist: this.initial.artist ?? '',
        key: this.initial.key ?? '',
        bpm: this.initial.bpm ?? null,
        durationSec: this.initial.durationSec ?? null,
        notes: this.initial.notes ?? '',
      });
      this._hydrating = false;
    }
  }

  constructor() {
    // Emit draft changes (debounced + distinct)
    this.songForm.valueChanges.subscribe((v) => {
      if (this._hydrating) return;
      if (!this.onDraftChange) return;

      const draft: Partial<CreateSongDto> = {
        title: v.title?.trim() ?? '',
        artist: v.artist?.trim() ?? '',
        key: v.key?.trim() || undefined,
        bpm: v.bpm ?? undefined,
        durationSec: v.durationSec ?? undefined,
        notes: v.notes?.trim() || undefined,
      };

      // distinct with stable key
      const key = JSON.stringify(draft);
      if (key === this._lastDraftKey) return;

      if (this._draftTimer) clearTimeout(this._draftTimer);
      this._draftTimer = setTimeout(() => {
        const k2 = JSON.stringify(draft);
        if (k2 === this._lastDraftKey) return;

        this._lastDraftKey = k2;
        this.onDraftChange?.(draft);
      }, 450);
    });
  }

  submit() {
    if (this.songForm.invalid) return;

    const v = this.songForm.value;

    const dto: CreateSongDto = {
      title: v.title?.trim() ?? '',
      artist: v.artist?.trim() ?? '',
      key: v.key?.trim() || undefined,
      bpm: v.bpm ?? undefined,
      durationSec: v.durationSec ?? undefined,
      notes: v.notes?.trim() || undefined,
      links: [],
    };

    this.onSubmit(dto);
  }
}
