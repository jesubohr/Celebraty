> **Status:** Revision 2. Supersedes the approved v1, kept at `tasks/design-plan.v1.md`.
> **Created:** 2026-09-01. **Revised:** 2026-09-01.
> **Why revised:** v1 was written before commit `f8460bd` ("passwordless email login and birthday bubble dashboard"). That commit fixed two of the nine bugs v1 lists, deleted a file v1 plans to modify, and added a visualization v1 does not know about. This revision corrects the audit against the code that runs today, and adds a contrast failure v1 missed.
> **Scope note:** This is the design overhaul plan. It is unrelated to `tasks/plan.md` / `tasks/todo.md`, which cover the dependency security refresh.

# Celebraty - design overhaul: "La vuelta al sol"

## What changed since v1

| v1 said | Reality today |
|---|---|
| Bug 3: `actions.ts:22` mutates `now` inside `.map` | **Already fixed.** The logic moved to `src/lib/birthdays.ts`. `startOfBogotaDay` mutates a fresh copy returned by `toZonedTime`, so nothing leaks across iterations. Covered by `src/lib/birthdays.test.ts`. |
| Bug 5: `Field` renders `<label>` and input as siblings | **Wrong reading.** `Field` wraps the input inside the `<label>`, which is valid implicit association. Screen readers announce the label. The real gap is the error link, which is bug 6. |
| Modify `src/components/UpcomingList.tsx` | **File does not exist.** `BirthdayBubbleChart` replaced it. |
| Split `getUpcomingBirthdays` so it stops filtering to 30 days | **Already done.** The function is `getBirthdayCountdowns` and it returns every friend, sorted. No 30-day filter remains. |
| Open question: names exposed on an unauthenticated page | **Resolved.** `index.astro:23` gates the query behind `session?.friendId`. Nothing is public. The privacy question is moot; delete it. |
| Nothing about the primary button | **The primary CTA fails WCAG AA at 2.68:1.** See "The finding v1 missed" below. This is the most serious defect in the app. |

Bugs 1, 2, 4, 6, 7, 8 and 9 from v1 are real and still present. I confirmed 1 and 2 in the running app, not just by reading the source.

---

## Design read

**Reading this as:** a private consumer utility for a Spanish-speaking friend circle, with a warm and personal language, leaning toward Tailwind v4 + the existing Manrope + a restrained information graphic as the one bold element.

The audience is friends and family, not buyers. Nobody is being convinced of anything. The job is to make a small recurring moment feel considered.

**Dials**, reasoned from that read rather than from the baseline:

| Dial | Value | Why |
|---|---|---|
| `DESIGN_VARIANCE` | 5 | The app is one column at `max-w-md`. High variance has nothing to act on. The value graphic supplies the only asymmetry. |
| `MOTION_INTENSITY` | 5 | People open this rarely. An entrance and the registration payoff earn motion. Nothing else does. |
| `VISUAL_DENSITY` | 3 | One idea per screen. Generous spacing costs nothing here. |

**Redesign mode: preserve.** The coral comes from the real logo. The information architecture works. Evolve the surface, keep the structure.

**Partly out of scope.** The signed-in view is product UI, not a landing page. Apply the marketing-page rules only to the signed-out entry screen. Judge the dashboard on clarity and accessibility instead.

---

## The finding v1 missed: the palette fails contrast

I measured every text and background pair the app ships. Six fail WCAG AA.

| Pair | Where | Ratio | Needs |
|---|---|---|---|
| White on `#e8826b` | **Every primary button** (`.btn-primary`) | **2.68** | 4.5 |
| `#e8826b` on `accent/10` | `.pill-today` | 2.44 | 4.5 |
| `#9c7b6a` on `#faf6f1` | every muted line at 14px | 3.58 | 4.5 |
| `#9c7b6a` on white | muted text inside cards | 3.85 | 4.5 |
| `#9c7b6a` on the bubble fills | countdown labels at 7px to 11px | 2.57 to 2.91 | 4.5 |
| `#C8B4A6` on white | both email footers | 1.99 | 4.5 |

