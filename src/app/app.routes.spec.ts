import { Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, Session } from './core/data/auth.service';
import { routes } from './app.routes';
import { HistoryDayComponent } from './features/history/history-day.component';
import { HistoryComponent } from './features/history/history.component';
import { ReportComponent } from './features/report/report.component';
import { ShellComponent } from './shell/shell.component';
import { LoginComponent } from './features/auth/login.component';
import { ResetComponent } from './features/auth/reset.component';
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
          useValue: { session, email: signal<string | null>(null), register: vi.fn(), login: vi.fn(), logout: vi.fn(), sendPasswordReset: vi.fn() },
        },
      ],
    });
  });

  function renders(harness: RouterTestingHarness, type: Type<unknown>): boolean {
    return harness.fixture.debugElement.query(By.directive(type)) !== null;
  }

  function activeTabs(harness: RouterTestingHarness): string[] {
    return Array.from(
      (harness.routeNativeElement as HTMLElement).querySelectorAll('a[aria-current="page"]'),
    ).map((a) => a.getAttribute('href') ?? '');
  }

  async function open(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return harness;
  }

  it('signed out: the empty path ends on LoginComponent', async () => {
    const harness = await open('');
    expect(renders(harness, LoginComponent)).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it.each(['/today', '/settings'])('signed out: %s goes to /login', async (url) => {
    const harness = await open(url);
    expect(renders(harness, LoginComponent)).toBe(true);
  });

  it('signed out: /register renders RegisterComponent', async () => {
    const harness = await open('/register');
    expect(renders(harness, RegisterComponent)).toBe(true);
  });

  it('signed in: the empty path renders TodayComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('');
    expect(renders(harness, TodayComponent)).toBe(true);
  });

  it.each(['/login', '/register'])('signed in: %s redirects to /today', async (url) => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open(url);
    expect(renders(harness, TodayComponent)).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/today');
  });

  it('signed in: /settings renders SettingsComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/settings');
    expect(renders(harness, SettingsComponent)).toBe(true);
  });

  it('reload: waits while unknown and lands on the route without showing login', async () => {
    session.set({ status: 'unknown' });
    const harness = await RouterTestingHarness.create();
    const nav = harness.navigateByUrl('/today');
    TestBed.tick();
    session.set({ status: 'signedIn', uid: 'u1' });
    TestBed.tick();
    await nav;
    expect(renders(harness, TodayComponent)).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/today');
  });

  it('signed out: /reset renders ResetComponent', async () => {
    const harness = await open('/reset');
    expect(renders(harness, ResetComponent)).toBe(true);
  });

  it('signed in: /reset still renders ResetComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/reset');
    expect(renders(harness, ResetComponent)).toBe(true);
  });

  it('signed out: an unknown address ends on LoginComponent', async () => {
    const harness = await open('/foo');
    expect(renders(harness, LoginComponent)).toBe(true);
  });

  it('signed in: an unknown address ends on TodayComponent', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/foo');
    expect(renders(harness, TodayComponent)).toBe(true);
  });

  it('after logout, going back to /today is blocked', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/today');
    await harness.navigateByUrl('/settings');
    session.set({ status: 'signedOut' });
    await harness.navigateByUrl('/today');
    expect(renders(harness, LoginComponent)).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it.each(['/history', '/history/2026-10-19', '/report'])(
    'signed out: %s goes to /login and shows no navigation',
    async (url) => {
      const harness = await open(url);
      expect(renders(harness, LoginComponent)).toBe(true);
      expect(renders(harness, ShellComponent)).toBe(false);
      expect(TestBed.inject(Router).url).toBe('/login');
    },
  );

  it.each([
    ['/today', '/today', TodayComponent],
    ['/history', '/history', HistoryComponent],
    ['/history/2026-10-19', '/history', HistoryDayComponent],
    ['/report', '/report', ReportComponent],
    ['/settings', '/settings', SettingsComponent],
  ] as const)('signed in: %s renders in the shell with %s active', async (url, tab, component) => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open(url);
    expect(renders(harness, ShellComponent)).toBe(true);
    expect(renders(harness, component)).toBe(true);
    expect(activeTabs(harness)).toEqual([tab]);
  });

  it('signed in: the day route shows the Entry edit screen for that Day over History', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/history/2026-10-19');
    expect(renders(harness, HistoryComponent)).toBe(true);
    expect((harness.routeNativeElement as HTMLElement).querySelector('#w4a-day-title')?.textContent).toContain(
      'Mon 19 Oct',
    );
  });

  it.each(['/history/abc', '/history/2026-13-40', '/history/2999-01-01'])(
    'signed in: %s redirects to /history',
    async (url) => {
      session.set({ status: 'signedIn', uid: 'u1' });
      const harness = await open(url);
      expect(TestBed.inject(Router).url).toBe('/history');
      expect(renders(harness, HistoryComponent)).toBe(true);
      expect(renders(harness, HistoryDayComponent)).toBe(false);
    },
  );

  it('signed in: tapping a Tab opens its destination and moves the active mark', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    const harness = await open('/today');
    const report = (harness.routeNativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a[href="/report"]',
    )!;
    report.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/report');
    expect(renders(harness, ReportComponent)).toBe(true);
    expect(activeTabs(harness)).toEqual(['/report']);
  });

  it.each(['/login', '/register', '/reset'])('%s renders outside the shell', async (url) => {
    const harness = await open(url);
    expect(renders(harness, ShellComponent)).toBe(false);
  });
});
