import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { I18n } from '../../shared/i18n';

/** Placeholder day screen; it only echoes the unvalidated `dayKey` route parameter. */
@Component({
  selector: 'w4a-history-day',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ t().historyDayPlaceholder({ dayKey: dayKey() }) }}</p>`,
})
export class HistoryDayComponent {
  protected readonly t = inject(I18n).t;
  protected readonly dayKey = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('dayKey') ?? '')),
    { initialValue: '' },
  );
}