v1 keeps `--ember` "as-is" and only asks to "verify" the muted token. Both instructions ship the failure forward. Fix the values instead.

**The accent does not need to change.** The logo coral carries `--ink` text at **6.39:1**. So the primary button becomes coral with dark ink on it, not coral with white on it. That passes AA comfortably and keeps the brand color exactly as the logo draws it. Darkening the coral to `#b8482f` to rescue white text costs the brand its warmth and is the worse trade.

Keep a second token `--ember-strong` (`#b8482f`, white at 5.24:1) for the rare case that needs white text, such as the email button where dark-on-coral reads oddly next to client chrome.

**The muted token has to move.** `#9c7b6a` cannot pass at any size the app uses it. `#7d5f4f` gives 5.39:1 on cream and 5.80:1 on white with the same hue.

---

## Bugs to fix first, independent of the redesign

| # | File | Problem | Effect |
|---|---|---|---|
| 1 | `base.astro:78` | `font-sans` on `<body>` resolves to `var(--font-sans)`, Tailwind's system stack, and beats the `html` rule in `global.css:19-21` | **Manrope downloads but never renders.** Confirmed in the browser: computed `font-family` is `-apple-system, system-ui, ...`. Drop the class. |
| 2 | `base.astro:78` | No background class on `<body>` | Confirmed: computed `background-color` is `rgba(0,0,0,0)`, so the page is white. `theme-color` claims `#faf6f1` and the manifest claims `#FDF6EC`. Three values, one ground. |
| 3 | `register.ts:28` | Returns `parsed.error.issues[0].message` | The Spanish UI shows English Zod text. Also returns only the first issue, so a form with two mistakes reports one. |
| 4 | `RegisterForm.tsx:154-164`, `EmailLoginForm.tsx:74-83` | Error `<p>` has no `role="alert"` and no `aria-describedby` link | Errors are silent to screen readers. |
| 5 | `RegisterForm.tsx:69-82`, `EmailLoginForm.tsx:38-51` | Success replaces the form with no focus management | Focus falls to `<body>`. Nothing announces the change. |
| 6 | `RegisterForm.tsx:128,142` | `type="number"` on day and year | The scroll wheel silently changes values and spinners appear. This is why GOV.UK moved to `inputmode="numeric"`. |
| 7 | `RegisterForm.tsx:160`, `EmailLoginForm.tsx:80` | `text-red-500` | Off palette, no dark variant, and 3.81:1 on white. |
| 8 | `BirthdayBubbleChart.tsx:54-56` | `role="presentation"` and `aria-hidden="true"` on the same `<svg>` | Redundant. Keep `aria-hidden`. |
| 9 | `BirthdayBubbleChart.tsx:45-49` | The SVG renders only after `ResizeObserver` fires, at a height computed from the measured width | Guaranteed layout shift on every dashboard load. Reserve the box with `aspect-ratio` before measuring. |
| 10 | `base.astro:58` | `<meta name="author" content="<AUTHOR>">` | Placeholder shipped to production. |
| 11 | `base.astro:78` | `min-h-screen` | `100vh` jumps when the iOS Safari address bar moves. Use `min-h-[100dvh]`. |
| 12 | `global.css:30` | Focus uses `focus:shadow-[...]` | Invisible in forced-colors mode, and it fires on mouse click. Use `:focus-visible` with `outline` and `outline-offset`. |

---

## Design system

### Color

Replace the raw hex values in `@theme inline` with semantic OKLCH tokens in a light and dark pair. Name tokens by role. `--warm-bg` next to `--warm-dark` reads as if both are backgrounds.

| Token | Role | Light | Notes |
|---|---|---|---|
| `--ground` | page | `oklch(97.5% 0.008 73.7)` | today's `#faf6f1` |
| `--surface` | card | near white, faint warm tint | one step above ground |
| `--ink` | primary text | `oklch(22.5% 0.011 73.3)` | today's `#1f1b16`, 15.9:1 on ground |
| `--ink-muted` | secondary text | `oklch(51.2% 0.046 49.4)` | **changed** from `#9c7b6a`, which fails |
| `--line` | dividers and structural borders | `oklch(93.5% 0.015 70.9)` | today's `#f0e8df` |
| `--ember` | accent, from the logo coral | `oklch(71.3% 0.131 33.7)` | unchanged, `#e8826b` |
| `--ember-ink` | text on ember | `= --ink` | 6.39:1, **replaces white** |
| `--ember-strong` | ember that must carry white | `oklch(54.8% 0.151 34.1)` | `#b8482f`, 5.24:1 |
| `--danger` | errors | warm red inside the palette | replaces `text-red-500` |

