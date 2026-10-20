import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from '../core/data/preferences.store';
import { DIMENSIONS } from '../domain/dimensions';
import { Language } from '../domain/language';
import { SleepSliderComponent } from './sleep-slider.component';

describe('SleepSliderComponent', () => {
  let language: ReturnType<typeof signal<Language>>;

  beforeEach(async () => {
    language = signal<Language>('en');
    await TestBed.configureTestingModule({
      imports: [SleepSliderComponent],
      providers: [{ provide: PreferencesStore, useValue: { language } }],
    }).compileComponents();
  });

  async function setup(value: number | null) {
    const fixture = TestBed.createComponent(SleepSliderComponent);
    fixture.componentRef.setInput('dimension', DIMENSIONS[2]);
    fixture.componentRef.setInput('labelledBy', 'label');
    fixture.componentRef.setInput('value', value);
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const range = el.querySelector<HTMLInputElement>('input[type="range"]')!;
    return { fixture, el, range, changed };
  }

  it('is a 0 to 24 slider in half-hour steps with the value as text', async () => {
    const { range } = await setup(7.5);
    expect([range.min, range.max, range.step, range.value]).toEqual(['0', '24', '0.5', '7.5']);
    expect(range.getAttribute('aria-valuetext')).toBe('7.5 hours');
  });

  it('emits the new number when moved', async () => {
    const { range, changed } = await setup(6);
    range.value = '7';
    range.dispatchEvent(new Event('input'));
    expect(changed).toHaveBeenCalledWith(7);
  });

  it('emits null from the clear button, named in the Language', async () => {
    const { el, changed, fixture } = await setup(6);
    el.querySelector<HTMLButtonElement>('button')!.click();
    expect(changed).toHaveBeenCalledWith(null);
    language.set('it');
    await fixture.whenStable();
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Cancella sonno');
  });

  it('reads "No sleep value", keeps the handle at 6 and sets 6 when touched while cleared', async () => {
    const { el, range, changed } = await setup(null);
    expect(range.getAttribute('aria-valuetext')).toBe('No sleep value');
    expect(range.value).toBe('6');
    expect(el.classList.contains('cleared')).toBe(true);
    range.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
    expect(changed).toHaveBeenCalledWith(6);
  });

  it('ignores a right-click, and sets the shown value on the first arrow key while cleared', async () => {
    const { range, changed } = await setup(null);
    range.dispatchEvent(new PointerEvent('pointerdown', { button: 2 }));
    expect(changed).not.toHaveBeenCalled();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    range.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(changed).toHaveBeenCalledWith(6);
  });

  it('does not re-emit on touch when a value is set', async () => {
    const { range, changed } = await setup(8);
    range.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
    expect(changed).not.toHaveBeenCalled();
  });
});
