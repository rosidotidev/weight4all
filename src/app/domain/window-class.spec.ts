import { windowClassFor } from './window-class';

describe('windowClassFor', () => {
  it.each([
    [359, 'compact'],
    [599, 'compact'],
    [600, 'medium'],
    [839, 'medium'],
    [840, 'expanded'],
    [1920, 'expanded'],
  ] as const)('width %i is %s', (width, expected) => {
    expect(windowClassFor(width)).toBe(expected);
  });
});
