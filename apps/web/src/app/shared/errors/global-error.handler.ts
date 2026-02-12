import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { NotificationsService } from '../ui/notifications/notifications.service';

// Errors to silently suppress (Angular dev-mode noise, not user-facing)
const SUPPRESSED_PATTERNS = [
  'NG0100', // ExpressionChangedAfterItHasBeenCheckedError (dev-only)
  'NG0506', // Signal equality check warning
  'ResizeObserver', // Benign browser warning
];

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);
  private readonly toast = inject(NotificationsService);

  handleError(error: any) {
    const normalized = this.normalize(error);

    // Always log for debugging
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', error);

    // Suppress known non-actionable dev errors
    if (SUPPRESSED_PATTERNS.some((p) => normalized.message.includes(p))) {
      return;
    }

    // Show a subtle, humanized toast instead of an intrusive panel
    this.zone.run(() => {
      this.toast.error(
        'Something unexpected happened. If this keeps occurring, try refreshing.',
        'Dismiss',
        5000,
      );
    });
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
