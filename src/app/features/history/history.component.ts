import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { DIMENSIONS } from '../../domain/dimensions';
import { formatDay } from '../../domain/day';
import { Entry } from '../../domain/entry';
import { HistoryRow, buildHistoryRows } from '../../domain/history';
import { formatNumber } from '../../domain/number';
import { I18n } from '../../shared/i18n';

interface Cell {
  readonly key: string;
  /** The formatted value with its unit, or `null` when the Entry has none. */
  readonly text: string | null;
}

/** History: every Entry newest first with dashed rows for the Days in between, in a virtual list. */
@Component({
  selector: 'w4a-history',
  imports: [ScrollingModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      padding: 0 var(--w4a-margin-compact);
      font-family: var(--w4a-font-family);
      color: var(--w4a-on-surface);
    }
    .heading {
      flex: none;
      margin: var(--w4a-space-2) var(--w4a-space-2) var(--w4a-space-3);
      font-size: 13px;
      font-weight: 500;
      color: var(--w4a-on-surface-variant);
    }
    .viewport {
      flex: 1 1 auto;
      min-height: 0;
    }
    .row {
      display: flex;
      align-items: center;
      gap: var(--w4a-space-4);
      box-sizing: border-box;
      height: 62px;
      margin-bottom: 8px;
      padding: 0 var(--w4a-space-4);
      color: inherit;
      text-decoration: none;
      background: var(--w4a-surface-container);
      border-radius: var(--w4a-rounded-md);
    }
    .row:focus-visible,
    .add:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 2px;
    }
    .date {
      flex: none;
      width: 80px;
      font-size: 14.5px;
      font-weight: 500;
    }
    .value {
      font-size: var(--w4a-type-row-value-size);
      font-weight: var(--w4a-type-row-value-weight);
    }
    .value.absent {
      font-weight: 400;
      color: var(--w4a-outline);
    }
    .row.missing {
      justify-content: space-between;
      background: transparent;
      border: 1.5px dashed var(--w4a-outline);
      color: var(--w4a-on-surface-variant);
      font-size: 14px;
    }
    .add {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      min-height: 44px;
      padding: 0 var(--w4a-space-4);
      font-size: 13px;
      font-weight: 500;
      color: var(--w4a-on-primary-container);
      text-decoration: none;
      background: var(--w4a-primary-container);
      border-radius: var(--w4a-rounded-full);
    }
    .message {
      flex: none;
      margin: var(--w4a-space-4) var(--w4a-space-2);
    }
    .skeleton {
      display: grid;
      gap: 8px;
    }
    .skeleton .row {
      margin: 0;
    }
    .bar {
      height: 16px;
      width: 40%;
      background: var(--w4a-surface);
      border-radius: var(--w4a-rounded-full);
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
  `,
  template: `
    @if (store.status() === 'error') {
      <div class="message load-error">
        <p role="alert">{{ t().historyLoadError }}</p>
        <button type="button" (click)="store.retry()">{{ t().historyRetry }}</button>
      </div>
    }
    @if (rows().length > 0) {
      <h2 class="heading">{{ t().historyHeading }}</h2>
      <cdk-virtual-scroll-viewport class="viewport" [itemSize]="70">
        <ng-container *cdkVirtualFor="let row of rows(); trackBy: trackRow">
          @if (row.kind === 'entry') {
            <a
              class="row entry"
              [routerLink]="['/history', row.day]"
              [attr.aria-label]="t().historyOpenEntry({ date: dateOf(row), value: summary(row.entry) })"
            >
              <span class="date">{{ dateOf(row) }}</span>
              @for (cell of cells(row.entry); track cell.key) {
                @if (cell.text !== null) {
                  <span class="value">{{ cell.text }}</span>
                } @else {
                  <span class="value absent">{{ t().historyDash }}</span>
                }
              }
            </a>
          } @else {
            <div class="row missing">
              <span>{{ t().historyMissing({ date: dateOf(row) }) }}</span>
              <a
                class="add"
                [routerLink]="['/history', row.day]"
                [attr.aria-label]="t().historyAddFor({ date: dateOf(row) })"
                >{{ t().historyAdd }}</a
              >
            </div>
          }
        </ng-container>
      </cdk-virtual-scroll-viewport>
    } @else if (store.status() === 'loading') {
      <div class="skeleton">
        <div class="row" aria-hidden="true"><div class="bar"></div></div>
        <div class="row" aria-hidden="true"><div class="bar"></div></div>
        <div class="row" aria-hidden="true"><div class="bar"></div></div>
        <p class="visually-hidden" role="status" aria-live="polite">{{ t().historyLoading }}</p>
      </div>
    } @else if (store.status() === 'ready') {
      <p class="message empty">{{ t().historyEmpty }}</p>
    }
  `,
})
export class HistoryComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly store = inject(EntryStore);
  private readonly clock = inject(ClockService);

  protected readonly rows = computed(() => buildHistoryRows(this.store.entries(), this.clock.today()));

  protected readonly trackRow = (_: number, row: HistoryRow) => row.day;

  protected dateOf(row: HistoryRow): string {
    return formatDay(row.day, this.i18n.locale());
  }

  protected cells(entry: Entry): Cell[] {
    const locale = this.i18n.locale();
    return DIMENSIONS.map((dimension) => {
      const value = (entry.values as Record<string, number | undefined>)[dimension.key];
      return {
        key: dimension.key,
        text:
          value === undefined
            ? null
            : `${formatNumber(value, dimension.decimals, locale)} ${dimension.unit}`,
      };
    });
  }

  /** The row's values as one phrase for its accessible name. */
  protected summary(entry: Entry): string {
    return this.cells(entry)
      .map((cell) => cell.text ?? this.t().historyAbsentValue)
      .join(', ');
  }
}
