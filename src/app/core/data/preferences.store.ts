import { Injectable, inject, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Accent, DEFAULT_ACCENT, isAccent } from '../../domain/accent';
import { DEFAULT_LANGUAGE, Language, isLanguage } from '../../domain/language';
import { db } from './firebase';
import { SessionScope, SessionStore } from './session-scope';

export const LANGUAGE_CACHE_KEY = 'w4a.language';

/** A write that gets no answer (offline Firestore keeps writes pending) counts as failed after this long. */
export const SAVE_TIMEOUT_MS = 10_000;

function readCachedLanguage(): Language {
  try {
    const cached = localStorage.getItem(LANGUAGE_CACHE_KEY);
    return isLanguage(cached) ? cached : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Owns the Language signal and its `localStorage` cache, and saves the choice to
 * `users/{uid}/preferences/app` (AD-10). The accent signal arrives with Story 1.10.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesStore implements SessionStore {
  private readonly scope = inject(SessionScope);
  private readonly _language = signal<Language>(readCachedLanguage());
  private readonly _saveError = signal(false);
  private uid: string | null = null;
  private accent: Accent = DEFAULT_ACCENT;
  /** Counts the choices made; a load or a rollback that started before the latest one gives way. */
  private choices = 0;

  readonly language = this._language.asReadonly();
  /** True after a Language save failed and was rolled back; clears when the next choice starts. */
  readonly saveError = this._saveError.asReadonly();

  constructor() {
    this.scope.registerStore(this);
  }

  /** Session change: forgets the Account but keeps the Language, so Login stays in the last one. */
  reset(): void {
    this.uid = null;
    this.accent = DEFAULT_ACCENT;
    this._saveError.set(false);
  }

  /** Reads the saved preferences once; a failed or missing read leaves the cached Language. */
  async load(uid: string): Promise<void> {
    this.uid = uid;
    const epoch = this.scope.sessionEpoch();
    const choices = this.choices;
    let data: Record<string, unknown> | undefined;
    try {
      const snapshot = await getDoc(doc(db, 'users', uid, 'preferences', 'app'));
      data = snapshot.exists() ? snapshot.data() : undefined;
    } catch {
      return;
    }
    if (epoch !== this.scope.sessionEpoch() || !data) return;
    // The accent is remembered even when a later choice wins, so the next save keeps it.
    if (isAccent(data['accent'])) this.accent = data['accent'];
    if (choices !== this.choices) return;
    if (isLanguage(data['language'])) this.apply(data['language']);
  }

  /** Applies the Language at once, then saves it; a failed save restores the previous one. */
  async setLanguage(language: Language): Promise<void> {
    const previous = this._language();
    if (language === previous) return;
    const choice = ++this.choices;
    const epoch = this.scope.sessionEpoch();
    this._saveError.set(false);
    this.apply(language);
    const uid = this.uid;
    if (!uid) return;
    try {
      await withTimeout(
        setDoc(doc(db, 'users', uid, 'preferences', 'app'), { accent: this.accent, language }),
        SAVE_TIMEOUT_MS,
      );
    } catch {
      if (choice !== this.choices || epoch !== this.scope.sessionEpoch()) return;
      this.apply(previous);
      this._saveError.set(true);
    }
  }

  private apply(language: Language): void {
    this._language.set(language);
    try {
      localStorage.setItem(LANGUAGE_CACHE_KEY, language);
    } catch {
      // cache is best effort
    }
  }
}
