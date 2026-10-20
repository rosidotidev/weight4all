import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

/** Closed set of auth failures; raw Firebase text never leaves this file (AD-9). */
export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'network'
  | 'unknown';

/** Tri-state session (AD-9): `unknown` until Firebase has resolved. */
export type Session =
  | { status: 'unknown' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; uid: string };

export function sameSession(a: Session, b: Session): boolean {
  if (a.status !== b.status) return false;
  return a.status !== 'signedIn' || (b.status === 'signedIn' && a.uid === b.uid);
}

export type AuthResult = { ok: true } | { ok: false; code: AuthErrorCode };

export function toAuthErrorCode(error: unknown): AuthErrorCode {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code: unknown }).code
      : undefined;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'invalid-credentials';
    case 'auth/email-already-in-use':
      return 'email-in-use';
    case 'auth/weak-password':
      return 'weak-password';
    case 'auth/invalid-email':
      return 'invalid-email';
    case 'auth/network-request-failed':
      return 'network';
    default:
      return 'unknown';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<Session>({ status: 'unknown' }, { equal: sameSession });
  readonly session = this._session.asReadonly();

  constructor() {
    onAuthStateChanged(
      auth,
      (user) =>
        this._session.set(user ? { status: 'signedIn', uid: user.uid } : { status: 'signedOut' }),
      // Never leave the guard waiting on `unknown` if Firebase cannot resolve.
      () => this._session.set({ status: 'signedOut' }),
    );
  }

  /** Creates the Account and signs the user in. */
  async register(email: string, password: string): Promise<AuthResult> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      this._session.set({ status: 'signedIn', uid: credential.user.uid });
      return { ok: true };
    } catch (error) {
      return { ok: false, code: toAuthErrorCode(error) };
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      this._session.set({ status: 'signedIn', uid: credential.user.uid });
      return { ok: true };
    } catch (error) {
      return { ok: false, code: toAuthErrorCode(error) };
    }
  }

  /**
   * Sends the reset email. An unregistered address maps to `ok` so the answer never
   * reveals who has an Account (FR-3, AD-9), even when Firebase protection is off.
   */
  async sendPasswordReset(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code: unknown }).code
          : undefined;
      if (code === 'auth/user-not-found') return { ok: true };
      return { ok: false, code: toAuthErrorCode(error) };
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      await signOut(auth);
      this._session.set({ status: 'signedOut' });
      return { ok: true };
    } catch (error) {
      return { ok: false, code: toAuthErrorCode(error) };
    }
  }
}
