import { Injectable, computed, effect, inject } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { PreferencesStore } from '../core/data/preferences.store';
import { LOCALES } from '../domain/language';
import { Resolved, StringKey, strings } from './strings';

/** Resolves the dictionary for the current Language; templates read `i18n.t().key`. */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly preferences = inject(PreferencesStore);

  readonly language = this.preferences.language;
  readonly locale = computed(() => LOCALES[this.language()]);
  readonly t = computed<Resolved>(() => {
    const lang = this.language();
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(strings) as StringKey[]) out[key] = strings[key][lang];
    return out as Resolved;
  });
}

/** Material datepicker labels that follow the Language signal. */
@Injectable()
export class LocalizedDatepickerIntl extends MatDatepickerIntl {
  private readonly i18n = inject(I18n);

  constructor() {
    super();
    effect(() => {
      const t = this.i18n.t();
      this.calendarLabel = t.datepickerCalendar;
      this.openCalendarLabel = t.datepickerOpenCalendar;
      this.closeCalendarLabel = t.datepickerCloseCalendar;
      this.prevMonthLabel = t.datepickerPrevMonth;
      this.nextMonthLabel = t.datepickerNextMonth;
      this.prevYearLabel = t.datepickerPrevYear;
      this.nextYearLabel = t.datepickerNextYear;
      this.prevMultiYearLabel = t.datepickerPrevMultiYear;
      this.nextMultiYearLabel = t.datepickerNextMultiYear;
      this.switchToMonthViewLabel = t.datepickerSwitchToMonthView;
      this.switchToMultiYearViewLabel = t.datepickerSwitchToMultiYearView;
      this.startDateLabel = t.datepickerStartDate;
      this.endDateLabel = t.datepickerEndDate;
      this.comparisonDateLabel = t.datepickerComparisonDate;
      this.changes.next();
    });
  }
}

/** Later stories add the `*Intl` of every Material component they use. */
export function provideMaterialIntl() {
  return [{ provide: MatDatepickerIntl, useClass: LocalizedDatepickerIntl }];
}
