import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../shared/i18n';

/** Placeholder History screen; Epic 3 replaces it. */
@Component({
  selector: 'w4a-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ t().historyPlaceholder }}</p>`,
})
export class HistoryComponent {
  protected readonly t = inject(I18n).t;
}
