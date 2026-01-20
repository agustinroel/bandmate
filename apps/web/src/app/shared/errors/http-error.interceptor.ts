import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorStateService } from './error-state.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly snack = inject(MatSnackBar);
  private readonly errors = inject(ErrorStateService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) {
          this.errors.set({
            message: 'Unknown HTTP error',
            stack: String(err),
            source: 'http',
            time: Date.now(),
          });
          return throwError(() => err);
        }

        const status = err.status;

        // 🟡 Esperables → toast
        if (status >= 400 && status < 500) {
          const msg = err.error?.message || err.message || 'Something went wrong';
          this.snack.open(msg, 'OK', { duration: 3000 });
          return throwError(() => err);
        }

        // 🔴 Graves → boundary
        const stack =
          (err.error && typeof err.error === 'object' && 'stack' in err.error
            ? (err.error as any).stack
            : undefined) ??
          (typeof err.error === 'string' ? err.error : undefined) ??
          undefined;

        this.errors.set({
          message: err.message || 'Server error',
          stack,
          source: 'http',
          status,
          url: err.url ?? undefined,
          time: Date.now(),
        });

        return throwError(() => err);
      }),
    );
  }
}
