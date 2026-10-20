import { DOCUMENT } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { EntryStore } from '../../core/data/entry.store';
import { ClockService } from '../../core/state/clock.service';
import { DIMENSIONS } from '../../domain/dimensions';
import { formatDay } from '../../domain/day';
import { Entry } from '../../domain/entry';
import { HistoryRow, buildHistoryRows } from '../../domain/history';
import { formatNumber } from '../../domain/number';
import { I18n } from '../../shared/i18n';
import { DeleteEntryDialogComponent } from './delete-entry-dialog.component';

/** Material "edit" (pencil) and "more vert" icons, 24x24 viewBox. */
const PENCIL =
  'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z';
const DOTS = 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z';
/** How far a touch drag must go to reveal or hide the Edit action. */
const SWIPE_PX = 48;

interface Cell {
  readonly key: string;
  /** The formatted value with its unit, or `null` when the Entry has none. */
  readonly text: string | null;
}

/** History: every Entry newest first with dashed rows for the Days in between, in a virtual list. */
@Component({
  selector: 'w4a-history',
  imports: [ScrollingModule, RouterLink, RouterOutlet, MatMenuModule, DeleteEntryDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { tabindex: '-1' },
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly store = inject(EntryStore);
  private readonly clock = inject(ClockService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly pencil = PENCIL;
  protected readonly dots = DOTS;
  /** The Day whose Edit action is revealed; one row at a time. */
  protected readonly revealed = signal<string | null>(null);
  /** The Day whose Delete confirmation is open. */
  protected readonly deleting = signal<string | null>(null);
  private opener: HTMLElement | null = null;
  private swipe: { x: number; y: number; day: string; done: boolean } | null = null;

  protected readonly rows = computed(() => buildHistoryRows(this.store.entries(), this.clock.today()));

  protected readonly trackRow = (_: number, row: HistoryRow) => row.day;

  protected dateOf(row: HistoryRow): string {
    return formatDay(row.day, this.i18n.locale());
  }

  protected cells(entry: Entry): Cell[] {
    const locale = this.i18n.locale();
    return DIMENSIONS.map((dimension) => {
      const value = (entry.values as Record<string, number | undefined>)[dimension.key];
      return {
        key: dimension.key,
        text:
          value === undefined
            ? null
            : `${formatNumber(value, dimension.decimals, locale)}${dimension.unit ? ' ' + dimension.unit : ''}`,
      };
    });
  }

  /** The row's values as one phrase for its accessible name. */
  protected summary(entry: Entry): string {
    return this.cells(entry)
      .map((cell) => cell.text ?? this.t().historyAbsentValue)
      .join(', ');
  }

  /** Remembers what opened Entry edit so focus can go back to it when it closes. */
  protected remember(event: Event): void {
    const target = event.currentTarget;
    if (target instanceof HTMLElement) this.opener = target;
    this.revealed.set(null);
  }

  protected open(day: string, event?: Event): void {
    if (event) this.remember(event);
    this.revealed.set(null);
    void this.router.navigate(['/history', day]);
  }

  /** The menu's Delete: ask first; the overflow button (remembered on open) gets focus back afterwards. */
  protected askDelete(day: string): void {
    this.revealed.set(null);
    this.deleting.set(day);
  }

  protected closeDelete(): void {
    const day = this.deleting();
    this.deleting.set(null);
    const opener = this.opener;
    this.opener = null;
    // Wait for the dialog's trap to release focus, then place it ourselves. The row may be gone after a
    // delete (the virtual list can recycle its button for another row), so check the Entry still exists.
    afterNextRender(
      () => {
        if (opener?.isConnected && day && this.store.entries()[day]) opener.focus();
        else this.host.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  /** Back on the list: focus returns to the opener, unless the user already moved focus elsewhere. */
  protected restoreFocus(): void {
    const opener = this.opener;
    this.opener = null;
    const active = this.document.activeElement;
    if (opener?.isConnected && (!active || active === this.document.body)) opener.focus();
  }

  /** Touch only: a drag left over 48 px reveals Edit, a drag right hides it; vertical scroll is untouched. */
  protected swipeStart(event: PointerEvent, day: string): void {
    if (event.pointerType !== 'touch') return;
    if (this.revealed() !== null && this.revealed() !== day) this.revealed.set(null);
    this.swipe = { x: event.clientX, y: event.clientY, day, done: false };
  }

  protected swipeMove(event: PointerEvent): void {
    const swipe = this.swipe;
    if (!swipe || swipe.done) return;
    const dx = event.clientX - swipe.x;
    if (Math.abs(dx) <= Math.abs(event.clientY - swipe.y)) return;
    if (dx < -SWIPE_PX) {
      this.revealed.set(swipe.day);
      swipe.done = true;
    } else if (dx > SWIPE_PX && this.revealed() === swipe.day) {
      this.revealed.set(null);
      swipe.done = true;
    }
  }

  protected swipeEnd(): void {
    this.swipe = null;
  }
}
