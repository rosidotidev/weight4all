import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { EntryResult, EntryStatus, EntryStore } from '../../core/data/entry.store';
import { SessionScope } from '../../core/data/session-scope';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ClockService } from '../../core/state/clock.service';
import { DraftStore } from '../../core/state/draft.store';
import { LayoutService } from '../../core/state/layout.service';
import { WindowClass } from '../../domain/window-class';
import { Entry } from '../../domain/entry';
import { Language } from '../../domain/language';
import { HistoryDayComponent } from './history-day.component';

const TODAY = '2026-10-20';

describe('HistoryDayComponent', () => {
  let status: ReturnType<typeof signal<EntryStatus>>;
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let language: ReturnType<typeof signal<Language>>;
  let windowClass: ReturnType<typeof signal<WindowClass>>;
  let retry: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let save: ReturnType<typeof vi.fn<(entry: Entry) => Promise<EntryResult>>>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    status = signal<EntryStatus>('ready');
    entries = signal<Readonly<Record<string, Entry>>>({
      '2026-10-14': { day: '2026-10-14', values: { weight: 71.5 } },
      '2026-10-19': { day: '2026-10-19', values: { weight: 72.4 } },
    });
    language = signal<Language>('en');
    windowClass = signal<WindowClass>('compact');
    retry = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    save = vi.fn<(entry: Entry) => Promise<EntryResult>>().mockImplementation(async (entry) => {
      entries.update((all) => ({ ...all, [entry.day]: entry }));
      return { ok: true };
    });
    navigate = vi.fn().mockResolvedValue(true);
  });

  function setup(dayKey: string) {
    TestBed.configureTestingModule({
      imports: [HistoryDayComponent],
      providers: [
        { provide: EntryStore, useValue: { status, entries, retry, save } },
        { provide: PreferencesStore, useValue: { language } },
        { provide: ClockService, useValue: { today: signal(TODAY) } },
        { provide: LayoutService, useValue: { windowClass } },
        { provide: SessionScope, useValue: { sessionEpoch: () => 0 } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ dayKey })) } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const fixture = TestBed.createComponent(HistoryDayComponent);
    fixture.detectChanges();
    return Object.assign(fixture, { el: fixture.nativeElement as HTMLElement });
  }

  const input = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input')!;
  const title = (el: HTMLElement) => el.querySelector('#w4a-day-title')!.textContent;

  async function type(fixture: ComponentFixture<HistoryDayComponent>, text: string) {
    const field = input(fixture.nativeElement);
    field.value = text;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(fixture: ComponentFixture<HistoryDayComponent>) {
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('is a labelled modal dialog', () => {
    const { el } = setup('2026-10-14');
    const dialog = el.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('w4a-day-title');
    expect(el.querySelector('[cdkTrapFocus], .cdk-focus-trap')).not.toBeNull();
  });

  it('edits an existing Entry: stored weight and "Edit entry for" title', () => {
    const { el } = setup('2026-10-14');
    expect(title(el)).toBe('Edit entry for Wed 14 Oct');
    expect(input(el).value).toBe('71.5');
  });

  it('adds a missing Day: the last Entry as suggestion and an "Add entry for" title', () => {
    const { el } = setup('2026-10-16');
    expect(title(el)).toBe('Add entry for Fri 16 Oct');
    expect(input(el).value).toBe('71.5');
  });

  it('adds a missing Day with no earlier Entry: the registry default', () => {
    const { el } = setup('2026-10-13');
    expect(title(el)).toBe('Add entry for Tue 13 Oct');
    expect(input(el).value).toBe('');
  });

  it('titles in Italian', () => {
    language.set('it');
    const { el } = setup('2026-10-13');
    expect(title(el)).toBe('Aggiungi registrazione per mar 13 ott');
    expect(el.textContent).toContain('Annulla');
  });

  it('is full screen on compact and a dialog with a scrim from medium', () => {
    const compact = setup('2026-10-14');
    expect(compact.el.querySelector('.panel')!.classList).not.toContain('dialog');
    expect(compact.el.querySelector('.scrim')!.classList).toContain('full');
  });

  it.each<WindowClass>(['medium', 'expanded'])('is a dialog over a scrim at %s', (cls) => {
    windowClass.set(cls);
    const { el } = setup('2026-10-14');
    expect(el.querySelector('.panel')!.classList).toContain('dialog');
    expect(el.querySelector('.scrim')!.classList).not.toContain('full');
  });

  it('shows a skeleton and no form while loading', () => {
    status.set('loading');
    const { el } = setup('2026-10-14');
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toContain('Loading your days');
    expect(title(el)).toBe('Entry for Wed 14 Oct');
  });

  it('shows a message with Retry on error and no form', () => {
    status.set('error');
    const { el } = setup('2026-10-14');
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('We could not load your days');
    el.querySelector<HTMLButtonElement>('.load-error button')!.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('saving a past Day closes at once with no Happy effect', async () => {
    const fixture = setup('2026-10-14');
    await type(fixture, '70.2');
    await submit(fixture);
    expect(save).toHaveBeenCalledWith({ day: '2026-10-14', values: { weight: 70.2 } });
    expect(navigate).toHaveBeenCalledWith(['/history']);
    expect(fixture.nativeElement.querySelector('w4a-happy-effect')).toBeNull();
    expect(TestBed.inject(DraftStore).get('2026-10-14')).toEqual({});
  });

  it("saving today's Entry shows the Happy effect, and Done returns to History", async () => {
    const fixture = setup(TODAY);
    await type(fixture, '72.0');
    await submit(fixture);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('w4a-happy-effect')).not.toBeNull();
    expect(el.querySelector('form')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    el.querySelector<HTMLButtonElement>('.done')!.click();
    expect(navigate).toHaveBeenCalledWith(['/history']);
  });

  it('a failed save keeps the dialog and the typed values', async () => {
    save.mockResolvedValue({ ok: false, code: 'network' });
    const fixture = setup('2026-10-14');
    await type(fixture, '70.2');
    await submit(fixture);
    expect(navigate).not.toHaveBeenCalled();
    expect(input(fixture.nativeElement).value).toBe('70.2');
    expect(TestBed.inject(DraftStore).get('2026-10-14').weight?.text).toBe('70.2');
  });

  it('Cancel drops the Day draft and goes back', async () => {
    const fixture = setup('2026-10-14');
    await type(fixture, '70.2');
    fixture.nativeElement.querySelector('button.cancel').click();
    expect(TestBed.inject(DraftStore).get('2026-10-14')).toEqual({});
    expect(navigate).toHaveBeenCalledWith(['/history']);
  });

  it('Esc drops the draft and goes back', async () => {
    const fixture = setup('2026-10-14');
    await type(fixture, '70.2');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(TestBed.inject(DraftStore).get('2026-10-14')).toEqual({});
    expect(navigate).toHaveBeenCalledWith(['/history']);
  });

  it('a click on the scrim drops the draft and goes back', async () => {
    windowClass.set('medium');
    const fixture = setup('2026-10-14');
    await type(fixture, '70.2');
    fixture.nativeElement.querySelector('.scrim').click();
    expect(TestBed.inject(DraftStore).get('2026-10-14')).toEqual({});
    expect(navigate).toHaveBeenCalledWith(['/history']);
  });

  it('keeps typed values when the Day is reopened after leaving', async () => {
    const first = setup('2026-10-14');
    await type(first, '70.2');
    first.destroy();
    const second = TestBed.createComponent(HistoryDayComponent);
    second.detectChanges();
    expect(input(second.nativeElement).value).toBe('70.2');
  });
});
