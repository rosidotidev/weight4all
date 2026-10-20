import { Injectable, signal } from '@angular/core';
import { DEFAULT_LANGUAGE, Language, isLanguage } from '../../domain/language';

export const LANGUAGE_CACHE_KEY = 'w4a.language';

function readCachedLanguage(): Language {
  try {
    const cached = localStorage.getItem(LANGUAGE_CACHE_KEY);
    return isLanguage(cached) ? cached : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/** Owns the Language signal. Story 1.9 adds Firestore persistence and the accent. */
@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly _language = signal<Language>(readCachedLanguage());
  readonly language = this._language.asReadonly();

  setLanguage(language: Language): void {
    this._language.set(language);
    try {
      localStorage.setItem(LANGUAGE_CACHE_KEY, language);
    } catch {
      // cache is best effort
    }
  }
}
