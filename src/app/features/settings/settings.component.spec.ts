import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthResult, AuthService } from '../../core/data/auth.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let logout: ReturnType<typeof vi.fn<() => Promise<AuthResult>>>;

  beforeEach(async () => {
    localStorage.clear();
    logout = vi.fn<() => Promise<AuthResult>>().mockResolvedValue({ ok: true });
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { logout } }],
    }).compileComponents();
  });

  async function setup() {
    const fixture = TestBed.createComponent(SettingsComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, button: el.querySelector('button')! };
  }

  it('logs out and navigates to /login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fixture, button } = await setup();
    expect(button.textContent).toContain('Log out');
    button.click();
    await fixture.whenStable();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('stays put and shows a message when logout fails', async () => {
    logout.mockResolvedValue({ ok: false, code: 'network' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const { fixture, el, button } = await setup();
    button.click();
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector('.error')!.textContent).toContain('Something went wrong');
    expect(button.disabled).toBe(false);
  });
});
