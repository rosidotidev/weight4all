import type { ChartDataset, ChartOptions } from 'chart.js';
import type { Dimension } from '../../domain/dimensions';
import { AxisBounds, SeriesPoint } from '../../domain/series';

/**
 * A legend entry: the name with the unit in brackets ("Weight (kg)"); a Dimension without a unit
 * shows its registry range instead ("Mood (1–10)").
 */
export function legendLabel(name: string, dimension: Pick<Dimension, 'unit' | 'min' | 'max'>): string {
  return `${name} (${dimension.unit || `${dimension.min}–${dimension.max}`})`;
}

/** Marker by registry position (AD-3, UX-DR13): circle for Weight, square for Mood, triangle for Sleep. */
export type MarkerStyle = 'circle' | 'rect' | 'triangle';
const MARKERS: readonly MarkerStyle[] = ['circle', 'rect', 'triangle'];

/** The marker of a Dimension by its registry position. */
export function markerFor(registryIndex: number): MarkerStyle {
  return MARKERS[registryIndex % MARKERS.length];
}

/** The dash pattern drawn over a Gap. */
export const GAP_DASH: readonly number[] = [6, 4];

const LINE_WIDTH = 2.5;
const MARKER_RADIUS = 4;
const MARKER_STROKE = 1.5;

/**
 * The dash for the segment that ends at `p1DataIndex`: dashed when that point is bridged from the
 * previous Real value, else solid (`undefined`).
 */
export function segmentDash(series: readonly SeriesPoint[], p1DataIndex: number): number[] | undefined {
  return series[p1DataIndex]?.bridgedFromPrev ? [...GAP_DASH] : undefined;
}

export interface LineStyle {
  readonly label: string;
  /** The Dimension's `--w4a-chart-*` color, resolved. */
  readonly color: string;
  /** The page surface, used for the 1.5 px marker stroke. */
  readonly surface: string;
  readonly marker: MarkerStyle;
  /** Which value axis the line uses; omitted for the single-axis chart. */
  readonly yAxisID?: string;
}

/**
 * One Chart.js line dataset for a Dimension's series: `null` gaps with `spanGaps`, a dashed segment
 * over every Gap, and a marker at every Real value only.
 */
export function chartDataset(series: readonly SeriesPoint[], style: LineStyle): ChartDataset<'line', (number | null)[]> {
  return {
    label: style.label,
    data: series.map((point) => point.value),
    borderColor: style.color,
    backgroundColor: style.color,
    borderWidth: LINE_WIDTH,
    spanGaps: true,
    segment: {
      borderDash: (ctx) => segmentDash(series, ctx.p1DataIndex),
    },
    pointStyle: style.marker,
    pointRadius: series.map((point) => (point.value === null ? 0 : MARKER_RADIUS)),
    pointHoverRadius: series.map((point) => (point.value === null ? 0 : MARKER_RADIUS + 1)),
    pointBackgroundColor: style.color,
    pointBorderColor: style.surface,
    pointBorderWidth: MARKER_STROKE,
    yAxisID: style.yAxisID,
  };
}

export interface AxisSpec {
  readonly id: string;
  readonly title: string;
  readonly bounds: AxisBounds | null;
  readonly position: 'left' | 'right';
  /** Gridlines only for the first axis, so the combined chart is not drawn twice. */
  readonly gridlines: boolean;
  /** Omitted or true draws the axis; false keeps the Dataset and its legend entry without an axis. */
  readonly visible?: boolean;
}

export interface ChartPalette {
  /** `--w4a-on-surface-variant`: tick and axis text. */
  readonly text: string;
  /** `--w4a-surface-variant`: gridlines. */
  readonly grid: string;
}

/** The options shared by the per-Dimension and combined charts; `animation` off (no freeze, reduced motion). */
export function lineOptions(axes: readonly AxisSpec[], palette: ChartPalette, legend: boolean): ChartOptions<'line'> {
  const scales: Record<string, unknown> = {
    x: {
      // Few enough labels that neighbouring dates never touch on a phone.
      ticks: { color: palette.text, autoSkip: true, maxRotation: 0, maxTicksLimit: 4 },
      grid: { display: false },
    },
  };
  for (const axis of axes) {
    scales[axis.id] = {
      type: 'linear',
      position: axis.position,
      min: axis.bounds?.min,
      max: axis.bounds?.max,
      display: axis.visible ?? true,
      title: { display: axis.title !== '', text: axis.title, color: palette.text },
      ticks: { color: palette.text },
      grid: { display: axis.gridlines, color: palette.grid },
    };
  }
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: legend, position: 'bottom', labels: { usePointStyle: true, color: palette.text } },
    },
    scales: scales as ChartOptions<'line'>['scales'],
  };
}

/** A `--w4a-*` custom property resolved on the document root; empty when absent. */
export function readToken(doc: Document, name: string): string {
  return doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(name).trim() ?? '';
}
