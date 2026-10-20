import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthResult, AuthService } from '../../core/data/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let register: ReturnType<typeof vi.fn<(e: string, p: string) => Promise<AuthResult>>>;

  beforeEach(async () => {
    localStorage.clear();
    register = vi.fn<(e: string, p: string) => Promise<AuthResult>>().mockResolvedValue({ ok: true });
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { register } }],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function setup() {
    const fixture = TestBed.createComponent(RegisterComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const email = el.querySelector<HTMLInputElement>('#register-email')!;
    const password = el.querySelector<HTMLInputElement>('#register-password')!;
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

  it('registers and navigates to /today on success', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    expect(register).toHaveBeenCalledWith('a@b.it', 'secret1');
    expect(navigate).toHaveBeenCalledWith('/today');
  });

  it('shows email-in-use under the email field and focuses it', async () => {
    register.mockResolvedValue({ ok: false, code: 'email-in-use' });
    const { el, email, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    const error = el.querySelector('#register-email-error')!;
    expect(error.textContent).toContain('already has an account');
    expect(error.getAttribute('aria-live')).toBe('polite');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
  });

  it('rejects a malformed email client-side and focuses it', async () => {
    const { el, email, fill, submit } = await setup();
    fill('nope', 'secret1');
    await submit();
    expect(register).not.toHaveBeenCalled();
    expect(el.querySelector('#register-email-error')!.textContent).toContain('does not look right');
    expect(document.activeElement).toBe(email);
  });

  it('rejects a short password client-side and focuses it', async () => {
    const { el, password, fill, submit } = await setup();
    fill('a@b.it', '12345');
    await submit();
    expect(register).not.toHaveBeenCalled();
    expect(el.querySelector('#register-password-error')!.textContent).toContain('at least 6');
    expect(document.activeElement).toBe(password);
  });

  it('shows both messages and focuses the email when both are invalid', async () => {
    const { el, email, fill, submit } = await setup();
    fill('bad', '123');
    await submit();
    expect(register).not.toHaveBeenCalled();
    expect(el.querySelector('#register-email-error')!.textContent!.trim()).not.toBe('');
    expect(el.querySelector('#register-password-error')!.textContent!.trim()).not.toBe('');
    expect(document.activeElement).toBe(email);
  });

  it('shows a form-level message on network error and keeps the values', async () => {
    register.mockResolvedValue({ ok: false, code: 'network' });
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
    register.mockResolvedValue({ ok: false, code: 'unknown' });
    const { el, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    expect(el.querySelector('.form-error')!.textContent).toContain('Something went wrong');
  });

  it('disables the button and ignores a second submit while pending', async () => {
    let resolve!: (r: AuthResult) => void;
    register.mockReturnValue(new Promise<AuthResult>((r) => (resolve = r)));
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fixture, el, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    const button = el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    expect(button.disabled).toBe(true);
    await submit();
    expect(register).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('does not register again on a second submit during navigation', async () => {
    let finishNav!: (v: boolean) => void;
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(
      new Promise<boolean>((r) => (finishNav = r)),
    );
    const { fixture, el, fill, submit } = await setup();
    fill('a@b.it', 'secret1');
    await submit();
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
    await submit();
    expect(register).toHaveBeenCalledTimes(1);
    finishNav(true);
  });

  it('trims the email before registering', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fill, submit } = await setup();
    fill('  a@b.it  ', 'secret1');
    await submit();
    expect(register).toHaveBeenCalledWith('a@b.it', 'secret1');
  });
});
