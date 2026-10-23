import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService, Session } from './auth.service';

const PUBLIC_PATHS = ['login', 'reset'];

/** Waits out `unknown`, then keeps signed-out users on the public screens only (AD-9). */
export const sessionGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  let session: Session = auth.session();
  if (session.status === 'unknown') {
    session = await firstValueFrom(
      toObservable(auth.session).pipe(filter((s) => s.status !== 'unknown')),
    );
  }

  const isPublic = PUBLIC_PATHS.includes(route.routeConfig?.path ?? '');
  if (session.status === 'signedIn') {
    const authScreen = isPublic && route.routeConfig?.path !== 'reset';
    return authScreen ? router.createUrlTree(['/today']) : true;
  }
  return isPublic ? true : router.createUrlTree(['/login']);
};
