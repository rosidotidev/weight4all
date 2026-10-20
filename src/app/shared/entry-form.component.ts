import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { MatSnackBarRef } from '@angular/material/snack-bar';
import { EntryErrorCode, EntryStore } from '../core/data/entry.store';
import { SessionScope } from '../core/data/session-scope';
import { LayoutService } from '../core/state/layout.service';
import { DraftStore } from '../core/state/draft.store';
import { DIMENSIONS, Dimension, DimensionKey } from '../domain/dimensions';
import { DayKey, Entry, initialDraft } from '../domain/entry';
import { previousEntry } from '../domain/history';
import { formatNumber, parseDecimal, stepValue } from '../domain/number';
import { ValueError, validateValue } from '../domain/validation';
import { I18n } from './i18n';
import { MoodFacesComponent } from './mood-faces.component';
import { SleepSliderComponent } from './sleep-slider.component';
import { saveErrorKey } from './save-error';

interface Field {
  readonly dimension: Dimension;
  readonly text: string;
  readonly error: ValueError | null;
  readonly message: string;
  readonly hint: string;
  /** The value as a slider card shows it: the formatted number, or an em dash when empty. */
  readonly display: string;
  readonly unit: string;
}

const PLUS = 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z';
const MINUS = 'M19 13H5v-2h14z';

