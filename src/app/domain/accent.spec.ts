import { ACCENTS, DEFAULT_ACCENT, isAccent } from './accent';

describe('accent', () => {
  it('defaults to violet', () => {
    expect(DEFAULT_ACCENT).toBe('violet');
  });

  it.each(['violet', 'teal', 'orange', 'magenta', 'blue', 'green'])('accepts %s', (id) => {
    expect(isAccent(id)).toBe(true);
  });

  it.each(['red', '', 'Violet', null, undefined, 3])('rejects %j', (bad) => {
    expect(isAccent(bad)).toBe(false);
  });

  it('lists exactly six ids', () => {
    expect(ACCENTS).toHaveLength(6);
  });
});
