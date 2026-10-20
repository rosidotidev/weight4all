import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  collection: vi.fn((...path: unknown[]) => ({ path: path.slice(1).join('/') })),
  query: vi.fn((...args: unknown[]) => ({ query: args })),
  orderBy: vi.fn((field: unknown) => ({ orderBy: field })),
  documentId: vi.fn(() => '__name__'),
  getDocs: vi.fn(),
  doc: vi.fn((...path: unknown[]) => ({ path: path.slice(1).join('/') })),
  setDoc: vi.fn(),
  getDocFromServer: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
  ...m,
}));

const epoch = signal(0);
const registerStore = vi.fn();
const SAVE_TIMEOUT_MS = 10_000;

async function create() {
  vi.resetModules();
  const { EntryStore } = await import('./entry.store');
  const { SessionScope } = await import('./session-scope');
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SessionScope, useValue: { registerStore, sessionEpoch: epoch.asReadonly() } }],
  });
  return TestBed.inject(EntryStore);
}

function docs(...items: [string, Record<string, unknown>][]) {
  return { docs: items.map(([id, data]) => ({ id, data: () => data })) };
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

describe('EntryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    epoch.set(0);
    m.getDocs.mockResolvedValue(docs());
    m.setDoc.mockResolvedValue(undefined);
    m.deleteDoc.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('registers with SessionScope and starts loading and empty', async () => {
    const store = await create();
    expect(registerStore).toHaveBeenCalledWith(store);
    expect(store.status()).toBe('loading');
    expect(store.entries()).toEqual({});
  });

  describe('load', () => {
    it('reads once, ordered, into a signal keyed by day', async () => {
      m.getDocs.mockResolvedValue(
        docs(
          ['2026-10-19', { weight: 72.5, updatedAt: 'x' }],
          ['2026-10-20', { weight: 72.1 }],
          ['not-a-day', { weight: 1 }],
        ),
      );
      const store = await create();
      await store.load('u1');
      await store.load('u1');
      expect(m.getDocs).toHaveBeenCalledTimes(1);
      expect(m.collection).toHaveBeenCalledWith(expect.anything(), 'users', 'u1', 'entries');
      expect(m.orderBy).toHaveBeenCalledWith('__name__');
      expect(store.status()).toBe('ready');
      expect(store.entries()).toEqual({
        '2026-10-19': { day: '2026-10-19', values: { weight: 72.5 } },
        '2026-10-20': { day: '2026-10-20', values: { weight: 72.1 } },
      });
    });

    it('treats a non-numeric value as absent', async () => {
      m.getDocs.mockResolvedValue(docs(['2026-10-20', { weight: 'x' }]));
      const store = await create();
      await store.load('u1');
      expect(store.entries()['2026-10-20']).toEqual({ day: '2026-10-20', values: {} });
    });

    it('sets error when the read fails, and retry reloads', async () => {
      m.getDocs.mockRejectedValueOnce(new Error('boom'));
      const store = await create();
      await store.load('u1');
      expect(store.status()).toBe('error');

      const pending = deferred<unknown>();
      m.getDocs.mockReturnValueOnce(pending.promise);
      const retrying = store.retry();
      expect(store.status()).toBe('loading');
      pending.resolve(docs(['2026-10-20', { weight: 70 }]));
      await retrying;
      expect(store.status()).toBe('ready');
      expect(Object.keys(store.entries())).toEqual(['2026-10-20']);
    });

    it('retry does nothing unless the load failed', async () => {
      const store = await create();
      await store.load('u1');
      await store.retry();
      expect(m.getDocs).toHaveBeenCalledTimes(1);
    });

    it('discards a result that arrives after the session changed', async () => {
      const pending = deferred<unknown>();
      m.getDocs.mockReturnValueOnce(pending.promise);
      const store = await create();
      const loading = store.load('u1');
      epoch.set(1);
      store.reset();
      pending.resolve(docs(['2026-10-20', { weight: 70 }]));
      await loading;
      expect(store.status()).toBe('loading');
      expect(store.entries()).toEqual({});
    });

    it('discards a failure that arrives after the session changed', async () => {
      const pending = deferred<unknown>();
      m.getDocs.mockReturnValueOnce(pending.promise);
      const store = await create();
      const loading = store.load('u1');
      epoch.set(1);
      store.reset();
      pending.reject(new Error('late'));
      await loading;
      expect(store.status()).toBe('loading');
    });

    it('tags the state with the session epoch', async () => {
      epoch.set(3);
      const store = await create();
      await store.load('u1');
      expect(store.epoch()).toBe(3);
    });

    it('reset empties and goes back to loading, allowing a new load', async () => {
      m.getDocs.mockResolvedValue(docs(['2026-10-20', { weight: 70 }]));
      const store = await create();
      await store.load('u1');
      epoch.set(1);
      store.reset();
      expect(store.status()).toBe('loading');
      expect(store.entries()).toEqual({});
      expect(store.epoch()).toBe(1);
      await store.load('u2');
      expect(m.getDocs).toHaveBeenCalledTimes(2);
      expect(store.status()).toBe('ready');
    });
  });

  describe('save', () => {
    const entry = { day: '2026-10-20', values: { weight: 72.5 } };

    it('writes the full document without merge and updates the signal after confirm', async () => {
      const store = await create();
      await store.load('u1');
      const write = deferred<void>();
      m.setDoc.mockReturnValueOnce(write.promise);
      const saving = store.save(entry);
      expect(store.entries()).toEqual({});
      write.resolve();
      expect(await saving).toEqual({ ok: true });
      expect(m.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'u1', 'entries', '2026-10-20');
      expect(m.setDoc).toHaveBeenCalledTimes(1);
      const [, data, options] = m.setDoc.mock.calls[0];
      expect(data).toEqual({ weight: 72.5, updatedAt: 'SERVER_TS' });
      expect(options).toBeUndefined();
      expect(store.entries()['2026-10-20']).toEqual(entry);
    });

    it('replaces an existing Entry and leaves other Days alone', async () => {
      m.getDocs.mockResolvedValue(docs(['2026-10-19', { weight: 70 }], ['2026-10-20', { weight: 71 }]));
      const store = await create();
      await store.load('u1');
      await store.save(entry);
      expect(store.entries()['2026-10-19']).toEqual({ day: '2026-10-19', values: { weight: 70 } });
      expect(store.entries()['2026-10-20']).toEqual(entry);
    });

    it('omits absent values from the document', async () => {
      const store = await create();
      await store.load('u1');
      await store.save({ day: '2026-10-20', values: {} });
      expect(m.setDoc.mock.calls[0][1]).toEqual({ updatedAt: 'SERVER_TS' });
    });

    it.each([
      ['permission-denied', 'permission'],
      ['unavailable', 'network'],
      ['invalid-argument', 'invalid'],
      ['internal', 'unknown'],
      ['unauthenticated', 'permission'],
      ['deadline-exceeded', 'timeout'],
      ['out-of-range', 'invalid'],
    ])('maps %s to %s and leaves the signal unchanged', async (firebaseCode, code) => {
      m.setDoc.mockRejectedValueOnce(Object.assign(new Error('raw firebase text'), { code: firebaseCode }));
      const store = await create();
      await store.load('u1');
      const result = await store.save(entry);
      expect(result).toEqual({ ok: false, code });
      expect(JSON.stringify(result)).not.toContain('raw');
      expect(store.entries()).toEqual({});
    });

    it('maps a plain error to unknown', async () => {
      m.setDoc.mockRejectedValueOnce(new Error('x'));
      const store = await create();
      await store.load('u1');
      expect(await store.save(entry)).toEqual({ ok: false, code: 'unknown' });
    });

    it('times out after 10 s and leaves the signal unchanged', async () => {
      vi.useFakeTimers();
      m.setDoc.mockReturnValueOnce(new Promise(() => undefined));
      const store = await create();
      await store.load('u1');
      const saving = store.save(entry);
      await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS - 1);
      expect(store.entries()).toEqual({});
      await vi.advanceTimersByTimeAsync(1);
      expect(await saving).toEqual({ ok: false, code: 'timeout' });
      expect(store.entries()).toEqual({});
    });

    it('does not change the signal when the session changed while writing', async () => {
      const store = await create();
      await store.load('u1');
      const write = deferred<void>();
      m.setDoc.mockReturnValueOnce(write.promise);
      const saving = store.save(entry);
      epoch.set(1);
      store.reset();
      write.resolve();
      await saving;
      expect(store.entries()).toEqual({});
    });

    it('fails without writing when there is no session', async () => {
      const store = await create();
      expect(await store.save(entry)).toEqual({ ok: false, code: 'unknown' });
      expect(m.setDoc).not.toHaveBeenCalled();
    });

    describe('after a timeout', () => {
      const other = { day: '2026-10-19', values: { weight: 70 } };

      async function timedOutStore() {
        vi.useFakeTimers();
        m.getDocs.mockResolvedValue(docs(['2026-10-20', { weight: 71 }]));
        const store = await create();
        await store.load('u1');
        m.setDoc.mockReturnValueOnce(new Promise(() => undefined));
        const saving = store.save(entry);
        await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS);
        expect(await saving).toEqual({ ok: false, code: 'timeout' });
        return store;
      }

      it('re-reads the Day with getDocFromServer before the next write and updates the signal', async () => {
        const store = await timedOutStore();
        const order: string[] = [];
        m.getDocFromServer.mockImplementationOnce(async () => {
          order.push('read');
          return { exists: () => true, data: () => ({ weight: 72.9 }) };
        });
        m.setDoc.mockImplementationOnce(async () => {
          order.push('write');
        });
        expect(await store.save(entry)).toEqual({ ok: true });
        expect(order).toEqual(['read', 'write']);
        expect(m.getDocFromServer).toHaveBeenCalledTimes(1);
        expect(m.doc).toHaveBeenLastCalledWith(expect.anything(), 'users', 'u1', 'entries', '2026-10-20');
        expect(store.entries()['2026-10-20']).toEqual(entry);
      });

      it('puts the server state in the signal when the read succeeds but the write fails', async () => {
        const store = await timedOutStore();
        m.getDocFromServer.mockResolvedValueOnce({ exists: () => true, data: () => ({ weight: 72.9 }) });
        m.setDoc.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'unavailable' }));
        expect(await store.save(entry)).toEqual({ ok: false, code: 'network' });
        expect(store.entries()['2026-10-20']).toEqual({ day: '2026-10-20', values: { weight: 72.9 } });
      });

      it('removes the Day from the signal when the server has no document', async () => {
        const store = await timedOutStore();
        m.getDocFromServer.mockResolvedValueOnce({ exists: () => false, data: () => undefined });
        m.setDoc.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'unavailable' }));
        await store.save(entry);
        expect(store.entries()['2026-10-20']).toBeUndefined();
      });

      it('clears the mark once read, so the next save does not re-read', async () => {
        const store = await timedOutStore();
        m.getDocFromServer.mockResolvedValueOnce({ exists: () => false, data: () => undefined });
        await store.save(entry);
        await store.save(entry);
        expect(m.getDocFromServer).toHaveBeenCalledTimes(1);
      });

      it('does not re-read another Day or a Day that never timed out', async () => {
        const store = await timedOutStore();
        await store.save(other);
        expect(m.getDocFromServer).not.toHaveBeenCalled();
        const fresh = await create();
        await fresh.load('u1');
        await fresh.save(entry);
        expect(m.getDocFromServer).not.toHaveBeenCalled();
      });

      it('returns the code and does not write when the re-read fails, keeping the mark', async () => {
        const store = await timedOutStore();
        m.setDoc.mockClear();
        m.getDocFromServer.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'unavailable' }));
        expect(await store.save(entry)).toEqual({ ok: false, code: 'network' });
        expect(m.setDoc).not.toHaveBeenCalled();
        expect(store.entries()['2026-10-20']).toEqual({ day: '2026-10-20', values: { weight: 71 } });
        m.getDocFromServer.mockResolvedValueOnce({ exists: () => true, data: () => ({ weight: 71 }) });
        expect(await store.save(entry)).toEqual({ ok: true });
        expect(m.getDocFromServer).toHaveBeenCalledTimes(2);
      });

      it('times out the re-read after 10 s', async () => {
        const store = await timedOutStore();
        m.setDoc.mockClear();
        m.getDocFromServer.mockReturnValueOnce(new Promise(() => undefined));
        const saving = store.save(entry);
        await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS);
        expect(await saving).toEqual({ ok: false, code: 'timeout' });
        expect(m.setDoc).not.toHaveBeenCalled();
      });

      it('forgets the mark on reset', async () => {
        const store = await timedOutStore();
        epoch.set(1);
        store.reset();
        await store.load('u1');
        await store.save(entry);
        expect(m.getDocFromServer).not.toHaveBeenCalled();
      });

      it('discards a re-read that arrives after the session changed, without writing', async () => {
        const store = await timedOutStore();
        m.setDoc.mockClear();
        const read = deferred<unknown>();
        m.getDocFromServer.mockReturnValueOnce(read.promise);
        const saving = store.save(entry);
        epoch.set(1);
        store.reset();
        read.resolve({ exists: () => true, data: () => ({ weight: 99 }) });
        await saving;
        expect(m.setDoc).not.toHaveBeenCalled();
        expect(store.entries()).toEqual({});
      });
    });
  });

  describe('remove', () => {
    async function loaded() {
      m.getDocs.mockResolvedValue(docs(['2026-10-19', { weight: 70 }], ['2026-10-20', { weight: 71 }]));
      const store = await create();
      await store.load('u1');
      return store;
    }

    it('removes the Entry only after the delete is confirmed', async () => {
      const store = await loaded();
      const del = deferred<void>();
      m.deleteDoc.mockReturnValueOnce(del.promise);
      const removing = store.remove('2026-10-20');
      expect(Object.keys(store.entries())).toEqual(['2026-10-19', '2026-10-20']);
      del.resolve();
      expect(await removing).toEqual({ ok: true });
      expect(m.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'u1', 'entries', '2026-10-20');
      expect(Object.keys(store.entries())).toEqual(['2026-10-19']);
    });

    it('keeps the Entry and returns a code when the delete fails', async () => {
      const store = await loaded();
      m.deleteDoc.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'unavailable' }));
      expect(await store.remove('2026-10-20')).toEqual({ ok: false, code: 'network' });
      expect(Object.keys(store.entries())).toHaveLength(2);
    });

    it('times out after 10 s', async () => {
      const store = await loaded();
      vi.useFakeTimers();
      m.deleteDoc.mockReturnValueOnce(new Promise(() => undefined));
      const removing = store.remove('2026-10-20');
      await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS);
      expect(await removing).toEqual({ ok: false, code: 'timeout' });
      expect(Object.keys(store.entries())).toHaveLength(2);
    });

    it('does not change the signal when the session changed while deleting', async () => {
      const store = await loaded();
      const del = deferred<void>();
      m.deleteDoc.mockReturnValueOnce(del.promise);
      const removing = store.remove('2026-10-20');
      epoch.set(1);
      store.reset();
      del.resolve();
      await removing;
      expect(store.entries()).toEqual({});
      expect(store.status()).toBe('loading');
    });
  });

  describe('with the real SessionScope', () => {
    it('loads on sign-in and resets on sign-out', async () => {
      vi.resetModules();
      const { EntryStore } = await import('./entry.store');
      const { AuthService } = await import('./auth.service');
      const session = signal<{ status: 'unknown' } | { status: 'signedIn'; uid: string } | { status: 'signedOut' }>({
        status: 'unknown',
      });
      m.getDocs.mockResolvedValue(docs(['2026-10-20', { weight: 71 }]));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { session } }] });
      const { SessionScope } = await import('./session-scope');
      TestBed.inject(SessionScope);
      const store = TestBed.inject(EntryStore);
      TestBed.tick();
      session.set({ status: 'signedIn', uid: 'u1' });
      TestBed.tick();
      await vi.waitFor(() => expect(store.status()).toBe('ready'));
      expect(m.getDocs).toHaveBeenCalledTimes(1);
      expect(Object.keys(store.entries())).toEqual(['2026-10-20']);
      session.set({ status: 'signedOut' });
      TestBed.tick();
      expect(store.status()).toBe('loading');
      expect(store.entries()).toEqual({});
    });
  });
});
