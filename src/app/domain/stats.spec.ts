import { resolveRange } from './day';
import { Entry } from './entry';
import { average, change, dimensionStatistics, formatStat, maximum, minimum } from './stats';

describe('average', () => {
  it('is null when there are no values, never 0', () => {
    expect(average([])).toBeNull();
  });

  it('is the mean of the values', () => {
    expect(average([72])).toBe(72);
    expect(average([70, 72, 74])).toBe(72);
    expect(average([0, 10])).toBe(5);
  });
});

describe('minimum and maximum', () => {
  it('are null when there are no values', () => {
    expect(minimum([])).toBeNull();
    expect(maximum([])).toBeNull();
  });

  it('are the smallest and largest value, a single value being both', () => {
    expect(minimum([72.4, 71.9, 73.4])).toBe(71.9);
    expect(maximum([72.4, 71.9, 73.4])).toBe(73.4);
    expect(minimum([5])).toBe(5);
    expect(maximum([5])).toBe(5);
  });
});

describe('change', () => {
  it('is null when there are no values', () => {
    expect(change([])).toBeNull();
  });

  it('is 0 for a single value', () => {
    expect(change([7])).toBe(0);
  });

  it('is the last value minus the first, exact to one decimal', () => {
    expect(change([72.7, 72.4])).toBe(-0.3);
    expect(change([7, 8.5])).toBe(1.5);
    expect(change([6.5, 7, 7.5])).toBe(1);
  });

  it('is never negative zero', () => {
    expect(Object.is(change([5, 5]), 0)).toBe(true);
  });
});

describe('formatStat', () => {
  it('writes one decimal in the Language and appends the unit', () => {
    expect(formatStat(72.6, 'en-GB')).toBe('72.6');
    expect(formatStat(72.6, 'it-IT')).toBe('72,6');
    expect(formatStat(7, 'en-GB')).toBe('7.0');
    expect(formatStat(7.25, 'en-GB', 'h')).toBe('7.3 h');
  });

  it('writes a negative value with U+2212 and a positive change with +', () => {
    expect(formatStat(-0.8, 'en-GB', 'kg', true)).toBe('\u22120.8 kg');
    expect(formatStat(1.5, 'en-GB', '', true)).toBe('+1.5');
    expect(formatStat(1.5, 'en-GB')).toBe('1.5');
  });

  it('never shows a sign on zero or on a rounded-away negative', () => {
    expect(formatStat(0, 'en-GB', '', true)).toBe('0.0');
    expect(formatStat(-0.04, 'en-GB', '', true)).toBe('0.0');
  });
});

describe('dimensionStatistics', () => {
  const entry = (day: string, values: Entry['values']): Entry => ({ day, values });
  const entries = (list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));

  it('reads no value when no Entry in the Range has the Dimension', () => {
    const stats = dimensionStatistics(
      entries([entry('2026-10-10', { mood: 7 })]),
      '2026-10-01',
      '2026-10-20',
      'weight',
    );
    expect(stats).toEqual({ average: null, minimum: null, maximum: null, change: null });
  });

  it('reads nothing at all when there are no Entries', () => {
    const stats = dimensionStatistics({}, '2026-10-01', '2026-10-20', 'mood');
    expect(stats).toEqual({ average: null, minimum: null, maximum: null, change: null });
  });

  it('uses a single Real entry for every Statistic, with change 0', () => {
    const stats = dimensionStatistics(
      entries([entry('2026-10-10', { mood: 7 })]),
      '2026-10-01',
      '2026-10-20',
      'mood',
    );
    expect(stats).toEqual({ average: 7, minimum: 7, maximum: 7, change: 0 });
  });

  it('skips Days without the Dimension, so gaps do not count', () => {
    const stats = dimensionStatistics(
      entries([
        entry('2026-10-02', { weight: 72 }),
        entry('2026-10-05', { mood: 9 }),
        entry('2026-10-09', { weight: 74 }),
      ]),
      '2026-10-01',
      '2026-10-20',
      'weight',
    );
    expect(stats).toEqual({ average: 73, minimum: 72, maximum: 74, change: 2 });
  });

  it('takes change from the first and last Real entry by Day, not by insertion order', () => {
    const stats = dimensionStatistics(
      entries([entry('2026-10-09', { sleep: 8 }), entry('2026-10-02', { sleep: 6 })]),
      '2026-10-01',
      '2026-10-20',
      'sleep',
    );
    expect(stats.change).toBe(2);
  });

  it('includes both boundary days and excludes the days just outside the Range', () => {
    const stats = dimensionStatistics(
      entries([
        entry('2026-10-12', { weight: 70 }),
        entry('2026-10-13', { weight: 71 }),
        entry('2026-10-20', { weight: 72 }),
        entry('2026-10-21', { weight: 99 }),
      ]),
      '2026-10-13',
      '2026-10-20',
      'weight',
    );
    expect(stats).toEqual({ average: 71.5, minimum: 71, maximum: 72, change: 1 });
  });
});

describe('dimensionStatistics over a Range from resolveRange', () => {
  const TODAY = '2026-10-20';
  const entry = (day: string, weight: number): Entry => ({ day, values: { weight } });
  const entries = (list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));

  it('counts 7 d as the 7 Days ending today: 6 Days ago in, 7 Days ago out', () => {
    const { from, to } = resolveRange('7d', TODAY, null);
    const stats = dimensionStatistics(
      entries([entry('2026-10-13', 99), entry('2026-10-14', 70), entry('2026-10-20', 72)]),
      from,
      to,
      'weight',
    );
    expect(stats).toEqual({ average: 71, minimum: 70, maximum: 72, change: 2 });
  });

  it('starts all at the first Entry, so an old Entry is included', () => {
    const { from, to } = resolveRange('all', TODAY, '2026-01-05');
    const stats = dimensionStatistics(
      entries([entry('2026-01-05', 80), entry('2026-10-20', 70)]),
      from,
      to,
      'weight',
    );
    expect(stats).toEqual({ average: 75, minimum: 70, maximum: 80, change: -10 });
  });

  it('counts 1 y as 365 Days ending today', () => {
    const { from, to } = resolveRange('1y', TODAY, null);
    const stats = dimensionStatistics(
      entries([entry('2025-10-20', 99), entry('2025-10-21', 60)]),
      from,
      to,
      'weight',
    );
    expect(stats).toEqual({ average: 60, minimum: 60, maximum: 60, change: 0 });
  });
});
