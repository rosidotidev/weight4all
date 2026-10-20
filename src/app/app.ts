import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { EntryStore } from './core/data/entry.store';
import { PreferencesStore } from './core/data/preferences.store';
import { DraftStore } from './core/state/draft.store';
import { SessionScope } from './core/data/session-scope';
import { RouterOutlet } from '@angular/router';
import { I18n } from './shared/i18n';

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
    const preferences = inject(PreferencesStore);
    inject(DraftStore); // typed values live outside components, so they survive Tab switches (AD-12)
    inject(EntryStore); // registered before the session resolves, so it loads on sign-in
    // Exactly one `theme-<id>` class on <html>, following the accent
    effect(() => {
      const next = `theme-${preferences.accent()}`;
      for (const cls of Array.from(root.classList)) {
        if (cls.startsWith('theme-') && cls !== next) root.classList.remove(cls);
      }
      root.classList.add(next);
    });
    effect(() => {
      root.lang = i18n.language();
    });
  }
}
