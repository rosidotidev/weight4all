import { buildSeries, SeriesPoint } from '../../domain/series';
import { Entry } from '../../domain/entry';
import { DIMENSIONS } from '../../domain/dimensions';
import { chartDataset, GAP_DASH, legendLabel, lineOptions, readToken, segmentDash } from './chart-config';

describe('legendLabel', () => {
  it('shows the unit in brackets when the Dimension has one', () => {
    expect(legendLabel('Weight', DIMENSIONS[0])).toBe('Weight (kg)');
    expect(legendLabel('Sleep', DIMENSIONS[2])).toBe('Sleep (h)');
  });

  it('shows the registry range when the Dimension has no unit', () => {
    expect(legendLabel('Mood', DIMENSIONS[1])).toBe('Mood (1–10)');
  });
});

const entry = (day: string, values: Entry['values']): Entry => ({ day, values });
const entries = (list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));

// Weight on Day 1 and Day 4 only: Days 2 and 3 are a Gap, Day 4 is bridged from Day 1.
const gapSeries = (): SeriesPoint[] =>
  buildSeries(
    entries([entry('2026-10-01', { weight: 70 }), entry('2026-10-04', { weight: 72 })]),
    '2026-10-01',
    '2026-10-04',
    'weight',
  );

const style = { label: 'Weight (kg)', color: 'weight-color', surface: 'surface-color', marker: 'circle' as const };

/** Chart.js passes the segment context; these tests use only the two indices the callback reads. */
type SegmentContext = { p0DataIndex: number; p1DataIndex: number };
const borderDashOf = (dataset: ReturnType<typeof chartDataset>) =>
  (dataset.segment as unknown as { borderDash: (ctx: SegmentContext) => number[] | undefined }).borderDash;

describe('chartDataset', () => {
  it('keeps null for every Day without a value and spans those gaps', () => {
    const dataset = chartDataset(gapSeries(), style);
    expect(dataset.data).toEqual([70, null, null, 72]);
    expect(dataset.spanGaps).toBe(true);
  });

  it('draws a marker only at Real values', () => {
    const dataset = chartDataset(gapSeries(), style);
    expect(dataset.pointRadius).toEqual([4, 0, 0, 4]);
    expect(dataset.pointStyle).toBe('circle');
  });

  it('dashes the segment that ends at a bridged point, using p1DataIndex', () => {
    const borderDash = borderDashOf(chartDataset(gapSeries(), style));
    // Segment from Day 1 (p0) to Day 4 (p1) crosses the Gap.
    expect(borderDash({ p0DataIndex: 0, p1DataIndex: 3 })).toEqual([...GAP_DASH]);
  });

  it('reads only p1DataIndex: a bridged start point does not dash a solid segment', () => {
    const borderDash = borderDashOf(chartDataset(gapSeries(), style));
    // Segment from Day 4 (p0, bridged) to Day 1 (p1, not bridged) stays solid.
    expect(borderDash({ p0DataIndex: 3, p1DataIndex: 0 })).toBeUndefined();
  });

  it('leaves a segment solid when its end point is not bridged', () => {
    const borderDash = borderDashOf(chartDataset(gapSeries(), style));
    expect(borderDash({ p0DataIndex: 0, p1DataIndex: 0 })).toBeUndefined();
  });

  it('keeps solid segments between adjacent Real values', () => {
    const series = buildSeries(
      entries([entry('2026-10-01', { mood: 6 }), entry('2026-10-02', { mood: 7 })]),
      '2026-10-01',
      '2026-10-02',
      'mood',
    );
    const borderDash = borderDashOf(chartDataset(series, { ...style, marker: 'rect' }));
    expect(borderDash({ p0DataIndex: 0, p1DataIndex: 1 })).toBeUndefined();
  });

  it('uses the colors it is given, so the chart keeps its Dimension color', () => {
    const dataset = chartDataset(gapSeries(), style);
    expect(dataset.borderColor).toBe('weight-color');
    expect(dataset.pointBackgroundColor).toBe('weight-color');
    expect(dataset.pointBorderColor).toBe('surface-color');
  });

  it('passes the value axis id through for the combined chart', () => {
    expect(chartDataset(gapSeries(), { ...style, yAxisID: 'y_weight' }).yAxisID).toBe('y_weight');
  });
});

describe('segmentDash', () => {
  it('is undefined outside the series', () => {
    expect(segmentDash(gapSeries(), 99)).toBeUndefined();
  });
});

describe('readToken', () => {
  const fakeDocument = (values: Record<string, string>) =>
    ({
      documentElement: {},
      defaultView: {
        getComputedStyle: () => ({ getPropertyValue: (name: string) => values[name] ?? '' }),
      },
    }) as unknown as Document;

  it('reads a custom property and trims it', () => {
    expect(readToken(fakeDocument({ '--w4a-chart-weight': ' weight-color ' }), '--w4a-chart-weight')).toBe('weight-color');
  });

  it('is empty when the property is absent', () => {
    expect(readToken(fakeDocument({}), '--w4a-chart-mood')).toBe('');
  });
});

describe('lineOptions', () => {
  it('hides an axis that is not visible and an axis with no title', () => {
    const options = lineOptions(
      [
        { id: 'y0', title: '', bounds: { min: 69.8, max: 72.2 }, position: 'left', gridlines: true },
        { id: 'y1', title: 'h', bounds: null, position: 'right', gridlines: false, visible: false },
      ],
      { text: 'text-color', grid: 'grid-color' },
      true,
    );
    const scales = options.scales as Record<string, { display: boolean; title: { display: boolean } }>;
    expect(scales['y0'].display).toBe(true);
    expect(scales['y0'].title.display).toBe(false);
    expect(scales['y1'].display).toBe(false);
  });

  it('turns animation off and lets the chart fill its container', () => {
    const options = lineOptions([], { text: 'text-color', grid: 'grid-color' }, false);
    expect(options.animation).toBe(false);
    expect(options.maintainAspectRatio).toBe(false);
  });

  it('builds one linear axis per spec with its title and bounds', () => {
    const options = lineOptions(
      [{ id: 'y', title: 'kg', bounds: { min: 69.8, max: 72.2 }, position: 'left', gridlines: true }],
      { text: 'text-color', grid: 'grid-color' },
      false,
    );
    const y = (options.scales as Record<string, { min?: number; max?: number; title?: { text?: string } }>)['y'];
    expect(y.min).toBe(69.8);
    expect(y.max).toBe(72.2);
    expect(y.title?.text).toBe('kg');
  });
});