**Two implementation notes v1 could not have known.**

Tailwind v4 tree-shakes `@theme inline` variables that nothing references through `var()`. Right now `--color-warm-bg` and `--color-warm-border` are **not emitted** into the stylesheet, because only utilities consume them. Any JSX that writes `fill="var(--color-warm-border)"` fails silently. `BirthdayBubbleChart.tsx:103,112` already depends on this working for `--color-warm-dark` and `--color-warm-muted`. Declare graphic tokens in a plain `:root` block, or use `@theme` without `inline`, so the SVG can reach them.

The five bubble fills are not a system. Their hues run 18, 51, 91, 140 and 302 degrees, which spans most of the wheel, so they read as five unrelated pastels rather than one family. If the bubbles survive, hold hue inside a 60 degree arc around the ember and vary lightness instead.

Ship dark mode through `prefers-color-scheme` in `@layer base`, with a small inline script in `base.astro` that swaps the `theme-color` meta. Verify `--ink` on `--ground` and `--ink-muted` on `--surface` in **both** modes. Muted text on tinted surfaces is where this fails.

### Typography

Keep **Manrope Variable** for body and UI. It is installed, it is the disciplined half, and bug 1 means nobody has actually seen it yet. **Fix bug 1 and look at the result before adding a second family.** Manrope rendering correctly may close most of the gap on its own.

If a display face is still wanted, add `@fontsource-variable/bricolage-grotesque` for the `h1` and the large date numerals only. Its `wght`, `wdth` and `opsz` axes let the `h1` sit wide and heavy while month ticks stay narrow and light. One family, two voices.

Deliberately **not** a high-contrast serif. Cream ground plus serif display plus terracotta accent is the exact cluster this redesign escapes. If Bricolage feels wrong when built, drop the second family rather than substituting a serif.

Set tracking per size, never one global value: `h1` at `-0.02em`, body near `0`, uppercase month ticks at `+0.08em`. Turn on `font-variant-numeric: tabular-nums` for every countdown, date and numeral so digits stop jittering.

### Surfaces

- Concentric radii. Card `p-6` (24px) plus inner `rounded-2xl` (16px) wants an outer radius near 40px. Today a `rounded-3xl` card wraps `rounded-2xl` inputs at 24px padding, so the inner corners look pinched. Pick one rule and apply it everywhere.
- `.card` at `global.css:26` fakes elevation with `border` plus `shadow-sm`. Replace with a layered transparent `box-shadow` tinted to the ground hue. Keep borders only where they carry structure or state.
- Focus per bug 12.

---

## Brand presence

`public/logo.png` and `public/logo-512x512.png` exist and the app never renders either one. Every screen opens with a 🎂 emoji at `text-4xl`. The word "Celebraty" appears in the `<title>` and nowhere on screen.

Put a small constant lockup at the top of all three states: the logo mark plus the wordmark. Let the `h1` below carry the state-specific message. This fixes the missing brand, retires the emoji header, and gives the three states a shared anchor.

The signed-in state currently sets `h1` to "Círculo de cumpleaños" and then an `h2` directly below to "Cumpleaños del círculo". Those are the same three words reordered. Collapse them.

---

## The signed-out screen

This is the front door. Everyone sees it first, and most people see only it before they check their email. Revision 2 spent its whole design budget on the ring, which lives behind auth, so this screen got nothing but corrections. That is the largest gap in the plan and this section closes it.

### What is wrong beyond the bugs

**The card should not be here.** The page holds one form. Wrapping it in a bordered and shadowed box stacks three surfaces for one email field: page, then card, then input. Elevation needs something to sit above, and on this screen there is nothing. Drop the card. Let the field sit on the ground with a `--line` border.

