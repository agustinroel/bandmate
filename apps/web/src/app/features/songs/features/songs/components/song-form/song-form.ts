import { ChangeDetectionStrategy, Component, Input, effect, signal } from '@angular/core';
import { Field, form, required, validate } from '@angular/forms/signals';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { CreateSongDto } from '@bandmate/shared';

type NumericInput = number | string | '';

type SongDraft = {
  title: string;
  artist: string;
  key: string;
  bpm: NumericInput;
  durationSec: NumericInput;
  notes: string;
};

const emptySongDraft = (): SongDraft => ({
  title: '',
  artist: '',
  key: '',
  bpm: '',
  durationSec: '',
  notes: '',
});

@Component({
  selector: 'app-song-form',
  standalone: true,
  imports: [Field, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="submit($event)" class="bm-form">
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
            <input matInput [field]="songForm.title" placeholder="e.g. Something" />
            @if (showError(songForm.title)) {
            <mat-error>{{ firstError(songForm.title().errors()) }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="bm-span-6">
            <mat-label>Artist</mat-label>
            <input matInput [field]="songForm.artist" placeholder="e.g. The Beatles" />
            @if (showError(songForm.artist)) {
            <mat-error>{{ firstError(songForm.artist().errors()) }}</mat-error>
            }
          </mat-form-field>

          <!-- Row 2 (Key + BPM + Duration) -->
          <mat-form-field appearance="outline" class="bm-span-4">
            <mat-label>Key</mat-label>
            <input matInput [field]="songForm.key" placeholder="e.g. Gm, C, Am" />
            <mat-hint>Optional</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="bm-span-4">
            <mat-label>BPM</mat-label>
            <input matInput type="number" [field]="songForm.bpm" placeholder="e.g. 120" />
            <mat-hint>Optional</mat-hint>
            @if (showError(songForm.bpm)) {
            <mat-error>{{ firstError(songForm.bpm().errors()) }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="bm-span-4">
            <mat-label>Duration</mat-label>
            <input matInput type="number" [field]="songForm.durationSec" placeholder="e.g. 185" />
            <mat-hint>Seconds (optional)</mat-hint>
            @if (showError(songForm.durationSec)) {
            <mat-error>{{ firstError(songForm.durationSec().errors()) }}</mat-error>
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
            [field]="songForm.notes"
            placeholder="e.g. Start on the bridge, watch the ritardando, vocal harmony on chorus…"
          ></textarea>
          <mat-hint>Optional — keep it short and actionable.</mat-hint>
        </mat-form-field>
      </div>

      <div class="bm-actions">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>

        <button mat-raised-button color="primary" type="submit" [disabled]="!songForm().valid()">
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
export class SongFormComponent {
  @Input() initial?: Partial<CreateSongDto>;
  @Input({ required: true }) onSubmit!: (dto: CreateSongDto) => void;
  @Input({ required: true }) onCancel!: () => void;

  readonly model = signal<SongDraft>(emptySongDraft());

  readonly songForm = form(this.model, (p) => {
    required(p.title, { message: 'Title is required' });
    required(p.artist, { message: 'Artist is required' });

    const toNumberOrNull = (v: NumericInput): number | null => {
      if (v === '') return null;
      if (typeof v === 'number') return Number.isFinite(v) ? v : null;

      const trimmed = v.trim();
      if (!trimmed) return null;

      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    };

    validate(p.bpm, ({ value }) => {
      const raw = value();
      if (raw === '') return undefined;
      const n = toNumberOrNull(raw);
      if (n === null) return { kind: 'type', message: 'BPM must be a number' };
      if (n < 1) return { kind: 'min', message: 'BPM must be >= 1' };
      return undefined;
    });

    validate(p.durationSec, ({ value }) => {
      const raw = value();
      if (raw === '') return undefined;
      const n = toNumberOrNull(raw);
      if (n === null) return { kind: 'type', message: 'Duration must be a number' };
      if (n < 1) return { kind: 'min', message: 'Duration must be >= 1 sec' };
      return undefined;
    });
  });

  constructor() {
    effect(() => {
      const init = this.initial;
      if (!init) return;

      this.model.set({
        title: init.title ?? '',
        artist: init.artist ?? '',
        key: init.key ?? '',
        bpm: init.bpm ?? '',
        durationSec: init.durationSec ?? '',
        notes: init.notes ?? '',
      });
    });
  }

  submit(ev: Event) {
    ev.preventDefault();
    if (!this.songForm().valid()) return;

    const v = this.model();

    const numOrUndef = (raw: NumericInput): number | undefined => {
      if (raw === '') return undefined;
      if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;

      const t = raw.trim();
      if (!t) return undefined;

      const n = Number(t);
      return Number.isFinite(n) ? n : undefined;
    };

    const dto: CreateSongDto = {
      title: v.title.trim(),
      artist: v.artist.trim(),
      key: v.key.trim() || undefined,
      bpm: numOrUndef(v.bpm),
      durationSec: numOrUndef(v.durationSec),
      notes: v.notes.trim() || undefined,
      links: [],
    };

    this.onSubmit(dto);
  }

  showError(field: any) {
    return field().touched() && !field().valid();
  }

  firstError(errors: unknown): string {
    if (Array.isArray(errors) && errors.length) {
      const e: any = errors[0];
      return e?.message ?? 'Invalid value';
    }
    return 'Invalid value';
  }
}
