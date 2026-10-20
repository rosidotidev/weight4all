import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { formatDay } from '../../domain/day';
import { recentEntries } from '../../domain/history';
import { entryCells } from '../../shared/entry-cells';
import { I18n } from '../../shared/i18n';
import { MoodFaceComponent } from '../../shared/mood-face.component';

/** The last 5 Entries (expanded Today) as compact, non-interactive rows. */
@Component({
  selector: 'w4a-recent-entries',
  imports: [MoodFaceComponent],
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
      cells: entryCells(entry, locale),
    }));
  });
}
