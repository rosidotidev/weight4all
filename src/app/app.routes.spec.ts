import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, Session } from './core/data/auth.service';
import { routes } from './app.routes';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { SettingsComponent } from './features/settings/settings.component';
import { TodayComponent } from './features/today/today.component';

describe('routes', () => {
  let session: ReturnType<typeof signal<Session>>;

  beforeEach(() => {
    localStorage.clear();
    session = signal<Session>({ status: 'signedOut' });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: { session, register: vi.fn(), login: vi.fn(), logout: vi.fn() },
        },
      ],
    });
  });

  async function open(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return harness;
  }

  it('signed out: the empty path ends on LoginComponent', async () => {
    const harness = await open('');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(LoginComponent);
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it.each(['/today', '/settings'])('signed out: %s goes to /login', async (url) => {
    const harness = await open(url);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(LoginComponent);
  });

  it('signed out: /register renders RegisterComponent', async () => {
    const harness = await open('/register');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(RegisterComponent);
  });

  it('signed in: the empty path renders TodayComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(TodayComponent);
  });

  it.each(['/login', '/register'])('signed in: %s redirects to /today', async (url) => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open(url);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(TodayComponent);
    expect(TestBed.inject(Router).url).toBe('/today');
  });

  it('signed in: /settings renders SettingsComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/settings');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(SettingsComponent);
  });

  it('reload: waits while unknown and lands on the route without showing login', async () => {
    session.set({ status: 'unknown' });
    const harness = await RouterTestingHarness.create();
    const nav = harness.navigateByUrl('/today');
    TestBed.tick();
    session.set({ status: 'signedIn', uid: 'u1' });
    TestBed.tick();
    await nav;
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(TodayComponent);
    expect(TestBed.inject(Router).url).toBe('/today');
  });

  it.each(['/foo', '/reset'])('signed out: unknown address %s ends on LoginComponent', async (url) => {
    const harness = await open(url);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(LoginComponent);
  });

  it('signed in: an unknown address ends on TodayComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/foo');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(TodayComponent);
  });

  it('after logout, going back to /today is blocked', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/today');
    await harness.navigateByUrl('/settings');
    session.set({ status: 'signedOut' });
    await harness.navigateByUrl('/today');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(LoginComponent);
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
