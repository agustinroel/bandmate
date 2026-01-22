import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { ErrorStateService } from './error-state.service';
import { NotificationsService } from '../ui/notifications/notifications.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);
  private readonly errors = inject(ErrorStateService);
  private readonly toast = inject(NotificationsService);

  handleError(error: any) {
    const normalized = this.normalize(error);

    this.zone.run(() => {
      this.errors.set({
        message: normalized.message,
        stack: normalized.stack,
        source: 'errorHandler',
        time: Date.now(),
      });
    });

    // Log (luego lo conectamos a backend / Sentry)
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', error);
  }

  private normalize(err: any): { message: string; stack?: string } {
    if (!err) return { message: 'Unknown error' };

    const e = err?.originalError ?? err;

    if (e instanceof Error) return { message: e.message || 'Error', stack: e.stack };
    if (typeof e === 'string') return { message: e };
    if (typeof e?.message === 'string') return { message: e.message, stack: e?.stack };
    return { message: 'Unexpected error', stack: undefined };
  }
}
