import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntryResult, EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { DraftStore } from '../../core/state/draft.store';
import { Language } from '../../domain/language';
import { DeleteEntryDialogComponent } from './delete-entry-dialog.component';

describe('DeleteEntryDialogComponent', () => {
  let language: ReturnType<typeof signal<Language>>;
  let remove: ReturnType<typeof vi.fn<(day: string) => Promise<EntryResult>>>;
  let fixture: ComponentFixture<DeleteEntryDialogComponent>;
  let cancelled: ReturnType<typeof vi.fn<() => void>>;
  let deleted: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    language = signal<Language>('en');
    remove = vi.fn<(day: string) => Promise<EntryResult>>().mockResolvedValue({ ok: true });
  });

  function setup() {
    TestBed.configureTestingModule({
      imports: [DeleteEntryDialogComponent],
      providers: [
        { provide: EntryStore, useValue: { remove } },
        { provide: PreferencesStore, useValue: { language } },
      ],
    });
    fixture = TestBed.createComponent(DeleteEntryDialogComponent);
    fixture.componentRef.setInput('day', '2026-10-14');
    cancelled = vi.fn<() => void>();
    deleted = vi.fn<() => void>();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    fixture.componentInstance.deleted.subscribe(deleted);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    fixture?.nativeElement.remove();
    vi.restoreAllMocks();
  });

  const cancelButton = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('button.cancel')!;
  const confirmButton = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('button.confirm')!;

  it('is a labelled, described alert dialog with the copy', () => {
    const el = setup();
    const dialog = el.querySelector('[role="alertdialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(el.querySelector('#w4a-delete-title')!.textContent).toBe('Delete this entry?');
    expect(el.querySelector('#w4a-delete-body')!.textContent).toBe("This removes the day's numbers.");
    expect(dialog.getAttribute('aria-labelledby')).toBe('w4a-delete-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('w4a-delete-body');
    expect(confirmButton(el).textContent).toContain('Delete');
    expect(cancelButton(el).textContent).toContain('Cancel');
  });

  it('puts the initial focus on Cancel', async () => {
    // jsdom has no layout, so the focus trap would find nothing visible.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    const el = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cancelButton(el).hasAttribute('cdkFocusInitial')).toBe(true);
    expect(document.activeElement).toBe(cancelButton(el));
  });

  it('speaks Italian', () => {
    language.set('it');
    const el = setup();
    expect(el.querySelector('#w4a-delete-title')!.textContent).toBe('Eliminare questa registrazione?');
    expect(el.querySelector('#w4a-delete-body')!.textContent).toBe('Verranno rimossi i numeri del giorno.');
    expect(confirmButton(el).textContent).toContain('Elimina');
    expect(cancelButton(el).textContent).toContain('Annulla');
  });

  it('Cancel, the scrim and Esc all cancel without removing', () => {
    const el = setup();
    cancelButton(el).click();
    el.querySelector<HTMLElement>('.backdrop')!.click();
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    el.querySelector('[role="alertdialog"]')!.dispatchEvent(esc);
    expect(cancelled).toHaveBeenCalledTimes(3);
    expect(esc.defaultPrevented).toBe(true);
    expect(remove).not.toHaveBeenCalled();
  });

  it('Esc cancels even when focus has dropped to the body', () => {
    setup();
    (document.activeElement as HTMLElement | null)?.blur();
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.body.dispatchEvent(esc);
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(esc.defaultPrevented).toBe(true);
  });

  it('destroyed while in flight: drops the draft on success and emits nothing', async () => {
    let finish!: (r: EntryResult) => void;
    remove.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const el = setup();
    const drafts = TestBed.inject(DraftStore);
    drafts.set('2026-10-14', 'weight', '70.2');
    confirmButton(el).click();
    fixture.destroy();
    finish({ ok: true });
    await Promise.resolve();
    await Promise.resolve();
    expect(drafts.get('2026-10-14')).toEqual({});
    expect(deleted).not.toHaveBeenCalled();
  });

  it('a confirmed delete removes the Day, drops its draft and emits deleted', async () => {
    const el = setup();
    const drafts = TestBed.inject(DraftStore);
    drafts.set('2026-10-14', 'weight', '70.2');
    confirmButton(el).click();
    await fixture.whenStable();
    expect(remove).toHaveBeenCalledWith('2026-10-14');
    expect(deleted).toHaveBeenCalledTimes(1);
    expect(drafts.get('2026-10-14')).toEqual({});
  });

  it('while in flight Delete shows Deleting…, is disabled, and Cancel is ignored', async () => {
    let finish!: (r: EntryResult) => void;
    remove.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const el = setup();
    confirmButton(el).click();
    fixture.detectChanges();
    expect(confirmButton(el).disabled).toBe(true);
    expect(confirmButton(el).textContent).toContain('Deleting…');
    confirmButton(el).click();
    cancelButton(el).click();
    expect(cancelled).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(1);
    finish({ ok: true });
    await fixture.whenStable();
    expect(deleted).toHaveBeenCalledTimes(1);
  });

  it('a failed delete stays open with a persistent alert and can be retried', async () => {
    remove.mockResolvedValueOnce({ ok: false, code: 'network' });
    const el = setup();
    confirmButton(el).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(deleted).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain(
      "Couldn't delete. Nothing was removed. Try again.",
    );
    expect(confirmButton(el).disabled).toBe(false);
    await fixture.whenStable();
    expect(document.activeElement).toBe(confirmButton(el));
    confirmButton(el).click();
    await fixture.whenStable();
    expect(remove).toHaveBeenCalledTimes(2);
    expect(deleted).toHaveBeenCalledTimes(1);
  });
});
