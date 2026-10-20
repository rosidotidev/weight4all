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
  styles: `
    :host {
      display: block;
      max-width: var(--w4a-form-column-width);
      margin-inline: auto;
      margin-block-end: var(--w4a-card-gap);
      font-family: var(--w4a-font-family);
    }
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      min-height: 370px;
      padding: 32px var(--w4a-space-6) 28px;
      overflow: hidden;
      text-align: center;
      border-radius: var(--w4a-rounded-xxl);
    }
    .card.loss {
      color: var(--w4a-on-primary);
      background: linear-gradient(
        to bottom right,
        var(--w4a-celebration-start),
        var(--w4a-celebration-mid) 60%,
        var(--w4a-celebration-end)
      );
    }
    .card.gain {
      color: var(--w4a-on-primary-container);
      background: var(--w4a-primary-container);
    }
    .icon {
      display: block;
      width: 60px;
      height: 60px;
    }
    .star {
      --tone: var(--w4a-confetti-gold);
      fill: var(--tone);
    }
    .disc {
      fill: var(--w4a-on-primary);
    }
    .tick {
      fill: none;
      stroke: var(--w4a-primary);
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .saved {
      margin: 38px 0 0;
      font-size: 15px;
      font-weight: 500;
      line-height: 20px;
    }
    .delta {
      margin: 12px 0 0;
      font-size: var(--w4a-type-effect-delta-size);
      font-weight: var(--w4a-type-effect-delta-weight);
      line-height: 66px;
    }
    .welcome {
      margin: 36px 0 0;
      font-size: 24px;
      font-weight: 700;
      line-height: 32px;
    }
    .vs {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      line-height: 22px;
    }
    .secondary {
      color: color-mix(in srgb, currentColor 88%, transparent);
    }
    .gain .secondary {
      color: var(--w4a-on-surface-variant);
    }
    .divider {
      align-self: stretch;
      height: 1px;
      margin: 24px 6px 0;
      background: color-mix(in srgb, var(--w4a-on-primary) 35%, transparent);
    }
    .wave {
      display: block;
      align-self: stretch;
      width: auto;
      height: 24px;
      margin: 18px 6px 0;
      overflow: visible;
    }
    .wave path {
      fill: none;
      stroke: color-mix(in srgb, var(--w4a-primary) 45%, transparent);
      stroke-width: 3;
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
    }
    .message {
      margin: 22px 0 0;
      font-size: 18px;
      font-weight: 500;
      line-height: 24px;
    }
    .gain .message {
      font-size: 16px;
    }
    .logged {
      margin: 6px 0 0;
      font-size: 13px;
      line-height: 18px;
    }
    .confetti {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .piece {
      position: absolute;
      left: calc(var(--x) * 1%);
      top: calc(var(--y) * 1%);
      background: var(--tone);
      transform: translate(-50%, -50%) rotate(calc(var(--r) * 1deg));
      animation: fall 2.8s ease-in var(--delay) both;
    }
    .piece.dot {
      width: 7px;
      height: 7px;
      border-radius: var(--w4a-rounded-full);
    }
    .piece.bar {
      width: 10px;
      height: 5px;
      border-radius: 1px;
    }
    .piece.tri {
      width: 12px;
      height: 10px;
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }
    .piece.gold {
      --tone: var(--w4a-confetti-gold);
    }
    .piece.pink {
      --tone: var(--w4a-confetti-pink);
    }
    .piece.mint {
      --tone: var(--w4a-confetti-mint);
    }
    .piece.orange {
      --tone: var(--w4a-confetti-orange);
    }
    .piece.sky {
      --tone: var(--w4a-confetti-sky);
    }
    .piece.white {
      --tone: var(--w4a-on-primary);
    }
    @keyframes fall {
      from {
        opacity: 0;
        transform: translate(-50%, calc(-50% - 36px)) rotate(calc(var(--r) * 1deg));
      }
      12% {
        opacity: 1;
      }
      75% {
        opacity: 1;
      }
      to {
        opacity: 0;
        transform: translate(-50%, calc(-50% + 28px)) rotate(calc(var(--r) * 1deg + 200deg));
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .piece {
        animation: none;
      }
    }
    .actions {
      display: grid;
      justify-items: center;
      gap: var(--w4a-space-2);
      margin-block-start: var(--w4a-space-6);
    }
    button {
      min-height: var(--w4a-touch-target);
      font: inherit;
      cursor: pointer;
      border: 0;
    }
    button:focus-visible {
      outline: 2px solid var(--w4a-primary);
      outline-offset: 2px;
    }
    .done {
      box-sizing: border-box;
      width: 100%;
      min-height: 52px;
      font-size: 17px;
      font-weight: 500;
      color: var(--w4a-on-primary);
      background: var(--w4a-primary);
      border-radius: var(--w4a-rounded-full);
    }
    .dismiss {
      padding: 0 var(--w4a-space-6);
      font-size: 15px;
      font-weight: 500;
      color: var(--w4a-primary);
      background: transparent;
      border-radius: var(--w4a-rounded-full);
    }
  `,
  template: `
    <section
      class="card"
      [class.loss]="view().loss"
      [class.gain]="!view().loss"
      aria-labelledby="w4a-effect-title"
    >
      @if (view().confetti) {
        <div class="confetti" aria-hidden="true">
          @for (piece of pieces; track $index) {
            <span
              [class]="'piece ' + piece.shape + ' ' + piece.tone"
              [style.--x]="piece.x"
              [style.--y]="piece.y"
              [style.--r]="piece.rotation"
              [style.--delay]="piece.delay + 'ms'"
            ></span>
          }
        </div>
      }
      @if (view().loss) {
        <svg class="icon" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
          <path class="star" d="M30 4l8 17 19 3-14 13 4 19-17-10-17 10 4-19-14-13 19-3z" />
        </svg>
      } @else {
        <svg class="icon" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
          <circle class="disc" cx="30" cy="30" r="30" />
          <path class="tick" d="M15 32l11 11 20-23" />
        </svg>
      }
      <p class="saved secondary" id="w4a-effect-title">{{ t().saved }}</p>
      @if (view().delta !== null) {
        <p class="delta">{{ view().delta }}</p>
        <p class="vs secondary">{{ view().comparison }}</p>
      } @else {
        <p class="welcome">{{ t().effectWelcome }}</p>
      }
      @if (view().loss) {
        <div class="divider" aria-hidden="true"></div>
      } @else {
        <svg
          class="wave"
          viewBox="0 0 280 14"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 14c40-14 60 14 100 0s60-14 100 0 50 8 70 0" />
        </svg>
      }
      @if (view().message !== null) {
        <p class="message">{{ view().message }}</p>
      }
      <p class="logged secondary">{{ view().logged }}</p>
    </section>
    <div class="actions">
      <button #done type="button" class="done" (click)="closed.emit()">{{ t().effectDone }}</button>
      <button type="button" class="dismiss" (click)="closed.emit()">{{ t().effectDismiss }}</button>
    </div>
  `,
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
      return { loss: false, confetti: false, delta: null, comparison: '', message: null, logged };
    }
    const loss = effect.kind === 'loss';
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
      logged,
    };
  });
}
