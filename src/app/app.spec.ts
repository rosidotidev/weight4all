import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionScope } from './core/data/session-scope';
import { EntryStore } from './core/data/entry.store';
import { PreferencesStore } from './core/data/preferences.store';
import { DraftStore } from './core/state/draft.store';
import { App } from './app';
import { I18n } from './shared/i18n';
import { LiveAnnouncer } from './shared/live-announcer';

@Component({
  selector: 'w4a-test-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p id="saved">{{ t().saved }}</p><input id="field" />`,
})
class TestHost {
  protected readonly t = inject(I18n).t;
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    await TestBed.configureTestingModule({
      imports: [App, TestHost],
    }).compileComponents();
  });

  afterEach(() => {
    document.head.querySelectorAll('style[data-test-theme]').forEach((s) => s.remove());
    document.documentElement.style.removeProperty('--test-chart');
    document.documentElement.className = '';
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sets <html lang> to English by default', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(document.documentElement.lang).toBe('en');
  });

  it('applies the default theme class to <html> and keeps chart tokens when it changes', async () => {
    document.documentElement.className = '';
    const style = document.createElement('style');
    style.dataset['testTheme'] = '';
    style.textContent = ':root { --w4a-chart-weight: var(--test-chart); } .theme-teal { --w4a-primary: var(--test-chart); }';
    document.head.appendChild(style);
    document.documentElement.style.setProperty('--test-chart', 'chart-value');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = document.documentElement;
    expect(root.classList.contains('theme-violet')).toBe(true);

    const chart = () => getComputedStyle(root).getPropertyValue('--w4a-chart-weight').trim();
    const before = chart();
    await TestBed.inject(PreferencesStore).setAccent('teal');
    await fixture.whenStable();
    expect(root.classList.contains('theme-teal')).toBe(true);
    expect(chart()).toBe(before);
  });

  it('keeps exactly one theme class, following the accent', async () => {
    document.documentElement.className = 'theme-orange other';
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const themes = () => Array.from(document.documentElement.classList).filter((c) => c.startsWith('theme-'));
    expect(themes()).toEqual(['theme-violet']);
    await TestBed.inject(PreferencesStore).setAccent('green');
    await fixture.whenStable();
    expect(themes()).toEqual(['theme-green']);
    expect(document.documentElement.classList.contains('other')).toBe(true);
  });

  it('starts with the cached accent class', async () => {
    localStorage.setItem('w4a.accent', 'orange');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(document.documentElement.classList.contains('theme-orange')).toBe(true);
  });

  it('switches <html lang> and texts at once, keeping typed input', async () => {
    const app = TestBed.createComponent(App);
    const host = TestBed.createComponent(TestHost);
    await app.whenStable();
    await host.whenStable();
    const el = host.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#field')!;
    input.value = '72.5';
    expect(el.querySelector('#saved')!.textContent).toBe('Saved!');

    TestBed.inject(PreferencesStore).setLanguage('it');
    await app.whenStable();
    await host.whenStable();

    expect(document.documentElement.lang).toBe('it');
    expect(el.querySelector('#saved')!.textContent).toBe('Salvato!');
    expect(el.querySelector<HTMLInputElement>('#field')).toBe(input);
    expect(input.value).toBe('72.5');
  });

  it('renders one polite status region that shows what is announced', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(App);
      const region = () => fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      expect(region()).not.toBeNull();
      TestBed.inject(LiveAnnouncer).say('Saved');
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(region().textContent?.trim()).toBe('Saved');
    } finally {
      vi.useRealTimers();
    }
  });

  it('instantiates EntryStore at startup so it registers with SessionScope', () => {
    const registered: unknown[] = [];
    TestBed.overrideProvider(SessionScope, {
      useFactory: () => ({ registerStore: (s: unknown) => registered.push(s), sessionEpoch: () => 0 }),
      deps: [],
    });
    TestBed.createComponent(App);
    expect(registered).toContain(TestBed.inject(EntryStore));
  });

  it('starts SessionScope when App is created', () => {
    let created = 0;
    TestBed.overrideProvider(SessionScope, {
      useFactory: () => {
        created++;
        return { registerStore: () => undefined, sessionEpoch: () => 0 };
      },
      deps: [],
    });
    expect(created).toBe(0);
    TestBed.createComponent(App);
    expect(created).toBe(1);
  });

  it('instantiates DraftStore at startup', () => {
    let created = 0;
    TestBed.overrideProvider(DraftStore, {
      useFactory: () => {
        created++;
        return { reset: () => undefined };
      },
      deps: [],
    });
    expect(created).toBe(0);
    TestBed.createComponent(App);
    expect(created).toBe(1);
  });
});
