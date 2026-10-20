import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// AD-13f: no literal user-visible text in templates. Attribute values (class, id, role, ...)
// and bound expressions such as `{{ t().key }}` are allowed.
const SRC = join(process.cwd(), 'src');

const CONTROL_FLOW =
  /@(?:else\s+if|if|else|for|switch|case|default|empty|defer|placeholder|loading|error)\b[^{]*\{/g;

export function findLiteralText(template: string): string[] {
  const text = template
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?[a-zA-Z][^\s>/]*(?:"[^"]*"|'[^']*'|[^>"'])*>/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/@let\s[^;]*;/g, ' ')
    .replace(CONTROL_FLOW, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/&nbsp;/g, ' ');
  return text
    .split(/\s{2,}|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inlineTemplates(source: string): string[] {
  const out: string[] = [];
  const re = /\btemplate\s*:\s*(?:`([^`]*)`|'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
  for (const m of source.matchAll(re)) out.push(m[1] ?? m[2] ?? m[3] ?? '');
  return out;
}

export function scan(files: { path: string; content: string }[]): string[] {
  const problems: string[] = [];
  for (const { path, content } of files) {
    const templates = path.endsWith('.html') ? [content] : inlineTemplates(content);
    for (const template of templates)
      for (const text of findLiteralText(template))
        problems.push(`${path}: literal text "${text}" (use a strings.ts key)`);
  }
  return problems;
}

function realFiles(): { path: string; content: string }[] {
  return (readdirSync(SRC, { recursive: true }) as string[])
    // index.html is the document shell, not a component template
    .filter((f) => /\.(html|ts)$/.test(f) && f !== 'index.html')
    .map((f) => join(SRC, f))
    .map((p) => ({ path: relative(process.cwd(), p).replaceAll('\\', '/'), content: readFileSync(p, 'utf8') }));
}

describe('template text scan', () => {
  it('flags literal text in an html template and names the file', () => {
    const problems = scan([{ path: 'src/app/x.html', content: '<p>Hello</p>' }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('src/app/x.html');
    expect(problems[0]).toContain('Hello');
  });

  it('flags literal text in an inline template', () => {
    const content = "@Component({ template: `<div class=\"a\">Hello <b>{{ t().x }}</b></div>` }) class A {}";
    const problems = scan([{ path: 'src/app/a.component.ts', content }]);
    expect(problems.join()).toContain('src/app/a.component.ts');
    expect(problems.join()).toContain('Hello');
  });

  it('flags text inside control flow blocks', () => {
    const html = '@if (ok()) { <span>Nope</span> } @else { <span>{{ t().a }}</span> }';
    expect(findLiteralText(html)).toEqual(['Nope']);
  });

  it('allows attributes, bindings, keys and control flow', () => {
    const html = `
      @if (a() > 1) {
        <div class="card" id="x" role="note" aria-label="fixed" [title]="t().saved">{{ t().saved }}</div>
      } @else {
        <input (input)="a.set(1 > 0 ? 1 : 2)" />
      }
      @for (i of items(); track i) { <li>{{ i }}</li> }
      <!-- a comment -->
      <router-outlet />`;
    expect(findLiteralText(html)).toEqual([]);
    expect(scan([{ path: 'a.html', content: html }])).toEqual([]);
  });

  it('finds no literal text in the real src tree', () => {
    expect(scan(realFiles())).toEqual([]);
  });
});