**The surfaces are inverted.** `.card` is `bg-white` and `.input` is `bg-warm-bg`, so the input is darker than the container holding it. Once bug 2 lands and the page turns cream, the input will match the page while the card floats white above it. Decide the relationship on purpose: the input tints one step from whatever it sits on, never from the page.

**Five strings explain one input.** The `h1`, the subtitle, the "Entrar" heading, the "Tu correo" label and the button all describe the same action. Delete the "Entrar" heading. Rewrite the subtitle to say what Celebraty does, because the label and the button already say what to do. Target four elements: lockup, headline, one line of subtext, field plus button.

**The type scale has a hole.** The `h1` is `text-4xl` at 36px and the subtitle is `text-sm` at 14px, a jump of 2.6x with nothing between. The headline outweighs the form it introduces, which inverts the hierarchy on a page whose only job is to take an email address. Bring the `h1` down to `text-3xl` and the subtitle up to `text-base`.

**The content floats.** `py-16` puts a roughly 500px stack at the top of an 800px viewport, leaving dead space below and no anchor anywhere. Center the column vertically instead of pinning it to the top.

**The CTA is four words.** "Enviar enlace de acceso" wants to be one or two. "Enviar enlace" carries the same meaning.

### The fix: put the ring on this screen too

Render `YearRing` here in its **empty state**, the one this plan already specifies. There is no session and therefore no data, so the ring draws the year, the month ticks, today's marker and the lit 30-day arc, with a bare circumference. It costs no new component and no new query.

That earns its place three ways. It shows what the product is before anyone types. It ties the front door to the signature, so signing in continues an idea rather than revealing an unrelated one. And it makes the empty state a designed moment rather than a fallback nobody sees.

Stack it vertically: lockup, headline, subtext, ring, field, button. Do not put the form on top of the ring, because the overlap costs contrast on the one control that matters. At 800px the stack lands near 550px, so it fits without scrolling, and it collapses to the same order on mobile.

The signed-in view keeps the same ring with dots on it. One idea, two states, which is what makes it read as a system.

---

## The signature: ring or bubbles

This is the decision the plan needs, and v1 could not make it because the bubbles did not exist yet.

**The bubble chart's flaw is that position means nothing.** `d3.pack` places circles to fill space efficiently. Two friends whose birthdays fall a day apart can land on opposite sides of the canvas. The layout looks structured and encodes nothing, which is the worst combination in information design. Size does carry meaning, through `closenessScore`, but size alone did not need a packing algorithm.

**The ring fixes exactly that.** Angular position is the date. The graphic answers a question the product is about: when in the year does everyone fall, and who is next.

**Recommendation: build the ring, retire the pack.** `src/lib/birthdays.ts` is shared and stays, along with its tests. `src/components/BirthdayBubbleChart/layout.ts`, its two test files and the `d3-hierarchy` dependency go. The reduced-motion test moves to the new component rather than being deleted.

**The ring now serves two screens, not one.** Its empty state is the visual on the signed-out page and its populated state is the dashboard. That doubles the return on building it and it is the reason the front door stops being a bare centered card. The bubbles cannot do this job, because circle packing has nothing to draw when there is no data.

**Cost, stated plainly:** this discards roughly 200 lines of code and three test files that shipped today. If that trade is not wanted, the smaller fix is to keep the packed circles and place them at ring angles, so size still means urgency and angle starts meaning date. That is more code than either option and makes collisions worse, so I do not recommend it.

If you would rather keep the bubbles as they are, say so. The color, type, form and accessibility work still stands and is most of the value. The signed-out screen would then need a different visual, because "delete the card and fix the type scale" leaves it correct but plain.

### `src/components/YearRing.tsx` (new)

One React island holding the ring **and** the upcoming list, so hover and focus link across both.

**Geometry.** Use `getDayOfYear` and `getDaysInYear` from `date-fns`, already a dependency. Do not add a date library.

```
angle = (dayOfYear - 1) / daysInYear * 360     // 0 degrees = 12 o'clock, clockwise
x = cx + r * sin(theta)
y = cy - r * cos(theta)
```

