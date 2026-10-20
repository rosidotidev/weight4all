import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { parseDayKey } from '../../domain/day';
import { DIMENSIONS } from '../../domain/dimensions';
import { DayKey, Entry } from '../../domain/entry';
import { db } from './firebase';
import { SessionScope, SessionStore } from './session-scope';
import { SAVE_TIMEOUT_MS, TimeoutError, withTimeout } from './timeout';

export type EntryStatus = 'loading' | 'ready' | 'error';
export type EntryErrorCode = 'network' | 'timeout' | 'permission' | 'invalid' | 'unknown';
export type EntryResult = { ok: true } | { ok: false; code: EntryErrorCode };

/** Maps a Firebase failure to the closed code set; the raw text never leaves this file. */
function toCode(error: unknown): EntryErrorCode {
  if (error instanceof TimeoutError) return 'timeout';
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  switch (code) {
    case 'permission-denied':
    case 'unauthenticated':
      return 'permission';
    case 'unavailable':
      return 'network';
    case 'deadline-exceeded':
      return 'timeout';
    case 'invalid-argument':
    case 'out-of-range':
      return 'invalid';
    default:
      return 'unknown';
  }
}

/** Reads the Dimension fields of a document; anything that is not a number counts as absent. */
function fromDoc(day: DayKey, data: Record<string, unknown>): Entry {
  const values: Record<string, number> = {};
  for (const dimension of DIMENSIONS) {
    const value = data[dimension.key];
    if (typeof value === 'number') values[dimension.key] = value;
  }
  return { day, values };
}

/** The full document of an Entry: its values by Dimension key plus `updatedAt`. */
function toDoc(entry: Entry): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const dimension of DIMENSIONS) {
    const value = entry.values[dimension.key];
    if (value !== undefined) data[dimension.key] = value;
  }
  data['updatedAt'] = serverTimestamp();
  return data;
}

/**
 * Loads all the Account's Entries once and is the only way to change them (AD-5). The signal changes
 * only after Firestore confirms, and work that started in an older session is discarded.
 */
@Injectable({ providedIn: 'root' })
export class EntryStore implements SessionStore {
  private readonly scope = inject(SessionScope);
  private readonly _status = signal<EntryStatus>('loading');
  private readonly _entries = signal<Readonly<Record<DayKey, Entry>>>({});
  private readonly _epoch = signal(0);
  private uid: string | null = null;
  private loadStarted = false;

  readonly status = this._status.asReadonly();
  readonly entries = this._entries.asReadonly();
  /** The `sessionEpoch` the status and entries belong to. */
  readonly epoch = this._epoch.asReadonly();

  constructor() {
    this.scope.registerStore(this);
  }

  /** Session change: forgets everything and goes back to `loading`. */
  reset(): void {
    this.uid = null;
    this.loadStarted = false;
    this._entries.set({});
    this._status.set('loading');
    this._epoch.set(this.scope.sessionEpoch());
  }

  /** Reads every Entry once per session. */
  async load(uid: string): Promise<void> {
    if (this.loadStarted) return;
    this.uid = uid;
    this.loadStarted = true;
    await this.read(uid);
  }

  /** Reloads after a failed load. */
  async retry(): Promise<void> {
    if (!this.uid || this._status() !== 'error') return;
    this._status.set('loading');
    await this.read(this.uid);
  }

  /** Writes the whole document of the Entry; the signal holds it only after the write is confirmed. */
  async save(entry: Entry): Promise<EntryResult> {
    const uid = this.uid;
    if (!uid) return { ok: false, code: 'unknown' };
    const epoch = this.scope.sessionEpoch();
    try {
      await withTimeout(setDoc(doc(db, 'users', uid, 'entries', entry.day), toDoc(entry)), SAVE_TIMEOUT_MS);
    } catch (error) {
      return { ok: false, code: toCode(error) };
    }
    if (epoch === this.scope.sessionEpoch()) {
      this._entries.update((entries) => ({ ...entries, [entry.day]: { day: entry.day, values: { ...entry.values } } }));
    }
    return { ok: true };
  }

  /** Deletes the Day's document; the Entry leaves the signal only after the delete is confirmed. */
  async remove(day: DayKey): Promise<EntryResult> {
    const uid = this.uid;
    if (!uid) return { ok: false, code: 'unknown' };
    const epoch = this.scope.sessionEpoch();
    try {
      await withTimeout(deleteDoc(doc(db, 'users', uid, 'entries', day)), SAVE_TIMEOUT_MS);
    } catch (error) {
      return { ok: false, code: toCode(error) };
    }
    if (epoch === this.scope.sessionEpoch()) {
      this._entries.update((entries) => {
        const rest = { ...entries };
        delete rest[day];
        return rest;
      });
    }
    return { ok: true };
  }

  private async read(uid: string): Promise<void> {
    const epoch = this.scope.sessionEpoch();
    try {
      const snapshot = await getDocs(query(collection(db, 'users', uid, 'entries'), orderBy(documentId())));
      if (epoch !== this.scope.sessionEpoch()) return;
      const entries: Record<DayKey, Entry> = {};
      for (const document of snapshot.docs) {
        if (parseDayKey(document.id)) entries[document.id] = fromDoc(document.id, document.data());
      }
      this._entries.set(entries);
      this._epoch.set(epoch);
      this._status.set('ready');
    } catch {
      if (epoch !== this.scope.sessionEpoch()) return;
      this._epoch.set(epoch);
      this._status.set('error');
    }
  }
}
