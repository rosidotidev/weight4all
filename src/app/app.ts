import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { SessionScope } from './core/data/session-scope';
import { RouterOutlet } from '@angular/router';
import { I18n } from './shared/i18n';

/** Accent theme class applied at startup; Story 1.10 makes it follow the saved accent. */
export const DEFAULT_THEME_CLASS = 'theme-violet';

@Component({
  imports: [RouterOutlet],
  selector: 'w4a-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    const root = inject(DOCUMENT).documentElement;
    const i18n = inject(I18n);
    inject(SessionScope); // starts the session lifecycle (AD-9)
    root.classList.add(DEFAULT_THEME_CLASS);
    effect(() => {
      root.lang = i18n.language();
    });
  }
}
