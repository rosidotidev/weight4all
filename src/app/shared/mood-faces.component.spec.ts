import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from '../core/data/preferences.store';
import { LayoutService } from '../core/state/layout.service';
import { Language } from '../domain/language';
import { WindowClass } from '../domain/window-class';
import { MoodFacesComponent } from './mood-faces.component';

describe('MoodFacesComponent', () => {
  let language: ReturnType<typeof signal<Language>>;
  let windowClass: ReturnType<typeof signal<WindowClass>>;

  beforeEach(async () => {
    language = signal<Language>('en');
    windowClass = signal<WindowClass>('compact');
    await TestBed.configureTestingModule({
      imports: [MoodFacesComponent],
      providers: [
        { provide: PreferencesStore, useValue: { language } },
        { provide: LayoutService, useValue: { windowClass } },
      ],
    }).compileComponents();
  });

  afterEach(() => document.body.replaceChildren());

  async function setup(value: number | null = null) {
    const fixture = TestBed.createComponent(MoodFacesComponent);
    fixture.componentRef.setInput('labelledBy', 'label');
    fixture.componentRef.setInput('value', value);
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    const faces = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    return { fixture, el, faces, changed };
  }

  it('draws ten distinct faces with numbers, names and radio semantics', async () => {
    const { el, faces } = await setup(7);
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute('aria-labelledby')).toBe('label');
    expect(faces()).toHaveLength(10);
    expect(faces().map((face) => face.textContent?.trim())).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    ]);
    expect(faces()[0].getAttribute('aria-label')).toBe('Mood 1 of 10');
    const mouths = new Set(Array.from(el.querySelectorAll('.mouth')).map((m) => m.getAttribute('d')));
    expect(mouths.size).toBe(10);
    expect(faces().map((face) => face.getAttribute('aria-checked'))).toEqual([
      'false', 'false', 'false', 'false', 'false', 'false', 'true', 'false', 'false', 'false',
    ]);
    expect(el.querySelectorAll('.ring')).toHaveLength(1);
  });

  it('emits the tapped level, and null when the selected face is tapped', async () => {
    const { faces, changed } = await setup(7);
    faces()[2].click();
    expect(changed).toHaveBeenLastCalledWith(3);
    faces()[6].click();
    expect(changed).toHaveBeenLastCalledWith(null);
  });

  it('makes the selected face the tab stop, else the first', async () => {
    const none = await setup(null);
    expect(none.faces().map((face) => face.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
    document.body.replaceChildren();
    const some = await setup(4);
    expect(some.faces().map((face) => face.tabIndex)).toEqual([-1, -1, -1, 0, -1, -1, -1, -1, -1, -1]);
  });

  it('moves focus with the arrow keys', async () => {
    const { faces } = await setup(null);
    faces()[0].focus();
    faces()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(faces()[1]);
    faces()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(faces()[0]);
    faces()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(faces()[0]);
  });

  it('lays out in one row from medium up', async () => {
    const { el, fixture } = await setup();
    expect(el.classList.contains('wide')).toBe(false);
    windowClass.set('medium');
    await fixture.whenStable();
    expect(el.classList.contains('wide')).toBe(true);
  });

  it('speaks Italian', async () => {
    language.set('it');
    const { faces } = await setup();
    expect(faces()[6].getAttribute('aria-label')).toBe('Umore 7 su 10');
  });
});
