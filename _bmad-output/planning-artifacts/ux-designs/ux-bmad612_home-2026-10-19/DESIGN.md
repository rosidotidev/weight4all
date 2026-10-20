---
title: "Weight4All — Design"
status: final
created: 2026-10-19
updated: 2026-10-19
name: Weight4All
description: Personal daily tracker for weight, mood and sleep. Material Design 3 for web, light theme; youthful, happy, colorful but not gaudy, never shaming.
colors:
  primary: '#5A46D6'
  on-primary: '#FFFFFF'
  primary-container: '#E4DEFF'
  on-primary-container: '#1B0A68'
  surface: '#FFFBFF'
  surface-container: '#F3EDF7'
  surface-variant: '#E7E0EC'
  on-surface: '#1C1B1F'
  on-surface-variant: '#49454F'
  outline: '#7A757F'
  chart-weight: '#2F5BD8'
  chart-mood: '#D9480F'
  chart-sleep: '#0B8A7B'
  banner-container: '#FFE9C7'
  on-banner-container: '#4A3000'
  banner-dot: '#E08A00'
  mood-face-fill: '#FFD35C'
  mood-face-stroke: '#5C4300'
  accent-primary: '#5A46D6'
  accent-teal: '#0B8A7B'
  accent-orange: '#D9480F'
  accent-magenta: '#C2287A'
  accent-blue: '#2F5BD8'
  accent-green: '#3C7D22'
  celebration-start: '#4A35C9'
  celebration-mid: '#6B47E0'
  celebration-end: '#9B4FD0'
  confetti-gold: '#FFC83D'
  confetti-pink: '#FF6FA5'
  confetti-mint: '#3EE0C5'
  confetti-orange: '#FF9A62'
  confetti-sky: '#8FB0FF'
typography:
  app-bar-title:
    fontSize: 22px
    fontWeight: '500'
  value-display:
    fontSize: 56px
    fontWeight: '500'
  effect-delta:
    fontSize: 58px
    fontWeight: '700'
  section-label:
    fontSize: 14px
    fontWeight: '700'
  card-label:
    fontSize: 14px
    fontWeight: '500'
  row-value:
    fontSize: 16px
    fontWeight: '700'
  stat-value:
    fontSize: 18px
    fontWeight: '700'
  body:
    fontSize: 14px
    fontWeight: '400'
  caption:
    fontSize: 12px
    fontWeight: '400'
rounded:
  sm: 8px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 28px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  margin-compact: 16px
  card-gap: 10px
  nav-bar-height: 80px
  nav-rail-width: 80px
  nav-drawer-width: 280px
  form-column-width: 600px
  sleep-clear-size: 40px
  touch-target: 44px
components:
  app-bar:
    background: '{colors.surface}'
    foreground: '{colors.on-surface}'
    typography: '{typography.app-bar-title}'
  navigation-bar:
    background: '{colors.surface-container}'
    indicator: '{colors.primary-container}'
    indicator-radius: '{rounded.full}'
    active-icon: '{colors.on-primary-container}'
    inactive-icon: '{colors.on-surface-variant}'
    height: '{spacing.nav-bar-height}'
  navigation-rail:
    background: '{colors.surface-container}'
    indicator: '{colors.primary-container}'
    indicator-radius: '{rounded.full}'
    active-icon: '{colors.on-primary-container}'
    inactive-icon: '{colors.on-surface-variant}'
    width: '{spacing.nav-rail-width}'
  navigation-drawer:
    background: '{colors.surface-container}'
    indicator: '{colors.primary-container}'
    indicator-radius: '{rounded.full}'
    active-foreground: '{colors.on-primary-container}'
    inactive-foreground: '{colors.on-surface}'
    width: '{spacing.nav-drawer-width}'
  input-card:
    background: '{colors.surface-container}'
    radius: '{rounded.xl}'
    padding: '{spacing.5}'
  stepper-button-minus:
    background: '{colors.primary-container}'
    foreground: '{colors.on-primary-container}'
    radius: '{rounded.full}'
  stepper-button-plus:
    background: '{colors.primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
  mood-face:
    background: '{colors.mood-face-fill}'
    foreground: '{colors.mood-face-stroke}'
  mood-face-selected:
    ring: '{colors.primary}'
    background: '{colors.primary-container}'
    label: '{colors.on-primary-container}'
  optional-tag:
    border: '{colors.outline}'
    foreground: '{colors.on-surface-variant}'
    radius: '{rounded.sm}'
  slider:
    track: '{colors.surface-variant}'
    active-track: '{colors.primary}'
    handle: '{colors.primary}'
  icon-button-clear:
    background: '{colors.surface-variant}'
    foreground: '{colors.on-surface-variant}'
    radius: '{rounded.full}'
    size: '{spacing.sleep-clear-size}'
  summary-card:
    background: '{colors.surface-container}'
    radius: '{rounded.xl}'
    padding: '{spacing.5}'
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
    height: 56px
  button-text:
    foreground: '{colors.primary}'
  missing-entry-banner:
    background: '{colors.banner-container}'
    foreground: '{colors.on-banner-container}'
    dot: '{colors.banner-dot}'
    radius: '{rounded.md}'
  happy-effect-loss:
    background: 'linear-gradient({colors.celebration-start}, {colors.celebration-mid}, {colors.celebration-end})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.xxl}'
  happy-effect-gain:
    background: '{colors.primary-container}'
    foreground: '{colors.on-primary-container}'
    radius: '{rounded.xxl}'
  history-row:
    background: '{colors.surface-container}'
    radius: '{rounded.md}'
    height: 62px
  history-row-missing:
    border: '{colors.outline}'
    border-style: dashed
    radius: '{rounded.md}'
    action-background: '{colors.primary-container}'
    action-foreground: '{colors.on-primary-container}'
  history-row-edit-reveal:
    background: '{colors.primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.md}'
  range-chip:
    border: '{colors.outline}'
    radius: '{rounded.sm}'
    height: 32px
  range-chip-selected:
    background: '{colors.primary-container}'
    foreground: '{colors.on-primary-container}'
  chart-card:
    background: '{colors.surface-container}'
    radius: '{rounded.xl}'
    gridline: '{colors.surface-variant}'
  stat-card:
    background: '{colors.surface-container}'
    radius: '{rounded.lg}'
  segmented-button:
    border: '{colors.outline}'
    selected-background: '{colors.primary-container}'
    selected-foreground: '{colors.on-primary-container}'
    height: 48px
  accent-swatch:
    size: 38px
    ring-width: 3px
  account-card:
    background: '{colors.surface-container}'
    radius: '{rounded.xl}'