- Twelve ticks with month abbreviations, `ene` through `dic`, around the circumference.
- The 30-day window is a highlighted arc in `--ember`, drawn with `stroke-dasharray` on a `<circle>`. Arc length is `(30 / daysInYear) * circumference`, offset is `-(dayOfYear / daysInYear) * circumference`, rotated `-90deg`. One property, and it animates cleanly.
- Today is a marker on the ring. The center holds today's date and the count of upcoming birthdays.
- **Collision.** At 320px the radius is near 120px, so adjacent days sit about 2px apart. Run one pass that pushes colliding dots outward in 6px steps.
- **Reserve the layout box** with `aspect-ratio: 1` before measuring, so the ring cannot cause the shift described in bug 9.

**Linking.** Hovering or keyboard-focusing a list row scales its dot and lifts the row. Use React state, not CSS `:has()`, which stays cleaner at N items.

**Accessibility.** The ring is a visualization, so it must not be the only path to the information.

- `<svg aria-hidden="true">`. Do not make 30 dots focusable.
- The list is the accessible equivalent. Real list semantics, focusable rows, the same data.
- Keyboard focus on a row drives the same highlight as hover, so keyboard users get the identical linkage.
- The current `sr-only` list is the right instinct and should carry forward, but as a **visible** list rather than a screen-reader-only one. Sighted users currently read countdown labels at 7px to 11px at 2.6:1, which nobody can read.

**Empty state.** The ring still renders. A year exists whether or not anyone is on it. Today's marker and the 30-day arc are present and the circumference is bare. Emptiness becomes meaningful rather than broken, and it invites action: *"Nadie en el círculo todavía. Sé el primer punto del año."* This replaces the current 🌱 line, which is off concept.

---

## The birthdate field: `src/components/BirthdayField.tsx` (new)

One bordered group that looks like three small boxes but types as one field, with the caret advancing on its own.

```
  Tu cumpleaños
  +------+------+------------+
  |  15  |  03  |    1998    |
  +------+------+------------+
     día    mes   año (opcional)
```

- `role="group"` plus `aria-labelledby` pointing at the "Tu cumpleaños" label.
- Three `<input inputMode="numeric" pattern="[0-9]*">`. **Not** `type="number"`, per bug 6.
- Per-segment `aria-label`: "Día", "Mes", "Año (opcional)".
- **Smart auto-advance.** Move on when the segment is full, or when it cannot be extended. Typing `4` in día advances at once, because `40` and up exceeds 31.
- Backspace on an empty segment returns to the previous one, caret at the end.
- Left and right arrows cross segment boundaries. Up and down increment and clamp.
- Pasting `15/03/1998` into any segment distributes across all three.
- Zero-pad día and mes on blur, so `5` becomes `05`.
- **One focus ring on the group** through `:focus-within`, never on the individual inputs. This is what makes three boxes read as one field.
- Widths in `ch` with tabular numerals, so segments do not resize as you type.
- Validate per segment on blur with a message naming the segment. Day maximum depends on month, so reject 31 February. No animation on advance. This fires on every keystroke, and motion on a high-frequency interaction is a cost that repeats.

This also replaces the month `<select>`, which is the only `select.input` in the app. That lets `global.css:33-35` go.

---

## Motion

Honor `prefers-reduced-motion` throughout. Cross-fade instead of moving, and render the ring in its final state with no draw.

| Moment | Treatment | Why |
|---|---|---|
| Ring draws on load | `stroke-dashoffset`, about 600ms, `cubic-bezier(0.23, 1, 0.32, 1)` | An occasional page earns one orchestrated entrance |
| Dots appear | stagger 40ms, `scale 0.6 → 1` plus opacity | Never from `scale(0)`. Nothing appears from nothing |
| Row or dot hover | 150ms or less, opacity and color only | High frequency. Instant feedback, no entrance |
| Button press | `active:scale-[0.96]`, `transition-transform 160ms ease-out` | Tactile confirmation that the UI heard the press |
| Hover styles | gate behind `@media (hover: hover) and (pointer: fine)` | Otherwise a tap triggers a false hover |
| **Success** | The form cross-fades out, focus moves to the success heading, and the new dot lands on the ring with a spring, `bounce: 0.2` | The payoff. You fill the form and you appear on the year. This is the one moment that earns bounce |

