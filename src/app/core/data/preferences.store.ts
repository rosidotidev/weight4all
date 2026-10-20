import { Injectable, inject, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Accent, DEFAULT_ACCENT, isAccent } from '../../domain/accent';
import { DEFAULT_LANGUAGE, Language, isLanguage } from '../../domain/language';
import { db } from './firebase';
import { SessionScope, SessionStore } from './session-scope';
import { SAVE_TIMEOUT_MS, withTimeout } from './timeout';

export { SAVE_TIMEOUT_MS };

export const LANGUAGE_CACHE_KEY = 'w4a.language';
export const ACCENT_CACHE_KEY = 'w4a.accent';

function readCachedLanguage(): Language {
  try {
    const cached = localStorage.getItem(LANGUAGE_CACHE_KEY);
    return isLanguage(cached) ? cached : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function readCachedAccent(): Accent {
  try {
    const cached = localStorage.getItem(ACCENT_CACHE_KEY);
    return isAccent(cached) ? cached : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

function writeCache(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // cache is best effort
  }
}

/**
 * Owns the Language and accent signals and their `localStorage` caches, and saves the choices to
 * `users/{uid}/preferences/app` (AD-10). Each preference keeps its own choice counter, so a late
 * load or rollback of one never discards the other.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesStore implements SessionStore {
  private readonly scope = inject(SessionScope);
  private readonly _language = signal<Language>(readCachedLanguage());
  private readonly _accent = signal<Accent>(readCachedAccent());
  private readonly _saveError = signal(false);
  private readonly _accentSaveError = signal(false);
  private uid: string | null = null;
  /** Count the choices made; a load or a rollback that started before the latest one gives way. */
  private languageChoices = 0;
  private accentChoices = 0;

  readonly language = this._language.asReadonly();
  readonly accent = this._accent.asReadonly();
  /** True after a Language save failed and was rolled back; clears when the next choice starts. */
  readonly saveError = this._saveError.asReadonly();
  /** True after an accent save failed and was rolled back; clears when the next choice starts. */
  readonly accentSaveError = this._accentSaveError.asReadonly();

  constructor() {
    this.scope.registerStore(this);
  }

  /** Session change: forgets the Account but keeps Language and accent, so Login keeps the last look. */
  reset(): void {
    this.uid = null;
    this._saveError.set(false);
    this._accentSaveError.set(false);
  }

  /** Reads the saved preferences once; a failed or missing read leaves the cached values. */
  async load(uid: string): Promise<void> {
    this.uid = uid;
    const epoch = this.scope.sessionEpoch();
    const languageChoices = this.languageChoices;
    const accentChoices = this.accentChoices;
    let data: Record<string, unknown> | undefined;
    try {
      const snapshot = await getDoc(doc(db, 'users', uid, 'preferences', 'app'));
      data = snapshot.exists() ? snapshot.data() : undefined;
    } catch {
      return;
    }
    if (epoch !== this.scope.sessionEpoch() || !data) return;
    if (accentChoices === this.accentChoices && isAccent(data['accent'])) this.applyAccent(data['accent']);
    if (languageChoices === this.languageChoices && isLanguage(data['language'])) {
      this.applyLanguage(data['language']);
    }
  }

  /** Applies the Language at once, then saves it; a failed save restores the previous one. */
  async setLanguage(language: Language): Promise<void> {
    const previous = this._language();
    if (language === previous) return;
    const choice = ++this.languageChoices;
    this._saveError.set(false);
    this.applyLanguage(language);
    const saved = await this.save();
    if (saved === 'failed' && choice === this.languageChoices) {
      this.applyLanguage(previous);
      this._saveError.set(true);
    }
  }

  /** Applies the accent at once, then saves it; a failed save restores the previous one. */
  async setAccent(accent: Accent): Promise<void> {
    const previous = this._accent();
    if (accent === previous) return;
    const choice = ++this.accentChoices;
    this._accentSaveError.set(false);
    this.applyAccent(accent);
    const saved = await this.save();
    if (saved === 'failed' && choice === this.accentChoices) {
      this.applyAccent(previous);
      this._accentSaveError.set(true);
    }
  }

  /**
   * Writes the full document with the current values. Resolves `failed` only when the write failed
   * and the session is still the one that started it; otherwise a rollback must not happen.
   */
  private async save(): Promise<'saved' | 'failed' | 'skipped'> {
    const uid = this.uid;
    if (!uid) return 'skipped';
    const epoch = this.scope.sessionEpoch();
    try {
      await withTimeout(
        setDoc(doc(db, 'users', uid, 'preferences', 'app'), {
          accent: this._accent(),
          language: this._language(),
        }),
        SAVE_TIMEOUT_MS,
      );
      return 'saved';
    } catch {
      return epoch === this.scope.sessionEpoch() ? 'failed' : 'skipped';
    }
  }

  private applyLanguage(language: Language): void {
    this._language.set(language);
    writeCache(LANGUAGE_CACHE_KEY, language);
  }

  private applyAccent(accent: Accent): void {
    this._accent.set(accent);
    writeCache(ACCENT_CACHE_KEY, accent);
  }
}
