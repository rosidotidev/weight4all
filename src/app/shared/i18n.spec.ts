import { TestBed } from '@angular/core/testing';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { PreferencesStore } from '../core/data/preferences.store';
import { SessionScope } from '../core/data/session-scope';
import { I18n, provideMaterialIntl } from './i18n';

describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideMaterialIntl(),
        { provide: SessionScope, useValue: { registerStore: () => undefined, sessionEpoch: () => 0 } },
      ],
    });
  });

  it('is English by default, with English Material labels', () => {
    const i18n = TestBed.inject(I18n);
    const intl = TestBed.inject(MatDatepickerIntl);
    TestBed.tick();
    expect(i18n.t().saved).toBe('Saved!');
    expect(i18n.locale()).toBe('en-GB');
    expect(intl.openCalendarLabel).toBe('Open calendar');
  });

  it('follows the Language signal for texts, locale and Material labels', () => {
    const i18n = TestBed.inject(I18n);
    const intl = TestBed.inject(MatDatepickerIntl);
    const changes = vi.fn();
    intl.changes.subscribe(changes);
    TestBed.tick();
    changes.mockClear();

    TestBed.inject(PreferencesStore).setLanguage('it');
    TestBed.tick();

    expect(i18n.t().saved).toBe('Salvato!');
    expect(i18n.locale()).toBe('it-IT');
    expect(intl.openCalendarLabel).toBe('Apri calendario');
    expect(changes).toHaveBeenCalled();
  });
});
