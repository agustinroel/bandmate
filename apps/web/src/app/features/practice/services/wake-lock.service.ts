import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private readonly document = inject(DOCUMENT);

  private sentinel: WakeLockSentinel | null = null;
  private isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  // Track if we *intent* to have the lock
  private isActive = false;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  async enable() {
    if (!this.isSupported) return;
    this.isActive = true;

    this.document.addEventListener('visibilitychange', this.handleVisibilityChange);
    await this.requestLock();
  }

  async disable() {
    if (!this.isSupported) return;
    this.isActive = false;

    this.document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    await this.releaseLock();
  }

  private async requestLock() {
    if (!this.isActive) return;
    // Don't request if already locked (though browsers usually handle this fine)
    if (this.sentinel && !this.sentinel.released) return;

    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      // console.log('Wake Lock acquired');
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
    }
  }

  private async releaseLock() {
    if (this.sentinel) {
      await this.sentinel.release();
      this.sentinel = null;
    }
  }

  private async handleVisibilityChange() {
    if (this.document.visibilityState === 'visible' && this.isActive) {
      await this.requestLock();
    }
  }
}
