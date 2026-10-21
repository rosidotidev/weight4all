import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { DraftStore } from '../../core/state/draft.store';
import { LayoutService } from '../../core/state/layout.service';
import { formatDay } from '../../domain/day';
import { PRIMARY } from '../../domain/dimensions';
import { Entry } from '../../domain/entry';
import { HappyEffect, happyEffect } from '../../domain/happy-effect';
import { EntryFormComponent } from '../../shared/entry-form.component';
import { I18n } from '../../shared/i18n';
import { LiveAnnouncer } from '../../shared/live-announcer';
import { HappyEffectComponent } from '../today/happy-effect.component';
import { DeleteEntryDialogComponent } from './delete-entry-dialog.component';

interface ShownEffect {
  readonly effect: HappyEffect;
  readonly value: number;
}

/**
 * Entry edit for one Day (FR-12): the shared Entry form, full screen on compact and a dialog over
 * the History list from medium up. Opened by the guarded `/history/:dayKey` child route.
 */
@Component({
  selector: 'w4a-history-day',
  imports: [A11yModule, DeleteEntryDialogComponent, EntryFormComponent, HappyEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)', '(click)': 'onClick($event)' },
  templateUrl: './history-day.component.html',
  styleUrl: './history-day.component.scss',
})
export class HistoryDayComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly store = inject(EntryStore);
  private readonly clock = inject(ClockService);
  private readonly drafts = inject(DraftStore);
  private readonly router = inject(Router);
  private readonly layout = inject(LayoutService);
  private readonly announcer = inject(LiveAnnouncer);
  protected readonly wide = computed(() => this.layout.windowClass() !== 'compact');

  /** Already validated by the route guard. */
  protected readonly day = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('dayKey') ?? '')),
    { initialValue: '' },
  );

  /** Whether the Delete confirmation is open over this screen. */
  protected readonly confirmingDelete = signal(false);

  private readonly effect = signal<ShownEffect | null>(null);
  protected readonly shownEffects = computed(() => {
    const shown = this.effect();
    return shown ? [shown] : [];
  });

  protected readonly title = computed(() => {
    const date = formatDay(this.day(), this.i18n.locale());
    const t = this.t();
    if (this.store.status() !== 'ready') return t.entryDayTitle({ date });
    return this.store.entries()[this.day()] ? t.entryEditTitle({ date }) : t.entryAddTitle({ date });
  });

  /** Only a confirmed save of today's Entry earns the Happy effect; a past Day just closes. */
  protected onConfirmed(entry: Entry): void {
    this.announcer.say(this.t().announceSaved);
    const value = entry.values[PRIMARY.key];
    if (value === undefined || entry.day !== this.clock.today()) {
      this.close();
      return;
    }
    this.effect.set({ effect: happyEffect(entry.day, value, this.store.entries()), value });
  }

  /** Cancel, Esc or the scrim: forget what was typed for the Day and go back. */
  protected cancel(): void {
    this.drafts.drop(this.day());
    this.close();
  }

  /** Only a click that lands on the scrim itself counts, not one inside the panel. */
  protected onClick(event: Event): void {
    if (event.target instanceof HTMLElement && event.target.classList.contains('scrim')) this.cancel();
  }

  protected onEscape(event: Event): void {
    // The Happy effect card handles its own Esc.
    // The Delete confirmation closes itself on Esc and marks the event handled.
    if (event.defaultPrevented || this.effect() || this.confirmingDelete()) return;
    this.cancel();
  }

  protected onDeleted(): void {
    this.announcer.say(this.t().announceDeleted);
    this.confirmingDelete.set(false);
    this.close();
  }

  protected close(): void {
    void this.router.navigate(['/history']);
  }
}
