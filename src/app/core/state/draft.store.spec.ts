import { TestBed } from '@angular/core/testing';
import { DraftStore } from './draft.store';

describe('DraftStore', () => {
  let store: DraftStore;
  beforeEach(() => {
    store = TestBed.inject(DraftStore);
  });

  it('starts empty: every field is untouched', () => {
    expect(store.get('2026-10-20')).toEqual({});
  });

  it('keeps typed text per Day', () => {
    store.set('2026-10-20', 'weight', '72');
    store.set('2026-10-19', 'weight', '70,5');
    expect(store.get('2026-10-20')).toEqual({ weight: { state: 'value', text: '72' } });
    expect(store.get('2026-10-19')).toEqual({ weight: { state: 'value', text: '70,5' } });
  });

  it('marks blank text as cleared', () => {
    store.set('2026-10-20', 'weight', '72');
    store.set('2026-10-20', 'weight', '  ');
    expect(store.get('2026-10-20')).toEqual({ weight: { state: 'cleared', text: '' } });
  });

  it('drops one Day only', () => {
    store.set('2026-10-20', 'weight', '72');
    store.set('2026-10-19', 'weight', '70');
    store.drop('2026-10-20');
    expect(store.get('2026-10-20')).toEqual({});
    expect(store.get('2026-10-19')).toEqual({ weight: { state: 'value', text: '70' } });
  });

  it('reset empties everything', () => {
    store.set('2026-10-20', 'weight', '72');
    store.reset();
    expect(store.get('2026-10-20')).toEqual({});
  });
});
