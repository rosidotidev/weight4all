import { decimalDifference, formatNumber, parseDecimal, stepValue } from './number';

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

describe('stepValue', () => {
  it.each([
    [72.7, 1, 72.8],
    [72.7, -1, 72.6],
    [72.3, 1, 72.4],
    [72.1 + 0.2, 1, 72.4],
    [72.3, -1, 72.2],
    [72.9, 1, 73],
    [73, -1, 72.9],
    [400, 1, 400],
    [20, -1, 20],
    [20, 1, 20.1],
    [399.9, 1, 400],
    [500, 1, 400],
    [5, -1, 20],
  ] as const)('steps %d by %d to %d', (value, direction, expected) => {
    expect(stepValue(value, direction, 0.1, 1, 20, 400)).toBe(expected);
  });

  it('follows the decimals and step given', () => {
    expect(stepValue(6, 1, 0.5, 1, 0, 24)).toBe(6.5);
    expect(stepValue(6, -1, 1, 0, 0, 24)).toBe(5);
  });

  it('reads a step typed in either Language as the same value', () => {
    for (const text of ['72.7', '72,7']) {
      expect(stepValue(parseDecimal(text, 1)!, 1, 0.1, 1, 20, 400)).toBe(72.8);
    }
  });
});

describe('decimalDifference', () => {
  it.each([
    [72.4, 72.7, -0.3],
    [72.8, 72.6, 0.2],
    [72.3, 72.1, 0.2],
    [0.3, 0.1, 0.2],
    [100.1, 100, 0.1],
  ] as const)('%d minus %d is exactly %d', (a, b, expected) => {
    expect(decimalDifference(a, b, 1)).toBe(expected);
  });

  it('is a plain zero, not negative zero, for equal values', () => {
    expect(Object.is(decimalDifference(72.4, 72.4, 1), 0)).toBe(true);
  });
});
