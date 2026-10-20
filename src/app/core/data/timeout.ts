/** A write that gets no answer (offline Firestore keeps writes pending) counts as failed after this long. */
export const SAVE_TIMEOUT_MS = 10_000;

export class TimeoutError extends Error {
  constructor() {
    super('timeout');
    this.name = 'TimeoutError';
  }
}

/** Races a promise against a timer; rejects with `TimeoutError` when the timer wins. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
