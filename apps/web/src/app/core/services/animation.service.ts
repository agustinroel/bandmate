import { Injectable, ElementRef, NgZone, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  private readonly ngZone = inject(NgZone);

  /**
   * Fade in an element from opacity 0 to 1
   */
  fadeIn(element: Element | ElementRef, delay: number = 0, duration: number = 0.5) {
    const el = this.getNativeElement(element);
    if (!el) return;

    this.runOutsideAngular(() => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration, delay, ease: 'power2.out' });
    });
  }

  /**
   * Slide an element up while fading in
   */
  slideUp(element: Element | ElementRef, delay: number = 0, duration: number = 0.5) {
    const el = this.getNativeElement(element);
    if (!el) return;

    this.runOutsideAngular(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration, delay, ease: 'back.out(1.7)' },
      );
    });
  }

  /**
   * Stagger a list of elements
   */
  staggerList(elements: Element[] | ElementRef[], stagger: number = 0.05, delay: number = 0) {
    // Convert all to native elements
    const nativeElements = elements.map((e) => this.getNativeElement(e)).filter((e) => !!e);
    if (nativeElements.length === 0) return;

    this.runOutsideAngular(() => {
      gsap.fromTo(
        nativeElements,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger,
          delay,
          ease: 'power2.out',
          clearProps: 'all', // Clean up after animation to avoid style conflicts
        },
      );
    });
  }

  /**
   * Smoothly scroll a container to a selector or position
   */
  smoothScrollTo(container: HTMLElement | Window, target: any, duration: number = 0.5) {
    this.runOutsideAngular(() => {
      gsap.to(container, {
        scrollTo: target,
        duration,
        ease: 'power2.inOut',
      });
    });
  }

  /**
   * Create a pulse animation for metronome
   */
  pulse(element: Element | ElementRef, duration: number = 0.1) {
    const el = this.getNativeElement(element);
    if (!el) return;

    this.runOutsideAngular(() => {
      const tl = gsap.timeline();
      tl.to(el, { scale: 1.05, opacity: 1, duration: duration / 2, ease: 'power2.out' }).to(el, {
        scale: 1,
        opacity: 0.8,
        duration: duration / 2,
        ease: 'power2.in',
      });
    });
  }

  /**
   * Animate an element leaving (fade out + scale down)
   */
  leave(element: Element | ElementRef, duration: number = 0.3): Promise<void> {
    const el = this.getNativeElement(element);
    if (!el) return Promise.resolve();

    return new Promise((resolve) => {
      this.runOutsideAngular(() => {
        gsap.to(el, {
          opacity: 0,
          scale: 0.95,
          duration,
          ease: 'power2.in',
          onComplete: () => {
            // Run resolve inside Angular zone if needed, or outside if just removing DOM
            resolve();
          },
        });
      });
    });
  }

  /**
   * Confetti-like celebration burst (used when completing a setlist)
   * Creates particles that fly outward from a container.
   */
  celebrate(container: Element | ElementRef, particleCount: number = 30) {
    const parent = this.getNativeElement(container);
    if (!parent) return;

    this.runOutsideAngular(() => {
      const colors = ['#E9C46A', '#2A9D8F', '#E76F51', '#F4A261', '#264653'];
      const rect = (parent as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      for (let i = 0; i < particleCount; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          position: fixed;
          left: ${cx}px;
          top: ${cy}px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${colors[i % colors.length]};
          pointer-events: none;
          z-index: 9999;
        `;
        document.body.appendChild(dot);

        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const dist = 60 + Math.random() * 120;

        gsap.to(dot, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 40, // bias upward
          scale: 0,
          opacity: 0,
          duration: 0.8 + Math.random() * 0.6,
          ease: 'power2.out',
          onComplete: () => dot.remove(),
        });
      }
    });
  }

  // --- Private Helpers ---

  private getNativeElement(element: Element | ElementRef): Element | null {
    if (element instanceof ElementRef) {
      return element.nativeElement;
    }
    return element;
  }

  /**
   * Run GSAP animations outside Angular zone to prevent change detection spam
   */
  private runOutsideAngular(fn: () => void) {
    this.ngZone.runOutsideAngular(() => {
      fn();
    });
  }
}
