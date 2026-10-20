import type { EntryErrorCode } from '../core/data/entry.store';
import type { StringKey } from './strings';

const KEYS = {
  network: 'saveErrorNetwork',
  timeout: 'saveErrorTimeout',
  permission: 'saveErrorPermission',
  invalid: 'saveErrorInvalid',
  unknown: 'saveErrorUnknown',
} as const satisfies Record<EntryErrorCode, StringKey>;

/** The `strings.ts` key of the message for a failed save; raw Firebase text is never shown. */
export function saveErrorKey(code: EntryErrorCode): (typeof KEYS)[EntryErrorCode] {
  return KEYS[code];
}
