import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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

  beforeEach(() => {
    localStorage.clear();
    windowClass.set('compact');
    language.set('en');
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
        ]),
        { provide: LayoutService, useValue: { windowClass } },
        { provide: PreferencesStore, useValue: { language } },
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

    it.each(['compact', 'medium'] as const)('keeps the current app bar on %s', async (cls) => {
      windowClass.set(cls);
      const { el, nav } = await setup();
      expect(el.querySelector('header .logo')).not.toBeNull();
      expect(el.querySelector('header h1')!.textContent?.trim()).toBe('Weight4All');
      expect(el.querySelector('.app-bar-date')).toBeNull();
      expect(nav().querySelector('.brand')).toBeNull();
    });
  });
});
