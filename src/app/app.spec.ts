import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from './core/data/preferences.store';
import { App } from './app';
import { I18n } from './shared/i18n';

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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sets <html lang> to English by default', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(document.documentElement.lang).toBe('en');
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
});
