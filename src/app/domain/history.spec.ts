import { Entry } from './entry';
import { buildHistoryRows, previousEntry, recentEntries } from './history';

const entry = (day: string, weight: number): Entry => ({ day, values: { weight } });

describe('previousEntry', () => {
  const entries = {
    '2026-10-10': entry('2026-10-10', 71),
    '2026-10-18': entry('2026-10-18', 72.7),
    '2026-10-20': entry('2026-10-20', 72.4),
    '2026-10-25': entry('2026-10-25', 70),
  };

  it('returns the latest Entry before the Day, skipping gaps', () => {
    expect(previousEntry('2026-10-20', entries)).toBe(entries['2026-10-18']);
    expect(previousEntry('2026-10-19', entries)).toBe(entries['2026-10-18']);
  });

  it('never returns the Day itself or a later Day', () => {
    expect(previousEntry('2026-10-10', entries)).toBeNull();
    expect(previousEntry('2026-10-21', entries)).toBe(entries['2026-10-20']);
  });

  it('is null with no Entries', () => {
    expect(previousEntry('2026-10-20', {})).toBeNull();
  });
});

describe('buildHistoryRows', () => {
  const of = (...days: string[]) => Object.fromEntries(days.map((d) => [d, entry(d, 70)]));
  const shape = (rows: ReturnType<typeof buildHistoryRows>) => rows.map((r) => `${r.kind}:${r.day}`);

  it('lists contiguous Entries newest first', () => {
    expect(shape(buildHistoryRows(of('2026-10-18', '2026-10-19'), '2026-10-20'))).toEqual([
      'entry:2026-10-19',
      'entry:2026-10-18',
    ]);
  });

  it('puts a missing row in each gap', () => {
    expect(shape(buildHistoryRows(of('2026-10-12', '2026-10-14'), '2026-10-20'))).toEqual([
      'entry:2026-10-14',
      'missing:2026-10-13',
      'entry:2026-10-12',
    ]);
  });

  it('fills a long gap day by day', () => {
    const rows = buildHistoryRows(of('2026-10-01', '2026-10-20'), '2026-10-20');
    expect(rows).toHaveLength(20);
    expect(rows.filter((r) => r.kind === 'missing')).toHaveLength(18);
  });

  it('drops future Entries and adds no future gap rows', () => {
    expect(shape(buildHistoryRows(of('2026-10-18', '2026-10-25'), '2026-10-20'))).toEqual([
      'entry:2026-10-18',
    ]);
  });

  it('adds no rows after the last Entry', () => {
    expect(shape(buildHistoryRows(of('2026-10-18'), '2026-10-20'))).toEqual(['entry:2026-10-18']);
  });

  it('is empty with no Entries, or only future ones', () => {
    expect(buildHistoryRows({}, '2026-10-20')).toEqual([]);
    expect(buildHistoryRows(of('2026-10-25'), '2026-10-20')).toEqual([]);
  });

  it('carries the Entry on entry rows', () => {
    const entries = of('2026-10-18');
    const [row] = buildHistoryRows(entries, '2026-10-20');
    expect(row.kind === 'entry' && row.entry).toBe(entries['2026-10-18']);
  });
});

describe('recentEntries', () => {
  const entries = {
    '2026-10-10': entry('2026-10-10', 71),
    '2026-10-18': entry('2026-10-18', 72.7),
    '2026-10-20': entry('2026-10-20', 72.4),
  };

  it('returns the n newest Entries, newest first', () => {
    expect(recentEntries(entries, 2).map((e) => e.day)).toEqual(['2026-10-20', '2026-10-18']);
  });

  it('returns fewer when there are fewer, and none for n of 0', () => {
    expect(recentEntries(entries, 5)).toHaveLength(3);
    expect(recentEntries(entries, 0)).toEqual([]);
    expect(recentEntries({}, 5)).toEqual([]);
  });
});
