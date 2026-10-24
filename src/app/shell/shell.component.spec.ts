import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, Session } from '../core/data/auth.service';
import { PreferencesStore } from '../core/data/preferences.store';
import { ClockService } from '../core/state/clock.service';
import { LayoutService } from '../core/state/layout.service';
import { formatDay } from '../domain/day';
import { WindowClass } from '../domain/window-class';
import { TodayComponent } from '../features/today/today.component';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  const windowClass = signal<WindowClass>('compact');
  const language = signal<'en' | 'it'>('en');
  const logout = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    windowClass.set('compact');
    language.set('en');
    logout.mockReset();
    logout.mockResolvedValue({ ok: true });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: ShellComponent,
            children: [
              { path: 'today', component: TodayComponent },
              { path: 'history', component: TodayComponent },
              { path: 'history/:dayKey', component: TodayComponent },
              { path: 'report', component: TodayComponent },
              { path: 'settings', component: TodayComponent },
            ],
          },
          { path: 'login', component: TodayComponent },
        ]),
        { provide: LayoutService, useValue: { windowClass } },
        { provide: PreferencesStore, useValue: { language } },
        {
          provide: AuthService,
          useValue: {
            session: signal<Session>({ status: 'signedIn', uid: 'u1' }),
            email: signal<string | null>('a@example.com'),
            logout,
          },
        },
      ],
    });
  });

  async function setup(url = '/today') {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const el = harness.routeNativeElement as HTMLElement;
    return { harness, el, nav: () => el.querySelector('nav')! };
  }

  it('renders one labeled nav with four links, each with a hidden icon and a label', async () => {
    const { el, nav } = await setup();
    expect(el.querySelectorAll('nav')).toHaveLength(1);
    expect(nav().getAttribute('aria-label')).toBe('Main navigation');
    const links = Array.from(nav().querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/today',
      '/history',
      '/report',
      '/settings',
    ]);
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'Today',
      'History',
      'Report',
      'Settings',
    ]);
    for (const a of links) {
      expect(a.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it.each(['compact', 'medium', 'expanded'] as const)(
    'shows only the %s layout and swaps without reload',
    async (cls) => {
      const { harness, nav } = await setup();
      windowClass.set(cls);
      harness.detectChanges();
      expect(nav().classList.contains(cls)).toBe(true);
      for (const other of (['compact', 'medium', 'expanded'] as const).filter((c) => c !== cls)) {
        expect(nav().classList.contains(other)).toBe(false);
      }
    },
  );

  it('marks only the current Tab, and History stays active on a day', async () => {
    const { nav } = await setup('/history/2026-10-19');
    const current = Array.from(nav().querySelectorAll('a[aria-current="page"]'));
    expect(current.map((a) => a.getAttribute('href'))).toEqual(['/history']);
  });

  it('labels follow the Language', async () => {
    const { harness, nav } = await setup();
    language.set('it');
    harness.detectChanges();
    const labels = Array.from(nav().querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Oggi', 'Storico', 'Report', 'Impostazioni']);
    expect(nav().getAttribute('aria-label')).toBe('Navigazione principale');
  });

  it('titles the app bar with the app name on Today and the Tab name elsewhere', async () => {
    const { harness, el } = await setup('/today');
    const title = () => el.querySelector('header h1')?.textContent?.trim();
    expect(title()).toBe('Weight4All');
    await harness.navigateByUrl('/settings');
    expect(title()).toBe('Settings');
    language.set('it');
    await harness.navigateByUrl('/history/2026-10-19');
    expect(title()).toBe('Storico');
  });

  describe('expanded window class', () => {
    it('starts the drawer with the logo and the app name, and drops the app bar logo', async () => {
      windowClass.set('expanded');
      const { el, nav } = await setup();
      const brand = nav().querySelector('.brand')!;
      expect(brand.textContent).toContain('Weight4All');
      expect(brand.querySelector('.logo')).not.toBeNull();
      expect(el.querySelector('header .logo')).toBeNull();
    });

    it("shows the Tab name and today's date in the app bar", async () => {
      windowClass.set('expanded');
      const { harness, el } = await setup();
      const bar = () => el.querySelector('header')!;
      const today = TestBed.inject(ClockService).today();
      expect(bar().querySelector('h1')!.textContent?.trim()).toBe('Today');
      expect(bar().querySelector('.app-bar-date')!.textContent?.trim()).toBe(formatDay(today, 'en-GB'));
      await harness.navigateByUrl('/settings');
      expect(bar().querySelector('h1')!.textContent?.trim()).toBe('Settings');
      language.set('it');
      harness.detectChanges();
      expect(bar().querySelector('h1')!.textContent?.trim()).toBe('Impostazioni');
      expect(bar().querySelector('.app-bar-date')!.textContent?.trim()).toBe(formatDay(today, 'it-IT'));
    });

    it.each(['compact', 'medium'] as const)('keeps the app bar icon in place of the logo on %s', async (cls) => {
      windowClass.set(cls);
      const { el, nav } = await setup();
      expect(el.querySelector('header .app-bar-icon')).not.toBeNull();
      expect(el.querySelector('header .logo')).toBeNull();
      expect(el.querySelector('header h1')!.textContent?.trim()).toBe('Weight4All');
      expect(el.querySelector('.app-bar-date')).toBeNull();
      expect(nav().querySelector('.brand')).toBeNull();
    });
  });

  describe('app bar icon and exit', () => {
    const tabs = [
      ['/today', 'Today'],
      ['/history/2026-10-19', 'History'],
      ['/report', 'Report'],
      ['/settings', 'Settings'],
    ] as const;

    function iconPath(root: Element): string | null {
      return root.querySelector('.app-bar-icon path')?.getAttribute('d') ?? null;
    }

    function exit(el: HTMLElement): HTMLButtonElement {
      return el.querySelector<HTMLButtonElement>('header .app-bar-exit')!;
    }

    it.each(tabs)('shows the bottom-nav icon of the active Tab on %s', async (url) => {
      const { el, nav } = await setup(url);
      const active = nav().querySelector('a[aria-current="page"] svg path')!;
      expect(iconPath(el.querySelector('header')!)).toBe(active.getAttribute('d'));
    });

    it.each(['compact', 'medium', 'expanded'] as const)('places the icon before the title on %s', async (cls) => {
      windowClass.set(cls);
      const { el } = await setup('/report');
      const bar = el.querySelector('header')!;
      expect(bar.firstElementChild?.classList.contains('app-bar-icon')).toBe(true);
      expect(bar.querySelector('.app-bar-icon')!.getAttribute('aria-hidden')).toBe('true');
    });

    const cases = tabs.flatMap(([url]) =>
      (['compact', 'medium', 'expanded'] as const).map((cls) => [url, cls] as const),
    );

    it.each(cases)('shows the exit button on %s at %s', async (url, cls) => {
      windowClass.set(cls);
      const { el } = await setup(url);
      const button = exit(el);
      expect(button.getAttribute('aria-label')).toBe('Log out');
      expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('logs out once and navigates to /login with replace', async () => {
      const { harness, el } = await setup('/today');
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl');
      exit(el).click();
      await harness.fixture.whenStable();
      expect(logout).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
      expect(router.url).toBe('/login');
    });

    it('unlocks the exit button and shows the failure when the navigation does not complete', async () => {
      const { harness, el } = await setup('/today');
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
      exit(el).click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(exit(el).disabled).toBe(false);
      expect(el.querySelector('.app-bar-error')!.textContent?.trim()).not.toBe('');
    });

    it('clears the failure once the user goes to another Tab', async () => {
      logout.mockResolvedValue({ ok: false, code: 'network' });
      const { harness, el } = await setup('/today');
      exit(el).click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(el.querySelector('.app-bar-error')!.textContent?.trim()).not.toBe('');
      await harness.navigateByUrl('/settings');
      harness.detectChanges();
      expect(el.querySelector('.app-bar-error')!.textContent?.trim()).toBe('');
    });

    it('shows the failure under the app bar and keeps the session', async () => {
      logout.mockResolvedValue({ ok: false, code: 'network' });
      const { harness, el } = await setup('/today');
      exit(el).click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/today');
      expect(exit(el).disabled).toBe(false);
      const message = el.querySelector('.app-bar-error')!;
      expect(message.getAttribute('aria-live')).toBe('polite');
      expect(message.textContent?.trim()).toBe(
        'Something went wrong on our side. Please try again in a moment.',
      );
    });

    it('ignores a second tap while the logout is pending', async () => {
      logout.mockReturnValue(new Promise(() => undefined));
      const { harness, el } = await setup('/today');
      exit(el).click();
      exit(el).click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(logout).toHaveBeenCalledTimes(1);
      expect(exit(el).disabled).toBe(true);
    });

    it('labels the exit button Esci in Italian', async () => {
      const { harness, el } = await setup('/today');
      language.set('it');
      harness.detectChanges();
      expect(exit(el).getAttribute('aria-label')).toBe('Esci');
    });
  });
});
