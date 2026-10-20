import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../shared/i18n';

/** Placeholder Report screen; Epic 4 replaces it. */
@Component({
  selector: 'w4a-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ t().reportPlaceholder }}</p>`,
})
export class ReportComponent {
  protected readonly t = inject(I18n).t;
}
