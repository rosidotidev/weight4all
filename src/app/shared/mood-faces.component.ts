import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output } from '@angular/core';
import { LayoutService } from '../core/state/layout.service';
import { formatNumber } from '../domain/number';
import { I18n } from './i18n';
import { CENTER, FaceColours, faceColours, mouthPath } from './mood-face.component';

interface Face {
  readonly n: number;
  readonly label: string;
  /** The mouth: a gentle quadratic curve from a light frown (1) to a light smile (10). */
  readonly mouth: string;
  /** The level's fill and stroke, shared with the row face. */
  readonly colours: FaceColours;
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Ten drawn faces as a radio group: tap selects, tapping the selected face clears (FR-15). */
@Component({
  selector: 'w4a-mood-faces',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mood-faces.component.html',
  styleUrl: './mood-faces.component.scss',
  host: { '[class.wide]': 'wide()' },
})
export class MoodFacesComponent {
  readonly value = input<number | null>(null);
  /** Id of the element that names the group. */
  readonly labelledBy = input.required<string>();
  readonly changed = output<number | null>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly i18n = inject(I18n);
  private readonly layout = inject(LayoutService);

  protected readonly wide = computed(() => this.layout.windowClass() !== 'compact');
  protected readonly center = CENTER;

  protected readonly faces = computed<readonly Face[]>(() => {
    const locale = this.i18n.locale();
    const t = this.i18n.t();
    return LEVELS.map((n) => {
      const text = formatNumber(n, 0, locale);
      return { n, label: t.moodFace({ n: text }), mouth: mouthPath(n), colours: faceColours(n) };
    });
  });

  protected readonly numbers = computed(() => {
    const locale = this.i18n.locale();
    return new Map(LEVELS.map((n) => [n, formatNumber(n, 0, locale)]));
  });

  /** The roving tab stop: the selected face, else the first. */
  protected tabStop(n: number): boolean {
    const value = this.value();
    return value === null ? n === 1 : n === value;
  }

  protected toggle(n: number): void {
    this.changed.emit(this.value() === n ? null : n);
  }

  protected move(event: Event, n: number, delta: 1 | -1): void {
    event.preventDefault();
    const next = n + delta;
    if (next < 1 || next > LEVELS.length) return;
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[next - 1]?.focus();
  }

  /** Moves focus onto the group (the roving tab stop), for validation errors. */
  focus(): void {
    this.host.nativeElement.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus();
  }
}
