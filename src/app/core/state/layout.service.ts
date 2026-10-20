import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { EXPANDED_MIN_WIDTH, MEDIUM_MIN_WIDTH, WindowClass, windowClassFor } from '../../domain/window-class';

/** The only code that reads the window: exposes the current `windowClass` (UX-DR2). */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly current = signal<WindowClass>('compact');
  readonly windowClass = this.current.asReadonly();

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const medium = window.matchMedia(`(min-width: ${MEDIUM_MIN_WIDTH}px)`);
    const expanded = window.matchMedia(`(min-width: ${EXPANDED_MIN_WIDTH}px)`);
    // Map the two media queries back through the domain function so thresholds stay in one place.
    const update = () =>
      this.current.set(
        windowClassFor(expanded.matches ? EXPANDED_MIN_WIDTH : medium.matches ? MEDIUM_MIN_WIDTH : 0),
      );
    update();
    medium.addEventListener('change', update);
    expanded.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => {
      medium.removeEventListener('change', update);
      expanded.removeEventListener('change', update);
    });
  }
}
