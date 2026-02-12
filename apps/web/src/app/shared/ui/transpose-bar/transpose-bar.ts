import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WritableSignal } from '@angular/core';
import { NotificationsService } from '../notifications/notifications.service';

@Component({
  selector: 'bm-transpose-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './transpose-bar.html',
  styleUrl: './transpose-bar.scss',
})
export class TransposeBarComponent {
  private readonly notify = inject(NotificationsService);
  /** valor actual (solo lectura para mostrar) */
  @Input({ required: true }) value = 0;

  /** signal que vive en el padre */
  @Input({ required: true }) onChange!: WritableSignal<number>;

  /** límite inferior */
  @Input() min = -12;
  /** límite superior */
  @Input() max = 12;

  /** Etiqueta a mostrar */
  @Input() label = 'Transpose';

  down() {
    this.set(this.value - 1);
    this.notify.info(`Transpose: ${this.value > 0 ? '-' : ''}${this.value - 1}`);
  }

  up() {
    this.set(this.value + 1);
    this.notify.info(`Transpose: ${this.value > 0 ? '+' : ''}${this.value + 1}`);
  }

  reset() {
    this.set(0);
  }

  private set(next: number) {
    if (!this.onChange) return;

    const clamped = Math.min(this.max, Math.max(this.min, next));
    this.onChange.set(clamped);
  }
}
