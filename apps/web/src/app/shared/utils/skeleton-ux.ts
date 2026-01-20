import { DestroyRef, effect, inject, signal, Signal } from '@angular/core';

/**
 * Creates a signal that turns true only if loading lasts longer than `showDelayMs`,
 * and once true stays true for at least `minVisibleMs` (unless loading continues).
 *
 * Great for skeleton UIs: avoids flashes on fast loads and avoids shimmer flicker.
 */
export function useSkeletonUx(opts: {
  isActive: Signal<boolean>; // e.g. "isEdit route"
  isLoading: Signal<boolean>; // e.g. store.detailState() === 'loading'
  showDelayMs?: number; // default 120
  minVisibleMs?: number; // default 280
}) {
  const destroyRef = inject(DestroyRef);

  const showDelayMs = opts.showDelayMs ?? 120;
  const minVisibleMs = opts.minVisibleMs ?? 280;

  const show = signal(false);

  let showTimer: any = null;
  let minTimer: any = null;

  const clearTimers = () => {
    if (showTimer) clearTimeout(showTimer);
    if (minTimer) clearTimeout(minTimer);
    showTimer = null;
    minTimer = null;
  };

  // cleanup on destroy
  destroyRef.onDestroy(() => clearTimers());

  effect(() => {
    const active = opts.isActive();
    const loading = opts.isLoading();

    // If not active: reset everything
    if (!active) {
      clearTimers();
      show.set(false);
      return;
    }

    // If not loading: reset everything
    if (!loading) {
      clearTimers();
      show.set(false);
      return;
    }

    // Active + loading
    // Delay before showing to avoid flash on fast loads
    if (!showTimer && !show()) {
      showTimer = setTimeout(() => {
        show.set(true);

        // Minimum visible time once shown
        minTimer = setTimeout(() => {
          // If loading already ended, hide; if still loading, keep showing
          if (!opts.isLoading()) show.set(false);
        }, minVisibleMs);
      }, showDelayMs);
    }
  });

  return show.asReadonly();
}
