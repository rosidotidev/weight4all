import { Routes } from '@angular/router';
import { sessionGuard } from './core/data/session.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  {
    path: 'login',
    canActivate: [sessionGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'today',
    canActivate: [sessionGuard],
    loadComponent: () => import('./features/today/today.component').then((m) => m.TodayComponent),
  },
  {
    path: 'settings',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  // Unknown addresses go through `today`, whose guard sends a signed-out user to /login.
  { path: '**', redirectTo: 'today' },
];
