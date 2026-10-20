import { Injectable } from '@angular/core';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

/** Closed set of auth failures; raw Firebase text never leaves this file (AD-9). */
export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'network'
  | 'unknown';

export type AuthResult = { ok: true } | { ok: false; code: AuthErrorCode };

export function toAuthErrorCode(error: unknown): AuthErrorCode {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code: unknown }).code
      : undefined;
  switch (code) {
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
  /** Creates the Account and signs the user in. Story 1.6 adds login and the session signal. */
  async register(email: string, password: string): Promise<AuthResult> {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (error) {
      return { ok: false, code: toAuthErrorCode(error) };
    }
  }
}
