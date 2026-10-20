import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register.component';
import { TodayComponent } from './features/today/today.component';

export const routes: Routes = [
  // The empty path goes to `register` until Story 1.6 adds the guard.
  { path: '', pathMatch: 'full', redirectTo: 'register' },
  { path: 'register', component: RegisterComponent },
  { path: 'today', component: TodayComponent },
];
