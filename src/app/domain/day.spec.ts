import { addDays, dayKey, enumerateDays, formatDay, parseDayKey, resolveRange } from './day';

describe('formatDay', () => {
  it('can leave the weekday out', () => {
    expect(formatDay('2025-10-14', 'en-GB', false)).toBe('14 Oct');
    expect(formatDay('2025-10-14', 'it-IT', false)).toBe('14 ott');
  });

  it('formats Italian as short weekday, day and month', () => {
    expect(formatDay('2025-10-19', 'it-IT')).toBe('dom 19 ott');
  });

  it('formats English as short weekday, day and month', () => {
    expect(formatDay('2025-10-19', 'en-GB')).toBe('Sun 19 Oct');
  });

  it('does not shift the day around the year boundary', () => {
    expect(formatDay('2026-01-01', 'en-GB')).toBe('Thu 1 Jan');
  });
});

describe('dayKey', () => {
  it('uses the local date around midnight', () => {
    expect(dayKey(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
    expect(dayKey(new Date(2026, 0, 2, 0, 0))).toBe('2026-01-02');
  });
});

describe('parseDayKey', () => {
  it('returns a local date for a valid key', () => {
    const date = parseDayKey('2026-10-20')!;
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 20, 0]);
  });

  it('accepts a leap day only in a leap year', () => {
    expect(parseDayKey('2028-02-29')).not.toBeNull();
    expect(parseDayKey('2026-02-29')).toBeNull();
  });

  it.each(['2026-02-30', 'x', '', '2026-13-01', '2026-00-10', '2026-1-1', '2026-10-20T00'])(
    'returns null for %j',
    (key) => expect(parseDayKey(key)).toBeNull(),
  );
});

describe('addDays', () => {
  it('crosses month, year and leap day', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-20', 0)).toBe('2026-10-20');
  });

  it('counts calendar days across a daylight saving change', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });

  it('throws on an invalid key', () => {
    expect(() => addDays('x', 1)).toThrow();
  });
});

describe('enumerateDays', () => {
  it('is inclusive', () => {
    expect(enumerateDays('2026-02-27', '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(enumerateDays('2026-10-20', '2026-10-20')).toEqual(['2026-10-20']);
  });

  it('is empty when from is after to', () => {
    expect(enumerateDays('2026-10-21', '2026-10-20')).toEqual([]);
  });
});

describe('resolveRange', () => {
  it('ends today and spans the stated Days', () => {
    expect(resolveRange('7d', '2026-10-20', null)).toEqual({ from: '2026-10-14', to: '2026-10-20' });
    expect(resolveRange('30d', '2026-10-20', null)).toEqual({ from: '2026-09-21', to: '2026-10-20' });
    expect(resolveRange('90d', '2026-10-20', null)).toEqual({ from: '2026-07-23', to: '2026-10-20' });
    const year = resolveRange('1y', '2026-10-20', null);
    expect(year).toEqual({ from: '2025-10-21', to: '2026-10-20' });
    expect(enumerateDays(year.from, year.to)).toHaveLength(365);
  });

  it('starts all at the first Day, or today without one', () => {
    expect(resolveRange('all', '2026-10-20', '2026-01-05')).toEqual({ from: '2026-01-05', to: '2026-10-20' });
    expect(resolveRange('all', '2026-10-20', null)).toEqual({ from: '2026-10-20', to: '2026-10-20' });
  });
});
