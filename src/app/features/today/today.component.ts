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
import { LayoutService } from '../../core/state/layout.service';
import { PRIMARY } from '../../domain/dimensions';
import { Entry } from '../../domain/entry';
import { HappyEffect, happyEffect } from '../../domain/happy-effect';
import { EntryFormComponent } from '../../shared/entry-form.component';
import { I18n } from '../../shared/i18n';
import { HappyEffectComponent } from './happy-effect.component';
import { RecentEntriesComponent } from './recent-entries.component';
import { WeekCardComponent } from './week-card.component';

interface ShownEffect {
  readonly effect: HappyEffect;
  readonly value: number;
}

/** Today: a skeleton while the Entries load, an inline error with Retry on failure, else the form for today, with the amber banner while today has no Entry. On expanded windows a right column shows This week and the last 5 Entries. */
@Component({
  selector: 'w4a-today',
  imports: [EntryFormComponent, HappyEffectComponent, WeekCardComponent, RecentEntriesComponent],
  host: { tabindex: '-1' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today.component.html',
  styleUrl: './today.component.scss',
})
export class TodayComponent {
  protected readonly t = inject(I18n).t;
  protected readonly store = inject(EntryStore);
  protected readonly clock = inject(ClockService);
  private readonly layout = inject(LayoutService);
  /** The right column (This week, last entries) shows on the expanded window class only. */
  protected readonly wide = computed(() => this.layout.windowClass() === 'expanded');
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
