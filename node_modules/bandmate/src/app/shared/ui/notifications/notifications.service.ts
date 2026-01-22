import { Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type ToastKind = 'success' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly snack = inject(MatSnackBar);
  private readonly zone = inject(NgZone);

  success(message: string, action = 'OK', ms = 2200) {
    this.open('success', message, action, ms);
  }

  info(message: string, action = 'OK', ms = 2400) {
    this.open('info', message, action, ms);
  }

  warn(message: string, action = 'OK', ms = 3200) {
    this.open('warn', message, action, ms);
  }

  error(message: string, action = 'OK', ms = 4200) {
    this.open('error', message, action, ms);
  }

  private open(kind: ToastKind, message: string, action: string, duration: number) {
    // asegura que corra dentro de Angular (por errores fuera de zone)
    this.zone.run(() => {
      this.snack.open(message, action, {
        duration,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: [`bm-toast`, `bm-toast--${kind}`],
      });
    });
  }
}
