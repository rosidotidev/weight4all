import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/data/auth.service';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ACCENTS, Accent } from '../../domain/accent';
import { Language } from '../../domain/language';
import { I18n } from '../../shared/i18n';

interface LanguageOption {
  readonly language: Language;
  readonly label: 'settingsLanguageEnglish' | 'settingsLanguageItalian';
}

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { language: 'en', label: 'settingsLanguageEnglish' },
  { language: 'it', label: 'settingsLanguageItalian' },
];

type AccentName = `accent${Capitalize<Accent>}`;

const ACCENT_OPTIONS: readonly { readonly accent: Accent; readonly label: AccentName }[] = ACCENTS.map(
  (accent) => ({ accent, label: `accent${accent[0].toUpperCase()}${accent.slice(1)}` as AccentName }),
);

/** Settings: accent and Language choices saved to the Account, and the Account section with Log out. */
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
    h2 {
      margin: var(--w4a-space-6) 0 var(--w4a-space-2);
      font-size: var(--w4a-type-section-label-size);
      font-weight: var(--w4a-type-section-label-weight);
      color: var(--w4a-primary);
    }
    fieldset {
      min-width: 0;
      margin: var(--w4a-space-6) 0 0;
      padding: 0;
      border: 0;
    }
    legend {
      padding: 0;
      margin-bottom: var(--w4a-space-2);
      font-size: var(--w4a-type-section-label-size);
      font-weight: var(--w4a-type-section-label-weight);
      color: var(--w4a-primary);
    }
    .segments {
      display: flex;
      max-width: 360px;
    }
    .segment {
      position: relative;
      flex: 1;
      display: flex;
    }
    .segment input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: pointer;
    }
    .segment span {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--w4a-space-2);
      min-height: max(48px, var(--w4a-touch-target));
      padding: 0 var(--w4a-space-4);
      border: 1px solid var(--w4a-outline);
      color: var(--w4a-on-surface);
      background: transparent;
    }
    .segment:first-child span {
      border-radius: var(--w4a-rounded-full) 0 0 var(--w4a-rounded-full);
    }
    .segment:last-child span {
      margin-left: -1px;
      border-radius: 0 var(--w4a-rounded-full) var(--w4a-rounded-full) 0;
    }
    .segment input:checked + span {
      color: var(--w4a-on-primary-container);
      background: var(--w4a-primary-container);
      font-weight: 700;
    }
    .segment input:checked + span::before {
      content: '\\2713';
    }
    .segment input:focus-visible + span {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 2px;
    }
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: var(--w4a-space-3);
      padding: var(--w4a-space-4) var(--w4a-space-3);
      background: var(--w4a-surface-container);
      border-radius: var(--w4a-rounded-xl);
    }
    .swatch {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: max(44px, var(--w4a-touch-target));
      height: max(44px, var(--w4a-touch-target));
    }
    .swatch input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: pointer;
    }
    .swatch span {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: var(--w4a-rounded-full);
      color: var(--w4a-on-primary);
      font-weight: 700;
    }
    .swatch input:checked + span {
      box-shadow:
        inset 0 0 0 3px var(--w4a-surface),
        0 0 0 3px var(--w4a-primary);
    }
    .swatch input:checked + span::before {
      content: '\\2713';
    }
    .swatch input:focus-visible + span {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 4px;
    }
    .account {
      padding: var(--w4a-space-5);
      background: var(--w4a-surface-container);
      border-radius: var(--w4a-rounded-xl);
    }
    .who {
      display: flex;
      align-items: center;
      gap: var(--w4a-space-4);
      padding-bottom: var(--w4a-space-4);
      border-bottom: 1px solid var(--w4a-surface-variant);
    }
    .avatar {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--w4a-rounded-full);
      color: var(--w4a-on-primary-container);
      background: var(--w4a-primary-container);
      font-size: 17px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .footer {
      margin: var(--w4a-space-6) 0 0;
      text-align: center;
      color: var(--w4a-on-surface-variant);
      font-size: var(--w4a-type-body-size);
    }
    .footer strong {
      display: block;
      font-weight: 500;
    }
    .caption {
      margin: 0;
      font-size: var(--w4a-type-caption-size);
      color: var(--w4a-on-surface-variant);
    }
    .email {
      margin: 0;
      font-weight: 500;
      overflow-wrap: anywhere;
    }
    button {
      min-height: 44px;
      margin-top: var(--w4a-space-2);
      padding: 0 var(--w4a-space-2);
      font: inherit;
      font-weight: 700;
      color: var(--w4a-primary);
      background: transparent;
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
      <fieldset>
        <legend>{{ t().settingsAccentLegend }}</legend>
        <div class="swatches">
          @for (option of accents; track option.accent) {
            <label class="swatch">
              <input
                type="radio"
                name="accent"
                [value]="option.accent"
                [attr.aria-label]="t()[option.label]"
                [checked]="preferences.accent() === option.accent"
                (change)="chooseAccent(option.accent)"
              />
              <span [style.background]="'var(--w4a-accent-' + option.accent + ')'" aria-hidden="true"></span>
            </label>
          }
        </div>
        <p class="error accent-error" aria-live="polite">
          @if (preferences.accentSaveError()) {
            {{ t().settingsAccentSaveError }}
          }
        </p>
      </fieldset>
      <fieldset>
        <legend>{{ t().settingsLanguageLegend }}</legend>
        <div class="segments">
          @for (option of options; track option.language) {
            <label class="segment">
              <input
                type="radio"
                name="language"
                [value]="option.language"
                [checked]="preferences.language() === option.language"
                (change)="choose(option.language)"
              />
              <span>{{ t()[option.label] }}</span>
            </label>
          }
        </div>
        <p class="error language-error" aria-live="polite">
          @if (preferences.saveError()) {
            {{ t().settingsLanguageSaveError }}
          }
        </p>
      </fieldset>
      <section aria-labelledby="account-heading">
        <h2 id="account-heading">{{ t().settingsAccountHeading }}</h2>
        <div class="account">
          <div class="who">
            <span class="avatar" aria-hidden="true">{{ initial() }}</span>
            <div>
              <p class="caption">{{ t().settingsSignedInAs }}</p>
              <p class="email">{{ auth.email() }}</p>
            </div>
          </div>
          <button type="button" [disabled]="pending()" (click)="logout()">
            {{ t().settingsLogout }}
          </button>
          <p class="error logout-error" aria-live="polite">
            @if (failed()) {
              {{ t().authErrorUnknown }}
            }
          </p>
        </div>
      </section>
      <p class="footer">
        <strong>{{ t().settingsFooterThanks }}</strong>
        {{ t().settingsFooterCount }}
      </p>
    </main>
  `,
})
export class SettingsComponent {
  protected readonly auth = inject(AuthService);
  protected readonly preferences = inject(PreferencesStore);
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;
  protected readonly options = LANGUAGE_OPTIONS;
  protected readonly accents = ACCENT_OPTIONS;
  protected readonly initial = computed(() => (this.auth.email() ?? '').charAt(0));
  protected readonly pending = signal(false);
  protected readonly failed = signal(false);

  protected choose(language: Language): void {
    void this.preferences.setLanguage(language);
  }

  protected chooseAccent(accent: Accent): void {
    void this.preferences.setAccent(accent);
  }

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