---

## Brand & Style

Weight4All feels like a friendly daily companion, not a clinic. Youthful, happy, colorful but not gaudy: one confident violet carries the interface, warm yellow mood faces add personality, and the three chart colors give the data a playful but readable voice. The visual language never shames. A gain, a missed day or a low mood gets the same calm, kind treatment as a loss; only a loss earns confetti.

Foundation is Material Design 3 for web, light theme. M3 defaults (type scale, shape scale, state layers, motion) are inherited and referenced, not redefined; this file lists only the Weight4All deltas. Reference mockups:

- Phone: [Today](mockups/mock-01-today.svg), [Happy effect](mockups/mock-02-happy-effect.svg), [History](mockups/mock-03-history.svg), [Report](mockups/mock-04-report.svg), [Settings](mockups/mock-05-settings.svg)
- Tablet: [Today](mockups/tablet-01-today.svg), [Report](mockups/tablet-02-report.svg)
- Desktop: [Today](mockups/desktop-01-today.svg), [Report](mockups/desktop-02-report.svg)

DESIGN.md and EXPERIENCE.md win over the mockups on conflict.

## Colors

The palette is the approved one, taken from the mockups. Roles follow M3 naming.

- **Primary `{colors.primary}`** (violet): Save button, plus button, slider, selected accents, and links such as Log out. Use `{colors.on-primary}` for text on it.
- **Primary container `{colors.primary-container}` / `{colors.on-primary-container}`**: selected navigation indicator, selected chip and segment, minus button, fill of the selected mood face, calm gain card, `+ Add` action, and avatar.
- **Surface `{colors.surface}`**: page background. **Surface container `{colors.surface-container}`**: cards, history rows, navigation bar, rail and drawer, This week card. **Surface variant `{colors.surface-variant}`**: slider track, chart gridlines, dividers.
- **On-surface `{colors.on-surface}`**: primary text. **On-surface variant `{colors.on-surface-variant}`**: secondary text and inactive icons. **Outline `{colors.outline}`**: chip, segment and tag borders, and the dashed missing-day outline.
- **Chart colors**, fixed per Dimension and independent of the chosen accent (FR-6):

| Dimension | Token | Hex | Marker |
|---|---|---|---|
| Weight | `{colors.chart-weight}` | #2F5BD8 | circle |
| Mood level | `{colors.chart-mood}` | #D9480F | square |
| Sleep hours | `{colors.chart-sleep}` | #0B8A7B | triangle |