Name exact properties everywhere. Never `transition: all`. The existing `motion/react` spring at `RegisterForm.tsx:21` and `EmailLoginForm.tsx:6` (`stiffness: 300, damping: 30`) is a reasonable house default. Keep it and add `bounce: 0` for transitions that should not carry momentum.

Note that `RegisterForm.tsx:62` redirects 900ms after success. Any success animation has to finish inside that window, or the redirect has to wait.

---

## Copy

One vocabulary, one voice. The text mixes "círculo" and "lista" for the same idea.

| Where | Now | Change to |
|---|---|---|
| `index.astro:37,75` `h1` | "Círculo de cumpleaños" | Tie it to the concept and to the product name. The year and the circle are the same idea here |
| `index.astro:81` `h2` | "Cumpleaños del círculo" | Remove. It restates the `h1` directly above it |
| `index.astro:44` `h2` | "Entrar" | Remove. The label and the button already name the action |
| `index.astro:38-40` subtitle | "Ingresa tu correo para unirte al círculo o entrar si ya eres parte." | Say what Celebraty does, in one line. The field and the button say what to do |
| `EmailLoginForm.tsx:94` button | "Enviar enlace de acceso" | "Enviar enlace". Four words for a primary action is two too many |
| `RegisterForm.tsx:174` button | "Unirme al círculo 🎂" then "Registrando…" | Hold the verb through the flow: **Unirme → Uniéndote… → Ya estás en el círculo** |
| `RegisterForm.tsx:78` success | "¡Listo! Ya estás en la lista." | "círculo", not "lista". Same word for the same idea |
| `RegisterForm.tsx:65`, `EmailLoginForm.tsx:34` fallback | "Algo salió mal." | Name what failed and how to fix it. Errors never stay vague and never apologize |
| `BirthdayBubbleChart.tsx:41` empty | "Todavía no hay nadie registrado. ¡Sé el primero! 🌱" | The on-concept invitation from the empty state above |
| Two labels | "Mes de nacimiento" plus "Día de nacimiento" | One "Tu cumpleaños" over the segmented field |
| `register.ts` | English Zod defaults | Spanish messages on the schema, per bug 3 |

Retire the decorative emoji: 🎂 in the header and the button, 🎉, 📬, 🌱, 🥳 in the emails and success states. The logo lockup replaces the header emoji. The rest carry no information.

The app stays Spanish. Add client-side validation on blur, so common mistakes never round-trip to the server.

---

## Email

- **Extract the palette to `src/lib/theme.ts`** and derive both the CSS tokens and the email hex values from it. Today `#FAF6F1`, `#1F1B16`, `#9C7B6A` and `#F0E8DF` are hardcoded in **both** email templates and again in `global.css`. They will drift. Email needs literal sRGB hex, with no CSS variables and no OKLCH, so the shared module exports both forms.
- Drop `fontFamily: "Georgia, serif"`. It matches nothing in the app. This appears in **both** `DailyBirthdayDigest.tsx:23` and `LoginLink.tsx:12`; v1 names only the first. Use a system sans stack, since clients will not load Manrope reliably.
- Fix the `#C8B4A6` footer text in both templates. It sits at 1.99:1.
- `LoginLink.tsx:29-42` uses `#E8826B` with white text, the same 2.68:1 failure as the app button. Use `--ember-strong` here.
- Carry over the large-numeral treatment. Do **not** try to render the ring in email. It will break across clients.
- Add `@media (prefers-color-scheme: dark)` where supported, and confirm it degrades cleanly where it is not.

---

## Files

**New**
- `src/components/YearRing.tsx` - ring plus linked list island
- `src/components/BirthdayField.tsx` - segmented date field
- `src/lib/year.ts` - day-of-year to angle math, dot collision pass
- `src/lib/theme.ts` - single palette source for CSS and email

