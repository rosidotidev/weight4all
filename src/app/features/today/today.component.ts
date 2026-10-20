import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../shared/i18n';

/** Placeholder landing screen; Story 2.x replaces it. */
@Component({
  selector: 'w4a-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ t().todayPlaceholder }}</p>`,
})
export class TodayComponent {
  protected readonly t = inject(I18n).t;
}
