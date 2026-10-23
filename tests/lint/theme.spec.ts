import { compile } from 'sass';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ACCENTS } from '../../src/app/domain/accent';
import { faceColours } from '../../src/app/shared/mood-face.component';

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

const root = tokensOf(':root');

/** Pairs of `--mat-sys-*` names resolved inside `.theme-<id>`. */
const TEXT_PAIRS: [string, string][] = [
  ['on-primary', 'primary'],
  ['on-primary-container', 'primary-container'],
  ['primary', 'surface'],
];
/** Fixed pairs on `:root`, the same for every accent. */
const ROOT_TEXT_PAIRS: [string, string][] = [
  ['on-surface', 'surface'],
  ['on-surface-variant', 'surface-container'],
  ['on-banner-container', 'banner-container'],
];
const CHART_PAIRS: [string, string][] = [
  ['chart-weight', 'surface'],
  ['chart-mood', 'surface'],
  ['chart-sleep', 'surface'],
];
const SEEDS: Record<string, string> = {
  violet: '#5A46D6',
  teal: '#0B8A7B',
  orange: '#D9480F',
  magenta: '#C2287A',
  blue: '#2F5BD8',
  green: '#3C7D22',
};

describe('theme tokens', () => {
  it('emits exactly one theme class per domain accent id', () => {
    const emitted = [...new Set([...css.matchAll(/\.theme-([a-z]+)\b/g)].map((m) => m[1]))];
    expect(emitted.sort()).toEqual([...ACCENTS].sort());
    for (const id of ACCENTS) expect(Object.keys(tokensOf(`.theme-${id}`)).length).toBeGreaterThan(0);
  });

  it('declares a seed token per accent matching the DESIGN.md seeds', () => {
    expect(Object.keys(SEEDS).sort()).toEqual([...ACCENTS].sort());
    for (const id of ACCENTS) expect(root[`--w4a-accent-${id}`].toLowerCase()).toBe(SEEDS[id].toLowerCase());
  });

  it('maps the role tokens to the Material system tokens in every accent', () => {
    for (const id of ACCENTS) {
      const t = tokensOf(`.theme-${id}`);
      for (const r of ['primary', 'on-primary', 'primary-container', 'on-primary-container'])
        expect(t[`--w4a-${r}`]).toBe(`var(--mat-sys-${r})`);
    }
  });

  it('defines all chart tokens outside any accent class', () => {
    for (const k of ['weight', 'mood', 'sleep']) expect(root[`--w4a-chart-${k}`]).toMatch(/^#[0-9a-f]{6}$/);
    for (const id of ACCENTS)
      expect(Object.keys(tokensOf(`.theme-${id}`)).filter((k) => k.startsWith('--w4a-chart-'))).toEqual([]);
  });

  it('derives the violet theme from the #5A46D6 seed palette', () => {
    expect(tokensOf('.theme-violet')['--mat-sys-primary']).toBe('#5945d5');
  });

  it('keeps chart tokens only on :root', () => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      if (/--w4a-chart-/.test(m[2])) expect(m[1].trim()).toBe(':root');
  });

  describe('mood face scale', () => {
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const fill = (n: number) => root[`--w4a-mood-${n}-fill`];
    const stroke = (n: number) => root[`--w4a-mood-${n}-stroke`];

    it('defines a distinct fill and a stroke per level, on :root only', () => {
      for (const n of levels) {
        expect(fill(n)).toMatch(/^#[0-9a-f]{6}$/);
        expect(stroke(n)).toMatch(/^#[0-9a-f]{6}$/);
      }
      expect(new Set(levels.map(fill)).size).toBe(10);
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
        if (/--w4a-mood-/.test(m[2])) expect(m[1].trim()).toBe(':root');
      expect(root['--w4a-mood-face-fill']).toBeUndefined();
      expect(root['--w4a-mood-face-stroke']).toBeUndefined();
    });

    it('defines every token that faceColours(n) refers to', () => {
      const name = (value: string) => /^var\((--[\w-]+)\)$/.exec(value)![1];
      for (const n of levels) {
        const { fill: f, stroke: s } = faceColours(n);
        expect(root[name(f)]).toBeDefined();
        expect(root[name(s)]).toBeDefined();
      }
    });

    it('leaves no use of the old single-colour tokens under src/', () => {
      const files = readdirSync(join(ROOT, 'src'), { recursive: true, withFileTypes: true }).filter((e) => e.isFile());
      const hits = files
        .map((e) => join(e.parentPath, e.name))
        .filter((p) => readFileSync(p, 'utf8').includes('--w4a-mood-face-'));
      expect(hits).toEqual([]);
    });

    it.each(levels)('level %i: outline and features are at least 3:1 on the fill', (n) => {
      expect(contrast(stroke(n), fill(n))).toBeGreaterThanOrEqual(3);
    });
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

  describe.each([...ACCENTS])('contrast for %s', (id) => {
    const t = tokensOf(`.theme-${id}`);
    const sys = (n: string) => t[`--mat-sys-${n}`];
    it.each(TEXT_PAIRS)('text %s on %s is at least 4.5:1', (fg, bg) => {
      expect(contrast(sys(fg), sys(bg))).toBeGreaterThanOrEqual(4.5);
    });
    it('graphic primary on surface is at least 3:1', () => {
      expect(contrast(sys('primary'), sys('surface'))).toBeGreaterThanOrEqual(3);
    });
    it('white check on the seed is at least 3:1', () => {
      expect(contrast('#ffffff', root[`--w4a-accent-${id}`])).toBeGreaterThanOrEqual(3);
    });
    it('seed on surface-container is at least 3:1', () => {
      expect(contrast(root[`--w4a-accent-${id}`], sys('surface-container'))).toBeGreaterThanOrEqual(3);
    });
    it.each(ROOT_TEXT_PAIRS)('text %s on %s is at least 4.5:1', (fg, bg) => {
      expect(contrast(root[`--w4a-${fg}`], root[`--w4a-${bg}`])).toBeGreaterThanOrEqual(4.5);
    });
    it.each(CHART_PAIRS)('graphic %s on %s is at least 3:1', (fg, bg) => {
      expect(contrast(root[`--w4a-${fg}`], root[`--w4a-${bg}`])).toBeGreaterThanOrEqual(3);
    });
  });
});
