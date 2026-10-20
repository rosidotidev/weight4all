import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// AD-10: no color literals in components. Literals live only in src/styles/ (tokens and theme).
const SRC = join(process.cwd(), 'src');
const ALLOWED_DIR = 'src/styles/';

const NAMED = [
  'red', 'green', 'blue', 'black', 'white', 'gray', 'grey', 'orange', 'purple', 'violet', 'pink',
  'yellow', 'teal', 'magenta', 'cyan', 'brown', 'navy', 'gold', 'silver', 'lime', 'maroon', 'olive',
  'indigo', 'coral', 'crimson', 'salmon', 'tomato', 'turquoise', 'lavender', 'beige', 'aqua',
].join('|');

const FUNCTIONAL = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
const HEX = /(?:^|[\s:(,'"`])#[0-9a-fA-F]{3,8}\b/;
// style files: a named color used as a value, e.g. `color: red` or `border: 1px solid white`
const NAMED_STYLE_VALUE = new RegExp(`:\\s*(?:[^;{}]*\\s)?(?:${NAMED})\\b(?![-\\w(])`, 'i');
// html/ts: a named color assigned to a color-like property
const NAMED_PROP_VALUE = new RegExp(
  `(?:color|background|fill|stroke|border)[\\w-]*\\s*[:=]\\s*["']?[^;"'}]*\\b(?:${NAMED})\\b(?![-\\w(])`,
  'i',
);

function stripComments(path: string, content: string): string {
  let text = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  if (!path.endsWith('.html') && !path.endsWith('.css')) text = text.replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  return text;
}

export function findColorLiterals(path: string, content: string): string[] {
  const isStyle = /\.(scss|css)$/.test(path);
  const found: string[] = [];
  for (const line of stripComments(path, content).split('\n')) {
    if (
      FUNCTIONAL.test(line) ||
      HEX.test(line) ||
      (isStyle ? NAMED_STYLE_VALUE.test(line) : NAMED_PROP_VALUE.test(line))
    )
      found.push(line.trim());
  }
  return found;
}

export function scan(files: { path: string; content: string }[]): string[] {
  const problems: string[] = [];
  for (const { path, content } of files) {
    if (path.startsWith(ALLOWED_DIR)) continue;
    for (const line of findColorLiterals(path, content))
      problems.push(`${path}: color literal in "${line}" (use a --w4a-* token)`);
  }
  return problems;
}

function realFiles(): { path: string; content: string }[] {
  return (readdirSync(SRC, { recursive: true }) as string[])
    .filter((f) => /\.(scss|css|html|ts)$/.test(f))
    .map((f) => join(SRC, f))
    .map((p) => ({ path: relative(process.cwd(), p).replaceAll('\\', '/'), content: readFileSync(p, 'utf8') }));
}

describe('color literal scan', () => {
  it('flags a hex color in a component scss and names the file', () => {
    const problems = scan([{ path: 'src/app/x.scss', content: '.a { color: #5a46d6; }' }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('src/app/x.scss');
  });

  it('flags rgb(), hsl() and named colors', () => {
    expect(scan([{ path: 'src/app/a.scss', content: '.a { background: rgb(1, 2, 3); }' }])).toHaveLength(1);
    expect(scan([{ path: 'src/app/a.scss', content: '.a { background: hsl(1 2% 3%); }' }])).toHaveLength(1);
    expect(scan([{ path: 'src/app/a.scss', content: '.a { color: red; }' }])).toHaveLength(1);
    expect(scan([{ path: 'src/app/a.scss', content: '.a { border: 1px solid white; }' }])).toHaveLength(1);
  });

  it('flags literals in templates and TypeScript', () => {
    expect(scan([{ path: 'src/app/a.html', content: '<p style="color: #fff">x</p>' }])).toHaveLength(1);
    expect(scan([{ path: 'src/app/a.html', content: '<p style="color: red">x</p>' }])).toHaveLength(1);
    expect(scan([{ path: 'src/app/a.ts', content: "const c = '#2f5bd8';" }])).toHaveLength(1);
    expect(scan([{ path: 'src/app/a.ts', content: "const c = 'rgb(0,0,0)';" }])).toHaveLength(1);
  });

  it('allows token usage and literals in the token and theme files', () => {
    expect(scan([{ path: 'src/app/a.scss', content: '.a { color: var(--w4a-primary); }' }])).toEqual([]);
    expect(scan([{ path: 'src/styles/_tokens.scss', content: ':root { --w4a-primary: #5a46d6; }' }])).toEqual([]);
    expect(scan([{ path: 'src/styles/_theme.scss', content: '.t { color: red; }' }])).toEqual([]);
  });

  it('finds no color literal in the real src tree', () => {
    expect(scan(realFiles())).toEqual([]);
  });
});
