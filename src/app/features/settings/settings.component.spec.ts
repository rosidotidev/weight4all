import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthResult, AuthService } from '../../core/data/auth.service';
import { PreferencesStore } from '../../core/data/preferences.store';
import { Accent } from '../../domain/accent';
import { Language } from '../../domain/language';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let logout: ReturnType<typeof vi.fn<() => Promise<AuthResult>>>;
  let language: ReturnType<typeof signal<Language>>;
  let saveError: ReturnType<typeof signal<boolean>>;
  let setLanguage: ReturnType<typeof vi.fn<(l: Language) => Promise<void>>>;
  let accent: ReturnType<typeof signal<Accent>>;
  let accentSaveError: ReturnType<typeof signal<boolean>>;
  let setAccent: ReturnType<typeof vi.fn<(a: Accent) => Promise<void>>>;
  let email: ReturnType<typeof signal<string | null>>;

  beforeEach(async () => {
    localStorage.clear();
    logout = vi.fn<() => Promise<AuthResult>>().mockResolvedValue({ ok: true });
    language = signal<Language>('en');
    saveError = signal(false);
    accent = signal<Accent>('violet');
    accentSaveError = signal(false);
    setAccent = vi.fn<(a: Accent) => Promise<void>>().mockResolvedValue(undefined);
    email = signal<string | null>('bob@example.com');
    setLanguage = vi.fn<(l: Language) => Promise<void>>().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout, email } },
        { provide: PreferencesStore, useValue: { language, saveError, setLanguage, accent, accentSaveError, setAccent } },
      ],
    }).compileComponents();
  });

  async function setup() {
    const fixture = TestBed.createComponent(SettingsComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      logoutButton: el.querySelector('button')!,
      radios: Array.from(el.querySelectorAll<HTMLInputElement>('input[name="language"]')),
      swatches: Array.from(el.querySelectorAll<HTMLInputElement>('input[name="accent"]')),
    };
  }

  const labelsOf = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.segment')).map((l) => l.textContent!.trim());

  it('logs out and navigates to /login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fixture, logoutButton } = await setup();
    expect(logoutButton.textContent).toContain('Log out');
    logoutButton.click();
    await fixture.whenStable();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('stays put and shows a message when logout fails', async () => {
    logout.mockResolvedValue({ ok: false, code: 'network' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const { fixture, el, logoutButton } = await setup();
    logoutButton.click();
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector('.logout-error')!.textContent).toContain('Something went wrong');
    expect(logoutButton.disabled).toBe(false);
  });

  it('shows the Account section with the email', async () => {
    const { el } = await setup();
    const text = el.textContent!;
    expect(text).toContain('Account');
    expect(text).toContain('Signed in as');
    expect(text).toContain('bob@example.com');
  });

  it('names the Language group with a fieldset legend and two radio options', async () => {
    const { el, radios } = await setup();
    expect(el.querySelectorAll('fieldset legend')[1].textContent).toContain('Language');
    expect(radios).toHaveLength(2);
    expect(labelsOf(el)).toEqual(['English', 'Italiano']);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
  });

  it('checks the option of the current Language', async () => {
    language.set('it');
    const { radios } = await setup();
    expect(radios.map((r) => r.checked)).toEqual([false, true]);
  });

  it('saves the Language chosen', async () => {
    const { fixture, radios } = await setup();
    radios[1].click();
    await fixture.whenStable();
    expect(setLanguage).toHaveBeenCalledWith('it');
  });

  it('keeps the option labels fixed while the rest follows an Italian Language', async () => {
    language.set('it');
    const { el } = await setup();
    expect(labelsOf(el)).toEqual(['English', 'Italiano']);
  });

  it('keeps a polite live region rendered and fills it on a save error', async () => {
    const { fixture, el } = await setup();
    const region = el.querySelector('.language-error')!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent!.trim()).toBe('');
    saveError.set(true);
    await fixture.whenStable();
    expect(el.querySelector('.language-error')).toBe(region);
    expect(region.textContent).toContain('could not save your language');
  });

  it('shows six accent radios in one group with names in English', async () => {
    const { el, swatches } = await setup();
    expect(el.querySelectorAll('fieldset legend')[0].textContent).toContain('Accent color');
    expect(swatches.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Violet',
      'Teal',
      'Orange',
      'Magenta',
      'Blue',
      'Green',
    ]);
    expect(swatches.map((r) => r.value)).toEqual(['violet', 'teal', 'orange', 'magenta', 'blue', 'green']);
    expect(new Set(swatches.map((r) => r.name))).toEqual(new Set(['accent']));
  });

  it('names the swatches in Italian', async () => {
    language.set('it');
    const { swatches } = await setup();
    expect(swatches.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Viola',
      'Verde acqua',
      'Arancione',
      'Magenta',
      'Blu',
      'Verde',
    ]);
  });

  it('fills each circle from its seed token', async () => {
    const { el } = await setup();
    const circles = Array.from(el.querySelectorAll<HTMLElement>('.swatch span'));
    expect(circles.map((c) => c.style.background)).toEqual(
      ['violet', 'teal', 'orange', 'magenta', 'blue', 'green'].map((id) => `var(--w4a-accent-${id})`),
    );
  });

  it('checks the swatch of the current accent', async () => {
    accent.set('orange');
    const { swatches } = await setup();
    expect(swatches.map((r) => r.checked)).toEqual([false, false, true, false, false, false]);
  });

  it('saves the accent chosen', async () => {
    const { fixture, swatches } = await setup();
    swatches[1].click();
    await fixture.whenStable();
    expect(setAccent).toHaveBeenCalledWith('teal');
  });

  it('keeps an accent live region rendered and fills it on a save error', async () => {
    const { fixture, el } = await setup();
    const region = el.querySelector('.accent-error')!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent!.trim()).toBe('');
    accentSaveError.set(true);
    await fixture.whenStable();
    expect(el.querySelector('.accent-error')).toBe(region);
    expect(region.textContent).toContain('could not save your color');
  });
});
