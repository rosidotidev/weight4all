import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from './core/data/auth.service';
import { routes } from './app.routes';
import { RegisterComponent } from './features/auth/register.component';
import { TodayComponent } from './features/today/today.component';

describe('routes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: { register: vi.fn() } },
      ],
    });
  });

  it('renders RegisterComponent for the empty path', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(RegisterComponent);
  });

  it('renders TodayComponent for /today', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/today');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(TodayComponent);
  });
});
