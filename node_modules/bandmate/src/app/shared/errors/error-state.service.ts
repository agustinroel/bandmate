import { Injectable, signal } from '@angular/core';

export type GlobalErrorSource = 'errorHandler' | 'window' | 'promise' | 'http';

export type GlobalErrorInfo = {
  message: string;
  stack?: string;
  source?: GlobalErrorSource;
  status?: number;
  url?: string;
  time: number;
};

@Injectable({ providedIn: 'root' })
export class ErrorStateService {
  readonly lastError = signal<GlobalErrorInfo | null>(null);

  set(err: GlobalErrorInfo) {
    const prev = this.lastError();
    if (
      prev &&
      prev.message === err.message &&
      prev.stack === err.stack &&
      prev.source === err.source
    )
      return;
    this.lastError.set(err);
  }

  clear() {
    this.lastError.set(null);
  }
}
