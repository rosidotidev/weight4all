import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { PRIMARY } from '../../domain/dimensions';
import { Entry } from '../../domain/entry';
import { HappyEffect, happyEffect } from '../../domain/happy-effect';
import { EntryFormComponent } from '../../shared/entry-form.component';
import { I18n } from '../../shared/i18n';
import { HappyEffectComponent } from './happy-effect.component';

interface ShownEffect {
  readonly effect: HappyEffect;
  readonly value: number;
}

/** Today: a skeleton while the Entries load, an inline error with Retry on failure, else the form for today, with the amber banner while today has no Entry. */
@Component({
  selector: 'w4a-today',
  imports: [EntryFormComponent, HappyEffectComponent],
  host: { tabindex: '-1' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: 24px 16px;
      font-family: var(--w4a-font-family);
      color: var(--w4a-on-surface);
    }
    :host:focus {
      outline: none;
    }
    .skeleton {
      display: grid;
      gap: var(--w4a-space-4);
      max-width: var(--w4a-form-column-width);
      margin-inline: auto;
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
    .load-error {
      max-width: var(--w4a-form-column-width);
      margin-inline: auto;
    }
    .banner {
      display: flex;
      align-items: center;
      gap: var(--w4a-space-4);
      max-width: var(--w4a-form-column-width);
      margin-inline: auto;
      margin-block-end: var(--w4a-card-gap);
      padding: var(--w4a-space-3) var(--w4a-space-4);
      background: var(--w4a-banner-container);
      color: var(--w4a-on-banner-container);
      border-radius: var(--w4a-rounded-md);
    }
    .banner-dot {
      flex: none;
      width: 14px;
      height: 14px;
      margin: 4px;
      background: var(--w4a-banner-dot);
      border-radius: var(--w4a-rounded-full);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--w4a-banner-dot) 40%, transparent);
    }
    .banner-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
    .banner-body {
      margin: 0;
      font-size: 12.5px;
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
      @case ('ready') {
        @if (!store.entries()[clock.today()]) {
          <div class="banner" role="status">
            <span class="banner-dot" aria-hidden="true"></span>
            <div>
              <p class="banner-title">{{ t().todayMissingTitle }}</p>
              <p class="banner-body">{{ t().todayMissingBody }}</p>
            </div>
          </div>
        }
        @for (shown of shownEffects(); track shown) {
          <w4a-happy-effect
            [effect]="shown.effect"
            [value]="shown.value"
            (closed)="closeEffect()"
          />
        }
        <w4a-entry-form [day]="clock.today()" (confirmed)="showEffect($event)" />
      }
    }
  `,
})
export class TodayComponent {
  protected readonly t = inject(I18n).t;
  protected readonly store = inject(EntryStore);
  protected readonly clock = inject(ClockService);
  protected readonly effect = signal<ShownEffect | null>(null);
  /** One card at a time; a new save makes a new object, so the card is recreated (confetti, focus). */
  protected readonly shownEffects = computed(() => {
    const shown = this.effect();
    return shown ? [shown] : [];
  });

  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private opener: HTMLElement | null = null;

  /** Only a confirmed save of today's Entry earns the Happy effect (never a past Day). */
  protected showEffect(entry: Entry): void {
    const value = entry.values[PRIMARY.key];
    if (value === undefined || entry.day !== this.clock.today()) return;
    if (!this.effect()) {
      const active = this.document.activeElement;
      // The Save button is disabled while saving, which can drop focus: fall back to it.
      this.opener =
        active instanceof HTMLElement && active !== this.document.body
          ? active
          : this.host.nativeElement.querySelector<HTMLElement>('button[type="submit"]');
    }
    this.effect.set({ effect: happyEffect(entry.day, value, this.store.entries()), value });
  }

  /** Done, Dismiss or Esc: remove the card and put focus back where it was, else on Today. */
  protected closeEffect(): void {
    if (!this.effect()) return;
    this.effect.set(null);
    const opener = this.opener;
    this.opener = null;
    const target = opener?.isConnected ? opener : this.host.nativeElement;
    target.focus();
  }
}
