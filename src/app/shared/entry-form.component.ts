import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { EntryStore } from '../core/data/entry.store';
import { DraftStore } from '../core/state/draft.store';
import { DIMENSIONS, DimensionKey } from '../domain/dimensions';
import { DayKey, initialDraft } from '../domain/entry';
import { formatNumber } from '../domain/number';
import { ValueError, validateValue } from '../domain/validation';
import { I18n } from './i18n';

interface Field {
  readonly dimension: (typeof DIMENSIONS)[number];
  readonly text: string;
  readonly error: ValueError | null;
  readonly message: string;
}

/** The one Entry form (AD-12): a card per Dimension, validation on Save, and the save flow. */
@Component({
  selector: 'w4a-entry-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      max-width: var(--w4a-form-column-width);
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
      align-items: baseline;
      justify-content: center;
      gap: var(--w4a-space-2);
    }
    input {
      box-sizing: border-box;
      width: 100%;
      min-height: var(--w4a-touch-target);
      max-width: 200px;
      padding: 0 var(--w4a-space-3);
      font: inherit;
      font-size: var(--w4a-type-value-display-size);
      font-weight: var(--w4a-type-value-display-weight);
      text-align: center;
      color: var(--w4a-on-surface);
      background: var(--w4a-surface);
      border: 1px solid var(--w4a-outline);
      border-radius: var(--w4a-rounded-md);
    }
    input[aria-invalid='true'] {
      border-width: 2px;
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
    button {
      width: 100%;
      min-height: max(44px, var(--w4a-touch-target));
      padding: 0 24px;
      font: inherit;
      font-weight: 500;
      color: var(--w4a-on-primary);
      background: var(--w4a-primary);
      border: 0;
      border-radius: var(--w4a-rounded-full);
      cursor: pointer;
    }
    button:disabled {
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
            <input
              type="text"
              inputmode="decimal"
              autocomplete="off"
              [id]="'w4a-field-' + field.dimension.key"
              [value]="field.text"
              [attr.aria-invalid]="field.error ? 'true' : null"
              [attr.aria-describedby]="'w4a-message-' + field.dimension.key"
              (input)="edit(field.dimension.key, $event)"
            />
            <span class="unit">{{ field.dimension.unit }}</span>
          </div>
          <p class="message" aria-live="polite" [id]="'w4a-message-' + field.dimension.key">
            {{ field.message }}
          </p>
        </div>
      }
      <button type="submit" [disabled]="saving()" [attr.aria-busy]="saving()">
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
  private readonly saved = signal(false);
  private readonly errors = signal<Partial<Record<DimensionKey, ValueError>>>({});

  /** Where each field starts from when the user has not typed in it. */
  private readonly initial = computed(() => initialDraft(this.day(), this.store.entries(), null));

  protected readonly fields = computed<readonly Field[]>(() => {
    const edits = this.drafts.get(this.day());
    const initial = this.initial();
    const errors = this.errors();
    const locale = this.i18n.locale();
    const t = this.t();
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
      } else if (index === 0 && this.saved()) message = t.saved;
      return { dimension, text, error, message };
    });
  });

  protected edit(key: DimensionKey, event: Event): void {
    this.drafts.set(this.day(), key, (event.target as HTMLInputElement).value);
    this.saved.set(false);
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
    this.saving.set(true);
    const sent = this.drafts.get(day);
    const result = await this.store.save({ day, values });
    this.saving.set(false);
    if (result.ok) {
      // Text typed while the write was in flight is newer than what was saved: keep it.
      if (this.drafts.get(day) === sent) this.drafts.drop(day);
      this.saved.set(true);
    }
  }
}
