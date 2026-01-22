import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  standalone: true,
  template: `<div class="p-4">Signing you in…</div>`,
})
export class AuthCallbackPage {
  readonly auth = inject(AuthStore);
  readonly router = inject(Router);

  constructor() {
    const check = setInterval(() => {
      if (this.auth.isAuthed()) {
        clearInterval(check);
        this.router.navigateByUrl('/songs');
      }
    }, 100);

    setTimeout(() => clearInterval(check), 5000);
  }
}
