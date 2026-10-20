import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ClockService } from '../core/state/clock.service';
import { LayoutService } from '../core/state/layout.service';
import { formatDay } from '../domain/day';
import { I18n } from '../shared/i18n';
import { StringKey } from '../shared/strings';

interface Tab {
  readonly path: string;
  readonly label: StringKey;
  /** Material icon path, 24x24 viewBox. */
  readonly icon: string;
}

const TABS: readonly Tab[] = [
  {
    path: '/today',
    label: 'navToday',
    icon: 'M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
  },
  {
    path: '/history',
    label: 'navHistory',
    icon: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
  },
  {
    path: '/report',
    label: 'navReport',
    icon: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  },
  {
    path: '/settings',
    label: 'navSettings',
    icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
  },
];

/** Signed-in frame: the four Tabs as bottom bar, rail or drawer by window class, plus the screen. */
@Component({
  selector: 'w4a-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly clock = inject(ClockService);
  protected readonly windowClass = inject(LayoutService).windowClass;
  protected readonly tabs = TABS;
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** The app bar names the screen; Today carries the app name (DESIGN.md, App bar). */
  protected readonly title = computed(() => {
    const url = this.url();
    const tab = TABS.find((candidate) => url === candidate.path || url.startsWith(`${candidate.path}/`));
    return !tab || tab.path === '/today' ? this.t().appName : this.t()[tab.label];
  });

  /** Expanded app bar: the Tab name at the left, today's date at the right (desktop mockup). */
  protected readonly tabTitle = computed(() => {
    const url = this.url();
    const tab = TABS.find((candidate) => url === candidate.path || url.startsWith(`${candidate.path}/`));
    return this.t()[(tab ?? TABS[0]).label];
  });
  protected readonly date = computed(() => formatDay(this.clock.today(), this.i18n.locale()));
}
