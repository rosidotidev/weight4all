import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { MatSnackBarRef } from '@angular/material/snack-bar';
import { EntryErrorCode, EntryStore } from '../core/data/entry.store';
import { SessionScope } from '../core/data/session-scope';
import { DraftStore } from '../core/state/draft.store';
import { DIMENSIONS, DimensionKey } from '../domain/dimensions';
import { DayKey, initialDraft } from '../domain/entry';
import { previousEntry } from '../domain/history';
import { formatNumber, parseDecimal, stepValue } from '../domain/number';
import { ValueError, validateValue } from '../domain/validation';
import { I18n } from './i18n';
import { saveErrorKey } from './save-error';

interface Field {
  readonly dimension: (typeof DIMENSIONS)[number];
  readonly text: string;
  readonly error: ValueError | null;
  readonly message: string;
  readonly hint: string;
}

const PLUS = 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z';
const MINUS = 'M19 13H5v-2h14z';

/** The one Entry form (AD-12): a card per Dimension, validation on Save, and the save flow. */
@Component({
  selector: 'w4a-entry-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      max-width: var(--w4a-form-column-width);
      margin-inline: auto;
      font-family: var(--w4a-font-family);
      color: var(--w4a-on-surface);
    }
    form {
      display: grid;
      gap: var(--w4a-card-gap);
    }
    .card {
      display: grid;
      gap: var(--w4a-space-2);
      padding: var(--w4a-space-5);
      background: var(--w4a-surface-container);
      border-radius: var(--w4a-rounded-xl);
    }
    label {
      font-size: var(--w4a-type-card-label-size);
      font-weight: var(--w4a-type-card-label-weight);
      color: var(--w4a-on-surface-variant);
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--w4a-space-2);
    }
    .value {
      display: flex;
      flex: 1 1 auto;
      align-items: baseline;
      justify-content: center;
      gap: var(--w4a-space-1);
      min-width: 0;
    }
    input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      max-width: 180px;
      min-height: var(--w4a-touch-target);
      padding: 0;
      font: inherit;
      font-size: var(--w4a-type-value-display-size);
      font-weight: var(--w4a-type-value-display-weight);
      text-align: center;
      color: var(--w4a-on-surface);
      background: transparent;
      border: 0;
      border-bottom: 2px solid transparent;
      border-radius: 0;
    }
    input[aria-invalid='true'] {
      border-bottom-color: var(--w4a-outline);
    }
    .hint {
      margin: 0;
      text-align: center;
      font-size: var(--w4a-type-caption-size);
      font-weight: var(--w4a-type-caption-weight);
      color: var(--w4a-on-surface-variant);
    }
    .step {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      padding: 0;
      border: 0;
      border-radius: var(--w4a-rounded-full);
      cursor: pointer;
    }
    .step svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
    }
    .step.minus {
      color: var(--w4a-on-primary-container);
      background: var(--w4a-primary-container);
    }
    .step.plus {
      color: var(--w4a-on-primary);
      background: var(--w4a-primary);
    }
    input:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 2px;
    }
    .unit {
      font-size: var(--w4a-type-body-size);
      color: var(--w4a-on-surface-variant);
    }
    .message {
      min-height: 1.5em;
      margin: 0;
      text-align: center;
      font-size: var(--w4a-type-body-size);
      font-weight: 700;
    }
    .save {
      width: 100%;
      min-height: 56px;
      padding: 0 24px;
      font: inherit;
      font-size: 18px;
      font-weight: 500;
      color: var(--w4a-on-primary);
      background: var(--w4a-primary);
      border: 0;
      border-radius: var(--w4a-rounded-full);
      cursor: pointer;
    }
    .save:disabled {
      opacity: 0.6;
      cursor: default;
    }
  `,
  template: `
    <form novalidate (submit)="submit($event)">
      @for (field of fields(); track field.dimension.key) {
        <div class="card">
          <label [for]="'w4a-field-' + field.dimension.key">{{ t()[field.dimension.labelKey] }}</label>
          <div class="row">
            @if (field.dimension.input === 'stepper') {
              <button
                type="button"
                class="step minus"
                [attr.aria-label]="t()[field.dimension.decreaseKey]"
                (click)="step(field.dimension, -1)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="minus" /></svg>
              </button>
            }
            <div class="value">
              <input
                type="text"
                inputmode="decimal"
                autocomplete="off"
                [id]="'w4a-field-' + field.dimension.key"
                [value]="field.text"
                [attr.aria-invalid]="field.error ? 'true' : null"
                [attr.aria-describedby]="'w4a-hint-' + field.dimension.key + ' w4a-message-' + field.dimension.key"
                (input)="edit(field.dimension.key, $event)"
                (keydown.arrowup)="key($event, field.dimension, 1)"
                (keydown.arrowdown)="key($event, field.dimension, -1)"
              />
              <span class="unit">{{ field.dimension.unit }}</span>
            </div>
            @if (field.dimension.input === 'stepper') {
              <button
                type="button"
                class="step plus"
                [attr.aria-label]="t()[field.dimension.increaseKey]"
                (click)="step(field.dimension, 1)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="plus" /></svg>
              </button>
            }
          </div>
          <p class="hint" [id]="'w4a-hint-' + field.dimension.key">{{ field.hint }}</p>
          <p class="message" aria-live="polite" [id]="'w4a-message-' + field.dimension.key">
            {{ field.message }}
          </p>
        </div>
      }
      <button type="submit" class="save" [disabled]="saving()" [attr.aria-busy]="saving()">
        {{ saving() ? t().entrySaving : t().entrySave }}
      </button>
    </form>
  `,
})
export class EntryFormComponent {
  readonly day = input.required<DayKey>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly store = inject(EntryStore);
  private readonly drafts = inject(DraftStore);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
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
    return DIMENSIONS.map((dimension, index) => {
      const edit = edits[dimension.key];
      const start = initial[dimension.key];
      const text = edit ? edit.text : start === undefined ? '' : formatNumber(start, dimension.decimals, locale);
      const error = errors[dimension.key] ?? null;
      let message = '';
      if (error === 'missing') message = t[dimension.missingKey];
      else if (error === 'range') {
        message = t[dimension.rangeKey]({
          min: formatNumber(dimension.min, dimension.decimals, locale),
          max: formatNumber(dimension.max, dimension.decimals, locale),
        });
      } else if (index === 0 && failure) message = t[saveErrorKey(failure)];
      else if (index === 0 && this.saved()) message = t.saved;
      const step = formatNumber(dimension.step, dimension.decimals, locale);
      const last = previous?.values[dimension.key];
      const hint =
        last === undefined
          ? t[dimension.hintNoLastKey]({ step })
          : t[dimension.hintKey]({ value: formatNumber(last, dimension.decimals, locale), step });
      return { dimension, text, error, message, hint };
    });
  });

  protected edit(key: DimensionKey, event: Event): void {
    this.change(key, (event.target as HTMLInputElement).value);
  }

  /** Up/Down in the field step once and keep the caret and the page where they are. */
  protected key(event: Event, dimension: (typeof DIMENSIONS)[number], direction: 1 | -1): void {
    if (dimension.input !== 'stepper') return;
    event.preventDefault();
    this.step(dimension, direction);
  }

  /** One step from the typed number, else from the suggestion, else from the minimum. */
  protected step(dimension: (typeof DIMENSIONS)[number], direction: 1 | -1): void {
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
        this.host.nativeElement.querySelector<HTMLInputElement>(`#w4a-field-${dimension.key}`)?.focus();
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
    const result = await this.store.save({ day, values });
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
    }
  }

  /** Closes the snackbar and invalidates one that is still being opened. */
  private closeSnackBar(): void {
    this.attempt++;
    this.snackBarRef?.dismiss();
    this.snackBarRef = null;
  }
}
