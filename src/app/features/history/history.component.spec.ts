import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EntryResult, EntryStatus, EntryStore } from '../../core/data/entry.store';
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
  let remove: ReturnType<typeof vi.fn<(day: string) => Promise<EntryResult>>>;

  beforeEach(async () => {
    status = signal<EntryStatus>('ready');
    entries = signal<Readonly<Record<string, Entry>>>({});
    language = signal<Language>('en');
    retry = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    remove = vi.fn<(day: string) => Promise<EntryResult>>().mockImplementation(async (day) => {
      entries.update((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== day)));
      return { ok: true };
    });
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideRouter([]),
        { provide: EntryStore, useValue: { status, entries, retry, remove } },
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

  describe('edit entry points', () => {
    let navigate: ReturnType<typeof vi.spyOn>;
    const firstItem = (el: HTMLElement) => el.querySelector('.item')!;
    const slide = (el: HTMLElement) => el.querySelector<HTMLElement>('.slide')!;

    function touch(type: string, x: number, y = 0, target?: Element) {
      const event = new Event(type, { bubbles: true });
      Object.assign(event, { pointerType: 'touch', clientX: x, clientY: y });
      target?.dispatchEvent(event);
    }

    beforeEach(() => {
      navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      entries.set(byDay(entry('2026-10-18', 72.7), entry('2026-10-19', 72.4)));
    });

    it('gives each Entry row an overflow button of at least 44 px with an accessible name', async () => {
      const { el } = await setup();
      const more = el.querySelector<HTMLButtonElement>('.more')!;
      expect(more.getAttribute('aria-label')).toBe('More actions for Mon 19 Oct');
      expect(more.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('the overflow menu offers Edit, which opens the Day', async () => {
      const { fixture, el } = await setup();
      el.querySelector<HTMLButtonElement>('.more')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const item = document.querySelector<HTMLButtonElement>('[mat-menu-item]')!;
      expect(item.textContent).toContain('Edit');
      item.click();
      expect(navigate).toHaveBeenCalledWith(['/history', '2026-10-19']);
    });

    it('the overflow menu offers Delete, which asks first and then removes the Entry', async () => {
      const { fixture, el } = await setup();
      el.querySelector<HTMLButtonElement>('.more')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const items = Array.from(document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]'));
      expect(items.map((i) => i.textContent?.trim())).toEqual(['Edit', 'Delete']);
      items[1].click();
      fixture.detectChanges();
      expect(remove).not.toHaveBeenCalled();
      expect(el.querySelector('[role="alertdialog"]')).not.toBeNull();
      el.querySelector<HTMLButtonElement>('button.confirm')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(remove).toHaveBeenCalledWith('2026-10-19');
      expect(el.querySelector('[role="alertdialog"]')).toBeNull();
      expect(el.querySelector('.row .date')!.textContent).toBe('Sun 18 Oct');
      expect(el.querySelectorAll('.row')).toHaveLength(1);
    });

    describe('focus after the Delete dialog', () => {
      beforeEach(() => {
        vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
      });

      async function openDelete() {
        const { fixture, el } = await setup();
        document.body.appendChild(el);
        const more = el.querySelector<HTMLButtonElement>('.more')!;
        more.click();
        fixture.detectChanges();
        await fixture.whenStable();
        document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')[1].click();
        fixture.detectChanges();
        await fixture.whenStable();
        return { fixture, el, more };
      }

      it('Cancel returns focus to the overflow button', async () => {
        const { fixture, el, more } = await openDelete();
        el.querySelector<HTMLButtonElement>('button.cancel')!.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(document.activeElement).toBe(more);
        el.remove();
      });

      it('a confirmed delete puts focus on the host, not the body', async () => {
        const { fixture, el } = await openDelete();
        el.querySelector<HTMLButtonElement>('button.confirm')!.click();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(document.activeElement).toBe(el);
        el.remove();
      });
    });

    it('Cancel in the Delete confirmation leaves the Entry listed', async () => {
      const { fixture, el } = await setup();
      el.querySelector<HTMLButtonElement>('.more')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')[1].click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('button.cancel')!.click();
      fixture.detectChanges();
      expect(el.querySelector('[role="alertdialog"]')).toBeNull();
      expect(remove).not.toHaveBeenCalled();
      expect(entries()['2026-10-19']).toBeDefined();
    });

    it('a touch drag left over 48 px reveals the Edit action, and tapping it opens the Day', async () => {
      const { fixture, el } = await setup();
      const row = slide(el);
      touch('pointerdown', 200, 0, row);
      touch('pointermove', 170, 2, row);
      fixture.detectChanges();
      expect(row.classList).not.toContain('revealed');
      touch('pointermove', 140, 4, row);
      fixture.detectChanges();
      expect(row.classList).toContain('revealed');
      const action = firstItem(el).querySelector<HTMLButtonElement>('.edit-action')!;
      expect(action.getAttribute('aria-label')).toBe('Edit entry for Mon 19 Oct');
      expect(action.textContent).toContain('Edit');
      action.click();
      expect(navigate).toHaveBeenCalledWith(['/history', '2026-10-19']);
    });

    it('a mostly vertical drag does not reveal, and a mouse never does', async () => {
      const { fixture, el } = await setup();
      const row = slide(el);
      touch('pointerdown', 200, 0, row);
      touch('pointermove', 140, 200, row);
      fixture.detectChanges();
      expect(row.classList).not.toContain('revealed');
      touch('pointerup', 140, 200, row);
      const mouse = new Event('pointerdown', { bubbles: true });
      Object.assign(mouse, { pointerType: 'mouse', clientX: 200, clientY: 0 });
      row.dispatchEvent(mouse);
      touch('pointermove', 100, 0, row);
      fixture.detectChanges();
      expect(row.classList).not.toContain('revealed');
    });

    it('a drag right hides it, and revealing another row hides the first', async () => {
      const { fixture, el } = await setup();
      const [first, second] = Array.from(el.querySelectorAll<HTMLElement>('.slide'));
      touch('pointerdown', 200, 0, first);
      touch('pointermove', 100, 0, first);
      touch('pointerup', 100, 0, first);
      fixture.detectChanges();
      expect(first.classList).toContain('revealed');
      touch('pointerdown', 100, 0, first);
      touch('pointermove', 200, 0, first);
      touch('pointerup', 200, 0, first);
      fixture.detectChanges();
      expect(first.classList).not.toContain('revealed');
      touch('pointerdown', 200, 0, first);
      touch('pointermove', 100, 0, first);
      touch('pointerup', 100, 0, first);
      touch('pointerdown', 200, 0, second);
      fixture.detectChanges();
      expect(first.classList).not.toContain('revealed');
      touch('pointermove', 100, 0, second);
      fixture.detectChanges();
      expect(second.classList).toContain('revealed');
      expect(first.classList).not.toContain('revealed');
    });

    it('tapping a row link or + Add hides a revealed row', async () => {
      const { fixture, el } = await setup();
      const row = slide(el);
      touch('pointerdown', 200, 0, row);
      touch('pointermove', 100, 0, row);
      touch('pointerup', 100, 0, row);
      fixture.detectChanges();
      expect(row.classList).toContain('revealed');
      row.querySelector<HTMLAnchorElement>('a.row')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(row.classList).not.toContain('revealed');
    });

    describe('focus return', () => {
      let outside: HTMLButtonElement;
      beforeEach(() => {
        outside = document.createElement('button');
        document.body.appendChild(outside);
      });
      afterEach(() => outside.remove());

      it('puts focus back on the opener when the edit screen closes', async () => {
        const { fixture, el } = await setup();
        document.body.appendChild(el);
        const link = el.querySelector<HTMLAnchorElement>('a.row')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        (document.activeElement as HTMLElement | null)?.blur();
        (fixture.componentInstance as unknown as { restoreFocus(): void }).restoreFocus();
        expect(document.activeElement).toBe(link);
        el.remove();
      });

      it('leaves focus alone when another element already has it', async () => {
        const { fixture, el } = await setup();
        document.body.appendChild(el);
        const link = el.querySelector<HTMLAnchorElement>('a.row')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        outside.focus();
        (fixture.componentInstance as unknown as { restoreFocus(): void }).restoreFocus();
        expect(document.activeElement).toBe(outside);
        el.remove();
      });
    });

    it('has a router outlet for the edit screen', async () => {
      const { el } = await setup();
      expect(el.querySelector('router-outlet')).not.toBeNull();
    });
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
