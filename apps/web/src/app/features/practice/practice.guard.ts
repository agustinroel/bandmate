import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

export const practiceGuard: CanMatchFn = () => {
  const router = inject(Router);

  // Si matchea /practice sin :setlistId, lo mandamos a setlists
  // (esto se usa con una ruta extra /practice)
  return router.createUrlTree(['/setlists']);
};
