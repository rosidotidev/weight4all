import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
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
    effect(() => {
      root.lang = i18n.language();
    });
  }
}
