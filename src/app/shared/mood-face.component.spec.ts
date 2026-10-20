import { TestBed } from '@angular/core/testing';
import { MoodFaceComponent, mouthPath } from './mood-face.component';

describe('MoodFaceComponent', () => {
  it('draws a decorative face whose mouth follows the level', async () => {
    const fixture = TestBed.createComponent(MoodFaceComponent);
    fixture.componentRef.setInput('level', 3);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.mouth')!.getAttribute('d')).toBe(mouthPath(3));
    expect(mouthPath(1)).not.toBe(mouthPath(10));
  });
});
