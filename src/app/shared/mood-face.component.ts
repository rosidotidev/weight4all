import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Center of the 50 x 50 face drawing. */
export const CENTER = 25;
/** Mouth ends sit this far below the center; a control point at this height draws a flat mouth. */
const MOUTH_ENDS = 6.5;
/** Middle of the 1-10 scale, where the mouth is flat. */
const MID_LEVEL = 5.5;
/** How far the control point moves from flat at the ends: 23.9 (1, light frown) to 39.1 (10, light smile). */
const MOUTH_REACH = 7.6;
const MOUTH_STEP = MOUTH_REACH / (10 - MID_LEVEL);

/** The mouth: a gentle quadratic curve from a light frown (1) to a light smile (10). */
export function mouthPath(n: number): string {
  const control = Math.round((CENTER + MOUTH_ENDS + (n - MID_LEVEL) * MOUTH_STEP) * 10) / 10;
  return `M${CENTER - 7.1} ${CENTER + MOUTH_ENDS} Q${CENTER} ${control} ${CENTER + 7.1} ${CENTER + MOUTH_ENDS}`;
}

/** The colours of level n as CSS values: the level reads from the fill, the number says it in text. */
export interface FaceColours {
  readonly fill: string;
  readonly stroke: string;
}

/** Level n's fill and stroke, from the `--w4a-mood-<n>-*` tokens. */
export function faceColours(n: number): FaceColours {
  return { fill: `var(--w4a-mood-${n}-fill)`, stroke: `var(--w4a-mood-${n}-stroke)` };
}

/** A small drawn face for list rows (decorative: the row carries the value as text). */
@Component({
  selector: 'w4a-mood-face',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    viewBox="7 7 36 36"
    aria-hidden="true"
    focusable="false"
    [style.--w4a-face-fill]="colours().fill"
    [style.--w4a-face-stroke]="colours().stroke"
  >
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
      fill: var(--w4a-face-fill);
      stroke: var(--w4a-face-stroke);
      stroke-width: 2.4;
    }
    .feature {
      fill: var(--w4a-face-stroke);
    }
    .mouth {
      fill: none;
      stroke: var(--w4a-face-stroke);
      stroke-width: 2.4;
      stroke-linecap: round;
    }
  `,
})
export class MoodFaceComponent {
  readonly level = input.required<number>();
  protected readonly center = CENTER;
  protected readonly mouth = computed(() => mouthPath(this.level()));
  protected readonly colours = computed(() => faceColours(this.level()));
}
