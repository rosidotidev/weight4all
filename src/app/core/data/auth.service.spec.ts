import { beforeEach, describe, expect, it, vi } from 'vitest';

const createUserWithEmailAndPassword = vi.fn();

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ auth: true })),
  connectAuthEmulator: vi.fn(),
  createUserWithEmailAndPassword,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
}));

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok when the Account is created', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1' } });
    const { AuthService } = await import('./auth.service');
    const result = await new AuthService().register('a@b.it', 'secret1');
    expect(result).toEqual({ ok: true });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({ auth: true }, 'a@b.it', 'secret1');
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
      const { AuthService } = await import('./auth.service');
      const result = await new AuthService().register('a@b.it', 'secret1');
      expect(result).toEqual({ ok: false, code });
      expect(JSON.stringify(result)).not.toContain('RAW');
    });
  }

  it('maps a non-Firebase error to unknown', async () => {
    createUserWithEmailAndPassword.mockRejectedValue(new Error('boom'));
    const { AuthService } = await import('./auth.service');
    expect(await new AuthService().register('a@b.it', 'secret1')).toEqual({
      ok: false,
      code: 'unknown',
    });
  });
});
