import { Injectable, signal } from '@angular/core';
import { DayKey, DimensionKey } from '../../domain/entry';

/** `value`: typed text; `cleared`: the user emptied the field. A field without an edit is `untouched`. */
export interface FieldEdit {
  readonly state: 'value' | 'cleared';
  readonly text: string;
}

export type DayDraft = Readonly<Partial<Record<DimensionKey, FieldEdit>>>;

const EMPTY: DayDraft = {};

/** Typed text per Day and Dimension, outside components so it survives Tab switches (AD-12). */
@Injectable({ providedIn: 'root' })
export class DraftStore {
  private readonly drafts = signal<Readonly<Record<DayKey, DayDraft>>>({});

  /** The edits typed for the Day; reading it tracks changes. */
  get(day: DayKey): DayDraft {
    return this.drafts()[day] ?? EMPTY;
  }

  set(day: DayKey, key: DimensionKey, text: string): void {
    const edit: FieldEdit = text.trim() === '' ? { state: 'cleared', text: '' } : { state: 'value', text };
    this.drafts.update((all) => ({ ...all, [day]: { ...all[day], [key]: edit } }));
  }

  drop(day: DayKey): void {
    this.drafts.update((all) => {
      if (!(day in all)) return all;
      const rest = { ...all };
      delete rest[day];
      return rest;
    });
  }

  /** Session change: forgets every draft. */
  reset(): void {
    this.drafts.set({});
  }
}
