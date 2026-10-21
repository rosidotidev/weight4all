import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Gap between clearing the region and writing the new text, so a repeated message is announced again. */
const RESET_MS = 100;

/**
 * Speaks save and delete outcomes through the one polite live region rendered by the root component
 * (`role="status"`, `aria-live="polite"`). The caller passes text already in the current Language.
 */
@Injectable({ providedIn: 'root' })
export class LiveAnnouncer {
  readonly message = signal('');
  private pending: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.pending));
  }

  /** Clears the region, then writes `text` a moment later: the same text said twice is heard twice. */
  say(text: string): void {
    clearTimeout(this.pending);
    this.message.set('');
    this.pending = setTimeout(() => this.message.set(text), RESET_MS);
  }
}
