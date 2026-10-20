import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService, Session } from './auth.service';
import { sessionGuard } from './session.guard';

describe('sessionGuard', () => {
  let session: ReturnType<typeof signal<Session>>;

  beforeEach(() => {
    session = signal<Session>({ status: 'unknown' });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { session } }],
    });
  });

  function run(path: string) {
    return TestBed.runInInjectionContext(() =>
      sessionGuard({ routeConfig: { path } } as never, {} as never),
    ) as Promise<boolean | UrlTree>;
  }

  const url = (r: boolean | UrlTree) => (r instanceof UrlTree ? TestBed.inject(Router).serializeUrl(r) : r);

  it('waits while unknown, then applies the resolved session', async () => {
    let settled = false;
    const pending = run('today').then((r) => {
      settled = true;
      return r;
    });
    TestBed.tick();
    await Promise.resolve();
    expect(settled).toBe(false);
    session.set({ status: 'signedIn', uid: 'u1' });
    TestBed.tick();
    expect(await pending).toBe(true);
  });

  it('sends a signed-out user from a private address to /login after unknown', async () => {
    const pending = run('settings');
    session.set({ status: 'signedOut' });
    TestBed.tick();
    expect(url(await pending)).toBe('/login');
  });

  it.each(['login', 'register', 'reset'])('lets a signed-out user through to %s', async (p) => {
    session.set({ status: 'signedOut' });
    expect(await run(p)).toBe(true);
  });

  it('lets a signed-in user through to /today', async () => {
    session.set({ status: 'signedIn', uid: 'u1' });
    expect(await run('today')).toBe(true);
  });

  it.each(['login', 'register'])('sends a signed-in user from %s to /today', async (p) => {
    session.set({ status: 'signedIn', uid: 'u1' });
    expect(url(await run(p))).toBe('/today');
  });
});
