import { compile } from 'sass';
import { join } from 'node:path';

const ROOT = process.cwd();

// ---- WCAG helpers ----
function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = compile(join(ROOT, 'src/styles.scss'), {
  loadPaths: [join(ROOT, 'node_modules')],
  quietDeps: true,
}).css;

/** Custom properties declared by rules with exactly this selector (e.g. `:root`, `.theme-violet`). */
function tokensOf(selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(',').map((s) => s.trim());
    if (!selectors.includes(selector)) continue;
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

// Story 1.10 adds accents by listing them here.
const ACCENTS = ['violet'];
const root = tokensOf(':root');

const TEXT_PAIRS: [string, string][] = [
  ['on-primary', 'primary'],
  ['on-primary-container', 'primary-container'],
  ['on-surface', 'surface'],
  ['on-surface-variant', 'surface-container'],
  ['on-banner-container', 'banner-container'],
];
const GRAPHIC_PAIRS: [string, string][] = [
  ['chart-weight', 'surface'],
  ['chart-mood', 'surface'],
  ['chart-sleep', 'surface'],
];

describe('theme tokens', () => {
  it('emits a theme class per accent', () => {
    for (const id of ACCENTS) expect(Object.keys(tokensOf(`.theme-${id}`)).length).toBeGreaterThan(0);
  });

  it('defines all chart tokens outside any accent class', () => {
    for (const k of ['weight', 'mood', 'sleep']) expect(root[`--w4a-chart-${k}`]).toMatch(/^#[0-9a-f]{6}$/);
    for (const id of ACCENTS)
      expect(Object.keys(tokensOf(`.theme-${id}`)).filter((k) => k.startsWith('--w4a-chart-'))).toEqual([]);
  });

  it('derives the violet theme from the #5A46D6 seed palette', () => {
    expect(tokensOf('.theme-violet')['--mat-sys-primary']).toBe('#5945d5');
  });

  it('defines shape, spacing, banner and touch tokens', () => {
    expect(root['--w4a-rounded-xl']).toBe('24px');
    expect(root['--w4a-space-4']).toBe('16px');
    expect(root['--w4a-touch-target']).toBe('44px');
    expect(root['--w4a-banner-container']).toBeDefined();
  });

  it.each([
    '--mat-button-filled-container-height',
    '--mat-button-outlined-container-height',
    '--mat-button-text-container-height',
    '--mat-button-protected-container-height',
    '--mat-button-tonal-container-height',
    '--mat-form-field-container-height',
    '--mat-chip-container-height',
  ])('sets %s to the touch target token in every accent', (prop) => {
    for (const id of ACCENTS) expect(tokensOf(`.theme-${id}`)[prop]).toBe('var(--w4a-touch-target)');
  });

  describe.each(ACCENTS)('contrast for %s', () => {
    it.each(TEXT_PAIRS)('text %s on %s is at least 4.5:1', (fg, bg) => {
      expect(contrast(root[`--w4a-${fg}`], root[`--w4a-${bg}`])).toBeGreaterThanOrEqual(4.5);
    });
    it.each(GRAPHIC_PAIRS)('graphic %s on %s is at least 3:1', (fg, bg) => {
      expect(contrast(root[`--w4a-${fg}`], root[`--w4a-${bg}`])).toBeGreaterThanOrEqual(3);
    });
  });
});
