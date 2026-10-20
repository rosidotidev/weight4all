import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  doc: vi.fn((...path: unknown[]) => ({ path: path.slice(1).join('/') })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
  doc: m.doc,
  getDoc: m.getDoc,
  setDoc: m.setDoc,
}));

const epoch = signal(0);
const registerStore = vi.fn();

const LANGUAGE_CACHE_KEY = 'w4a.language';
const SAVE_TIMEOUT_MS = 10_000;

// Fresh module graph per store, so `firebase/firestore` is always the mock above and never a
// copy cached by an earlier spec file (see deferred-work.md on module-cache order).
async function create() {
  vi.resetModules();
  const { PreferencesStore } = await import('./preferences.store');
  const { SessionScope } = await import('./session-scope');
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: SessionScope,
        useValue: { registerStore, sessionEpoch: epoch.asReadonly() },
      },
    ],
  });
  return TestBed.inject(PreferencesStore);
}

function snapshot(data: Record<string, unknown> | undefined) {
  return { exists: () => data !== undefined, data: () => data };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('PreferencesStore cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    epoch.set(0);
    m.setDoc.mockResolvedValue(undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('defaults to English with no cache', async () => {
    expect((await create()).language()).toBe('en');
  });

  it('reads a cached choice at startup', async () => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, 'it');
    expect((await create()).language()).toBe('it');
  });

  it.each(['fr', ''])('falls back to English for bad cache %j', async (bad) => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, bad);
    expect((await create()).language()).toBe('en');
  });

  it('falls back to English when localStorage throws on read', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect((await create()).language()).toBe('en');
  });

  it('writes the cache and survives a throwing write', async () => {
    const store = await create();
    void store.setLanguage('it');
    expect(store.language()).toBe('it');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('it');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    void store.setLanguage('en');
    expect(store.language()).toBe('en');
  });

  it('registers with SessionScope', async () => {
    const store = await create();
    expect(registerStore).toHaveBeenCalledWith(store);
  });
});

