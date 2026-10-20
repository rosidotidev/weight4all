import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/data/auth.service';
import { I18n } from '../../shared/i18n';

/** Placeholder Settings screen with Log out; Story 1.9 replaces it. */
@Component({
  selector: 'w4a-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: 24px 16px;
      font-family: var(--w4a-font-family);
      color: var(--w4a-on-surface);
    }
    button {
      min-height: 44px;
      padding: 0 24px;
      font: inherit;
      font-weight: 500;
      color: var(--w4a-on-primary);
      background: var(--w4a-primary);
      border: 0;
      border-radius: var(--w4a-rounded-full);
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
    button:focus-visible {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 2px;
    }
    .error {
      margin: 8px 0 0;
      font-weight: 700;
    }
  `,
  template: `
    <main>
      <h1>{{ t().settingsTitle }}</h1>
      <button type="button" [disabled]="pending()" (click)="logout()">
        {{ t().settingsLogout }}
      </button>
      <p class="error" aria-live="polite">
        @if (failed()) {
          {{ t().authErrorUnknown }}
        }
      </p>
    </main>
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;
  protected readonly pending = signal(false);
  protected readonly failed = signal(false);

  protected async logout(): Promise<void> {
    if (this.pending()) return;
    this.pending.set(true);
    this.failed.set(false);
    const result = await this.auth.logout();
    if (result.ok) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    this.pending.set(false);
    this.failed.set(true);
  }
}
