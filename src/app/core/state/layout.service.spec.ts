import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

class FakeQuery {
  listeners = new Set<() => void>();
  constructor(
    private readonly minWidth: number,
    private readonly env: { width: number },
  ) {}
  get matches() {
    return this.env.width >= this.minWidth;
  }
  addEventListener(_: string, fn: () => void) {
    this.listeners.add(fn);
  }
  removeEventListener(_: string, fn: () => void) {
    this.listeners.delete(fn);
  }
}

describe('LayoutService', () => {
  const env = { width: 360 };
  let queries: FakeQuery[];
  const original = window.matchMedia;

  function resize(width: number) {
    env.width = width;
    queries.forEach((q) => q.listeners.forEach((fn) => fn()));
  }

  beforeEach(() => {
    queries = [];
    window.matchMedia = ((query: string) => {
      const q = new FakeQuery(Number(/min-width:\s*(\d+)px/.exec(query)![1]), env);
      queries.push(q);
      return q;
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = original;
  });

  it.each([
    [599, 'compact'],
    [600, 'medium'],
    [839, 'medium'],
    [840, 'expanded'],
  ] as const)('starts at width %i as %s', (width, expected) => {
    env.width = width;
    expect(TestBed.inject(LayoutService).windowClass()).toBe(expected);
  });

  it('updates when the window crosses a boundary', () => {
    env.width = 360;
    const layout = TestBed.inject(LayoutService);
    expect(layout.windowClass()).toBe('compact');
    resize(700);
    expect(layout.windowClass()).toBe('medium');
    resize(1000);
    expect(layout.windowClass()).toBe('expanded');
    resize(500);
    expect(layout.windowClass()).toBe('compact');
  });

  it('removes its listeners on destroy', () => {
    env.width = 360;
    TestBed.inject(LayoutService);
    expect(queries.every((q) => q.listeners.size === 1)).toBe(true);
    TestBed.resetTestingModule();
    expect(queries.every((q) => q.listeners.size === 0)).toBe(true);
  });
});
