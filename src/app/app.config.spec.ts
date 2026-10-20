import { TestBed } from '@angular/core/testing';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { appConfig } from './app.config';
import { PreferencesStore } from './core/data/preferences.store';
import { LocalizedDatepickerIntl } from './shared/i18n';

describe('appConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });

  it('registers the localized Material datepicker labels', () => {
    const intl = TestBed.inject(MatDatepickerIntl);
    expect(intl).toBeInstanceOf(LocalizedDatepickerIntl);
    TestBed.inject(PreferencesStore).setLanguage('it');
    TestBed.tick();
    expect(intl.openCalendarLabel).toBe('Apri calendario');
  });
});
