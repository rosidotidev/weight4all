import { entryCells } from './entry-cells';

describe('entryCells', () => {
  const full = { day: '2026-10-19', values: { weight: 72.4, mood: 7, sleep: 7.5 } };

  it('gives one cell per Dimension, with the Mood number as a face', () => {
    expect(entryCells(full, 'en')).toEqual([
      { key: 'weight', text: '72.4 kg', face: null },
      { key: 'mood', text: '7', face: 7 },
      { key: 'sleep', text: '7.5 h', face: null },
    ]);
  });

  it('leaves absent values null, never 0', () => {
    const cells = entryCells({ day: '2026-10-19', values: { weight: 72.9 } }, 'en');
    expect(cells.map((c) => [c.text, c.face])).toEqual([
      ['72.9 kg', null],
      [null, null],
      [null, null],
    ]);
  });

  it('shows whole hours without a decimal and uses the decimal comma in Italian', () => {
    expect(entryCells({ day: '2026-10-19', values: { weight: 72.4, sleep: 8 } }, 'en')[2].text).toBe('8 h');
    expect(entryCells(full, 'it').map((c) => c.text)).toEqual(['72,4 kg', '7', '7,5 h']);
  });
});
