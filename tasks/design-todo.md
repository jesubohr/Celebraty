# Design Overhaul Checklist

Source: `tasks/design-plan.md` (revision 2). The recommended year ring was selected and implemented.

## Phase 0: Decision

- [x] Decide ring or bubbles. Approving the ring retires `BirthdayBubbleChart/` and `d3-hierarchy`; keeping the bubbles leaves the signed-out screen needing a different visual.

## Phase 1: Rendering bugs and color tokens

- [x] Remove `font-sans` from `<body>` so Manrope renders (`base.astro:78`).
- [x] Apply the ground token to `<body>` and swap `min-h-screen` for `min-h-[100dvh]`.
- [x] Fill the `<AUTHOR>` placeholder in the author meta tag (`base.astro:58`).
- [x] Reconcile `theme-color`, `msapplication-TileColor`, and `site.webmanifest` on one ground value.
- [x] Add `src/lib/theme.ts` as the single palette source, exporting OKLCH for CSS and sRGB hex for email.
- [x] Replace the raw hex values in `@theme inline` with semantic OKLCH tokens.
- [x] Move `--ink-muted` off `#9c7b6a` to `#7d5f4f`, which passes at every size the app uses.
- [x] Change the primary button to ember fill with `--ink` text, replacing white at 2.68:1.
- [x] Add `--ember-strong` for the surfaces that must carry white text.
- [x] Add `--danger` and replace every `text-red-500`.
- [x] Fix `.pill-today`, which sits at 2.44:1.
- [x] Declare graphic tokens outside `@theme inline` so SVG `var()` references resolve.
- [x] Replace the `focus:shadow-[...]` ring with `:focus-visible` plus `outline` and `outline-offset`.
- [x] Add dark mode through `prefers-color-scheme`, with an inline script that swaps `theme-color`.
- [x] Apply one concentric radius rule across card, input, and button.
- [x] Replace the `.card` border and `shadow-sm` with a layered shadow tinted to the ground hue.

## Checkpoint: Foundation

- [x] Computed `font-family` on `<body>` is Manrope Variable.
- [x] Computed `background-color` on `<body>` is the ground token, not transparent.
- [x] Re-measure every pair in the plan's contrast table, in both modes. All clear 4.5:1.
- [x] Look at Manrope rendering correctly, then decide whether a display face is still wanted.
- [x] `pnpm exec astro check && pnpm build`

## Phase 2: Forms, copy, and the signed-out composition

- [x] Build `src/components/BirthdayField.tsx` as one `role="group"` with three numeric segments.
- [x] Use `inputMode="numeric"` with `pattern="[0-9]*"`, never `type="number"`.
- [x] Add smart auto-advance, backspace-to-previous, arrow navigation, paste distribution, and blur zero-padding.
- [x] Put one focus ring on the group through `:focus-within`, never on the segments.
- [x] Size segments in `ch` with tabular numerals so they do not resize while typing.
- [x] Validate per segment on blur, with the day maximum derived from the month.
- [x] Adopt `BirthdayField` in `RegisterForm`, retiring the month `select` and `select.input`.
- [x] Link errors with `role="alert"` and `aria-describedby` in both forms.
- [x] Move focus to the success heading in both forms.
- [x] Return Spanish Zod messages, per field, from `api/register.ts`.
- [x] Add the brand lockup from `public/logo.png` across all three states.
- [x] Drop the card on the signed-out screen and set the field on the ground.
- [x] Tint inputs one step from their container, not from the page.
- [x] Lower the `h1` to `text-3xl` and raise the subtitle to `text-base`.
- [x] Center the column vertically instead of pinning it to the top.
- [x] Remove the "Entrar" heading and the duplicate dashboard `h2`.
- [x] Rewrite the subtitle to say what Celebraty does, not what to do next.
- [x] Shorten the login button to "Enviar enlace".
- [x] Hold one verb through registration: Unirme, Uniéndote, Ya estás en el círculo.
- [x] Use "círculo" everywhere, never "lista".
- [x] Replace the vague error fallbacks with messages that name the failure and the fix.
- [x] Retire the decorative emoji across the app and both emails.

