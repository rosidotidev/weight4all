import { formatNumber } from './number';

describe('formatNumber', () => {
  it('uses a decimal comma in Italian', () => {
    expect(formatNumber(72.5, 1, 'it-IT')).toBe('72,5');
  });

  it('uses a decimal point in English', () => {
    expect(formatNumber(72.5, 1, 'en-GB')).toBe('72.5');
  });

  it('pads and rounds to the requested decimals', () => {
    expect(formatNumber(72, 1, 'en-GB')).toBe('72.0');
    expect(formatNumber(72.46, 1, 'it-IT')).toBe('72,5');
    expect(formatNumber(6, 0, 'en-GB')).toBe('6');
  });
});
