import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClockService } from '../../core/state/clock.service';
import { dayKey, parseDayKey } from '../../domain/day';

/** Lets Entry edit open only for a real Day that is not after today; anything else goes to /history. */
export const dayGuard: CanActivateFn = (route) => {
  const key = route.paramMap.get('dayKey') ?? '';
  const date = parseDayKey(key);
  const valid = date !== null && dayKey(date) === key && key <= inject(ClockService).today();
  return valid ? true : inject(Router).createUrlTree(['/history']);
};
