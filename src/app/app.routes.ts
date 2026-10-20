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
    path: 'reset',
    canActivate: [sessionGuard],
    loadComponent: () => import('./features/auth/reset.component').then((m) => m.ResetComponent),
  },
  {
    path: '',
    canActivate: [sessionGuard],
    canActivateChild: [sessionGuard],
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'today',
        loadComponent: () =>
          import('./features/today/today.component').then((m) => m.TodayComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history.component').then((m) => m.HistoryComponent),
      },
      {
        path: 'history/:dayKey',
        loadComponent: () =>
          import('./features/history/history-day.component').then((m) => m.HistoryDayComponent),
      },
      {
        path: 'report',
        loadComponent: () =>
          import('./features/report/report.component').then((m) => m.ReportComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  // Unknown addresses go through `today`, whose guard sends a signed-out user to /login.
  { path: '**', redirectTo: 'today' },
];
