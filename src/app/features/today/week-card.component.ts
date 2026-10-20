import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { enumerateDays, formatDay, resolveRange } from '../../domain/day';
import { DIMENSIONS } from '../../domain/dimensions';
import { formatNumber } from '../../domain/number';
import { average } from '../../domain/stats';
import { I18n } from '../../shared/i18n';

interface Dot {
  readonly day: string;
  readonly initial: string;
  readonly logged: boolean;
}

interface Stat {
  readonly key: string;
  readonly caption: string;
  /** The formatted average with its unit, or `null` when no real value exists. */
  readonly text: string | null;
}

/** "This week" (expanded Today): the last 7 Days ending today, from the store; real values only. */
@Component({
  selector: 'w4a-week-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './week-card.component.html',
  styleUrl: './week-card.component.scss',
})
export class WeekCardComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly entries = inject(EntryStore).entries;
  private readonly clock = inject(ClockService);

  private readonly days = computed(() => {
    const { from, to } = resolveRange('7d', this.clock.today(), null);
    return enumerateDays(from, to);
  });

  protected readonly range = computed(() => {
    const days = this.days();
    const locale = this.i18n.locale();
    return this.t().weekRange({
      from: formatDay(days[0], locale, false),
      to: formatDay(days[days.length - 1], locale, false),
    });
  });

  protected readonly dots = computed<Dot[]>(() => {
    const locale = this.i18n.locale();
    const entries = this.entries();
    return this.days().map((day) => ({
      day,
      initial: formatDay(day, locale).charAt(0).toLocaleUpperCase(locale),
      logged: entries[day] !== undefined,
    }));
  });

  protected readonly count = computed(() => this.dots().filter((dot) => dot.logged).length);

  protected readonly stats = computed<Stat[]>(() => {
    const locale = this.i18n.locale();
    const t = this.t();
    const entries = this.entries();
    const days = this.days();
    return DIMENSIONS.map((dimension) => {
      const values: number[] = [];
      for (const day of days) {
        const value = (entries[day]?.values as Record<string, number | undefined> | undefined)?.[
          dimension.key
        ];
        if (value !== undefined) values.push(value);
      }
      const mean = average(values);
      return {
        key: dimension.key,
        caption: t.weekAverage({ label: t[dimension.labelKey] }),
        text:
          mean === null
            ? null
            : `${formatNumber(mean, Math.max(dimension.decimals, 1), locale)} ${dimension.unit}`,
      };
    });
  });
}
