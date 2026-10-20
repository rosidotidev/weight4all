import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { formatDay } from '../../domain/day';
import { DIMENSIONS } from '../../domain/dimensions';
import { Entry } from '../../domain/entry';
import { recentEntries } from '../../domain/history';
import { formatNumber } from '../../domain/number';
import { I18n } from '../../shared/i18n';

interface Cell {
  readonly key: string;
  /** The formatted value with its unit, or `null` when the Entry has none. */
  readonly text: string | null;
}

/** The last 5 Entries (expanded Today) as compact, non-interactive rows. */
@Component({
  selector: 'w4a-recent-entries',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-entries.component.html',
  styleUrl: './recent-entries.component.scss',
})
export class RecentEntriesComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly entries = inject(EntryStore).entries;
  private readonly today = inject(ClockService).today;

  protected readonly rows = computed(() => {
    const locale = this.i18n.locale();
    const upToToday = Object.fromEntries(
      Object.entries(this.entries()).filter(([day]) => day <= this.today()),
    );
    return recentEntries(upToToday, 5).map((entry) => ({
      day: entry.day,
      date: formatDay(entry.day, locale),
      cells: this.cells(entry, locale),
    }));
  });

  private cells(entry: Entry, locale: string): Cell[] {
    return DIMENSIONS.map((dimension) => {
      const value = (entry.values as Record<string, number | undefined>)[dimension.key];
      return {
        key: dimension.key,
        text:
          value === undefined
            ? null
            : `${formatNumber(value, dimension.decimals, locale)}${dimension.unit ? ' ' + dimension.unit : ''}`,
      };
    });
  }
}
