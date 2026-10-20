import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { dayKey } from '../../domain/day';

/** The only code that reads the clock: a `today` signal refreshed at local midnight and on tab visibility (AD-4). */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly current = signal(dayKey(new Date()));
  private timer: ReturnType<typeof setTimeout> | undefined;
  readonly today = this.current.asReadonly();

  constructor() {
    const refresh = () => {
      this.current.set(dayKey(new Date()));
      this.schedule(refresh);
    };
    this.schedule(refresh);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  private schedule(refresh: () => void): void {
    clearTimeout(this.timer);
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // A little after midnight, so the timer never fires on the previous Day.
    this.timer = setTimeout(refresh, nextMidnight.getTime() - now.getTime() + 50);
  }
}
