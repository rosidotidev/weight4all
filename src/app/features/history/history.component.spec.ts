import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntryStatus, EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ClockService } from '../../core/state/clock.service';
import { addDays } from '../../domain/day';
import { Entry } from '../../domain/entry';
import { Language } from '../../domain/language';
import { HistoryComponent } from './history.component';

const TODAY = '2026-10-20';
const entry = (day: string, weight?: number): Entry => ({
  day,
  values: weight === undefined ? {} : { weight },
});
const byDay = (...list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));

describe('HistoryComponent', () => {
  let status: ReturnType<typeof signal<EntryStatus>>;
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let language: ReturnType<typeof signal<Language>>;
  let retry: ReturnType<typeof vi.fn<() => Promise<void>>>;

  beforeEach(async () => {
    status = signal<EntryStatus>('ready');
    entries = signal<Readonly<Record<string, Entry>>>({});
    language = signal<Language>('en');
    retry = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideRouter([]),
        { provide: EntryStore, useValue: { status, entries, retry } },
        { provide: PreferencesStore, useValue: { language } },
        { provide: ClockService, useValue: { today: signal(TODAY) } },
      ],
    }).compileComponents();
    // jsdom has no layout: give the virtual viewport a 700 px height.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 390,
      height: 700,
      top: 0,
      left: 0,
      right: 390,
      bottom: 700,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup() {
    const fixture = TestBed.createComponent(HistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lists Entries newest first with the date and weight', async () => {
    entries.set(byDay(entry('2026-10-18', 72.7), entry('2026-10-19', 72.4)));
    const { el } = await setup();
    const rows = Array.from(el.querySelectorAll('.row'));
    expect(rows.map((r) => r.querySelector('.date')?.textContent)).toEqual(['Mon 19 Oct', 'Sun 18 Oct']);
    expect(rows[0].querySelector('.value')?.textContent).toBe('72.4 kg');
    expect(el.querySelector('.heading')?.textContent).toContain('Entries · newest first');
  });

  it('shows a dashed missing row with a + Add link to the Day', async () => {
    entries.set(byDay(entry('2026-10-12', 70), entry('2026-10-14', 71)));
    const { el } = await setup();
    const missing = el.querySelector('.row.missing')!;
    expect(missing.textContent).toContain('Tue 13 Oct — no entry');
    const add = missing.querySelector('a.add')!;
    expect(add.textContent).toContain('+ Add');
    expect(add.getAttribute('href')).toBe('/history/2026-10-13');
    expect(add.getAttribute('aria-label')).toBe('Add entry for Tue 13 Oct');
  });

  it('links an Entry row to its Day with an accessible name', async () => {
    entries.set(byDay(entry('2026-10-19', 72.4)));
    const { el } = await setup();
    const link = el.querySelector('a.row')!;
    expect(link.getAttribute('href')).toBe('/history/2026-10-19');
    expect(link.getAttribute('aria-label')).toContain('Mon 19 Oct');
  });

  it('shows an em dash, never 0, for an absent value', async () => {
    entries.set(byDay(entry('2026-10-19')));
    const { el } = await setup();
    const value = el.querySelector('.value')!;
    expect(value.textContent).toBe('—');
    expect(value.classList).toContain('absent');
    expect(el.textContent).not.toContain('0 kg');
  });

  it('hides future Entries and adds no rows after the last Entry', async () => {
    entries.set(byDay(entry('2026-10-18', 72), entry(addDays(TODAY, 3), 70)));
    const { el } = await setup();
    expect(el.querySelectorAll('.row')).toHaveLength(1);
    expect(el.querySelector('.missing')).toBeNull();
  });

  it('renders only the visible rows of a year of Entries', async () => {
    const list: Entry[] = [];
    for (let i = 0; i < 365; i++) list.push(entry(addDays(TODAY, -i), 70));
    entries.set(byDay(...list));
    const { el } = await setup();
    const rendered = el.querySelectorAll('.row').length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
  });

  it('shows the empty message when ready with no Entries', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Nothing here yet. Your first log starts on Today.');
    expect(el.querySelector('.heading')).toBeNull();
  });

  it('shows a skeleton and a polite status while loading', async () => {
    status.set('loading');
    const { el } = await setup();
    const note = el.querySelector('[role="status"]')!;
    expect(note.getAttribute('aria-live')).toBe('polite');
    expect(note.textContent).toContain('Loading your days');
    el.querySelectorAll('.skeleton .row').forEach((r) => expect(r.getAttribute('aria-hidden')).toBe('true'));
    expect(el.textContent).not.toContain('Nothing here yet');
  });

  it('shows the message and Retry on error, and Retry reloads', async () => {
    status.set('error');
    const { el } = await setup();
    expect(el.textContent).toContain('We could not load your days');
    el.querySelector('button')!.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps existing rows below the load error', async () => {
    entries.set(byDay(entry('2026-10-19', 72.4)));
    status.set('error');
    const { el } = await setup();
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.querySelector('.row .date')?.textContent).toBe('Mon 19 Oct');
  });

  it('uses Italian copy, comma decimals and Italian dates', async () => {
    language.set('it');
    entries.set(byDay(entry('2026-10-12', 70), entry('2026-10-14', 72.4)));
    const { el } = await setup();
    expect(el.querySelector('.heading')?.textContent).toContain('Registrazioni · dalla più recente');
    expect(el.querySelector('.value')?.textContent).toBe('72,4 kg');
    expect(el.querySelector('.missing')?.textContent).toContain('nessuna registrazione');
    expect(el.querySelector('.add')?.textContent).toContain('+ Aggiungi');
  });
});
