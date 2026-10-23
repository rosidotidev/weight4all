import { TestBed } from '@angular/core/testing';
import { MoodFaceComponent, faceColours, mouthPath } from './mood-face.component';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** The mouth's control point y, from `M.. Q<x> <y> ..`. */
function controlY(n: number): number {
  return Number(/Q\S+ (\S+)/.exec(mouthPath(n))![1]);
}

describe('mouthPath', () => {
  it('keeps every mouth gentle: 23.9 (light frown) to 39.1 (light smile)', () => {
    expect(controlY(1)).toBe(23.9);
    expect(controlY(10)).toBe(39.1);
    for (const n of LEVELS) {
      expect(controlY(n)).toBeGreaterThanOrEqual(23.9);
      expect(controlY(n)).toBeLessThanOrEqual(39.1);
    }
  });

  it('mirrors frown and smile around the flat mouth (31.5)', () => {
    for (const n of LEVELS) expect(Math.abs(controlY(n) - 31.5)).toBeCloseTo(Math.abs(controlY(11 - n) - 31.5), 5);
  });

  it('rises step by step from 1 to 10, flat around the middle', () => {
    const ys = LEVELS.map(controlY);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1]);
    expect(controlY(5)).toBeLessThan(31.5);
    expect(controlY(6)).toBeGreaterThan(31.5);
  });
});

describe('faceColours', () => {
  it('gives each level its own fill and stroke token', () => {
    const fills = LEVELS.map((n) => faceColours(n).fill);
    expect(new Set(fills).size).toBe(10);
    expect(faceColours(1)).toEqual({ fill: 'var(--w4a-mood-1-fill)', stroke: 'var(--w4a-mood-1-stroke)' });
    expect(faceColours(10)).toEqual({ fill: 'var(--w4a-mood-10-fill)', stroke: 'var(--w4a-mood-10-stroke)' });
  });
});

describe('MoodFaceComponent', () => {
  it('draws a decorative face whose mouth and colours follow the level', async () => {
    const fixture = TestBed.createComponent(MoodFaceComponent);
    fixture.componentRef.setInput('level', 3);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.mouth')!.getAttribute('d')).toBe(mouthPath(3));
    expect(svg.style.getPropertyValue('--w4a-face-fill')).toBe(faceColours(3).fill);
    expect(svg.style.getPropertyValue('--w4a-face-stroke')).toBe(faceColours(3).stroke);
  });
});
