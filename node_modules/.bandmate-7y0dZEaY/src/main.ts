import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ErrorStateService } from './app/shared/errors/error-state.service';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    const errors = appRef.injector.get(ErrorStateService);

    window.addEventListener('error', (ev) => {
      errors.set({
        message: ev.message || 'Window error',
        stack: (ev as any)?.error?.stack,
        source: 'window',
        time: Date.now(),
      });
    });

    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      const reason: any = ev.reason;
      errors.set({
        message: reason?.message ?? String(reason ?? 'Unhandled rejection'),
        stack: reason?.stack,
        source: 'promise',
        time: Date.now(),
      });
    });
  })
  .catch((err) => console.error(err));
