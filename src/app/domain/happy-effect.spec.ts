import { Entry } from './entry';
import { happyEffect } from './happy-effect';

const entry = (day: string, weight: number): Entry => ({ day, values: { weight } });
const byDay = (...list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));

describe('happyEffect', () => {
  it('is a loss against yesterday, with an exact delta', () => {
    const entries = byDay(entry('2026-10-19', 72.7), entry('2026-10-20', 72.4));
    expect(happyEffect('2026-10-20', 72.4, entries)).toEqual({
      kind: 'loss',
      delta: -0.3,
      since: '2026-10-19',
      yesterday: true,
    });
  });

  it('is a gain', () => {
    const entries = byDay(entry('2026-10-19', 72.6));
    expect(happyEffect('2026-10-20', 72.8, entries)).toEqual({
      kind: 'gain',
      delta: 0.2,
      since: '2026-10-19',
      yesterday: true,
      jump: false,
    });
  });

  describe('weight jump (CR-2)', () => {
    it('is not a jump at exactly 1% up', () => {
      const entries = byDay(entry('2026-10-19', 70));
      expect(happyEffect('2026-10-20', 70.7, entries)).toMatchObject({ kind: 'gain', jump: false });
    });

    it('is a jump just above 1% up', () => {
      const entries = byDay(entry('2026-10-19', 70));
      expect(happyEffect('2026-10-20', 70.8, entries)).toMatchObject({ kind: 'gain', jump: true });
    });

    it('is not a jump for a small rise', () => {
      const entries = byDay(entry('2026-10-19', 70));
      expect(happyEffect('2026-10-20', 70.1, entries)).toMatchObject({ kind: 'gain', jump: false });
    });

    it('is never a jump for a decrease', () => {
      const entries = byDay(entry('2026-10-19', 70.8));
      expect(happyEffect('2026-10-20', 70, entries)).toEqual({
        kind: 'loss',
        delta: -0.8,
        since: '2026-10-19',
        yesterday: true,
      });
    });

    it('is welcome, with no jump, when there is no earlier Entry', () => {
      expect(happyEffect('2026-10-20', 70.8, {})).toEqual({ kind: 'welcome' });
    });
  });

  it('is the same when nothing changed', () => {
    const entries = byDay(entry('2026-10-19', 72.4));
    const result = happyEffect('2026-10-20', 72.4, entries);
    expect(result.kind).toBe('same');
    expect(result).toMatchObject({ delta: 0 });
  });

  it('names an older Entry and is not yesterday', () => {
    const entries = byDay(entry('2026-10-10', 73), entry('2026-10-16', 72.7));
    expect(happyEffect('2026-10-20', 72.4, entries)).toMatchObject({
      kind: 'loss',
      since: '2026-10-16',
      yesterday: false,
    });
  });

  it('is yesterday across a month change', () => {
    const entries = byDay(entry('2026-09-30', 72));
    expect(happyEffect('2026-10-01', 72.1, entries)).toMatchObject({ yesterday: true });
  });

  it('welcomes when there is no earlier Entry', () => {
    expect(happyEffect('2026-10-20', 72.4, {})).toEqual({ kind: 'welcome' });
  });

  it('welcomes when Entries exist only after the Day', () => {
    const entries = byDay(entry('2026-10-25', 70));
    expect(happyEffect('2026-10-20', 72.4, entries)).toEqual({ kind: 'welcome' });
  });

  it('does not compare with the Day itself', () => {
    const entries = byDay(entry('2026-10-20', 72.4));
    expect(happyEffect('2026-10-20', 72.4, entries)).toEqual({ kind: 'welcome' });
  });
});
