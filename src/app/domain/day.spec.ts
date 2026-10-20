import { formatDay } from './day';

describe('formatDay', () => {
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