- **Chart markers** carry meaning together with color, never color alone. Markers have a 1.5px white stroke so they separate from lines.
- **Missing-entry banner** `{colors.banner-container}`, text `{colors.on-banner-container}`, dot `{colors.banner-dot}`: a warm amber, deliberately not error red.
- **Mood faces** fill `{colors.mood-face-fill}`, stroke and features `{colors.mood-face-stroke}`: the same yellow for all ten faces; the mouth curve alone expresses the level.
- **Accent swatches** (six, Settings): `{colors.accent-primary}` (default), `{colors.accent-teal}`, `{colors.accent-orange}`, `{colors.accent-magenta}`, `{colors.accent-blue}`, `{colors.accent-green}`. They are the primary, the three chart colors, magenta and green.
- **Celebration** `{colors.celebration-start}` to `{colors.celebration-end}` gradient and confetti `{colors.confetti-gold}`, `{colors.confetti-pink}`, `{colors.confetti-mint}`, `{colors.confetti-orange}`, `{colors.confetti-sky}`, white: only on the loss Happy effect.

Accent behavior `[NOTE FOR UX]`: the mockups show only the default violet. How the other five accents derive their container, on-container, gradient and confetti tones is not decided; it must keep AA contrast (FR-25) in every option. The teal and orange accents sit near 4.5:1 on `{colors.surface}` and must be checked before use as text color.

Dark mode `[NOTE FOR UX]`: not discussed with the user; no dark tokens are defined. Light theme only.

## Typography

Material 3 type scale in Roboto (fallback Arial, sans-serif); M3 roles are inherited. The named roles in the frontmatter record the sizes seen in the approved mockups:

- `{typography.value-display}`: the weight number.
- `{typography.effect-delta}`: the Happy effect change.
- `{typography.app-bar-title}`: the screen title.
- `{typography.section-label}` in `{colors.primary}`: Settings group headings.
- `{typography.row-value}`: History weight.
- `{typography.stat-value}`: Statistics.
- `{typography.caption}`: hints, axis text and legend text.

Use a minus sign (−), never a hyphen, in deltas and Statistics. Number and date formatting follows the Language (see EXPERIENCE.md). Italian strings run longer, so don't use fixed-width labels.

## Layout & Spacing

The base scale is 4px (`{spacing.1}` to `{spacing.6}`). Interactive targets are at least `{spacing.touch-target}`. The mockup reference width is 390px, and there is no horizontal page scroll from 360px up.

- **Compact width:** 16px side margin (`{spacing.margin-compact}`), full-width cards, 10px between cards (`{spacing.card-gap}`), 20px card padding (`{spacing.5}`). History rows are 62px high with 8px between them. The bottom navigation bar is 80px (`{spacing.nav-bar-height}`) with a 64x32 indicator.
- **Medium:** the navigation rail is `{spacing.nav-rail-width}` wide.
- **Expanded:** the labeled drawer is `{spacing.nav-drawer-width}` wide. The Today form column is `{spacing.form-column-width}` wide, centered, with a right column beside it.

Medium and expanded layouts follow the M3 window size classes (rules in EXPERIENCE.md, Responsive & Platform).

## Elevation & Depth

Tonal, not shadowed. Depth comes from `{colors.surface}` against `{colors.surface-container}` cards. No shadows in the approved mockups; the Happy effect card is distinguished by its fill. Overlays that need a scrim (delete confirmation dialog) use the M3 dialog elevation and scrim defaults.

## Shapes

Generously rounded, friendly. Cards `{rounded.xl}` (24); Happy effect card `{rounded.xxl}` (28); Statistics cards `{rounded.lg}` (20); banner and History rows `{rounded.md}` (16); range chips, tags `{rounded.sm}` (8); buttons, stepper buttons, sleep clear button, swatches, navigation indicator `{rounded.full}`. M3 shape scale is otherwise inherited.

## Components

Visual specs only; behavior lives in EXPERIENCE.md.

