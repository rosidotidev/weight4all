import { formatNumber, parseDecimal } from './number';

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

describe('parseDecimal', () => {
  it.each([
    ['72.7', 72.7],
    ['72,7', 72.7],
    [' 72.7 ', 72.7],
    ['20', 20],
    ['400', 400],
    ['0', 0],
    ['072.5', 72.5],
  ])('parses %j as %d', (text, value) => {
    expect(parseDecimal(text, 1)).toBe(value);
  });

  it.each(['', '   ', 'abc', '-5', '+5', '72.55', '72,55', '72.', '.5', '7 2', '72.7.1', '72,7,1', '1e3', '72.7kg'])(
    'rejects %j',
    (text) => {
      expect(parseDecimal(text, 1)).toBeNull();
    },
  );

  it('follows the decimals allowed', () => {
    expect(parseDecimal('6.5', 0)).toBeNull();
    expect(parseDecimal('6', 0)).toBe(6);
    expect(parseDecimal('6.25', 2)).toBe(6.25);
  });
});
