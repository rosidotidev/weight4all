import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Center of the 50 x 50 face drawing. */
export const CENTER = 25;
/** Control point offset of the mouth at level 1, and its growth per level (as drawn in the mockups). */
const MOUTH_FROWN = -13.4;
const MOUTH_STEP = 4.42;

/** The mouth: a quadratic curve from a deep frown (1) to a wide smile (10). */
export function mouthPath(n: number): string {
  const control = Math.round((CENTER + MOUTH_FROWN + (n - 1) * MOUTH_STEP) * 10) / 10;
  return `M${CENTER - 7.1} ${CENTER + 6.5} Q${CENTER} ${control} ${CENTER + 7.1} ${CENTER + 6.5}`;
}

/** A small drawn face for list rows (decorative: the row carries the value as text). */
@Component({
  selector: 'w4a-mood-face',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="7 7 36 36" aria-hidden="true" focusable="false">
    <circle class="head" [attr.cx]="center" [attr.cy]="center" r="17" />
    <circle class="feature" [attr.cx]="center - 6" [attr.cy]="center - 3.4" r="1.9" />
    <circle class="feature" [attr.cx]="center + 6" [attr.cy]="center - 3.4" r="1.9" />
    <path class="mouth" [attr.d]="mouth()" />
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
    }
    svg {
      width: 26px;
      height: 26px;
    }
    .head {
      fill: var(--w4a-mood-face-fill);
      stroke: var(--w4a-mood-face-stroke);
      stroke-width: 2.4;
    }
    .feature {
      fill: var(--w4a-mood-face-stroke);
    }
    .mouth {
      fill: none;
      stroke: var(--w4a-mood-face-stroke);
      stroke-width: 2.4;
      stroke-linecap: round;
    }
  `,
})
export class MoodFaceComponent {
  readonly level = input.required<number>();
  protected readonly center = CENTER;
  protected readonly mouth = computed(() => mouthPath(this.level()));
}
