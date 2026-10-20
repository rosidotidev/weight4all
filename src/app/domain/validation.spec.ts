import { DIMENSIONS, PRIMARY } from './dimensions';
import { validateValue } from './validation';

describe('validateValue', () => {
  it.each([
    ['72.7', 72.7],
    ['72,7', 72.7],
    [' 72.7 ', 72.7],
    ['20', 20],
    ['20.0', 20],
    ['400', 400],
    ['400,0', 400],
  ])('accepts %j', (text, value) => {
    expect(validateValue(PRIMARY, text)).toEqual({ ok: true, value });
  });

  it.each(['', '   '])('reports %j as missing', (text) => {
    expect(validateValue(PRIMARY, text)).toEqual({ ok: false, error: 'missing' });
  });

  it.each(['19.9', '400.1', '0', '-5', 'abc', '72.55', '72,55', '19,9', '1000'])('reports %j as range', (text) => {
    expect(validateValue(PRIMARY, text)).toEqual({ ok: false, error: 'range' });
  });
});

describe('validateValue for Mood', () => {
  const mood = DIMENSIONS[1];

  it.each([1, 5, 7, 10])('accepts %j', (value) => {
    expect(validateValue(mood, String(value))).toEqual({ ok: true, value });
  });

  it.each(['0', '11', '7.5', '-1'])('reports %j as range', (text) => {
    expect(validateValue(mood, text)).toEqual({ ok: false, error: 'range' });
  });

  it('reports blank as missing', () => {
    expect(validateValue(mood, '')).toEqual({ ok: false, error: 'missing' });
  });
});

describe('validateValue for Sleep', () => {
  const sleep = DIMENSIONS[2];

  it.each([0, 6, 6.5, 7, 7.5, 24])('accepts %j', (value) => {
    expect(validateValue(sleep, String(value))).toEqual({ ok: true, value });
  });

  it.each(['24.5', '-1', '6.3', '7.25', '25'])('reports %j as range', (text) => {
    expect(validateValue(sleep, text)).toEqual({ ok: false, error: 'range' });
  });

  it('reports blank as missing', () => {
    expect(validateValue(sleep, '')).toEqual({ ok: false, error: 'missing' });
  });
});
