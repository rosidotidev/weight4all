import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { formatDay } from '../../domain/day';
import { PRIMARY } from '../../domain/dimensions';
import { HappyEffect } from '../../domain/happy-effect';
import { formatNumber } from '../../domain/number';
import { I18n } from '../../shared/i18n';

type Shape = 'bar' | 'dot' | 'tri';
type Tone = 'gold' | 'pink' | 'mint' | 'orange' | 'sky' | 'white';

/** How long the confetti plays before it is removed (FR-9). */
export const CONFETTI_MS = 3000;

/** Pieces as in the mockup: shape, x and y in percent of the card, rotation in degrees, color. */
const PIECES: readonly (readonly [Shape, number, number, number, Tone])[] = [
  ['bar', 37.7, 82.3, 26, 'gold'],
  ['dot', 59.2, 34.6, 0, 'pink'],
  ['tri', 15.6, 7.6, 5, 'mint'],
  ['bar', 61.5, 90.9, 74, 'white'],
  ['dot', 11.2, 16.8, 0, 'sky'],
  ['tri', 79.3, 27.8, 70, 'orange'],
  ['bar', 28.8, 75.5, 67, 'gold'],
  ['dot', 33.2, 3.2, 0, 'pink'],
  ['tri', 39.9, 21.6, 49, 'mint'],
  ['bar', 27.7, 82.6, 74, 'white'],
  ['dot', 92.5, 27.3, 0, 'sky'],
  ['tri', 89.4, 26.2, 171, 'orange'],
  ['bar', 59.5, 89.3, 63, 'gold'],
  ['dot', 28.2, 18.6, 0, 'pink'],
  ['tri', 42.7, 8.9, 140, 'mint'],
  ['bar', 46.9, 72.0, 74, 'white'],
  ['dot', 84.6, 23.0, 0, 'sky'],
  ['tri', 30.4, 31.4, 108, 'orange'],
  ['bar', 89.7, 81.8, 110, 'gold'],
  ['dot', 67.3, 12.7, 0, 'pink'],
  ['tri', 46.4, 20.8, 11, 'mint'],
  ['bar', 15.6, 73.4, 118, 'white'],
  ['dot', 92.2, 20.8, 0, 'sky'],
  ['tri', 79.1, 35.4, 179, 'orange'],
  ['bar', 53.1, 76.9, 172, 'gold'],
  ['dot', 30.7, 6.2, 0, 'pink'],
  ['tri', 31.6, 33.2, 70, 'mint'],
  ['bar', 30.4, 84.2, 111, 'white'],
  ['dot', 86.9, 23.8, 0, 'sky'],
  ['tri', 82.4, 16.5, 82, 'orange'],
  ['bar', 18.4, 73.9, 58, 'gold'],
  ['dot', 42.5, 17.8, 0, 'pink'],
  ['tri', 50.0, 15.1, 74, 'mint'],
  ['bar', 69.8, 72.8, 10, 'white'],
];

const CONFETTI = PIECES.map(([shape, x, y, rotation, tone], index) => ({
  shape,
  tone,
  x,
  y,
  rotation,
  delay: (index % 7) * 60,
}));

/**
 * The Happy effect card (FR-9, UX-DR8): a celebration with confetti for a loss, a calm card for a
 * gain or no change, a welcome when there is no earlier Entry. Presentational: the parent decides
 * when it exists and what happens on `closed` (Done, Dismiss or Esc).
 */
@Component({
  selector: 'w4a-happy-effect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': '$event.defaultPrevented || closed.emit()' },
  templateUrl: './happy-effect.component.html',
  styleUrl: './happy-effect.component.scss',
})
export class HappyEffectComponent {
  /** The comparison to show, from `happyEffect`. */
  readonly effect = input.required<HappyEffect>();
  /** The value that was saved, in display units. */
  readonly value = input.required<number>();
  /** Done, Dismiss or Esc. */
  readonly closed = output<void>();

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly pieces = CONFETTI;
  private readonly done = viewChild.required<ElementRef<HTMLButtonElement>>('done');
  private readonly playing = signal(true);

  constructor() {
    // With reduced motion the pieces stay as drawn; otherwise they are gone after 3 s.
    const win = inject(DOCUMENT).defaultView;
    if (!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const timer = setTimeout(() => this.playing.set(false), CONFETTI_MS);
      inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    }
    afterNextRender(() => this.done().nativeElement.focus());
  }

  protected readonly view = computed(() => {
    const effect = this.effect();
    const t = this.t();
    const locale = this.i18n.locale();
    const logged = t.effectLogged({ value: formatNumber(this.value(), PRIMARY.decimals, locale) });
    if (effect.kind === 'welcome') {
      return {
        loss: false,
        confetti: false,
        delta: null,
        comparison: '',
        message: null,
        warning: null,
        jump: false,
        logged,
      };
    }
    const loss = effect.kind === 'loss';
    const jump = effect.kind === 'gain' && effect.jump;
    const sign = loss ? '−' : effect.kind === 'gain' ? '+' : '';
    const delta = `${sign}${formatNumber(Math.abs(effect.delta), PRIMARY.decimals, locale)} ${PRIMARY.unit}`;
    const comparison = effect.yesterday
      ? t.effectYesterday
      : t.effectSince({ date: formatDay(effect.since, locale, false) });
    return {
      loss,
      confetti: loss && this.playing(),
      delta,
      comparison,
      message: loss ? t.effectLoss : t.effectGain,
      warning: jump ? t.effectJumpWarning : null,
      jump,
      logged,
    };
  });
}
