import type { EntryErrorCode } from '../core/data/entry.store';
import { saveErrorKey } from './save-error';
import { strings } from './strings';

describe('saveErrorKey', () => {
  it.each<[EntryErrorCode, keyof typeof strings]>([
    ['network', 'saveErrorNetwork'],
    ['timeout', 'saveErrorTimeout'],
    ['permission', 'saveErrorPermission'],
    ['invalid', 'saveErrorInvalid'],
    ['unknown', 'saveErrorUnknown'],
  ])('maps %s to %s, a key with both languages', (code, key) => {
    expect(saveErrorKey(code)).toBe(key);
    expect(strings[key].en).toBeTruthy();
    expect(strings[key].it).toBeTruthy();
  });
});
