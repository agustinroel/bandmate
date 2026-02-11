import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthStore } from './auth.store';
import { SubscriptionStore } from '../subscription/subscription.store';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  readonly auth = inject(AuthStore);
  readonly subscription = inject(SubscriptionStore);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.accessToken();
    const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(request).pipe(
      tap({
        error: (err: HttpErrorResponse) => {
          if (err.status === 403) {
            this.subscription.handleLimitError(err);
          }
        },
      }),
    );
  }
}
