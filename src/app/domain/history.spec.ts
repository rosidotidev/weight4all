import { Entry } from './entry';
import { previousEntry } from './history';

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
