import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService, Session } from './auth.service';
import { SessionScope } from './session-scope';

describe('SessionScope', () => {
  let session: ReturnType<typeof signal<Session>>;
  let scope: SessionScope;
  const reset = vi.fn();
  const load = vi.fn();

  beforeEach(() => {
    reset.mockClear();
    load.mockClear();
    session = signal<Session>({ status: 'unknown' });
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { session } }],
    });
    scope = TestBed.inject(SessionScope);
    scope.registerStore({ reset, load });
    TestBed.tick();
  });

  function change(next: Session) {
    session.set(next);
    TestBed.tick();
  }

  it('does not bump or reset for the initial state', () => {
    expect(scope.sessionEpoch()).toBe(0);
    expect(reset).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  it('login bumps once, resets and loads', () => {
    change({ status: 'signedIn', uid: 'u1' });
    expect(scope.sessionEpoch()).toBe(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('u1');
  });

  it('logout bumps once, resets and does not load', () => {
    change({ status: 'signedIn', uid: 'u1' });
    reset.mockClear();
    load.mockClear();
    change({ status: 'signedOut' });
    expect(scope.sessionEpoch()).toBe(2);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(load).not.toHaveBeenCalled();
  });

  it('a different uid replacing the first bumps, resets and loads the new uid', () => {
    change({ status: 'signedIn', uid: 'u1' });
    reset.mockClear();
    load.mockClear();
    change({ status: 'signedIn', uid: 'u2' });
    expect(scope.sessionEpoch()).toBe(2);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('u2');
  });

  it('the same uid set again does not bump', () => {
    change({ status: 'signedIn', uid: 'u1' });
    change({ status: 'signedIn', uid: 'u1' });
    expect(scope.sessionEpoch()).toBe(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('unknown to signedOut at startup counts as a change and does not load', () => {
    change({ status: 'signedOut' });
    expect(scope.sessionEpoch()).toBe(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(load).not.toHaveBeenCalled();
  });

  it('a store without a loader is only reset', () => {
    const only = vi.fn();
    scope.registerStore({ reset: only });
    change({ status: 'signedIn', uid: 'u1' });
    expect(only).toHaveBeenCalledTimes(1);
  });
});
