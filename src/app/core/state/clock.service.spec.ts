import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClockService } from './clock.service';

describe('ClockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts with the local day', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59));
    expect(TestBed.inject(ClockService).today()).toBe('2026-01-01');
  });

  it('rolls over at local midnight, repeatedly', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59));
    const clock = TestBed.inject(ClockService);
    vi.advanceTimersByTime(30_000);
    expect(clock.today()).toBe('2026-01-01');
    vi.advanceTimersByTime(31_000);
    expect(clock.today()).toBe('2026-01-02');
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(clock.today()).toBe('2026-01-03');
  });

  it('updates when the tab becomes visible after midnight', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 23, 0));
    const clock = TestBed.inject(ClockService);
    vi.setSystemTime(new Date(2026, 0, 2, 8, 0)); // timers were frozen while hidden
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(clock.today()).toBe('2026-01-02');
  });

  it('releases its timer and listener on destroy', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59));
    const remove = vi.spyOn(document, 'removeEventListener');
    TestBed.inject(ClockService);
    expect(vi.getTimerCount()).toBe(1);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
