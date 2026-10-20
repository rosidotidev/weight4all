import { TestBed } from '@angular/core/testing';
import { LANGUAGE_CACHE_KEY, PreferencesStore } from './preferences.store';

function create(): PreferencesStore {
  TestBed.resetTestingModule();
  return TestBed.inject(PreferencesStore);
}

describe('PreferencesStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('defaults to English with no cache', () => {
    expect(create().language()).toBe('en');
  });

  it('reads a cached choice at startup', () => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, 'it');
    expect(create().language()).toBe('it');
  });

  it.each(['fr', ''])('falls back to English for bad cache %j', (bad) => {
    localStorage.setItem(LANGUAGE_CACHE_KEY, bad);
    expect(create().language()).toBe('en');
  });

  it('falls back to English when localStorage throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(create().language()).toBe('en');
  });

  it('writes the cache and survives a throwing write', () => {
    const store = create();
    store.setLanguage('it');
    expect(store.language()).toBe('it');
    expect(localStorage.getItem(LANGUAGE_CACHE_KEY)).toBe('it');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    store.setLanguage('en');
    expect(store.language()).toBe('en');
  });
});
