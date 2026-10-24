import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from '../../core/data/preferences.store';
import { HappyEffect } from '../../domain/happy-effect';
import { Language } from '../../domain/language';
import { CONFETTI_MS, HappyEffectComponent } from './happy-effect.component';

const loss: HappyEffect = { kind: 'loss', delta: -0.3, since: '2026-10-19', yesterday: true };
const gain: HappyEffect = {
  kind: 'gain',
  delta: 0.2,
  since: '2026-10-19',
  yesterday: true,
  jump: false,
};
const jumpGain: HappyEffect = { ...gain, delta: 0.8, jump: true };
const same: HappyEffect = { kind: 'same', delta: 0, since: '2026-10-19', yesterday: true };
const welcome: HappyEffect = { kind: 'welcome' };

// Compiled styles carry an emulated-encapsulation attribute on every selector; drop it for matching.
const componentStyles = () =>
  (HappyEffectComponent as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles
    .join('')
    .replace(/\[_ngcontent-%COMP%\]/g, '');

describe('HappyEffectComponent', () => {
  let language: ReturnType<typeof signal<Language>>;

  beforeEach(async () => {
    language = signal<Language>('en');
    await TestBed.configureTestingModule({
      imports: [HappyEffectComponent],
      providers: [{ provide: PreferencesStore, useValue: { language } }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  async function setup(effect: HappyEffect, value = 72.4) {
    const fixture = TestBed.createComponent(HappyEffectComponent);
    fixture.componentRef.setInput('effect', effect);
    fixture.componentRef.setInput('value', value);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    // Fake timers would stall `whenStable`, so those tests render synchronously.
    if (vi.isFakeTimers()) fixture.detectChanges();
    else await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, closed };
  }
  const text = (el: HTMLElement, selector: string) =>
    el.querySelector(selector)?.textContent?.trim();

  it('celebrates a loss: delta with a real minus sign, comparison, message, confetti, star', async () => {
    const { el } = await setup(loss);
    expect(el.querySelector('.card')!.classList.contains('loss')).toBe(true);
    expect(text(el, '.saved')).toBe('Saved!');
    expect(text(el, '.delta')).toBe('−0.3 kg');
    expect(text(el, '.vs')).toBe('vs yesterday');
    expect(text(el, '.message')).toBe('Nice! Another step, your way.');
    expect(text(el, '.logged')).toBe('72.4 kg logged for today.');
    expect(el.querySelector('.divider')).not.toBeNull();
    expect(el.querySelector('.star')).not.toBeNull();
    expect(el.querySelectorAll('.piece').length).toBeGreaterThan(20);
    expect(el.querySelector('.wave')).toBeNull();
  });

  it('keeps confetti out of the way of the pointer and of assistive technology', async () => {
    const { el } = await setup(loss);
    const layer = el.querySelector<HTMLElement>('.confetti')!;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(layer).pointerEvents).toBe('none');
  });

  it('removes the confetti after 3 seconds and not before', async () => {
    vi.useFakeTimers();
    const { fixture, el } = await setup(loss);
    vi.advanceTimersByTime(CONFETTI_MS - 1);
    fixture.detectChanges();
    expect(el.querySelector('.confetti')).not.toBeNull();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(el.querySelector('.confetti')).toBeNull();
    expect(text(el, '.delta')).toBe('−0.3 kg');
  });

  it('keeps the pieces as drawn, with no timer, when motion is reduced', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
    }));
    vi.useFakeTimers();
    const { fixture, el } = await setup(loss);
    vi.advanceTimersByTime(CONFETTI_MS * 2);
    fixture.detectChanges();
    expect(el.querySelectorAll('.piece').length).toBeGreaterThan(20);
  });

  it('declares no animation for the pieces and no transitions under reduced motion', () => {
    const styles = componentStyles();
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*animation: none/);
    expect(styles).not.toContain('transition');
  });

  it.each([
    ['gain', gain, '+0.2 kg'],
    ['no change', same, '0.0 kg'],
  ] as const)(
    'is calm for %s: no confetti, check, wave, gain message',
    async (_name, effect, delta) => {
      const { el } = await setup(effect, 72.8);
      expect(el.querySelector('.card')!.classList.contains('gain')).toBe(true);
      expect(text(el, '.delta')).toBe(delta);
      expect(text(el, '.vs')).toBe('vs yesterday');
      expect(text(el, '.message')).toBe('Bodies fluctuate. Thanks for logging today.');
      expect(text(el, '.logged')).toBe('72.8 kg logged for today.');
      expect(el.querySelector('.confetti')).toBeNull();
      expect(el.querySelector('.piece')).toBeNull();
      expect(el.querySelector('.star')).toBeNull();
      expect(el.querySelector('.tick')).not.toBeNull();
      expect(el.querySelector('.wave')).not.toBeNull();
    },
  );

  it('shows no sign for no change, and never a hyphen minus', async () => {
    const { el } = await setup(same);
    expect(text(el, '.delta')).toBe('0.0 kg');
    const { el: lossEl } = await setup(loss);
    expect(text(lossEl, '.delta')).not.toContain('-');
  });

  it('names an older Entry by its date, without the weekday', async () => {
    const { el } = await setup({
      kind: 'loss',
      delta: -0.3,
      since: '2026-10-14',
      yesterday: false,
    });
    expect(text(el, '.vs')).toBe('vs 14 Oct');
  });

  it('shows the warning line under the gain message on a jump', async () => {
    const { el } = await setup(jumpGain, 70.8);
    expect(el.querySelector('.card')!.classList.contains('gain')).toBe(true);
    expect(text(el, '.message')).toBe('Bodies fluctuate. Thanks for logging today.');
    expect(text(el, '.warning')).toBe(
      'Your weight went up more than usual. Pay attention to what you eat.',
    );
  });

  it('gives a jump the angry face in place of the check and the warning in a solid pill', async () => {
    const { el } = await setup(jumpGain, 70.8);
    expect(el.querySelector('.card')!.classList.contains('jump')).toBe(true);
    expect(el.querySelector('.icon-wrap .face')).not.toBeNull();
    expect(el.querySelector('.face .brow')).not.toBeNull();
    expect(el.querySelectorAll('.face .eye')).toHaveLength(2);
    expect(el.querySelector('.face .mouth')).not.toBeNull();
    expect(el.querySelector('.tick')).toBeNull();
    expect(el.querySelector('.halo')).toBeNull();
    expect(el.querySelector('.confetti')).toBeNull();
    expect(text(el, '.warning')).toBe(
      'Your weight went up more than usual. Pay attention to what you eat.',
    );
  });

  it('gives a calm gain no jump class, no face and no pill', async () => {
    const { el } = await setup(gain);
    expect(el.querySelector('.card')!.classList.contains('jump')).toBe(false);
    expect(el.querySelector('.face')).toBeNull();
    expect(el.querySelector('.tick')).not.toBeNull();
  });

  it('colours the face and the pill with the amber tokens only, and never with red', () => {
    const styles = componentStyles();
    expect(styles).toMatch(/\.face-disc\s*\{\s*fill: var\(--(?:%NS%)?w4a-banner-dot\)/);
    expect(styles).toMatch(/background: var\(--(?:%NS%)?w4a-banner-dot\)/);
    expect(styles).toMatch(/color: var\(--(?:%NS%)?w4a-on-banner-container\)/);
    expect(styles).not.toMatch(/halo|\bred\b/i);
  });

  it('plays the jump motion once, with no looping animation', () => {
    const styles = componentStyles();
    expect(styles).not.toContain('infinite');
    expect(styles).toMatch(/\.face\s*\{\s*animation: [^;]*face-pop [^;]*both;/);
    expect(styles).toMatch(/\.card\.jump\s+\.warning\s*\{[^}]*animation: [^;]*pill-rise [^;]*both;/);
  });

  it('turns off the face pop and the pill slide under reduced motion', () => {
    const styles = componentStyles();
    const block = styles.slice(styles.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/\.face,\s*\.card\.jump\s+\.warning\s*\{\s*animation: none/);
  });

  it.each([
    ['a gain under 1%', gain],
    ['no change', same],
    ['a loss', loss],
    ['a welcome', welcome],
  ] as const)('shows no warning for %s', async (_name, effect) => {
    const { el } = await setup(effect);
    expect(el.querySelector('.warning')).toBeNull();
  });

  it('shows the warning in Italian', async () => {
    language.set('it');
    const { el } = await setup(jumpGain, 70.8);
    expect(text(el, '.warning')).toBe(
      'Il tuo peso è salito più del solito. Fai attenzione a cosa mangi.',
    );
  });

  it('welcomes a first Entry in place of delta and comparison, on a calm card', async () => {
    const { el } = await setup(welcome);
    expect(el.querySelector('.card')!.classList.contains('gain')).toBe(true);
    expect(text(el, '.welcome')).toBe('Welcome! Your first log is in.');
    expect(el.querySelector('.delta')).toBeNull();
    expect(el.querySelector('.vs')).toBeNull();
    expect(el.querySelector('.message')).toBeNull();
    expect(el.querySelector('.confetti')).toBeNull();
    expect(text(el, '.logged')).toBe('72.4 kg logged for today.');
  });

  it('speaks Italian with comma decimals', async () => {
    language.set('it');
    const { el } = await setup({
      kind: 'loss',
      delta: -0.3,
      since: '2026-10-14',
      yesterday: false,
    });
    expect(text(el, '.saved')).toBe('Salvato!');
    expect(text(el, '.delta')).toBe('−0,3 kg');
    expect(text(el, '.vs')).toBe('rispetto al 14 ott');
    expect(text(el, '.message')).toBe('Bene! Un altro passo, a modo tuo.');
    expect(text(el, '.logged')).toBe('72,4 kg registrati per oggi.');
    expect(el.querySelector('.done')!.textContent).toContain('Fatto');
    expect(el.querySelector('.dismiss')!.textContent).toContain('Chiudi');
  });

  it('is a labelled region', async () => {
    const { el } = await setup(loss);
    const card = el.querySelector('.card')!;
    expect(card.tagName).toBe('SECTION');
    expect(el.querySelector(`#${card.getAttribute('aria-labelledby')}`)!.textContent).toContain(
      'Saved!',
    );
  });

  it('moves focus to Done when it opens', async () => {
    const { el } = await setup(loss);
    expect(document.activeElement).toBe(el.querySelector('.done'));
  });

  it.each([
    ['Done', '.done'],
    ['Dismiss', '.dismiss'],
  ])('closes with %s', async (_name, selector) => {
    const { el, closed } = await setup(gain);
    el.querySelector<HTMLButtonElement>(selector)!.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('closes with Esc from anywhere', async () => {
    const { closed } = await setup(gain);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('ignores an Esc that something else already handled', async () => {
    const { closed } = await setup(gain);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    event.preventDefault();
    document.dispatchEvent(event);
    expect(closed).not.toHaveBeenCalled();
  });

  it('gives both buttons a 44 px target', async () => {
    const { el } = await setup(gain);
    expect(componentStyles()).toMatch(/min-height:\s*var\(--(?:%NS%)?w4a-touch-target\)/);
    expect(el.querySelectorAll('button')).toHaveLength(2);
  });
});