## Checkpoint: Forms and accessibility

- [x] Type `1503`. The caret reaches año on its own, with día `15` and mes `03`.
- [x] Type `4` in día. It advances at once, because `40` exceeds 31.
- [x] Backspace from an empty mes returns to día with the caret at the end.
- [x] Paste `15/03/1998` into día. All three segments fill.
- [x] Enter `31` and `02`. Blur names the day in the message.
- [x] Tab the field. One focus ring around the group, not three.
- [x] Submit an invalid email. The message is Spanish.
- [ ] VoiceOver announces every label, every error, and each success. (Requires manual macOS VoiceOver verification.)
- [x] axe-core reports zero violations, in both modes.
- [x] `pnpm test && pnpm exec astro check && pnpm build`

## Phase 3: The year ring

Phase 0 resolved: year ring selected.

- [x] Add `src/lib/year.ts` with day-of-year to angle math and the dot collision pass.
- [x] Build `src/components/YearRing.tsx` holding the ring and the visible list in one island.
- [x] Derive geometry from `date-fns` `getDayOfYear` and `getDaysInYear`. Add no date library.
- [x] Draw twelve month ticks, `ene` through `dic`, around the circumference.
- [x] Draw the 30-day window as a `stroke-dasharray` arc in `--ember`, with today marked.
- [x] Push colliding dots outward in 6px steps so adjacent days separate at 320px.
- [x] Reserve the box with `aspect-ratio: 1` before measuring, so the ring cannot shift layout.
- [x] Make the visible list the accessible equivalent, with `aria-hidden` on the SVG.
- [x] Link hover and keyboard focus between each row and its dot through React state.
- [x] Render the empty state as a bare circumference with today and the arc still drawn.
- [x] Place the empty ring on the signed-out screen, stacked above the field.
- [x] Animate the ring draw, the dot stagger, and the success spring, each under `useReducedMotion`.
- [x] Land the new dot on the ring before the 900ms redirect in `RegisterForm.tsx:62`.
- [x] Delete `src/components/BirthdayBubbleChart/`, moving its reduced-motion test to `YearRing`.
- [x] Drop `d3-hierarchy` and `@types/d3-hierarchy`.

## Checkpoint: Ring

- [x] Seed two friends born today and one three days out. All three read correctly, whatever the insert order.
- [x] The ring is skipped as `aria-hidden` and the visible list carries the same data.
- [x] No label renders below 12px or below 4.5:1.
- [x] Turn on Reduce Motion. The ring renders final-state, with no draw and no stagger.
- [ ] Replay motion at 10%. The draw and stagger stay in sync and the success spring settles cleanly. (Requires manual DevTools playback.)
- [ ] Lighthouse on the signed-in view reports CLS below 0.1. (Browser Performance API measured CLS at 0; Lighthouse remains manual.)
- [x] Verify 320, 768, 1024, and 1440 pixel layouts.

## Phase 4: Email

- [x] Derive both templates' colors from `src/lib/theme.ts` instead of hardcoded hex.
- [x] Drop `fontFamily: "Georgia, serif"` from `DailyBirthdayDigest.tsx` and `LoginLink.tsx`.
- [x] Fix the `#C8B4A6` footer text in both templates, currently at 1.99:1.
- [x] Switch the `LoginLink` button to `--ember-strong`, which carries white at 5.24:1.
- [x] Carry over the large-numeral treatment. Do not render the ring in email.
- [x] Add `prefers-color-scheme` support and confirm it degrades cleanly.

## Checkpoint: Release candidate

- [x] Render both templates for one and for three birthdays, in light and dark.
- [x] Tab the whole app. Every control is reachable, focus is visible, order matches reading order.
- [x] Re-check contrast across every screen in both modes.
- [x] `pnpm test`
- [x] `pnpm exec astro check`
- [x] `pnpm build`
- [x] Review the final diff for secrets, generated output, and unrelated changes.

## Follow-up

- [x] Decide whether to add `@fontsource-variable/bricolage-grotesque`, after judging Manrope on screen.
- [x] Hold the bubble palette hues inside a 60 degree arc, if any pastel fills survive the ring.
