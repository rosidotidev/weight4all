import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { AxisBounds, SeriesPoint } from '../../domain/series';
import { MarkerStyle, chartDataset, lineOptions, readToken } from './chart-config';

/** One Dimension's line over the Range: solid between Real values, dashed over Gaps. */
@Component({
  selector: 'w4a-dimension-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './dimension-chart.component.html',
  styleUrl: './dimension-chart.component.scss',
})
export class DimensionChartComponent {
  private readonly doc = inject(DOCUMENT);

  readonly label = input.required<string>();
  /** The value axis title: the registry unit, or the Dimension name when it has none. */
  readonly axisTitle = input.required<string>();
  /** The `--w4a-chart-*` token of the Dimension. */
  readonly token = input.required<string>();
  readonly marker = input.required<MarkerStyle>();
  readonly series = input.required<readonly SeriesPoint[]>();
  readonly labels = input.required<readonly string[]>();
  readonly bounds = input.required<AxisBounds | null>();
  readonly ariaLabel = input.required<string>();

  /** Chart data and options; the colors are read from the tokens when the chart is built. */
  protected readonly config = computed(() => {
    const palette = {
      text: readToken(this.doc, '--w4a-on-surface-variant'),
      grid: readToken(this.doc, '--w4a-surface-variant'),
    };
    const dataset = chartDataset(this.series(), {
      label: this.label(),
      color: readToken(this.doc, this.token()),
      surface: readToken(this.doc, '--w4a-surface'),
      marker: this.marker(),
    });
    return {
      data: { labels: [...this.labels()], datasets: [dataset] },
      options: lineOptions(
        [{ id: 'y', title: this.axisTitle(), bounds: this.bounds(), position: 'left', gridlines: true }],
        palette,
        false,
      ),
    };
  });
}
