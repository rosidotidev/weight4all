import { average } from './stats';

describe('average', () => {
  it('is null when there are no values, never 0', () => {
    expect(average([])).toBeNull();
  });

  it('is the mean of the values', () => {
    expect(average([72])).toBe(72);
    expect(average([70, 72, 74])).toBe(72);
    expect(average([0, 10])).toBe(5);
  });
});
