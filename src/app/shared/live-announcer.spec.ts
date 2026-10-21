import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from './live-announcer';

describe('LiveAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty message', () => {
    expect(TestBed.inject(LiveAnnouncer).message()).toBe('');
  });

  it('writes the text after the region is cleared', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    announcer.say('Saved');
    expect(announcer.message()).toBe('');
    vi.advanceTimersByTime(100);
    expect(announcer.message()).toBe('Saved');
  });

  it('announces a repeated text again', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    announcer.say('Saved');
    vi.advanceTimersByTime(100);
    announcer.say('Saved');
    expect(announcer.message()).toBe('');
    vi.advanceTimersByTime(100);
    expect(announcer.message()).toBe('Saved');
  });

  it('keeps only the latest text when two outcomes come close together', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    announcer.say('Saved');
    announcer.say('Deleted');
    vi.advanceTimersByTime(100);
    expect(announcer.message()).toBe('Deleted');
  });
});