- **App bar** — `{colors.surface}`, title `{typography.app-bar-title}`, a small primary-colored logo dot (circle with white center) before the Today title.
- **Navigation bar** — `{colors.surface-container}`, four destinations (Today, History, Report, Settings) with icon above label; active destination has a `{colors.primary-container}` pill indicator, icon `{colors.on-primary-container}` and bold label; inactive `{colors.on-surface-variant}`.
- **Navigation rail** — medium window class, `{components.navigation-rail}`, `{spacing.nav-rail-width}` wide at the left: four destinations with icon above label, same indicator pill and active/inactive colors as the navigation bar. See [tablet Today](mockups/tablet-01-today.svg).
- **Navigation drawer** — expanded window class, `{components.navigation-drawer}`, `{spacing.nav-drawer-width}` wide at the left, always visible: four labeled rows (icon and text on one line); active row has a `{colors.primary-container}` pill with `{colors.on-primary-container}` bold label, inactive rows `{colors.on-surface}`. A top app bar (title and date) sits to its right. See [desktop Today](mockups/desktop-01-today.svg).
- **Weight card** — `{components.input-card}`; label "Weight"; centered `{typography.value-display}` number with a "kg" unit; round minus button (`{components.stepper-button-minus}`) left and plus button (`{components.stepper-button-plus}`) right, 56px diameter; caption "Last time: 72.7 kg · step 0.1 kg".
- **Mood card** — label "Mood", an "optional" outlined tag, hint "1 sad … 10 happy"; ten faces in two rows of five (34px face, number below); selected face: 50px ring `{colors.primary}` 3.5px on a `{colors.primary-container}` disc, bold number in `{colors.on-primary-container}`. Faces are drawn shapes: two eyes and a mouth curve from a deep frown (1) to a wide smile (10).
- **Sleep card** — label "Sleep", "optional" tag, value `22px` right aligned ("6.0 h" by default); slider with 6px track `{colors.surface-variant}`, active part and 22px handle in `{colors.primary}`, handle at 6.0 h on the 0 to 24 h track by default; end labels "0 h", "24 h"; the sleep clear icon-button at the right end of the slider row. On tablet the value is shown large (`{typography.value-display}`) with an "h" unit and the card sits beside the Weight card.
- **Sleep clear icon-button** — `{components.icon-button-clear}`: 40px round button, `{colors.surface-variant}` fill, an "x" glyph in `{colors.on-surface-variant}` (2px round-capped strokes), placed right of the slider; M3 state layers apply; accessible name "Clear sleep". Behavior in EXPERIENCE.md. `[NOTE FOR UX]` the cleared look (value "—", slider dimmed) is not drawn in the mockups.
- **This week card** — desktop only, `{components.summary-card}`, 320px wide at the top of the right column: title "This week" (16px bold), caption "6 of 7 days logged", then three columns Avg weight, Avg mood, Avg sleep (caption label over value). Below it, the "Last entries · newest first" list of five compact rows (`{components.history-row}` style). See [desktop Today](mockups/desktop-01-today.svg).
- **Save button** — `{components.button-primary}`, full width, 56px, label 18px medium.
- **Missing-entry banner** — `{components.missing-entry-banner}`: amber dot with halo ring, bold title and one supporting line; sits above the weight card.
- **Happy effect card** — 358x370 card. Loss: `{components.happy-effect-loss}` with a gold star at top, scattered confetti (circles, rectangles, triangles), "Saved!", `{typography.effect-delta}` delta, "vs yesterday", a 35% white divider, message and logged value. Gain or no change: `{components.happy-effect-gain}` with a check in a white circle and a soft wavy line, no confetti, same layout. Below the card: a filled "Done" button and a "Dismiss" text button in `{colors.primary}`.
- **History row** — `{components.history-row}`: date (medium), weight (`{typography.row-value}`), mood face (26px) with its number, sleep hours, overflow dots at the right. Weight-only row shows an em dash in `{colors.outline}` for absent mood and sleep. Missing day: `{components.history-row-missing}` with dashed outline, text "Mon 13 Oct — no entry" and a pill "+ Add". Swipe reveal: a `{components.history-row-edit-reveal}` Edit action with pencil icon at the right.
- **Range chips** — `{components.range-chip}`: 7 d, 30 d, 90 d, 1 y, All; selected `{components.range-chip-selected}` with a check mark and bold label.
- **Combined chart card** — `{components.chart-card}`: legend with marker + label ("Weight (kg)", "Mood (1–10)", "Sleep (h)"), horizontal gridlines `{colors.surface-variant}`, three 2.5px round-capped lines each with its marker, dashed segments over gaps, date ticks, annotation "no entries · bridged" at gaps, footnote "Each line uses its own scale. Dashed = days without an entry."
- **Statistics card** — `{components.stat-card}`, one per Dimension: marker + Dimension name, "last 30 days" at right, four columns Average, Min, Max, Change (caption label over `{typography.stat-value}` value, unit when meaningful).
- **Settings groups** — heading `{typography.section-label}`; accent swatch row (six 38px circles in a `{colors.surface-container}` card; selected one has a 3px outer ring and a white check); segmented button English | Italiano (`{components.segmented-button}`, selected segment with check); Account card with initial avatar (`{colors.primary-container}`), "Signed in as" caption, email, divider, "Log out" in `{colors.primary}` bold.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep each Dimension's color and marker (circle, square, triangle) everywhere | Recolor charts when the accent changes |
| Use amber for the Missing-entry sign | Use error red or exclamation icons for a missed day |
| Reserve confetti and gradient for a loss; keep gain/no change calm | Show sad, red or warning visuals for a gain or low mood |
| Draw gaps as dashed lines and missing days as dashed outlines | Interpolate gaps with a solid line |
| Show absent values as an em dash | Show absent mood or sleep as 0 |
| Pair color with shape, number or text | Rely on color alone (faces carry numbers, lines carry markers) |
| Use M3 state layers for hover, focus, press | Invent custom state colors |
| Use the minus sign (−) and the Language's number format | Mix decimal separators in one Language |
