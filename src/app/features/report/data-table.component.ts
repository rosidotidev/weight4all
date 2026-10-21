import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { I18n } from '../../shared/i18n';

/** One value column: its heading and one formatted cell per Day, in the same order as the Days. */
export interface TableColumn {
  readonly header: string;
  readonly cells: readonly string[];
}

let nextTableId = 0;

/** The text alternative of a chart: "Show data as table" toggles a table of Days and values. */
@Component({
  selector: 'w4a-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  protected readonly t = inject(I18n).t;
  protected readonly id = `w4a-table-${nextTableId++}`;

  /** The table's accessible name, the same as the chart's. */
  readonly caption = input.required<string>();
  /** One label per Day of the Range. */
  readonly days = input.required<readonly string[]>();
  readonly columns = input.required<readonly TableColumn[]>();

  protected readonly open = signal(false);

  /** Rows of the table: the Day, then one cell per column. */
  protected readonly rows = computed(() => {
    const columns = this.columns();
    return this.days().map((day, index) => [day, ...columns.map((column) => column.cells[index] ?? '')]);
  });

  protected toggle(): void {
    this.open.update((value) => !value);
  }
}
