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
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
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
