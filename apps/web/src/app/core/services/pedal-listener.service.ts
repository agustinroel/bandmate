import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type PedalAction = 'scroll-down' | 'scroll-up' | 'toggle-scroll' | 'next-song' | 'prev-song';

@Injectable({ providedIn: 'root' })
export class PedalListenerService {
  private destroyRef = inject(DestroyRef);

  readonly lastPedalAction = signal<{ action: PedalAction; label: string; timestamp: number } | null>(null);
  readonly isPedalEnabled = signal(true);

  private actionSubject = new Subject<PedalAction>();
  readonly actions$ = this.actionSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      fromEvent<KeyboardEvent>(window, 'keydown')
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => this.isPedalEnabled()),
          filter((e) => !this.isTypingTarget(e))
        )
        .subscribe((e) => this.handleKeyEvent(e));
    }
  }

  setPedalEnabled(enabled: boolean) {
    this.isPedalEnabled.set(enabled);
  }

  private handleKeyEvent(e: KeyboardEvent) {
    // AirTurn / Donner / PageFlip Bluetooth Pedals typically send:
    // Mode 1: PageUp / PageDown
    // Mode 2: ArrowUp / ArrowDown
    // Mode 3: ArrowLeft / ArrowRight
    // Mode 4: Space / Enter
    // Mode 5: Mouse click or KeyB / KeyC

    let action: PedalAction | null = null;
    let label = '';

    if (e.key === 'PageDown' || e.code === 'PageDown') {
      action = 'scroll-down';
      label = 'Pedal: Scroll Abajo';
    } else if (e.key === 'PageUp' || e.code === 'PageUp') {
      action = 'scroll-up';
      label = 'Pedal: Scroll Arriba';
    } else if (e.key === 'ArrowDown') {
      action = 'scroll-down';
      label = 'Pedal: Scroll Abajo';
    } else if (e.key === 'ArrowUp') {
      action = 'scroll-up';
      label = 'Pedal: Scroll Arriba';
    } else if (e.code === 'Space' && (e.ctrlKey || e.altKey)) {
      action = 'toggle-scroll';
      label = 'Pedal: Play / Pausa Scroll';
    }

    if (action) {
      e.preventDefault();
      this.triggerAction(action, label);
    }
  }

  triggerAction(action: PedalAction, label: string) {
    this.lastPedalAction.set({
      action,
      label,
      timestamp: Date.now(),
    });
    this.actionSubject.next(action);

    // Auto-clear HUD action after 1.8 seconds
    setTimeout(() => {
      if (this.lastPedalAction()?.timestamp && Date.now() - this.lastPedalAction()!.timestamp >= 1700) {
        this.lastPedalAction.set(null);
      }
    }, 1800);
  }

  private isTypingTarget(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (target.isContentEditable) return true;
    return false;
  }
}
