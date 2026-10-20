import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ClockService } from '../../core/state/clock.service';
import { Entry } from '../../domain/entry';
import { Language } from '../../domain/language';
import { RecentEntriesComponent } from './recent-entries.component';

describe('RecentEntriesComponent', () => {
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let language: ReturnType<typeof signal<Language>>;

  beforeEach(async () => {
    entries = signal<Readonly<Record<string, Entry>>>({});
    language = signal<Language>('en');
    await TestBed.configureTestingModule({
      imports: [RecentEntriesComponent],
      providers: [
        { provide: EntryStore, useValue: { entries } },
        { provide: PreferencesStore, useValue: { language } },
        { provide: ClockService, useValue: { today: signal('2025-10-18') } },
      ],
    }).compileComponents();
  });

  async function setup() {
    const fixture = TestBed.createComponent(RecentEntriesComponent);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the empty hint when there are no Entries', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Last entries · newest first');
    expect(el.textContent).toContain('Nothing logged yet.');
    expect(el.querySelectorAll('.row').length).toBe(0);
  });

  it('shows only the 5 newest Entries, newest first, as non-interactive rows', async () => {
    const list: Record<string, Entry> = {};
    for (let d = 1; d <= 7; d++) {
      const day = `2025-10-0${d}`;
      list[day] = { day, values: { weight: 70 + d } };
    }
    entries.set(list);
    const { el } = await setup();
    const rows = Array.from(el.querySelectorAll('.row'));
    expect(rows.length).toBe(5);
    expect(rows[0].textContent).toContain('77.0 kg');
    expect(rows[4].textContent).toContain('73.0 kg');
    expect(el.querySelector('a, button')).toBeNull();
  });

  it('shows an em dash for an absent value, never 0', async () => {
    entries.set({ '2025-10-01': { day: '2025-10-01', values: {} } });
    const { el } = await setup();
    const cell = el.querySelector('.row .value')!;
    expect(cell.textContent!.trim()).toBe('—');
    expect(el.textContent).not.toContain('0.0');
  });

  it('updates when the store changes and formats in Italian', async () => {
    language.set('it');
    const { fixture, el } = await setup();
    entries.set({ '2025-10-01': { day: '2025-10-01', values: { weight: 72.5 } } });
    await fixture.whenStable();
    expect(el.textContent).toContain('72,5 kg');
    expect(el.textContent).toContain('Ultime registrazioni');
  });

  it('leaves out an Entry dated after today', async () => {
    entries.set({
      '2025-10-19': { day: '2025-10-19', values: { weight: 99 } },
      '2025-10-18': { day: '2025-10-18', values: { weight: 71 } },
    });
    const { el } = await setup();
    const rows = Array.from(el.querySelectorAll('.row'));
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('71.0 kg');
  });
});
