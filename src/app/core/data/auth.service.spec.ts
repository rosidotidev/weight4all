import { beforeEach, describe, expect, it, vi } from 'vitest';

const createUserWithEmailAndPassword = vi.fn();
const signInWithEmailAndPassword = vi.fn();
const signOut = vi.fn();
const onAuthStateChanged = vi.fn();

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ auth: true })),
  connectAuthEmulator: vi.fn(),
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
}));

type AuthListener = (user: { uid: string } | null) => void;

async function create() {
  const { AuthService } = await import('./auth.service');
  const service = new AuthService();
  const emit = onAuthStateChanged.mock.calls.at(-1)![1] as AuthListener;
  return { service, emit };
}

describe('AuthService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns ok when the Account is created and sets the session', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1' } });
    const { service } = await create();
    const result = await service.register('a@b.it', 'secret1');
    expect(result).toEqual({ ok: true });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({ auth: true }, 'a@b.it', 'secret1');
    expect(service.session()).toEqual({ status: 'signedIn', uid: 'u1' });
  });

  const cases: [string, string][] = [
    ['auth/email-already-in-use', 'email-in-use'],
    ['auth/weak-password', 'weak-password'],
    ['auth/invalid-email', 'invalid-email'],
    ['auth/network-request-failed', 'network'],
    ['auth/something-else', 'unknown'],
  ];
  for (const [firebaseCode, code] of cases) {
    it(`maps ${firebaseCode} to ${code} without raw text`, async () => {
      createUserWithEmailAndPassword.mockRejectedValue({ code: firebaseCode, message: 'RAW TEXT' });
      const { service } = await create();
      const result = await service.register('a@b.it', 'secret1');
      expect(result).toEqual({ ok: false, code });
      expect(JSON.stringify(result)).not.toContain('RAW');
    });
  }

  it('maps a non-Firebase error to unknown', async () => {
    createUserWithEmailAndPassword.mockRejectedValue(new Error('boom'));
    const { service } = await create();
    expect(await service.register('a@b.it', 'secret1')).toEqual({ ok: false, code: 'unknown' });
  });
});

describe('AuthService session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('starts unknown, then follows onAuthStateChanged', async () => {
    const { service, emit } = await create();
    expect(service.session()).toEqual({ status: 'unknown' });
    emit(null);
    expect(service.session()).toEqual({ status: 'signedOut' });
    emit({ uid: 'u1' });
    expect(service.session()).toEqual({ status: 'signedIn', uid: 'u1' });
    emit({ uid: 'u2' });
    expect(service.session()).toEqual({ status: 'signedIn', uid: 'u2' });
  });
});

describe('AuthService session errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('falls back to signedOut when onAuthStateChanged reports an error', async () => {
    const { service } = await create();
    const onError = onAuthStateChanged.mock.calls.at(-1)![2] as (e: Error) => void;
    onError(new Error('boom'));
    expect(service.session()).toEqual({ status: 'signedOut' });
  });
});

describe('AuthService.login and logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('login returns ok and sets signedIn(uid) before the listener fires', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1' } });
    const { service } = await create();
    expect(await service.login('a@b.it', 'secret1')).toEqual({ ok: true });
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({ auth: true }, 'a@b.it', 'secret1');
    expect(service.session()).toEqual({ status: 'signedIn', uid: 'u1' });
  });

  const loginCases: [string, string][] = [
    ['auth/invalid-credential', 'invalid-credentials'],
    ['auth/wrong-password', 'invalid-credentials'],
    ['auth/user-not-found', 'invalid-credentials'],
    ['auth/invalid-login-credentials', 'invalid-credentials'],
    ['auth/invalid-email', 'invalid-email'],
    ['auth/network-request-failed', 'network'],
    ['auth/too-many-requests', 'unknown'],
  ];
  for (const [firebaseCode, code] of loginCases) {
    it(`login maps ${firebaseCode} to ${code} without raw text`, async () => {
      signInWithEmailAndPassword.mockRejectedValue({ code: firebaseCode, message: 'RAW TEXT' });
      const { service } = await create();
      const result = await service.login('a@b.it', 'x');
      expect(result).toEqual({ ok: false, code });
      expect(JSON.stringify(result)).not.toContain('RAW');
      expect(service.session()).toEqual({ status: 'unknown' });
    });
  }

  it('logout signs out and sets signedOut', async () => {
    signOut.mockResolvedValue(undefined);
    const { service, emit } = await create();
    emit({ uid: 'u1' });
    expect(await service.logout()).toEqual({ ok: true });
    expect(signOut).toHaveBeenCalledWith({ auth: true });
    expect(service.session()).toEqual({ status: 'signedOut' });
  });

  it('logout failure keeps the session and reports the code', async () => {
    signOut.mockRejectedValue({ code: 'auth/network-request-failed' });
    const { service, emit } = await create();
    emit({ uid: 'u1' });
    expect(await service.logout()).toEqual({ ok: false, code: 'network' });
    expect(service.session()).toEqual({ status: 'signedIn', uid: 'u1' });
  });
});