describe('PreferencesStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
    epoch.set(0);
    m.setDoc.mockResolvedValue(undefined);
    m.getDoc.mockResolvedValue(snapshot(undefined));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('applies at once and writes the full document', async () => {
    const store = await create();
    await store.load('u1');
    const saving = store.setLanguage('it');
    expect(store.language()).toBe('it');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('it');
    await saving;
    expect(m.setDoc).toHaveBeenCalledWith(
      { path: 'users/u1/preferences/app' },
      { accent: 'violet', language: 'it' },
    );
    expect(store.saveError()).toBe(false);
  });

  it('restores the previous Language and cache when the save fails', async () => {
    m.setDoc.mockRejectedValue(new Error('denied'));
    const store = await create();
    await store.load('u1');
    await store.setLanguage('it');
    expect(store.language()).toBe('en');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('en');
    expect(store.saveError()).toBe(true);
  });

  it('treats no answer in 10 s as a failed save', async () => {
    vi.useFakeTimers();
    m.setDoc.mockReturnValue(new Promise(() => undefined));
    const store = await create();
    await store.load('u1');
    const saving = store.setLanguage('it');
    expect(store.language()).toBe('it');
    await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS - 1);
    expect(store.saveError()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await saving;
    expect(store.language()).toBe('en');
    expect(store.saveError()).toBe(true);
  });

  it('clears the error when the next choice starts', async () => {
    m.setDoc.mockRejectedValueOnce(new Error('denied'));
    const store = await create();
    await store.load('u1');
    await store.setLanguage('it');
    expect(store.saveError()).toBe(true);
    const next = store.setLanguage('it');
    expect(store.saveError()).toBe(false);
    await next;
    expect(store.language()).toBe('it');
  });

  it('writes nothing when the Language shown is chosen again', async () => {
    const store = await create();
    await store.load('u1');
    await store.setLanguage('en');
    expect(m.setDoc).not.toHaveBeenCalled();
  });

  it('only applies locally without a signed-in user', async () => {
    const store = await create();
    await store.setLanguage('it');
    expect(store.language()).toBe('it');
    expect(m.setDoc).not.toHaveBeenCalled();
  });

  it('does not roll back a failed save when a later choice was made', async () => {
    const first = deferred<void>();
    m.setDoc.mockReturnValueOnce(first.promise).mockResolvedValueOnce(undefined);
    const store = await create();
    await store.load('u1');
    const a = store.setLanguage('it');
    const b = store.setLanguage('en');
    first.reject(new Error('late failure'));
    await Promise.all([a, b]);
    expect(store.language()).toBe('en');
    expect(store.saveError()).toBe(false);
  });

  it('does not roll back when the session changed during the save', async () => {
    const pending = deferred<void>();
    m.setDoc.mockReturnValue(pending.promise);
    const store = await create();
    await store.load('u1');
    const saving = store.setLanguage('it');
    epoch.set(1);
    store.reset();
    pending.reject(new Error('denied'));
    await saving;
    expect(store.language()).toBe('it');
    expect(store.saveError()).toBe(false);
  });

  it('applies and caches the saved Language on load', async () => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, 'en');
    m.getDoc.mockResolvedValue(snapshot({ accent: 'violet', language: 'it' }));
    const store = await create();
    expect(store.language()).toBe('en');
    await store.load('u1');
    expect(m.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'u1', 'preferences', 'app');
    expect(store.language()).toBe('it');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('it');
  });

  it('shows the cached Language before load finishes (cold start)', async () => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, 'it');
    const read = deferred<ReturnType<typeof snapshot>>();
    m.getDoc.mockReturnValue(read.promise);
    const store = await create();
    const loading = store.load('u1');
    expect(store.language()).toBe('it');
    read.resolve(snapshot({ accent: 'violet', language: 'it' }));
    await loading;
    expect(store.language()).toBe('it');
  });

  it('keeps the cached Language when there is no document', async () => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, 'it');
    const store = await create();
    await store.load('u1');
    expect(store.language()).toBe('it');
    expect(store.saveError()).toBe(false);
  });

  it('keeps the cached Language when the read fails, or the document is invalid', async () => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, 'it');
    const store = await create();
    m.getDoc.mockRejectedValueOnce(new Error('offline'));
    await store.load('u1');
    expect(store.language()).toBe('it');
    m.getDoc.mockResolvedValueOnce(snapshot({ accent: 'violet', language: 'fr' }));
    await store.load('u1');
    expect(store.language()).toBe('it');
    expect(store.saveError()).toBe(false);
  });

  it('discards a load that returns after the user chose', async () => {
    const read = deferred<ReturnType<typeof snapshot>>();
    m.getDoc.mockReturnValue(read.promise);
    const store = await create();
    const loading = store.load('u1');
    const saving = store.setLanguage('it');
    read.resolve(snapshot({ accent: 'violet', language: 'en' }));
    await Promise.all([loading, saving]);
    expect(store.language()).toBe('it');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('it');
  });

  it('keeps the loaded accent when a later choice wins over the load', async () => {
    const read = deferred<ReturnType<typeof snapshot>>();
    m.getDoc.mockReturnValue(read.promise);
    const store = await create();
    const loading = store.load('u1');
    await store.setLanguage('it');
    read.resolve(snapshot({ accent: 'teal', language: 'en' }));
    await loading;
    await store.setLanguage('en');
    expect(store.language()).toBe('en');
    expect(m.setDoc).toHaveBeenLastCalledWith(expect.anything(), { accent: 'teal', language: 'en' });
  });

  it('discards a load that returns after a session change', async () => {
    const read = deferred<ReturnType<typeof snapshot>>();
    m.getDoc.mockReturnValue(read.promise);
    const store = await create();
    const loading = store.load('u1');
    epoch.set(1);
    store.reset();
    read.resolve(snapshot({ accent: 'teal', language: 'it' }));
    await loading;
    expect(store.language()).toBe('en');
  });

  it('remembers the saved accent for the next save', async () => {
    m.getDoc.mockResolvedValue(snapshot({ accent: 'teal', language: 'en' }));
    const store = await create();
    await store.load('u1');
    await store.setLanguage('it');
    expect(m.setDoc).toHaveBeenCalledWith(expect.anything(), { accent: 'teal', language: 'it' });
  });

  it('reset clears accent and error, keeps the Language and cache, and drops the user', async () => {
    m.getDoc.mockResolvedValue(snapshot({ accent: 'teal', language: 'it' }));
    m.setDoc.mockRejectedValueOnce(new Error('denied'));
    const store = await create();
    await store.load('u1');
    await store.setLanguage('en');
    expect(store.saveError()).toBe(true);
    store.reset();
    expect(store.saveError()).toBe(false);
    expect(store.language()).toBe('it');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('it');
    m.setDoc.mockClear();
    await store.setLanguage('en');
    expect(m.setDoc).not.toHaveBeenCalled();
    m.getDoc.mockResolvedValue(snapshot(undefined));
    await store.load('u2');
    await store.setLanguage('it');
    expect(m.setDoc).toHaveBeenCalledWith(
      { path: 'users/u2/preferences/app' },
      { accent: 'violet', language: 'it' },
    );
  });
});
