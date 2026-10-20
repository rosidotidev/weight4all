import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntryResult, EntryStore } from '../core/data/entry.store';
import { PreferencesStore } from '../core/data/preferences.store';
import { DraftStore } from '../core/state/draft.store';
import { Entry } from '../domain/entry';
import { Language } from '../domain/language';
import { EntryFormComponent } from './entry-form.component';

const DAY = '2026-10-20';

describe('EntryFormComponent', () => {
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let language: ReturnType<typeof signal<Language>>;
  let save: ReturnType<typeof vi.fn<(entry: Entry) => Promise<EntryResult>>>;

  beforeEach(async () => {
    entries = signal<Readonly<Record<string, Entry>>>({});
    language = signal<Language>('en');
    save = vi.fn<(entry: Entry) => Promise<EntryResult>>().mockResolvedValue({ ok: true });
    await TestBed.configureTestingModule({
      imports: [EntryFormComponent],
      providers: [
        { provide: EntryStore, useValue: { entries, save } },
        { provide: PreferencesStore, useValue: { language } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

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
      button: () => el.querySelector<HTMLButtonElement>('button')!,
      message: () => el.querySelector<HTMLElement>('.message')!,
      type: async (text: string) => {
        const input = el.querySelector<HTMLInputElement>('input')!;
        input.value = text;
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
      },
      press: async () => {
        el.querySelector<HTMLButtonElement>('button')!.click();
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
    expect(input().getAttribute('aria-describedby')).toBe(message().id);
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
