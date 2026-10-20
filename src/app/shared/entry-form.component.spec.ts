import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestBed } from '@angular/core/testing';
import { EntryResult, EntryStatus, EntryStore } from '../core/data/entry.store';
import { PreferencesStore } from '../core/data/preferences.store';
import { SessionScope } from '../core/data/session-scope';
import { DraftStore } from '../core/state/draft.store';
import { Entry } from '../domain/entry';
import { Language } from '../domain/language';
import { EntryFormComponent } from './entry-form.component';

const DAY = '2026-10-20';
const epoch = signal(0);
let epochNow = () => epoch();
const FAILED = "Couldn't save. Your numbers are still here. Try again.";

describe('EntryFormComponent', () => {
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let language: ReturnType<typeof signal<Language>>;
  let status: ReturnType<typeof signal<EntryStatus>>;
  let save: ReturnType<typeof vi.fn<(entry: Entry) => Promise<EntryResult>>>;

  beforeEach(async () => {
    entries = signal<Readonly<Record<string, Entry>>>({});
    language = signal<Language>('en');
    status = signal<EntryStatus>('ready');
    epoch.set(0);
    epochNow = () => epoch();
    save = vi.fn<(entry: Entry) => Promise<EntryResult>>().mockResolvedValue({ ok: true });
    await TestBed.configureTestingModule({
      imports: [EntryFormComponent],
      providers: [
        { provide: EntryStore, useValue: { entries, status, save } },
        { provide: PreferencesStore, useValue: { language } },
        { provide: SessionScope, useValue: { sessionEpoch: () => epochNow() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  const snackText = () => document.querySelector('.mat-mdc-snack-bar-container')?.textContent ?? '';

  async function setup(day = DAY) {
    const fixture = TestBed.createComponent(EntryFormComponent);
    fixture.componentRef.setInput('day', day);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el); // focus only works on attached elements
    return {
      fixture,
      el,
      input: () => el.querySelector<HTMLInputElement>('input')!,
      button: () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!,
      message: () => el.querySelector<HTMLElement>('.message')!,
      type: async (text: string) => {
        const input = el.querySelector<HTMLInputElement>('input')!;
        input.value = text;
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
      },
      press: async () => {
        el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        await fixture.whenStable();
      },
    };
  }

  it('opens with an empty field and an enabled Save', async () => {
    const { input, button } = await setup();
    expect(input().value).toBe('');
    expect(button().disabled).toBe(false);
    expect(button().textContent).toContain('Save');
  });

  it('builds an accessible field: label, decimal keyboard, unit, live message region', async () => {
    const { el, input, message } = await setup();
    const label = el.querySelector('label')!;
    expect(label.textContent).toContain('Weight');
    expect(label.getAttribute('for')).toBe(input().id);
    expect(input().getAttribute('inputmode')).toBe('decimal');
    expect(input().getAttribute('autocomplete')).toBe('off');
    expect(el.querySelector('.unit')!.textContent).toBe('kg');
    expect(message().getAttribute('aria-live')).toBe('polite');
    expect(input().getAttribute('aria-describedby')).toBe(`${el.querySelector('.hint')!.id} ${message().id}`);
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('shows the stored value, in the Language, and saves again for the same Day', async () => {
    entries.set({ [DAY]: { day: DAY, values: { weight: 72.7 } } });
    const { input, press, fixture } = await setup();
    expect(input().value).toBe('72.7');
    language.set('it');
    await fixture.whenStable();
    expect(input().value).toBe('72,7');
    await press();
    expect(save).toHaveBeenCalledWith({ day: DAY, values: { weight: 72.7 } });
  });

  it('blocks an empty Weight with the message, focus and no save', async () => {
    const { input, press, message, type } = await setup();
    await type('   ');
    await press();
    expect(save).not.toHaveBeenCalled();
    expect(message().textContent).toContain('Add your weight to save.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input());
  });

  it('keeps a cleared stored Weight empty and blocks Save', async () => {
    entries.set({ [DAY]: { day: DAY, values: { weight: 72.7 } } });
    const { input, press, message, type } = await setup();
    expect(input().value).toBe('72.7');
    await type('');
    expect(input().value).toBe('');
    await press();
    expect(save).not.toHaveBeenCalled();
    expect(message().textContent).toContain('Add your weight to save.');
  });

  it('keeps text typed while the save is in flight', async () => {
    let finish!: (r: EntryResult) => void;
    save.mockReturnValueOnce(new Promise<EntryResult>((resolve) => (finish = resolve)));
    const { input, press, type, fixture } = await setup();
    await type('72.7');
    await press();
    await type('73.1');
    finish({ ok: true });
    await fixture.whenStable();
    expect(input().value).toBe('73.1');
  });

  it.each(['19.9', '400.1', '0', '-5', 'abc', '72.55', '72,55'])('rejects %j with the range message', async (text) => {
    const { input, press, message, type } = await setup();
    await type(text);
    await press();
    expect(save).not.toHaveBeenCalled();
    expect(message().textContent).toContain('Enter a weight between 20.0 and 400.0 kg.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('writes the range message in Italian with decimal commas', async () => {
    language.set('it');
    const { press, message, type } = await setup();
    await type('19');
    await press();
    expect(message().textContent).toContain('Inserisci un peso tra 20,0 e 400,0 kg.');
  });

  it.each([
    ['72.7', 72.7],
    ['72,7', 72.7],
    [' 72.7 ', 72.7],
    ['20', 20],
    ['400', 400],
  ])('saves %j once as %d', async (text, value) => {
    const { press, type } = await setup();
    await type(text);
    await press();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ day: DAY, values: { weight: value } });
  });

  it('submits on Enter through the form', async () => {
    const { el, fixture, type } = await setup();
    await type('72.5');
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('shows progress while in flight and ignores a second press', async () => {
    let finish!: (result: EntryResult) => void;
    save.mockReturnValue(new Promise<EntryResult>((resolve) => (finish = resolve)));
    const { button, press, type, fixture } = await setup();
    await type('72.5');
    await press();
    expect(button().disabled).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(button().textContent).toContain('Saving…');
    button().form!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(save).toHaveBeenCalledTimes(1);
    finish({ ok: true });
    await fixture.whenStable();
    expect(button().disabled).toBe(false);
    expect(button().textContent).toContain('Save');
  });

  it('drops the draft and announces Saved! after a confirmed save, until the next edit', async () => {
    const { input, message, press, type, fixture } = await setup();
    await type('72.7');
    await press();
    expect(TestBed.inject(DraftStore).get(DAY)).toEqual({});
    expect(message().textContent).toContain('Saved!');
    entries.set({ [DAY]: { day: DAY, values: { weight: 72.7 } } });
    await fixture.whenStable();
    expect(input().value).toBe('72.7');
    await type('72.8');
    expect(message().textContent).not.toContain('Saved!');
  });

  it('keeps the typed text and re-enables Save when the save fails', async () => {
    save.mockResolvedValue({ ok: false, code: 'network' });
    const { input, button, message, press, type } = await setup();
    await type('72,5');
    await press();
    expect(input().value).toBe('72,5');
    expect(button().disabled).toBe(false);
    expect(message().textContent).not.toContain('Saved!');
    expect(TestBed.inject(DraftStore).get(DAY)).toEqual({ weight: { state: 'value', text: '72,5' } });
  });

  describe('a failed save', () => {
    it.each([
      ['network', FAILED, 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.'],
      ['timeout', FAILED, 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.'],
      ['permission', "Couldn't save. Your numbers are still here. Please log in again.", 'Accedi di nuovo'],
      ['invalid', "Couldn't save. Your numbers are still here. Check them and try again.", 'Controllali e riprova'],
      ['unknown', "Couldn't save. Your numbers are still here. Try again in a moment.", 'Riprova tra un momento'],
    ] as const)('shows the %s message inline and in a snackbar, never saved', async (code, english, italian) => {
      save.mockResolvedValue({ ok: false, code });
      const { message, button, input, press, type, fixture } = await setup();
      await type('72.5');
      await press();
      expect(message().textContent?.trim()).toBe(english);
      expect(message().textContent).not.toContain('Saved!');
      expect(snackText()).toContain(english);
      expect(snackText()).toContain('Dismiss');
      expect(input().value).toBe('72.5');
      expect(button().disabled).toBe(false);
      expect(JSON.stringify(TestBed.inject(DraftStore).get(DAY))).toContain('72.5');

      language.set('it');
      await fixture.whenStable();
      expect(message().textContent).toContain(italian);
    });

    it('does not auto-dismiss the snackbar or the inline message', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const open = vi.spyOn(TestBed.inject(MatSnackBar), 'open');
      const { message, type, press } = await setup();
      await type('72.5');
      await press();
      expect(open).toHaveBeenCalledWith(FAILED, 'Dismiss', { duration: 0 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(snackText()).toContain(FAILED);
      expect(message().textContent).toContain(FAILED);
    });

    it('closes the snackbar with Dismiss and keeps the inline message', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const { message, type, press, fixture } = await setup();
      await type('72.5');
      await press();
      document.querySelector<HTMLButtonElement>('.mat-mdc-snack-bar-container button')!.click();
      await fixture.whenStable();
      await vi.waitFor(() => expect(document.querySelector('.mat-mdc-snack-bar-container')).toBeNull());
      expect(message().textContent).toContain(FAILED);
    });

    it('clears the inline message on the next edit', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const { message, type, press } = await setup();
      await type('72.5');
      await press();
      await type('72.6');
      expect(message().textContent?.trim()).toBe('');
    });

    it('closes the snackbar when the user edits', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const { type, press, fixture } = await setup();
      await type('72.5');
      await press();
      expect(snackText()).toContain(FAILED);
      await type('72.6');
      await fixture.whenStable();
      await vi.waitFor(() => expect(document.querySelector('.mat-mdc-snack-bar-container')).toBeNull());
    });

    it('closes the snackbar when the form is destroyed', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const { type, press, fixture } = await setup();
      await type('72.5');
      await press();
      expect(snackText()).toContain(FAILED);
      fixture.destroy();
      await vi.waitFor(() => expect(document.querySelector('.mat-mdc-snack-bar-container')).toBeNull());
    });

    it('does not open the snackbar when the session changes while it loads', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const { type, press } = await setup();
      await type('72.5');
      // Reads of the epoch in a save: before it, right after it, and after the snackbar loads.
      let reads = 0;
      epochNow = () => (++reads > 2 ? 1 : 0);
      await press();
      expect(snackText()).toBe('');
    });

    it('closes the snackbar and the message on a new attempt, then shows Saved! when it works', async () => {
      save.mockResolvedValueOnce({ ok: false, code: 'network' });
      const { message, type, press, fixture } = await setup();
      await type('72.5');
      await press();
      expect(snackText()).toContain(FAILED);
      await press();
      await fixture.whenStable();
      await vi.waitFor(() => expect(document.querySelector('.mat-mdc-snack-bar-container')).toBeNull());
      expect(message().textContent).toContain('Saved!');
      expect(message().textContent).not.toContain(FAILED);
      expect(TestBed.inject(DraftStore).get(DAY)).toEqual({});
    });
  });

  describe('confirmed output', () => {
    it('emits the saved Entry once, only after the store confirms', async () => {
      let finish!: (r: EntryResult) => void;
      save.mockReturnValueOnce(new Promise<EntryResult>((resolve) => (finish = resolve)));
      const { fixture, press, type } = await setup();
      const seen: Entry[] = [];
      fixture.componentInstance.confirmed.subscribe((entry) => seen.push(entry));
      await type('72,4');
      await press();
      expect(seen).toEqual([]);
      finish({ ok: true });
      await fixture.whenStable();
      expect(seen).toEqual([{ day: DAY, values: { weight: 72.4 } }]);
    });

    it('does not emit when the save fails', async () => {
      save.mockResolvedValue({ ok: false, code: 'network' });
      const { fixture, press, type } = await setup();
      const seen: Entry[] = [];
      fixture.componentInstance.confirmed.subscribe((entry) => seen.push(entry));
      await type('72.4');
      await press();
      expect(seen).toEqual([]);
    });

    it('does not emit for a rejected value or a save from an older session', async () => {
      const { fixture, press, type } = await setup();
      const seen: Entry[] = [];
      fixture.componentInstance.confirmed.subscribe((entry) => seen.push(entry));
      await type('5');
      await press();
      expect(save).not.toHaveBeenCalled();
      let finish!: (r: EntryResult) => void;
      save.mockReturnValueOnce(new Promise<EntryResult>((resolve) => (finish = resolve)));
      await type('72.5');
      await press();
      epoch.set(1);
      finish({ ok: true });
      await fixture.whenStable();
      expect(seen).toEqual([]);
    });
  });

  describe('a session change during a save', () => {
    it('discards a success: no Saved!, draft kept', async () => {
      let finish!: (r: EntryResult) => void;
      save.mockReturnValueOnce(new Promise<EntryResult>((resolve) => (finish = resolve)));
      const { message, press, type, fixture } = await setup();
      await type('72.5');
      await press();
      epoch.set(1);
      finish({ ok: true });
      await fixture.whenStable();
      expect(message().textContent).not.toContain('Saved!');
      expect(TestBed.inject(DraftStore).get(DAY)).toEqual({ weight: { state: 'value', text: '72.5' } });
    });

    it('discards a failure: no message, no snackbar', async () => {
      let finish!: (r: EntryResult) => void;
      save.mockReturnValueOnce(new Promise<EntryResult>((resolve) => (finish = resolve)));
      const { message, press, type, fixture } = await setup();
      await type('72.5');
      await press();
      epoch.set(1);
      finish({ ok: false, code: 'network' });
      await fixture.whenStable();
      expect(message().textContent?.trim()).toBe('');
      expect(snackText()).toBe('');
    });
  });

  describe('quick weight', () => {
    const previous = (weight: number, day = '2026-10-18'): Record<string, Entry> => ({
      [day]: { day, values: { weight } },
    });
    const plus = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.step.plus')!;
    const minus = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.step.minus')!;
    const hint = (el: HTMLElement) => el.querySelector('.hint')!.textContent?.trim();
    const arrow = (input: HTMLInputElement, key: 'ArrowUp' | 'ArrowDown') => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
      input.dispatchEvent(event);
      return event;
    };

    it('starts from the most recent earlier Entry with a hint, in both Languages', async () => {
      entries.set({ ...previous(71, '2026-10-10'), ...previous(72.7) });
      const { input, el, fixture } = await setup();
      expect(input().value).toBe('72.7');
      expect(hint(el)).toBe('Last time: 72.7 kg · step 0.1 kg');
      language.set('it');
      await fixture.whenStable();
      expect(input().value).toBe('72,7');
      expect(hint(el)).toBe('Ultima volta: 72,7 kg · passo 0,1 kg');
    });

    it('starts empty with only the step in the hint when there is no earlier Entry', async () => {
      const { input, el, fixture } = await setup();
      expect(input().value).toBe('');
      expect(hint(el)).toBe('Step 0.1 kg');
      language.set('it');
      await fixture.whenStable();
      expect(hint(el)).toBe('Passo 0,1 kg');
    });

    it('builds no suggestion while the store is not ready', async () => {
      entries.set(previous(72.7));
      status.set('loading');
      const { input, el, fixture } = await setup();
      expect(input().value).toBe('');
      expect(hint(el)).toBe('Step 0.1 kg');
      status.set('ready');
      await fixture.whenStable();
      expect(input().value).toBe('72.7');
    });

    it("prefers today's stored Entry and still hints the earlier one", async () => {
      entries.set({ ...previous(72.7), [DAY]: { day: DAY, values: { weight: 72.4 } } });
      const { input, el } = await setup();
      expect(input().value).toBe('72.4');
      expect(hint(el)).toBe('Last time: 72.7 kg · step 0.1 kg');
    });

    it('never replaces typed text with the suggestion', async () => {
      entries.set(previous(72.7));
      const { input, type, fixture } = await setup();
      await type('80.0');
      entries.set({ ...previous(72.7), '2026-10-19': { day: '2026-10-19', values: { weight: 75 } } });
      await fixture.whenStable();
      expect(input().value).toBe('80.0');
    });

    it('names the buttons', async () => {
      const { el } = await setup();
      expect(plus(el).getAttribute('aria-label')).toBe('Increase weight by 0.1 kg');
      expect(minus(el).getAttribute('aria-label')).toBe('Decrease weight by 0.1 kg');
      expect(plus(el).type).toBe('button');
      expect(el.querySelectorAll('button')).toHaveLength(3);
    });

    it('names the buttons in Italian', async () => {
      language.set('it');
      const { el } = await setup();
      expect(plus(el).getAttribute('aria-label')).toBe('Aumenta il peso di 0,1 kg');
      expect(minus(el).getAttribute('aria-label')).toBe('Diminuisci il peso di 0,1 kg');
    });

    it('steps by exactly 0.1 with the buttons and saves the stepped value', async () => {
      entries.set(previous(72.7));
      const { input, el, fixture, press } = await setup();
      plus(el).click();
      await fixture.whenStable();
      expect(input().value).toBe('72.8');
      minus(el).click();
      minus(el).click();
      await fixture.whenStable();
      expect(input().value).toBe('72.6');
      await press();
      expect(save).toHaveBeenCalledWith({ day: DAY, values: { weight: 72.6 } });
    });

    it('steps with Up and Down once per key and prevents the default', async () => {
      entries.set(previous(72.7));
      const { input, fixture } = await setup();
      expect(arrow(input(), 'ArrowUp').defaultPrevented).toBe(true);
      await fixture.whenStable();
      expect(input().value).toBe('72.8');
      expect(arrow(input(), 'ArrowDown').defaultPrevented).toBe(true);
      arrow(input(), 'ArrowDown');
      await fixture.whenStable();
      expect(input().value).toBe('72.6');
    });

    it('steps from a typed comma in Italian and writes a comma back', async () => {
      language.set('it');
      const { input, el, type, fixture } = await setup();
      await type('72,7');
      plus(el).click();
      await fixture.whenStable();
      expect(input().value).toBe('72,8');
    });

    it('stays at the edges of the range', async () => {
      const { input, el, type, fixture } = await setup();
      await type('400.0');
      plus(el).click();
      await fixture.whenStable();
      expect(input().value).toBe('400.0');
      await type('20.0');
      minus(el).click();
      await fixture.whenStable();
      expect(input().value).toBe('20.0');
    });

    it('steps from the suggestion when there is nothing to step from', async () => {
      entries.set(previous(72.7));
      const { input, el, type, fixture } = await setup();
      for (const text of ['', 'abc']) {
        await type(text);
        plus(el).click();
        await fixture.whenStable();
        expect(input().value).toBe('72.8');
        await type(text);
        minus(el).click();
        await fixture.whenStable();
        expect(input().value).toBe('72.6');
      }
    });

    it('steps from the minimum with no number and no suggestion', async () => {
      const first = await setup();
      plus(first.el).click();
      await first.fixture.whenStable();
      expect(first.input().value).toBe('20.1');
      document.body.replaceChildren();
      TestBed.inject(DraftStore).reset();
      const second = await setup();
      minus(second.el).click();
      await second.fixture.whenStable();
      expect(second.input().value).toBe('20.0');
    });

    it('reads a typed comma and point as the same value', async () => {
      const { type, press } = await setup();
      await type('72,7');
      await press();
      await type('72.7');
      await press();
      expect(save.mock.calls[0][0]).toEqual(save.mock.calls[1][0]);
      expect(save.mock.calls[0][0].values).toEqual({ weight: 72.7 });
    });

    it('clears the saved message when a button changes the value', async () => {
      entries.set(previous(72.7));
      const { el, press, message, fixture } = await setup();
      await press();
      expect(message().textContent).toContain('Saved!');
      plus(el).click();
      await fixture.whenStable();
      expect(message().textContent?.trim()).toBe('');
    });
  });

  it('keeps typed text across a destroyed and recreated form (Tab switch)', async () => {
    const first = await setup();
    await first.type('72');
    first.fixture.destroy();
    const second = await setup();
    expect(second.input().value).toBe('72');
  });

  it('keeps one draft per Day', async () => {
    const a = await setup('2026-10-19');
    await a.type('70');
    const b = await setup('2026-10-20');
    expect(b.input().value).toBe('');
    expect(a.input().value).toBe('70');
  });

  it('does not touch another Day when saving', async () => {
    entries.set({ '2026-10-19': { day: '2026-10-19', values: { weight: 70 } } });
    const { press, type } = await setup();
    await type('72.5');
    await press();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].day).toBe(DAY);
  });

  it('clears the message when the user edits after an error', async () => {
    const { message, input, press, type } = await setup();
    await press();
    expect(message().textContent).toContain('Add your weight to save.');
    await type('7');
    expect(message().textContent?.trim()).toBe('');
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });
});
