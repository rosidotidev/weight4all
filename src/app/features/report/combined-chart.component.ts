import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { AxisBounds, SeriesPoint } from '../../domain/series';
import { MarkerStyle, chartDataset, lineOptions, readToken } from './chart-config';

/** One Dimension's line in the combined chart, with its own value axis. */
export interface CombinedLine {
  /** The legend entry, e.g. "Weight (kg)". */
  readonly legend: string;
  /** The value axis title: the registry unit, or the Dimension name when it has none. */
  readonly axisTitle: string;
  /** The `--w4a-chart-*` token of the Dimension. */
  readonly token: string;
  readonly marker: MarkerStyle;
  readonly series: readonly SeriesPoint[];
  /** The same bounds the Dimension's own chart uses for this series. */
  readonly bounds: AxisBounds | null;
}

/** All Dimensions on one chart, each line on its own independent value axis (no normalization). */
@Component({
  selector: 'w4a-combined-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './combined-chart.component.html',
  styleUrl: './combined-chart.component.scss',
})
export class CombinedChartComponent {
  private readonly doc = inject(DOCUMENT);

  readonly lines = input.required<readonly CombinedLine[]>();
  readonly labels = input.required<readonly string[]>();
  readonly ariaLabel = input.required<string>();

  /** Chart data and options; the first axis sits on the left with gridlines, the others on the right. */
  protected readonly config = computed(() => {
    const palette = {
      text: readToken(this.doc, '--w4a-on-surface-variant'),
      grid: readToken(this.doc, '--w4a-surface-variant'),
    };
    const surface = readToken(this.doc, '--w4a-surface');
    const lines = this.lines();
    const axisId = (index: number) => `y${index}`;
    return {
      data: {
        labels: [...this.labels()],
        datasets: lines.map((line, index) =>
          chartDataset(line.series, {
            label: line.legend,
            color: readToken(this.doc, line.token),
            surface,
            marker: line.marker,
            yAxisID: axisId(index),
          }),
        ),
      },
      options: lineOptions(
        lines.map((line, index) => ({
          id: axisId(index),
          // Each legend entry already carries its unit; axis titles overlapped the ticks on narrow screens.
          title: '',
          bounds: line.bounds,
          // A Dimension with no value in the Range keeps its legend entry but draws no axis.
          visible: line.bounds !== null,
          position: index === 0 ? ('left' as const) : ('right' as const),
          gridlines: index === 0,
        })),
        palette,
        true,
      ),
    };
  });
}
