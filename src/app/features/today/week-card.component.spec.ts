import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ClockService } from '../../core/state/clock.service';
import { addDays } from '../../domain/day';
import { Entry } from '../../domain/entry';
import { Language } from '../../domain/language';
import { WeekCardComponent } from './week-card.component';

const TODAY = '2025-10-18';

describe('WeekCardComponent', () => {
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let language: ReturnType<typeof signal<Language>>;

  beforeEach(async () => {
    entries = signal<Readonly<Record<string, Entry>>>({});
    language = signal<Language>('en');
    await TestBed.configureTestingModule({
      imports: [WeekCardComponent],
      providers: [
        { provide: EntryStore, useValue: { entries } },
        { provide: PreferencesStore, useValue: { language } },
        { provide: ClockService, useValue: { today: signal(TODAY) } },
      ],
    }).compileComponents();
  });

  const entry = (day: string, weight: number): Entry => ({ day, values: { weight } });
  const all = (list: Entry[]) => Object.fromEntries(list.map((e) => [e.day, e]));

  async function setup() {
    const fixture = TestBed.createComponent(WeekCardComponent);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the count, filled dots and the average of the 6 logged Days', async () => {
    // 12 Oct is left empty; the other six Days of the week have an Entry.
    entries.set(all([13, 14, 15, 16, 17, 18].map((d, i) => entry(`2025-10-${d}`, 72 + i))));
    const { el } = await setup();
    expect(el.textContent).toContain('This week');
    expect(el.textContent).toContain('12 Oct – 18 Oct');
    expect(el.textContent).toContain('6 of 7 days logged');
    expect(el.querySelectorAll('.dot.logged').length).toBe(6);
    expect(el.querySelectorAll('.dot.logged svg').length).toBe(6);
    expect(el.querySelectorAll('.dot').length).toBe(7);
    expect(el.textContent).toContain('Avg weight');
    expect(el.textContent).toContain('74.5 kg');
    expect(el.querySelector('section')!.getAttribute('aria-label')).toBeTruthy();
  });

  it('reads 0 of 7 and No data, never 0, when only older Entries exist', async () => {
    entries.set(all([entry(addDays(TODAY, -7), 80)]));
    const { el } = await setup();
    expect(el.textContent).toContain('0 of 7 days logged');
    expect(el.textContent).toContain('No data');
    expect(el.textContent).not.toMatch(/\b0(\.0)? kg/);
    expect(el.querySelectorAll('.dot.logged').length).toBe(0);
  });

  it('shows No data for an empty store', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('No data');
  });

  it('ignores a future-dated Entry', async () => {
    entries.set(all([entry(TODAY, 70), entry(addDays(TODAY, 1), 99)]));
    const { el } = await setup();
    expect(el.textContent).toContain('1 of 7 days logged');
    expect(el.textContent).toContain('70.0 kg');
    expect(el.textContent).not.toContain('99');
  });

  it('updates when an Entry is saved, edited or deleted', async () => {
    const { fixture, el } = await setup();
    entries.set(all([entry(TODAY, 70)]));
    await fixture.whenStable();
    expect(el.textContent).toContain('1 of 7 days logged');
    entries.set(all([entry(TODAY, 71)]));
    await fixture.whenStable();
    expect(el.textContent).toContain('71.0 kg');
    entries.set({});
    await fixture.whenStable();
    expect(el.textContent).toContain('0 of 7 days logged');
  });

  it('speaks Italian with comma decimals', async () => {
    language.set('it');
    entries.set(all([entry(TODAY, 72.5), entry(addDays(TODAY, -1), 72)]));
    const { el } = await setup();
    expect(el.textContent).toContain('Questa settimana');
    expect(el.textContent).toContain('2 giorni su 7 registrati');
    expect(el.textContent).toContain('Peso medio');
    expect(el.textContent).toContain('72,3 kg');
  });

  it('shows Nessun dato in Italian', async () => {
    language.set('it');
    const { el } = await setup();
    expect(el.textContent).toContain('Nessun dato');
  });

  it('labels the 7 dots with the weekday initials in each Language', async () => {
    const { fixture, el } = await setup();
    const initials = () => Array.from(el.querySelectorAll('.initial')).map((n) => n.textContent?.trim());
    expect(initials()).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    language.set('it');
    fixture.detectChanges();
    expect(initials()).toEqual(['D', 'L', 'M', 'M', 'G', 'V', 'S']);
  });

  it('averages Mood and Sleep from Real values only, and reads No data when there are none', async () => {
    entries.set(
      all([
        { day: TODAY, values: { weight: 72, mood: 8, sleep: 7 } },
        { day: addDays(TODAY, -1), values: { weight: 73, mood: 6 } },
        { day: addDays(TODAY, -2), values: { weight: 74 } },
      ]),
    );
    const { el, fixture } = await setup();
    const stats = Array.from(el.querySelectorAll('.stat')).map((s) => s.textContent!.replace(/\s+/g, ' ').trim());
    expect(stats).toEqual(['Avg weight73.0 kg', 'Avg mood7.0', 'Avg sleep7.0 h']);
    entries.set(all([entry(TODAY, 72)]));
    await fixture.whenStable();
    expect(el.textContent!.match(/No data/g)).toHaveLength(2);
  });

  it('writes the Sleep average with the decimal comma in Italian', async () => {
    language.set('it');
    entries.set(all([{ day: TODAY, values: { weight: 72, sleep: 7.5 } }]));
    const { el } = await setup();
    expect(el.textContent).toContain('7,5 h');
  });
});
