import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EntryStore } from '../../core/data/entry.store';
import { DraftStore } from '../../core/state/draft.store';
import { I18n } from '../../shared/i18n';

/**
 * The Delete confirmation (FR-13): an M3 alert dialog over a scrim. Cancel is the default focus;
 * the Entry is removed only when Bob presses Delete and the server confirms.
 */
@Component({
  selector: 'w4a-delete-entry-dialog',
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  templateUrl: './delete-entry-dialog.component.html',
  styleUrl: './delete-entry-dialog.component.scss',
})
export class DeleteEntryDialogComponent {
  protected readonly t = inject(I18n).t;
  private readonly store = inject(EntryStore);
  private readonly drafts = inject(DraftStore);

  private destroyed = false;
  private readonly injector = inject(Injector);
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  readonly day = input.required<string>();
  readonly cancelled = output<void>();
  readonly deleted = output<void>();

  protected readonly deleting = signal(false);
  protected readonly failed = signal(false);

  /** Cancel, Esc and the scrim all land here; ignored while the request is in flight. */
  protected cancel(): void {
    if (this.deleting()) return;
    this.cancelled.emit();
  }

  /** Esc closes this dialog only, never the Entry edit behind it. */
  protected onEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cancel();
  }

  protected async confirm(): Promise<void> {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.failed.set(false);
    const day = this.day();
    const result = await this.store.remove(day);
    if (this.destroyed) {
      // Left while the request was in flight: keep the store consistent, touch nothing else.
      if (result.ok) this.drafts.drop(day);
      return;
    }
    this.deleting.set(false);
    if (!result.ok) {
      this.failed.set(true);
      // The disabled button dropped focus; put it back inside the trap so Delete can be pressed again.
      afterNextRender(() => this.confirmButton()?.nativeElement.focus(), { injector: this.injector });
      return;
    }
    this.drafts.drop(day);
    this.deleted.emit();
  }
}
