import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { I18n } from '../../shared/i18n';

/** Today: a skeleton while the Entries load, an inline error with Retry on failure, else the placeholder (Story 2.2 adds the form). */
@Component({
  selector: 'w4a-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: 24px 16px;
      font-family: var(--w4a-font-family);
      color: var(--w4a-on-surface);
    }
    .skeleton {
      display: grid;
      gap: var(--w4a-space-4);
      max-width: 480px;
    }
    .card {
      display: grid;
      gap: var(--w4a-space-3);
      padding: var(--w4a-space-5);
      background: var(--w4a-surface-container);
      border-radius: var(--w4a-rounded-xl);
    }
    .bar {
      height: 16px;
      width: 40%;
      background: var(--w4a-surface);
      border-radius: var(--w4a-rounded-full);
    }
    .bar.wide {
      width: 80%;
      height: 40px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
    button {
      min-height: 44px;
      padding: 0 24px;
      font: inherit;
      font-weight: 500;
      color: var(--w4a-on-primary);
      background: var(--w4a-primary);
      border: 0;
      border-radius: var(--w4a-rounded-full);
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 2px;
    }
  `,
  template: `
    @switch (store.status()) {
      @case ('loading') {
        <div class="skeleton">
          <div class="card" aria-hidden="true">
            <div class="bar"></div>
            <div class="bar wide"></div>
          </div>
          <div class="card" aria-hidden="true">
            <div class="bar"></div>
            <div class="bar wide"></div>
          </div>
          <p class="visually-hidden" role="status" aria-live="polite">{{ t().todayLoading }}</p>
        </div>
      }
      @case ('error') {
        <div class="load-error">
          <p role="alert">{{ t().todayLoadError }}</p>
          <button type="button" (click)="store.retry()">{{ t().todayRetry }}</button>
        </div>
      }
      @default {
        <p>{{ t().todayPlaceholder }}</p>
      }
    }
  `,
})
export class TodayComponent {
  protected readonly t = inject(I18n).t;
  protected readonly store = inject(EntryStore);
}