**Modified**
- `src/styles/global.css` - OKLCH semantic tokens, light and dark, base font fix, concentric radii, `:focus-visible`, drop `select.input`, and audit every use of `.card` before keeping it
- `src/layouts/base.astro` - bugs 1, 2, 10, 11, dark `theme-color` swap, logo lockup
- `src/pages/index.astro` - new composition around the ring on both the signed-out and signed-in states, brand lockup, drop the card on the signed-out screen, copy
- `src/components/RegisterForm.tsx` - bugs 4, 5, 6, 7, adopt `BirthdayField`, copy, success focus
- `src/components/EmailLoginForm.tsx` - bugs 4, 5, 7. **v1 omits this file entirely and it carries the same three defects**
- `src/components/LogoutButton.tsx` - palette tokens
- `src/pages/api/register.ts` - Spanish Zod messages, per-field errors
- `src/lib/email/DailyBirthdayDigest.tsx` - shared tokens, drop the serif, fix footer contrast
- `src/lib/email/LoginLink.tsx` - same. **v1 omits this file**
- `public/site.webmanifest` - reconcile `#FDF6EC` with `theme-color`

**Removed, if the ring is approved**
- `src/components/BirthdayBubbleChart/` - the whole directory
- `d3-hierarchy` and `@types/d3-hierarchy` from `package.json`

**Dependency:** `@fontsource-variable/bricolage-grotesque` only, and only after bug 1 is fixed and plain Manrope has been judged on screen. No date library and no headless UI library. `date-fns` and `motion` are installed, and the segmented field is hand-rolled.

---

## Verification

**Bugs**
- `pnpm dev`, then read the computed `font-family` on `<body>`. It must be Manrope Variable. It is the system stack today.
- The page ground is the token value, not white. `theme-color` and the manifest agree.
- Seed two friends with today's date and one three days out. All three appear with the right `daysUntil`, and both of today's read "Hoy" whatever the insert order. This case passes today, and the regression test in `birthdays.test.ts` should stay.
- Submit an invalid email. The message is Spanish.
- View source and confirm no `<AUTHOR>` placeholder ships.

**Contrast, the part v1 skipped**
- Every pair in the table at the top of this document, measured again after the token change, in **both** modes.
- The primary button specifically. It fails at 2.68:1 today and must clear 4.5:1.
- Bubble or dot labels are not measured at 7px. Nothing renders text that small.

**Date field**
- Type `1503`. The caret reaches año on its own, día shows `15` and mes shows `03`.
- Type `4` in día. It advances at once, because `40` is above 31.
- Backspace from an empty mes returns to día with the caret at the end.
- Paste `15/03/1998` into día. All three fill.
- Enter `31` and `02`. Blur shows a message naming the day.
- Tab through. **One** focus ring around the group, not three.

**Accessibility**
- Tab the whole page. Every control is reachable, focus is always visible, and the order matches the reading order.
- VoiceOver: every input announces its label, an invalid submit announces the error, and success moves focus and is announced.
- The ring is skipped as `aria-hidden`, and the visible list carries the same information.
- axe-core reports zero violations, in both modes.
- Turn on macOS Reduce Motion. The ring renders in its final state, with no draw and no dot stagger.

**Responsive** - 320, 768, 1024 and 1440. At 320px the ring stays legible and colliding dots separate.

**Motion** - replay at 10% in the Animations panel. The ring draw and the dot stagger stay in sync, and the success spring settles before the 900ms redirect fires.

**Performance** - Lighthouse on the signed-in view. CLS below 0.1, which bug 9 breaks today.

**Email** - render both templates, for one and for three birthdays. Compare against the app palette. Check light and dark.

**Build** - `pnpm exec astro check` reports zero errors, `pnpm test` passes, and `pnpm build` succeeds.

---

## Open question

One decision is left, and it is the ring versus the bubbles trade in the signature section. Everything else in this plan stands on its own and can start now. The color, type, form and accessibility work is the larger share of the value and does not depend on that answer.

v1's privacy question is resolved and removed. The dashboard is behind auth, so nothing is publicly disclosed.
