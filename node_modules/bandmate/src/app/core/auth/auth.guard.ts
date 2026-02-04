import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  await auth.ready;

  if (auth.isAuthed()) return true;

  // Save return URL for after login
  localStorage.setItem('bm_return_url', state.url);

  router.navigateByUrl('/login');
  return false;
};
