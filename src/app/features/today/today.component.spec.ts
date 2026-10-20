import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntryStatus, EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { dayKey } from '../../domain/day';
import { Entry } from '../../domain/entry';
import { Language } from '../../domain/language';
import { TodayComponent } from './today.component';

describe('TodayComponent', () => {
  let status: ReturnType<typeof signal<EntryStatus>>;
  let retry: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let language: ReturnType<typeof signal<Language>>;
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;

  beforeEach(async () => {
    status = signal<EntryStatus>('loading');
    retry = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    language = signal<Language>('en');
    entries = signal<Readonly<Record<string, Entry>>>({});
    await TestBed.configureTestingModule({
      imports: [TodayComponent],
      providers: [
        { provide: EntryStore, useValue: { status, retry, entries, save: vi.fn() } },
        { provide: PreferencesStore, useValue: { language } },
      ],
    }).compileComponents();
  });

  async function setup() {
    const fixture = TestBed.createComponent(TodayComponent);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows a skeleton with hidden shapes and a polite loading text while loading', async () => {
    const { el } = await setup();
    const shapes = el.querySelectorAll('.card');
    expect(shapes.length).toBeGreaterThan(0);
    shapes.forEach((s) => expect(s.getAttribute('aria-hidden')).toBe('true'));
    const status = el.querySelector('[role="status"]')!;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Loading your days');
    expect(el.querySelector('button')).toBeNull();
  });

  it('shows the message and Retry on error, and Retry reloads', async () => {
    status.set('error');
    const { el } = await setup();
    expect(el.textContent).toContain('We could not load your days');
    expect(el.querySelector('.skeleton')).toBeNull();
    const button = el.querySelector('button')!;
    expect(button.textContent).toContain('Try again');
    button.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('binds the form to today, not to another Day', async () => {
    const today = dayKey(new Date());
    entries.set({
      '2000-01-01': { day: '2000-01-01', values: { weight: 60 } },
      [today]: { day: today, values: { weight: 71.5 } },
    });
    status.set('ready');
    const { el } = await setup();
    expect(el.querySelector('input')!.value).toBe('71.5');
  });

  it('shows the entry form for today when ready', async () => {
    status.set('ready');
    const { el } = await setup();
    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.querySelector('w4a-entry-form')).not.toBeNull();
    expect(el.querySelector('input')).not.toBeNull();
    expect(el.querySelector('button[type="submit"]')!.textContent).toContain('Save');
  });

  it('shows no form while loading or on error', async () => {
    const { fixture, el } = await setup();
    expect(el.querySelector('w4a-entry-form')).toBeNull();
    status.set('error');
    await fixture.whenStable();
    expect(el.querySelector('w4a-entry-form')).toBeNull();
  });

  it('follows state changes and the Language', async () => {
    const { fixture, el } = await setup();
    status.set('error');
    language.set('it');
    await fixture.whenStable();
    expect(el.textContent).toContain('Non siamo riusciti a caricare i tuoi giorni');
    expect(el.querySelector('button')!.textContent).toContain('Riprova');
  });
});
