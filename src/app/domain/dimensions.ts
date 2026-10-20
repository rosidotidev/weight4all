export type DimensionInput = 'stepper' | 'faces' | 'slider';

export interface Dimension {
  /** Also the Firestore field name. */
  readonly key: 'weight' | 'mood' | 'sleep';
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly decimals: number;
  /** Fewest decimals a list row shows (8 h, 7.5 h); the form always shows `decimals`. */
  readonly rowMinDecimals?: number;
  readonly required: boolean;
  readonly clearable: boolean;
  readonly input: DimensionInput;
  readonly defaultValue: number | null;
  /** CSS custom property holding the chart color. */
  readonly chartToken: string;
  /** Key in `strings.ts`. */
  readonly labelKey: 'dimensionWeight' | 'dimensionMood' | 'dimensionSleep';
  /** Keys in `strings.ts` for the blank (required Dimensions only) and out-of-range messages. */
  readonly missingKey?: 'weightMissing';
  readonly rangeKey: 'weightRange' | 'moodRange' | 'sleepRange';
  /** Keys in `strings.ts` for the stepper buttons and the hint under the field. */
  readonly increaseKey?: 'weightIncrease';
  readonly decreaseKey?: 'weightDecrease';
  readonly hintKey?: 'weightHint' | 'moodHint';
  readonly hintNoLastKey?: 'weightHintNoLast';
}

/** The ordered list of Dimensions; the only place that names them (AD-3). */
export const DIMENSIONS = [
  {
    key: 'weight',
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
  },
  {
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
  },
  {
    key: 'sleep',
    unit: 'h',
    min: 0,
    max: 24,
    step: 0.5,
    decimals: 1,
    rowMinDecimals: 0,
    required: false,
    clearable: true,
    input: 'slider',
    defaultValue: 6,
    chartToken: '--w4a-chart-sleep',
    labelKey: 'dimensionSleep',
    rangeKey: 'sleepRange',
  },
] as const satisfies readonly Dimension[];

export type DimensionKey = (typeof DIMENSIONS)[number]['key'];

/** The Dimension behind the Happy effect, pre-fill and the required rule. */
export const PRIMARY: (typeof DIMENSIONS)[0] = DIMENSIONS[0];