/** The one Entry form (AD-12): a card per Dimension, validation on Save, and the save flow. */
@Component({
  selector: 'w4a-entry-form',
  imports: [MoodFacesComponent, SleepSliderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entry-form.component.html',
  styleUrl: './entry-form.component.scss',
})
export class EntryFormComponent {
  readonly day = input.required<DayKey>();
  /** The Entry the store confirmed, once; never emitted for a failed or stale save. */
  readonly confirmed = output<Entry>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly store = inject(EntryStore);
  private readonly drafts = inject(DraftStore);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly layout = inject(LayoutService);
  protected readonly medium = computed(() => this.layout.windowClass() === 'medium');
  protected readonly saving = signal(false);
  protected readonly plus = PLUS;
  protected readonly minus = MINUS;
  private readonly saved = signal(false);
  private readonly failure = signal<EntryErrorCode | null>(null);
  private readonly injector = inject(Injector);
  private attempt = 0;
  private readonly scope = inject(SessionScope);
  private snackBarRef: MatSnackBarRef<unknown> | null = null;

  constructor() {
    // The inline message goes with the form, so the snackbar and any pending open go with it.
    inject(DestroyRef).onDestroy(() => this.closeSnackBar());
  }
  private readonly errors = signal<Partial<Record<DimensionKey, ValueError>>>({});

  /** Where each field starts from when the user has not typed in it. */
  private readonly initial = computed(() =>
    initialDraft(this.day(), this.store.entries(), this.previous()),
  );

  /** The latest earlier Entry, only once the Entries are loaded (never a guess while loading). */
  private readonly previous = computed(() =>
    this.store.status() === 'ready' ? previousEntry(this.day(), this.store.entries()) : null,
  );

  protected readonly fields = computed<readonly Field[]>(() => {
    const edits = this.drafts.get(this.day());
    const initial = this.initial();
    const errors = this.errors();
    const locale = this.i18n.locale();
    const t = this.t();
    const failure = this.failure();
    const previous = this.previous();
    return (DIMENSIONS as readonly Dimension[]).map((dimension, index) => {
      const edit = edits[dimension.key];
      const start = initial[dimension.key];
      const text = edit ? edit.text : start === undefined ? '' : formatNumber(start, dimension.decimals, locale);
      const error = errors[dimension.key] ?? null;
      // A slider's bounds are whole hours; a stepper's carry its decimals.
      const bounds = dimension.input === 'slider' ? 0 : dimension.decimals;
      let message = '';
      if (error === 'missing') message = dimension.missingKey ? t[dimension.missingKey] : '';
      else if (error === 'range') {
        message = (t[dimension.rangeKey] as (p: { min: string; max: string }) => string)({
          min: formatNumber(dimension.min, bounds, locale),
          max: formatNumber(dimension.max, bounds, locale),
        });
      } else if (index === 0 && failure) message = t[saveErrorKey(failure)];
      else if (index === 0 && this.saved()) message = t.saved;
      const hint =
        dimension.input === 'stepper'
          ? this.stepperHint(dimension, previous)
          : dimension.hintKey
            ? (t[dimension.hintKey] as string)
            : '';
      const typed = parseDecimal(text, dimension.decimals);
      const inRange = typed !== null && typed >= dimension.min && typed <= dimension.max;
      const display = inRange ? formatNumber(typed, dimension.decimals, locale) : '—';
      return { dimension, text, error, message, hint, display, unit: inRange ? dimension.unit : '' };
    });
  });

  /** The caption under a stepper: the last value and the step, or the step alone. */
  private stepperHint(dimension: Dimension, previous: Entry | null): string {
    const locale = this.i18n.locale();
    const t = this.t();
    const step = formatNumber(dimension.step, dimension.decimals, locale);
    const last = previous?.values[dimension.key];
    if (last === undefined || !dimension.hintNoLastKey) {
      return dimension.hintNoLastKey ? t[dimension.hintNoLastKey]({ step }) : '';
    }
    if (!dimension.hintKey) return '';
    const hint = t[dimension.hintKey] as (p: { value: string; step: string }) => string;
    return hint({ value: formatNumber(last, dimension.decimals, locale), step });
  }

  protected setValue(key: DimensionKey, value: number | null): void {
    this.change(key, value === null ? '' : String(value));
  }

  protected selected(text: string, dimension: Dimension): number | null {
    const value = parseDecimal(text, dimension.decimals);
    return value === null || value < dimension.min || value > dimension.max ? null : value;
  }

  protected edit(key: DimensionKey, event: Event): void {
    this.change(key, (event.target as HTMLInputElement).value);
  }

  /** Up/Down in the field step once and keep the caret and the page where they are. */
  protected key(event: Event, dimension: Dimension, direction: 1 | -1): void {
    if (dimension.input !== 'stepper') return;
    event.preventDefault();
    this.step(dimension, direction);
  }

  /** One step from the typed number, else from the suggestion, else from the minimum. */
  protected step(dimension: Dimension, direction: 1 | -1): void {
    const field = this.fields().find((candidate) => candidate.dimension === dimension);
    const typed = parseDecimal(field?.text ?? '', dimension.decimals);
    const from = typed ?? this.previous()?.values[dimension.key] ?? dimension.min;
    const next = stepValue(from, direction, dimension.step, dimension.decimals, dimension.min, dimension.max);
    this.change(dimension.key, formatNumber(next, dimension.decimals, this.i18n.locale()));
  }

  private change(key: DimensionKey, text: string): void {
    this.drafts.set(this.day(), key, text);
    this.saved.set(false);
    this.failure.set(null);
    this.closeSnackBar();
    this.errors.update((errors) => (errors[key] ? { ...errors, [key]: undefined } : errors));
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) return;
    const day = this.day();
    const values: Partial<Record<DimensionKey, number>> = {};
    for (const field of this.fields()) {
      const { dimension } = field;
      const result = validateValue(dimension, field.text);
      if (result.ok) {
        values[dimension.key] = result.value;
      } else if (result.error === 'missing' && !dimension.required) {
        continue;
      } else {
        this.saved.set(false);
        this.errors.set({ [dimension.key]: result.error });
        const target = this.host.nativeElement.querySelector<HTMLElement>(
          dimension.input === 'faces'
            ? `#w4a-field-${dimension.key} [role="radio"][tabindex="0"]`
            : dimension.input === 'slider'
              ? `#w4a-field-${dimension.key} input`
              : `#w4a-field-${dimension.key}`,
        );
        target?.focus();
        return;
      }
    }
    this.errors.set({});
    this.saved.set(false);
    this.failure.set(null);
    this.closeSnackBar();
    this.saving.set(true);
    const sent = this.drafts.get(day);
    const epoch = this.scope.sessionEpoch();
    const saving: Entry = { day, values };
    const result = await this.store.save(saving);
    this.saving.set(false);
    // A result from an older session belongs to nobody now: no message, no "Saved!", no draft change.
    if (epoch !== this.scope.sessionEpoch()) return;
    if (!result.ok) {
      this.failure.set(result.code);
      const opening = this.attempt;
      const t = this.t();
      // Loaded on first failure so Material's snack bar stays out of the initial bundle.
      try {
        const { MatSnackBar } = await import('@angular/material/snack-bar');
        if (opening !== this.attempt || epoch !== this.scope.sessionEpoch()) return;
        this.snackBarRef = this.injector
          .get(MatSnackBar)
          .open(t[saveErrorKey(result.code)], t.snackbarDismiss, { duration: 0 });
      } catch {
        // The chunk may not load offline; the inline message already says the save failed.
      }
    } else {
      // Text typed while the write was in flight is newer than what was saved: keep it.
      if (this.drafts.get(day) === sent) this.drafts.drop(day);
      this.saved.set(true);
      this.confirmed.emit(saving);
    }
  }

  /** Closes the snackbar and invalidates one that is still being opened. */
  private closeSnackBar(): void {
    this.attempt++;
    this.snackBarRef?.dismiss();
    this.snackBarRef = null;
  }
}
