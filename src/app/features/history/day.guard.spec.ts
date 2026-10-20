import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { ClockService } from '../../core/state/clock.service';
import { dayGuard } from './day.guard';

describe('dayGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ClockService, useValue: { today: signal('2026-10-20') } }],
    });
  });

  function run(key: string | null): boolean | UrlTree {
    const route = { paramMap: { get: () => key } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => dayGuard(route, {} as RouterStateSnapshot)) as boolean | UrlTree;
  }

  it.each(['2026-10-20', '2026-10-19', '2025-02-28', '2024-02-29'])('lets %s through', (key) => {
    expect(run(key)).toBe(true);
  });

  it.each(['abc', '2026-13-40', '2026-02-30', '2026-1-5', '', '20261019', '2026-10-19x', ' 2026-10-19'])(
    'redirects the malformed key "%s" to /history',
    (key) => {
      const result = run(key);
      expect(result).toBeInstanceOf(UrlTree);
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/history');
    },
  );

  it('redirects tomorrow and later to /history', () => {
    for (const key of ['2026-10-21', '2027-01-01']) {
      expect(run(key)).toBeInstanceOf(UrlTree);
    }
  });

  it('redirects a missing parameter', () => {
    expect(run(null)).toBeInstanceOf(UrlTree);
  });
});
