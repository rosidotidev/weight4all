import { DIMENSIONS } from './dimensions';
import { Entry } from './entry';
import { axisBounds, buildSeries, countValues, isEmptyReport, tableCells } from './series';

describe('tableCells', () => {
  it('lists every Day, the formatted value or the empty text for a Day without one', () => {
    const series = buildSeries(
      entries([entry('2026-10-01', { weight: 72.44 }), entry('2026-10-03', { weight: 71 })]),
      '2026-10-01',
      '2026-10-03',
      'weight',
    );
    const cells = tableCells(series, (value) => `v${value}`, '—');
    expect(cells).toEqual(['v72.44', '—', 'v71']);
    expect(cells).toHaveLength(3);
  });
});

describe('isEmptyReport', () => {
  it('is true only when the Entries are loaded and there are none', () => {
    expect(isEmptyReport('ready', 0)).toBe(true);
    expect(isEmptyReport('ready', 1)).toBe(false);
  });

  it('is false while loading, so the message cannot flash before the first load', () => {
    expect(isEmptyReport('loading', 0)).toBe(false);
  });

  it('is false after a failed load, which has its own message', () => {
    expect(isEmptyReport('error', 0)).toBe(false);
  });
});

describe('a single Real value', () => {
  it('is one point with a value, and its axis is padded so it stays visible', () => {
    const series = buildSeries(
      { '2026-10-10': { day: '2026-10-10', values: { weight: 72 } } },
      '2026-10-01',
      '2026-10-20',
      'weight',
    );
    expect(countValues(series)).toBe(1);
    const bounds = axisBounds(DIMENSIONS[0], series);
    expect(bounds).not.toBeNull();
    expect(bounds!.min).toBeLessThan(72);
    expect(bounds!.max).toBeGreaterThan(72);
  });
});

const entry = (day: string, values: Entry['values']): Entry => ({ day, values });
const entries = (list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));
const weight = DIMENSIONS[0];
const mood = DIMENSIONS[1];

describe('buildSeries', () => {
  it('has one point per Day, in order, including Days without an Entry', () => {
    const series = buildSeries(entries([entry('2026-10-02', { weight: 72 })]), '2026-10-01', '2026-10-03', 'weight');
    expect(series.map((p) => p.day)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(series.map((p) => p.value)).toEqual([null, 72, null]);
  });

  it('uses null, never 0, for a Day without a value for the Dimension', () => {
    const series = buildSeries(entries([entry('2026-10-02', { mood: 7 })]), '2026-10-01', '2026-10-02', 'weight');
    expect(series.map((p) => p.value)).toEqual([null, null]);
  });

  it('marks the Real point that ends a segment crossing one or more Gap Days', () => {
    const series = buildSeries(
      entries([entry('2026-10-01', { weight: 70 }), entry('2026-10-04', { weight: 71 }), entry('2026-10-05', { weight: 72 })]),
      '2026-10-01',
      '2026-10-05',
      'weight',
    );
    expect(series.map((p) => p.bridgedFromPrev)).toEqual([false, false, false, true, false]);
  });

  it('does not bridge two adjacent Days', () => {
    const series = buildSeries(
      entries([entry('2026-10-01', { weight: 70 }), entry('2026-10-02', { weight: 71 })]),
      '2026-10-01',
      '2026-10-02',
      'weight',
    );
    expect(series[1].bridgedFromPrev).toBe(false);
  });

  it('bridges a Gap in one Dimension only: a missing Sleep does not dash Weight', () => {
    const list = entries([
      entry('2026-10-01', { weight: 70, sleep: 7 }),
      entry('2026-10-02', { weight: 71 }),
      entry('2026-10-03', { weight: 72, sleep: 6 }),
    ]);
    const sleep = buildSeries(list, '2026-10-01', '2026-10-03', 'sleep');
    const weightSeries = buildSeries(list, '2026-10-01', '2026-10-03', 'weight');
    expect(sleep.map((p) => p.bridgedFromPrev)).toEqual([false, false, true]);
    expect(weightSeries.map((p) => p.bridgedFromPrev)).toEqual([false, false, false]);
  });

  it('does not bridge before the first Real value, and bridges the next one', () => {
    const series = buildSeries(
      entries([entry('2026-10-03', { mood: 5 }), entry('2026-10-05', { mood: 6 })]),
      '2026-10-01',
      '2026-10-05',
      'mood',
    );
    expect(series.map((p) => p.bridgedFromPrev)).toEqual([false, false, false, false, true]);
  });

  it('gives a single Real value no segment and no bridge', () => {
    const series = buildSeries(entries([entry('2026-10-02', { mood: 7 })]), '2026-10-01', '2026-10-03', 'mood');
    expect(series.map((p) => p.value)).toEqual([null, 7, null]);
    expect(series.some((p) => p.bridgedFromPrev)).toBe(false);
  });

  it('includes both boundary Days and ignores Entries outside the Range', () => {
    const series = buildSeries(
      entries([entry('2026-10-12', { weight: 70 }), entry('2026-10-13', { weight: 71 }), entry('2026-10-20', { weight: 72 }), entry('2026-10-21', { weight: 99 })]),
      '2026-10-13',
      '2026-10-20',
      'weight',
    );
    expect(series[0].day).toBe('2026-10-13');
    expect(series[series.length - 1].day).toBe('2026-10-20');
    expect(series.map((p) => p.value).filter((v) => v !== null)).toEqual([71, 72]);
  });

  it('is all nulls when there are no Entries', () => {
    const series = buildSeries({}, '2026-10-01', '2026-10-03', 'weight');
    expect(series).toHaveLength(3);
    expect(countValues(series)).toBe(0);
  });
});

describe('countValues', () => {
  it('counts the Days with a Real value', () => {
    const series = buildSeries(entries([entry('2026-10-01', { weight: 1 }), entry('2026-10-03', { weight: 2 })]), '2026-10-01', '2026-10-03', 'weight');
    expect(countValues(series)).toBe(2);
  });
});

describe('axisBounds', () => {
  it('is null when there is no value', () => {
    expect(axisBounds(weight, buildSeries({}, '2026-10-01', '2026-10-03', 'weight'))).toBeNull();
  });

  it('pads the data span and keeps the bounds inside the registry range', () => {
    const series = buildSeries(
      entries([entry('2026-10-01', { weight: 70 }), entry('2026-10-02', { weight: 72 })]),
      '2026-10-01',
      '2026-10-02',
      'weight',
    );
    const bounds = axisBounds(weight, series);
    expect(bounds).not.toBeNull();
    expect(bounds!.min).toBeLessThan(70);
    expect(bounds!.max).toBeGreaterThan(72);
    expect(bounds!.min).toBeGreaterThanOrEqual(weight.min);
    expect(bounds!.max).toBeLessThanOrEqual(weight.max);
  });

  it('keeps a single value visible, padded by at least one step', () => {
    const series = buildSeries(entries([entry('2026-10-01', { mood: 7 })]), '2026-10-01', '2026-10-01', 'mood');
    expect(axisBounds(mood, series)).toEqual({ min: 6, max: 8 });
  });

  it('never goes outside the registry range, even at the edge', () => {
    const series = buildSeries(entries([entry('2026-10-01', { mood: 10 })]), '2026-10-01', '2026-10-01', 'mood');
    const bounds = axisBounds(mood, series)!;
    expect(bounds.max).toBe(mood.max);
    expect(bounds.min).toBeGreaterThanOrEqual(mood.min);
  });
});
