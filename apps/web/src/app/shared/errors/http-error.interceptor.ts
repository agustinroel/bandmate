import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { NotificationsService } from '../ui/notifications/notifications.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly notify = inject(NotificationsService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) {
          return throwError(() => err);
        }

        const status = err.status;

        // 4xx — expected client errors → friendly toast
        if (status >= 400 && status < 500) {
          const msg = err.error?.message || err.message || 'Something went wrong';
          this.notify.error(msg, 'OK', 3000);
          return throwError(() => err);
        }

        // 5xx — server errors → generic toast (details in console)
        if (status >= 500) {
          this.notify.error('Server error — please try again in a moment.', 'OK', 4000);
        }

        // 0 — network / timeout → connectivity toast
        if (status === 0) {
          this.notify.error('Network issue — check your connection and try again.', 'OK', 4000);
        }

        return throwError(() => err);
      }),
    );
  }
}
