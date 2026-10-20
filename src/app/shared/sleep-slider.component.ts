import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Dimension } from '../domain/dimensions';
import { formatNumber } from '../domain/number';
import { I18n } from './i18n';

/** A range slider with a clear button: moving or touching sets a value, "x" empties it (FR-16). */
@Component({
  selector: 'w4a-sleep-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sleep-slider.component.html',
  styleUrl: './sleep-slider.component.scss',
  host: { '[class.cleared]': 'value() === null' },
})
export class SleepSliderComponent {
  readonly dimension = input.required<Dimension>();
  readonly value = input<number | null>(null);
  /** Id of the element that names the slider. */
  readonly labelledBy = input.required<string>();
  readonly changed = output<number | null>();

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

  /** Where the handle sits: the value, else the default (a cleared slider keeps its handle). */
  protected readonly shown = computed(() => this.value() ?? this.dimension().defaultValue ?? this.dimension().min);

  protected readonly percent = computed(() => {
    const { min, max } = this.dimension();
    return `${((this.shown() - min) / (max - min)) * 100}%`;
  });

  protected readonly valueText = computed(() => {
    const value = this.value();
    if (value === null) return this.t().sleepNone;
    return this.t().sleepValueText({ hours: formatNumber(value, this.dimension().decimals, this.i18n.locale()) });
  });

  protected readonly minLabel = computed(() =>
    this.t().sleepEnd({ hours: formatNumber(this.dimension().min, 0, this.i18n.locale()) }),
  );
  protected readonly maxLabel = computed(() =>
    this.t().sleepEnd({ hours: formatNumber(this.dimension().max, 0, this.i18n.locale()) }),
  );

  protected edit(event: Event): void {
    this.changed.emit(Number((event.target as HTMLInputElement).value));
  }

  /** Touching a cleared slider on its handle sets the value the handle shows. */
  protected touch(event: PointerEvent): void {
    if (event.button === 0 && this.value() === null) this.changed.emit(this.shown());
  }

  /** The first arrow key on a cleared slider sets the value the handle shows, not a step away from it. */
  protected key(event: KeyboardEvent): void {
    if (this.value() !== null || !event.key.startsWith('Arrow')) return;
    event.preventDefault();
    this.changed.emit(this.shown());
  }
}
