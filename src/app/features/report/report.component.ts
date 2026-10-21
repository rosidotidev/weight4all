import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { RangeId, resolveRange } from '../../domain/day';
import { DIMENSIONS } from '../../domain/dimensions';
import { dimensionStatistics, formatStat } from '../../domain/stats';
import { I18n } from '../../shared/i18n';

type RangeLabelKey = 'rangeDays7' | 'rangeDays30' | 'rangeDays90' | 'rangeYear' | 'rangeAll';

/** The Range chips in display order; `30d` is the default. */
const RANGE_CHIPS: readonly { readonly id: RangeId; readonly labelKey: RangeLabelKey }[] = [
  { id: '7d', labelKey: 'rangeDays7' },
  { id: '30d', labelKey: 'rangeDays30' },
  { id: '90d', labelKey: 'rangeDays90' },
  { id: '1y', labelKey: 'rangeYear' },
  { id: 'all', labelKey: 'rangeAll' },
];

const RANGE_DAYS: Record<Exclude<RangeId, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

/** Marker shapes by registry position: circle for Weight, square for Mood, triangle for Sleep. */
const MARKERS = ['circle', 'square', 'triangle'] as const;

interface Chip {
  readonly id: RangeId;
  readonly label: string;
}

interface Cell {
  readonly key: 'average' | 'minimum' | 'maximum' | 'change';
  readonly label: string;
  /** The formatted Statistic with its unit, or `null` when no Real entry exists ("No data"). */
  readonly text: string | null;
}

interface StatCard {
  readonly key: string;
  readonly name: string;
  readonly token: string;
  readonly marker: (typeof MARKERS)[number];
  readonly caption: string;
  readonly cells: readonly Cell[];
}

/** Report: the Range chips and one Statistics card per Dimension, from Real entries in the Range. */
@Component({
  selector: 'w4a-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class ReportComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly entries = inject(EntryStore).entries;
  private readonly clock = inject(ClockService);
  private readonly chipButtons = viewChildren<ElementRef<HTMLButtonElement>>('chip');

  /** The selected Range; it lives in the component, so a resize or rotation keeps it. */
  protected readonly range = signal<RangeId>('30d');

  /** The earliest Day with an Entry, or `null` when there are none; `all` starts there. */
  private readonly firstDay = computed(() => {
    const days = Object.keys(this.entries()).sort();
    return days.length > 0 ? days[0] : null;
  });

  private readonly period = computed(() => resolveRange(this.range(), this.clock.today(), this.firstDay()));

  protected readonly chips = computed<Chip[]>(() => {
    const t = this.t();
    return RANGE_CHIPS.map((chip) => ({ id: chip.id, label: t[chip.labelKey] }));
  });

  private readonly caption = computed(() => {
    const t = this.t();
    const range = this.range();
    return range === 'all' ? t.statAllTime : t.statLastDays({ count: String(RANGE_DAYS[range]) });
  });

  protected readonly cards = computed<StatCard[]>(() => {
    const t = this.t();
    const locale = this.i18n.locale();
    const entries = this.entries();
    const { from, to } = this.period();
    const caption = this.caption();
    return DIMENSIONS.map((dimension, index) => {
      const stats = dimensionStatistics(entries, from, to, dimension.key);
      const text = (value: number | null, signed = false) =>
        value === null ? null : formatStat(value, locale, dimension.unit, signed);
      return {
        key: dimension.key,
        name: t[dimension.labelKey],
        token: dimension.chartToken,
        marker: MARKERS[index % MARKERS.length],
        caption,
        cells: [
          { key: 'average', label: t.statAverage, text: text(stats.average) },
          { key: 'minimum', label: t.statMin, text: text(stats.minimum) },
          { key: 'maximum', label: t.statMax, text: text(stats.maximum) },
          { key: 'change', label: t.statChange, text: text(stats.change, true) },
        ],
      };
    });
  });

  /** Arrow keys move the selection within the radio group, as the ARIA radio pattern expects. */
  protected onChipKeydown(event: KeyboardEvent, index: number): void {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !backward) return;
    event.preventDefault();
    const next = (index + (forward ? 1 : -1) + RANGE_CHIPS.length) % RANGE_CHIPS.length;
    this.range.set(RANGE_CHIPS[next].id);
    this.chipButtons()[next].nativeElement.focus();
  }
}
