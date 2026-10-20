import { DIMENSIONS, PRIMARY } from './dimensions';
import { Entry } from './entry';

describe('dimension registry', () => {
  it('holds Weight then Mood, with Weight as the primary Dimension', () => {
    expect(DIMENSIONS.map((d) => d.key)).toEqual(['weight', 'mood']);
    expect(PRIMARY).toBe(DIMENSIONS[0]);
  });

  it('describes Weight', () => {
    expect(PRIMARY).toMatchObject({
      unit: 'kg',
      min: 20,
      max: 400,
      step: 0.1,
      decimals: 1,
      required: true,
      clearable: false,
      input: 'stepper',
      defaultValue: null,
      chartToken: '--w4a-chart-weight',
      labelKey: 'dimensionWeight',
      missingKey: 'weightMissing',
      rangeKey: 'weightRange',
      increaseKey: 'weightIncrease',
      decreaseKey: 'weightDecrease',
      hintKey: 'weightHint',
      hintNoLastKey: 'weightHintNoLast',
    });
  });

  it('describes Mood', () => {
    expect(DIMENSIONS[1]).toEqual({
      key: 'mood',
      unit: '',
      min: 1,
      max: 10,
      step: 1,
      decimals: 0,
      required: false,
      clearable: true,
      input: 'faces',
      defaultValue: null,
      chartToken: '--w4a-chart-mood',
      labelKey: 'dimensionMood',
      rangeKey: 'moodRange',
      hintKey: 'moodHint',
    });
  });

  it('shapes an Entry as a day and values by Dimension key', () => {
    const entry: Entry = { day: '2026-10-20', values: { weight: 72.5 } };
    expect(entry.values[PRIMARY.key]).toBe(72.5);
  });
});
