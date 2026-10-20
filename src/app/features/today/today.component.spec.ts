import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntryResult, EntryStatus, EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ClockService } from '../../core/state/clock.service';
import { addDays, dayKey } from '../../domain/day';
import { Entry } from '../../domain/entry';
import { Language } from '../../domain/language';
import { TodayComponent } from './today.component';

describe('TodayComponent', () => {
  let status: ReturnType<typeof signal<EntryStatus>>;
  let retry: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let language: ReturnType<typeof signal<Language>>;
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let save: ReturnType<typeof vi.fn<(entry: Entry) => Promise<EntryResult>>>;

  beforeEach(async () => {
    status = signal<EntryStatus>('loading');
    retry = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    language = signal<Language>('en');
    entries = signal<Readonly<Record<string, Entry>>>({});
    // Like the real store: the Entry is in the signal by the time `save` resolves ok.
    save = vi.fn<(entry: Entry) => Promise<EntryResult>>().mockImplementation(async (entry) => {
      entries.update((all) => ({ ...all, [entry.day]: entry }));
      return { ok: true };
    });
    await TestBed.configureTestingModule({
      imports: [TodayComponent],
      providers: [
        { provide: EntryStore, useValue: { status, retry, entries, save } },
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

  it('renders the skeleton while loading and the form when ready', async () => {
    const { fixture, el } = await setup();
    expect(el.querySelector('.skeleton')).not.toBeNull();
    status.set('ready');
    await fixture.whenStable();
    expect(el.querySelector('w4a-entry-form')).not.toBeNull();
  });

  describe('missing-entry banner', () => {
    const today = () => dayKey(new Date());
    const banner = (el: HTMLElement) => el.querySelector('.banner');

    it('shows both lines above the form when ready and today has no Entry', async () => {
      status.set('ready');
      const { el } = await setup();
      const b = banner(el)!;
      expect(b.getAttribute('role')).toBe('status');
      expect(b.textContent).toContain("Today isn't logged yet");
      expect(b.textContent).toContain("Add today's numbers whenever you're ready.");
      expect(b.querySelector('button, [role="alert"], svg, mat-icon')).toBeNull();
      const form = el.querySelector('w4a-entry-form')!;
      expect(b.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('is absent while loading and on error', async () => {
      const { fixture, el } = await setup();
      expect(banner(el)).toBeNull();
      status.set('error');
      await fixture.whenStable();
      expect(banner(el)).toBeNull();
    });

    it('is absent when today is logged', async () => {
      entries.set({ [today()]: { day: today(), values: { weight: 70 } } });
      status.set('ready');
      const { el } = await setup();
      expect(banner(el)).toBeNull();
    });

    it('shows when only other Days have Entries', async () => {
      entries.set({ '2000-01-01': { day: '2000-01-01', values: { weight: 60 } } });
      status.set('ready');
      const { el } = await setup();
      expect(banner(el)).not.toBeNull();
    });

    it('disappears when today is saved and returns when it is deleted', async () => {
      status.set('ready');
      const { fixture, el } = await setup();
      expect(banner(el)).not.toBeNull();
      entries.set({ [today()]: { day: today(), values: { weight: 70 } } });
      await fixture.whenStable();
      expect(banner(el)).toBeNull();
      entries.set({});
      await fixture.whenStable();
      expect(banner(el)).not.toBeNull();
    });

    it('follows midnight rollover to a new today that has no Entry', async () => {
      const day = signal('2026-01-01');
      TestBed.overrideProvider(ClockService, { useValue: { today: day } });
      entries.set({ '2026-01-01': { day: '2026-01-01', values: { weight: 70 } } });
      status.set('ready');
      const { fixture, el } = await setup();
      expect(banner(el)).toBeNull();
      day.set('2026-01-02');
      await fixture.whenStable();
      expect(banner(el)).not.toBeNull();
    });

    it('is Italian when the Language is it, with no dismiss control', async () => {
      language.set('it');
      status.set('ready');
      const { el } = await setup();
      const b = banner(el)!;
      expect(b.textContent).toContain('Oggi non è ancora registrato');
      expect(b.textContent).toContain('Aggiungi i numeri di oggi quando vuoi.');
      expect(b.querySelector('button')).toBeNull();
    });
  });

  describe('Happy effect', () => {
    const today = () => dayKey(new Date());
    const ago = (n: number) => addDays(today(), -n);
    const entry = (day: string, weight: number): [string, Entry] => [
      day,
      { day, values: { weight } },
    ];

    afterEach(() => document.body.replaceChildren());

    async function saveWeight(text: string) {
      status.set('ready');
      const { fixture, el } = await setup();
      document.body.appendChild(el);
      const input = el.querySelector<HTMLInputElement>('input')!;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      const submit = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      submit.focus();
      submit.click();
      await fixture.whenStable();
      await fixture.whenStable();
      return { fixture, el, submit };
    }
    const card = (el: HTMLElement) => el.querySelector('w4a-happy-effect');
    const text = (el: HTMLElement, selector: string) =>
      el.querySelector(selector)?.textContent?.trim();

    it('shows nothing before a save', async () => {
      status.set('ready');
      const { el } = await setup();
      expect(card(el)).toBeNull();
    });

    it('celebrates a loss against yesterday above the form', async () => {
      entries.set(Object.fromEntries([entry(ago(1), 72.7)]));
      const { el } = await saveWeight('72.4');
      expect(save).toHaveBeenCalledWith({ day: today(), values: { weight: 72.4 } });
      expect(text(el, '.delta')).toBe('−0.3 kg');
      expect(text(el, '.vs')).toBe('vs yesterday');
      expect(el.querySelector('.card.loss')).not.toBeNull();
      expect(el.querySelector('.confetti')).not.toBeNull();
      expect(el.querySelector('.banner')).toBeNull();
      const form = el.querySelector('w4a-entry-form')!;
      expect(
        card(el)!.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('names the date of an older earlier Entry', async () => {
      entries.set(Object.fromEntries([entry(ago(4), 73)]));
      const { el } = await saveWeight('72.4');
      expect(text(el, '.vs')).toMatch(/^vs \d{1,2} \p{L}+$/u);
      expect(text(el, '.vs')).not.toContain('yesterday');
    });

    it('is calm for a gain', async () => {
      entries.set(Object.fromEntries([entry(ago(1), 72.6)]));
      const { el } = await saveWeight('72.8');
      expect(text(el, '.delta')).toBe('+0.2 kg');
      expect(el.querySelector('.card.gain')).not.toBeNull();
      expect(el.querySelector('.confetti')).toBeNull();
      expect(text(el, '.message')).toBe('Bodies fluctuate. Thanks for logging today.');
    });

    it('is calm for no change', async () => {
      entries.set(Object.fromEntries([entry(ago(1), 72.4)]));
      const { el } = await saveWeight('72.4');
      expect(text(el, '.delta')).toBe('0.0 kg');
      expect(el.querySelector('.confetti')).toBeNull();
    });

    it('welcomes the first Entry', async () => {
      const { el } = await saveWeight('72.4');
      expect(text(el, '.welcome')).toBe('Welcome! Your first log is in.');
      expect(el.querySelector('.delta')).toBeNull();
    });

    it('welcomes when Entries exist only after today', async () => {
      entries.set(Object.fromEntries([entry(addDays(today(), 3), 70)]));
      const { el } = await saveWeight('72.4');
      expect(text(el, '.welcome')).toBe('Welcome! Your first log is in.');
    });

    it('shows nothing when the save fails', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      entries.set(Object.fromEntries([entry(ago(1), 72.7)]));
      const { el } = await saveWeight('72.4');
      expect(card(el)).toBeNull();
      expect(el.textContent).toContain("Couldn't save");
    });

    it('shows nothing while the save is in flight', async () => {
      let finish!: (r: EntryResult) => void;
      save.mockReturnValueOnce(new Promise<EntryResult>((resolve) => (finish = resolve)));
      const { fixture, el } = await saveWeight('72.4');
      expect(card(el)).toBeNull();
      finish({ ok: true });
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
      expect(card(el)).not.toBeNull();
    });

    it('is Italian when the Language is it', async () => {
      language.set('it');
      entries.set(Object.fromEntries([entry(ago(1), 72.7)]));
      const { el } = await saveWeight('72,4');
      expect(text(el, '.delta')).toBe('−0,3 kg');
      expect(text(el, '.vs')).toBe('rispetto a ieri');
      expect(text(el, '.logged')).toBe('72,4 kg registrati per oggi.');
    });

    it('moves focus to Done, then closes with Done and returns focus to Save', async () => {
      const { el, submit, fixture } = await saveWeight('72.4');
      expect(document.activeElement).toBe(el.querySelector('.done'));
      el.querySelector<HTMLButtonElement>('.done')!.click();
      await fixture.whenStable();
      expect(card(el)).toBeNull();
      expect(document.activeElement).toBe(submit);
    });

    it('closes with Dismiss and returns focus to Save', async () => {
      const { el, submit, fixture } = await saveWeight('72.4');
      el.querySelector<HTMLButtonElement>('.dismiss')!.click();
      await fixture.whenStable();
      expect(card(el)).toBeNull();
      expect(document.activeElement).toBe(submit);
    });

    it('closes with Esc and returns focus to Save', async () => {
      const { el, submit, fixture } = await saveWeight('72.4');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();
      expect(card(el)).toBeNull();
      expect(document.activeElement).toBe(submit);
    });

    it('returns focus to Today when the opener is gone', async () => {
      const { el, submit, fixture } = await saveWeight('72.4');
      submit.remove();
      el.querySelector<HTMLButtonElement>('.done')!.click();
      await fixture.whenStable();
      expect(document.activeElement).toBe(el);
    });

    it('makes a fresh card for a second save while the first is open, and still returns focus to Save', async () => {
      entries.set(Object.fromEntries([entry(ago(1), 72.7)]));
      const { fixture, el, submit } = await saveWeight('72.4');
      const first = card(el);
      const input = el.querySelector<HTMLInputElement>('input')!;
      input.value = '72.2';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      submit.focus();
      submit.click();
      await fixture.whenStable();
      await fixture.whenStable();
      expect(card(el)).not.toBeNull();
      expect(card(el)).not.toBe(first);
      expect(document.activeElement).toBe(el.querySelector('.done'));
      el.querySelector<HTMLButtonElement>('.done')!.click();
      await fixture.whenStable();
      expect(document.activeElement).toBe(submit);
    });

    it('keeps the form usable while the card is open', async () => {
      const { el } = await saveWeight('72.4');
      expect(card(el)).not.toBeNull();
      expect(el.querySelector<HTMLInputElement>('input')!.disabled).toBe(false);
      expect(el.querySelector('[aria-modal]')).toBeNull();
    });
  });
});
