import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { AuthService, Session, sameSession } from './auth.service';

export interface SessionStore {
  /** Empties the store; runs on every session change. */
  reset(): void;
  /** Starts loading; runs only when a user is signed in. */
  load?(uid: string): void;
}

/** The only code that resets and starts stores (AD-9). Injected once at startup. */
@Injectable({ providedIn: 'root' })
export class SessionScope {
  private readonly auth = inject(AuthService);
  private readonly stores: SessionStore[] = [];
  private readonly _sessionEpoch = signal(0);
  private last: Session = this.auth.session();

  /** Increases by 1 on every session change; async work tagged with an older value is discarded. */
  readonly sessionEpoch = this._sessionEpoch.asReadonly();

  constructor() {
    effect(() => {
      const session = this.auth.session();
      untracked(() => this.onSession(session));
    });
  }

  registerStore(store: SessionStore): void {
    this.stores.push(store);
  }

  private onSession(session: Session): void {
    if (sameSession(session, this.last)) return;
    this.last = session;
    this._sessionEpoch.update((n) => n + 1);
    for (const store of this.stores) store.reset();
    if (session.status === 'signedIn') {
      for (const store of this.stores) store.load?.(session.uid);
    }
  }
}
