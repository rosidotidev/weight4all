import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment as local } from '../../../environments/environment';
import { environment as prod } from '../../../environments/environment.prod';

const connectAuthEmulator = vi.fn();
const connectFirestoreEmulator = vi.fn();
const initializeApp = vi.fn(() => ({ app: true }));

vi.mock('firebase/app', () => ({ initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ auth: true })), connectAuthEmulator }));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ db: true })),
  connectFirestoreEmulator,
}));

describe('initFirebase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('connects Auth and Firestore to the emulators in local', async () => {
    const { initFirebase } = await import('./firebase');
    initFirebase(local);
    expect(initializeApp).toHaveBeenCalledWith(local.firebase);
    expect(connectAuthEmulator).toHaveBeenCalledWith({ auth: true }, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
    expect(connectFirestoreEmulator).toHaveBeenCalledWith({ db: true }, '127.0.0.1', 8080);
  });

  it('does not connect to emulators in prod', async () => {
    const { initFirebase } = await import('./firebase');
    initFirebase(prod);
    expect(initializeApp).toHaveBeenCalledWith(prod.firebase);
    expect(connectAuthEmulator).not.toHaveBeenCalled();
    expect(connectFirestoreEmulator).not.toHaveBeenCalled();
  });
});
