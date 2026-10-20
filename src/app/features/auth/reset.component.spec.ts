import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthResult, AuthService } from '../../core/data/auth.service';
import { ResetComponent } from './reset.component';

describe('ResetComponent', () => {
  let sendPasswordReset: ReturnType<typeof vi.fn<(e: string) => Promise<AuthResult>>>;

  beforeEach(async () => {
    localStorage.clear();
    sendPasswordReset = vi.fn<(e: string) => Promise<AuthResult>>().mockResolvedValue({ ok: true });
    await TestBed.configureTestingModule({
      imports: [ResetComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { sendPasswordReset } }],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function setup() {
    const fixture = TestBed.createComponent(ResetComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const email = el.querySelector<HTMLInputElement>('#reset-email')!;
    const fill = (e: string) => {
      email.value = e;
      email.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector('form')?.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, el, email, fill, submit };
  }

  it('shows the neutral confirmation and hides the form on success', async () => {
    const { el, fill, submit } = await setup();
    fill('a@b.it');
    await submit();
    expect(sendPasswordReset).toHaveBeenCalledWith('a@b.it');
    expect(el.querySelector('form')).toBeNull();
    const confirmation = el.querySelector('.confirmation')!;
    expect(confirmation.textContent).toContain('If this email has an account');
    expect(confirmation.closest('[aria-live]')?.getAttribute('aria-live')).toBe('polite');
    expect(confirmation.textContent).not.toContain('a@b.it');
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/login');
  });

  it('shows the identical confirmation for registered and unregistered addresses', async () => {
    // The service maps auth/user-not-found to ok, so the screen sees ok in both cases.
    const texts: string[] = [];
    for (const address of ['known@b.it', 'unknown@b.it']) {
      document.body.innerHTML = '';
      const { el, fill, submit } = await setup();
      fill(address);
      await submit();
      texts.push(el.querySelector('.confirmation')!.textContent!.trim());
    }
    expect(texts[0]).not.toBe('');
    expect(texts[0]).toBe(texts[1]);
  });

  it.each(['abc', '', 'a@b'])('rejects %j inline, focuses the field, calls nothing', async (value) => {
    const { el, email, fill, submit } = await setup();
    fill(value);
    await submit();
    expect(sendPasswordReset).not.toHaveBeenCalled();
    const error = el.querySelector('#reset-email-error')!;
    expect(error.textContent).toContain('does not look right');
    expect(error.getAttribute('aria-live')).toBe('polite');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
    expect(email.value).toBe(value);
  });

  it.each([
    ['network', 'could not reach'],
    ['unknown', 'Something went wrong'],
  ] as const)('shows a form-level message on %s and keeps the value', async (code, text) => {
    sendPasswordReset.mockResolvedValue({ ok: false, code });
    const { el, email, fill, submit } = await setup();
    fill('a@b.it');
    await submit();
    expect(el.querySelector('.form-error')!.textContent).toContain(text);
    expect(el.querySelector('.confirmation')).toBeNull();
    expect(email.value).toBe('a@b.it');
  });

  it('disables the button and ignores a second submit while pending', async () => {
    let resolve!: (r: AuthResult) => void;
    sendPasswordReset.mockReturnValue(new Promise<AuthResult>((r) => (resolve = r)));
    const { el, fill, submit } = await setup();
    fill('a@b.it');
    await submit();
    expect(el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
    await submit();
    expect(sendPasswordReset).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    await new Promise((r) => setTimeout(r));
  });

  it('links back to /login from the form', async () => {
    const { el } = await setup();
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/login');
  });

  it('never shows raw Firebase text', async () => {
    sendPasswordReset.mockResolvedValue({ ok: false, code: 'unknown' });
    const { el, fill, submit } = await setup();
    fill('a@b.it');
    await submit();
    expect(el.textContent).not.toMatch(/auth\//);
  });
});
