import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PreferencesStore } from '../../core/data/preferences.store';
import { SessionScope } from '../../core/data/session-scope';
import { AuthResult, AuthService } from '../../core/data/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let login: ReturnType<typeof vi.fn<(e: string, p: string) => Promise<AuthResult>>>;

  beforeEach(async () => {
    localStorage.clear();
    login = vi.fn<(e: string, p: string) => Promise<AuthResult>>().mockResolvedValue({ ok: true });
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } },
        { provide: SessionScope, useValue: { registerStore: () => undefined, sessionEpoch: () => 0 } }],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function setup() {
    const fixture = TestBed.createComponent(LoginComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const email = el.querySelector<HTMLInputElement>('#login-email')!;
    const password = el.querySelector<HTMLInputElement>('#login-password')!;
    const fill = (e: string, p: string) => {
      email.value = e;
      email.dispatchEvent(new Event('input'));
      password.value = p;
      password.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, el, email, password, fill, submit };
  }

  it('logs in and navigates to /today on success', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    expect(login).toHaveBeenCalledWith('a@b.it', 'secret1');
    expect(navigate).toHaveBeenCalledWith('/today');
  });

  it('shows one message for wrong credentials and focuses the email', async () => {
    login.mockResolvedValue({ ok: false, code: 'invalid-credentials' });
    const { el, email, fill, submit } = await setup();
    fill('a@b.it', 'wrong');
    await submit();
    const error = el.querySelector('#login-email-error')!;
    expect(error.textContent).toContain('do not match');
    expect(error.getAttribute('aria-live')).toBe('polite');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
    expect(el.querySelector('.form-error')!.textContent!.trim()).toBe('');
  });

  it('shows the same text for an unknown email as for a wrong password', async () => {
    const texts: string[] = [];
    for (const email of ['known@b.it', 'unknown@b.it']) {
      TestBed.resetTestingModule();
      login = vi
        .fn<(e: string, p: string) => Promise<AuthResult>>()
        .mockResolvedValue({ ok: false, code: 'invalid-credentials' });
      await TestBed.configureTestingModule({
        imports: [LoginComponent],
        providers: [provideRouter([]), { provide: AuthService, useValue: { login } },
        { provide: SessionScope, useValue: { registerStore: () => undefined, sessionEpoch: () => 0 } }],
      }).compileComponents();
      const { el, fill, submit } = await setup();
      fill(email, 'pw');
      await submit();
      texts.push(el.querySelector('#login-email-error')!.textContent!.trim());
      document.body.innerHTML = '';
    }
    expect(texts[0]).not.toBe('');
    expect(texts[0]).toBe(texts[1]);
  });

  it('never shows raw Firebase text', async () => {
    login.mockResolvedValue({ ok: false, code: 'invalid-credentials' });
    const { el, fill, submit } = await setup();
    fill('a@b.it', 'wrong');
    await submit();
    expect(el.textContent).not.toMatch(/auth\//);
  });

  it('rejects a malformed email client-side', async () => {
    const { el, email, fill, submit } = await setup();
    fill('nope', 'secret1');
    await submit();
    expect(login).not.toHaveBeenCalled();
    expect(el.querySelector('#login-email-error')!.textContent).toContain('does not look right');
    expect(document.activeElement).toBe(email);
  });

  it('does not call login with an empty password', async () => {
    const { el, email, fill, submit } = await setup();
    fill('a@b.it', '');
    await submit();
    expect(login).not.toHaveBeenCalled();
    expect(el.querySelector('#login-email-error')!.textContent).toContain('do not match');
    expect(document.activeElement).toBe(email);
  });

  it('shows a form-level message on network error and keeps the values', async () => {
    login.mockResolvedValue({ ok: false, code: 'network' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const { el, email, password, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    expect(el.querySelector('.form-error')!.textContent).toContain('could not reach');
    expect(email.value).toBe('a@b.it');
    expect(password.value).toBe('secret1');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a generic form-level message on unknown error', async () => {
    login.mockResolvedValue({ ok: false, code: 'unknown' });
    const { el, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    expect(el.querySelector('.form-error')!.textContent).toContain('Something went wrong');
  });

  it('disables the button and ignores a second submit while pending', async () => {
    let resolve!: (r: AuthResult) => void;
    login.mockReturnValue(new Promise<AuthResult>((r) => (resolve = r)));
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fixture, el, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    const button = el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    expect(button.disabled).toBe(true);
    await submit();
    expect(login).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('trims the email before logging in', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fill, submit } = await setup();
    fill('  a@b.it  ', 'secret1');
    await submit();
    expect(login).toHaveBeenCalledWith('a@b.it', 'secret1');
  });

  it('has no create-account link or text', async () => {
    const { el } = await setup();
    const hrefs = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/reset']);
    expect(el.textContent).not.toMatch(/create an account|new here/i);
  });

  it('shows the brand, the tagline and a decorative illustration', async () => {
    const { el } = await setup();
    expect(el.querySelector('.wordmark')!.textContent!.trim()).toBe('Weight4All');
    expect(el.querySelector('.tagline')!.textContent!.trim()).toBe('Your kind daily check-in.');
    const art = el.querySelector('svg.art')!;
    expect(art.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('h1')!.textContent!.trim()).toBe('Welcome back');
  });

  it('shows the brand and tagline in Italian', async () => {
    TestBed.inject(PreferencesStore).setLanguage('it');
    const { fixture, el } = await setup();
    await fixture.whenStable();
    expect(el.querySelector('.wordmark')!.textContent!.trim()).toBe('Weight4All');
    expect(el.querySelector('.tagline')!.textContent!.trim()).toBe(
      'Il tuo check-in quotidiano, senza giudizi.',
    );
    expect(el.querySelector('h1')!.textContent!.trim()).toBe('Bentornato');
  });

  it('links to /reset', async () => {
    const { el } = await setup();
    const hrefs = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/reset');
  });
});
