# Implementation Plan: Email Login and Birthday Bubbles

## Overview

Update Celebraty so the daily birthday job runs at 5:00 a.m. in Bogotá, members enter their email before accessing the app, new members continue through the existing registration form, and authenticated members see the whole birthday circle as a packed-bubble diagram. Each bubble shows an abbreviated name and countdown, and birthdays that are closer have larger bubbles.

This plan assumes “login with email” means passwordless email verification through a short-lived magic link. A database lookup that immediately admits anyone who knows a registered email is not authentication and is not recommended.

## Current Baseline

- Vercel runs `/api/cron/daily-birthdays` at `0 13 * * *`, which is 8:00 a.m. in Bogotá.
- The page always renders the full registration form and a public list of birthdays in the next 30 days.
- There is no authentication, session, login-token, logout, or account-verification code.
- `friends.email` is already unique and can identify an existing member.
- The app has one global birthday circle; there is no group or friendship-membership model.
- `getUpcomingBirthdays()` selects complete friend records and spreads them into page data. The new dashboard must return an explicit public DTO so email addresses and birth years are never serialized to the browser.
- The production database currently contains 7 members. Existing names range from 12 to 27 characters, so visual abbreviation is necessary.
- There is no automated test runner. `pnpm exec astro check` currently passes with two deprecation hints, and `pnpm build` passes.

## Product Flow

### Signed-out member

1. The landing card asks only for an email address.
2. Submitting a valid email sends a short-lived login link and always shows the same “check your email” response, whether the email is new or already registered.
3. The login link proves ownership of the email and creates a server-side session.

### Verified existing member

1. The server finds a `friends` record for the verified email.
2. The member is redirected to the birthday dashboard.
3. The dashboard shows every member of the single circle, including the signed-in member, as bubbles.
4. A logout control invalidates the session and returns to the email form.

### Verified new member

1. The server does not find a `friends` record for the verified email.
2. The existing registration form is shown with the verified email prefilled and read-only.
3. Registration takes the email from the verified server session, not from request JSON.
4. On success, the session is linked to the new friend record and the dashboard is shown.

## Architecture Decisions

### Passwordless authentication

- Store single-use login tokens and sessions in Turso.
- Send an opaque random token to the email address and store only its SHA-256 hash.
- Login links expire after 15 minutes and are consumed atomically.
- Sessions use an opaque random cookie token whose hash is stored in the database.
- Session cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax`, scoped to `/`, and expire after 30 days.
- Rate-limit login-link requests per normalized email and return a generic response to reduce email enumeration and Resend abuse.
- The authenticated email is always normalized with the same trim/lowercase rule used by registration.
- Use an `APP_URL` environment value to build login links; do not trust an arbitrary request `Host` header.

### Data exposure and countdowns

- Replace the 30-day query with an authenticated `getBirthdayCountdowns()` query covering the full circle.
- Return only `id`, abbreviated display name, birthday month/day, `daysUntil`, and the formatted countdown. Do not return email, birth year, or creation time to the client.
- Calculate calendar-day differences in `America/Bogota`, using an injected “now” in tests so year rollover and timezone behavior are deterministic.
- Sort by `daysUntil`, then by name and ID for deterministic ties.

### Display rules

- Visual name: first name plus the final name’s initial (`John Doe` → `John D.`); a one-part name stays unchanged.
- Countdown: `Hoy` for 0 days, `Nd` for 1–30 days, and `Nm` for 31+ days, where months are `max(1, floor(days / 30))`.
- Bubble size must be monotonic: fewer remaining days always produces a bubble at least as large as a later birthday.
- Use a bounded closeness score rather than raw inverse days so distant birthdays remain readable.

### Bubble diagram

- Replace `UpcomingList` with a focused React `BirthdayBubbleChart` component.
- Use `d3-hierarchy`’s deterministic circle-packing layout rather than a random force simulation.
- Render the diagram as responsive SVG with circle, name, and countdown elements; increase diagram height when necessary instead of shrinking labels below the readable minimum.
- Use the existing warm palette plus a small set of pastel semantic tokens. Color is decorative; countdown text and size carry the information.
- Respect `prefers-reduced-motion`. Initial animation is opacity/scale only and must not prevent reading.
- Keep the SVG non-interactive. Provide an equivalent semantic list for assistive technology and meaningful empty/error states.

## Task Breakdown

## Task 1: Add deterministic birthday countdown data

**Description:** Extract birthday calculations and label formatting into tested pure functions, then replace the public 30-day action with a sanitized, authenticated-ready full-circle DTO.

**Acceptance criteria:**

- [ ] Calculations use Bogotá calendar dates and never depend on the deployment server’s local timezone.
- [ ] The result includes all birthdays through the next annual occurrence, sorted deterministically.
- [ ] Labels follow `Hoy`, `1d`–`30d`, then whole-month notation.
- [ ] Client data cannot contain email, birth year, or `createdAt`.

**Verification:**

- [ ] Tests cover today, tomorrow, December-to-January rollover, 30/31-day label boundaries, and deterministic ties.
- [ ] `pnpm test` passes.
- [ ] `pnpm exec astro check` passes.

**Dependencies:** None.

**Files likely touched:**

- `package.json`
- `pnpm-lock.yaml`
- `src/lib/birthdays.ts`
- `src/lib/birthdays.test.ts`
- `src/lib/actions.ts`

**Estimated scope:** Medium.

## Task 2: Move the daily cron to 5:00 a.m. Bogotá

**Description:** Change the Vercel UTC schedule and update deployment documentation while retaining Bogotá timezone handling in the endpoint.

**Acceptance criteria:**

- [ ] `vercel.json` uses `0 10 * * *`.
- [ ] README states that the job runs at 10:00 UTC / 5:00 a.m. Bogotá.
- [ ] Cron authorization and birthday matching behavior are unchanged.

**Verification:**

- [ ] `vercel.json` parses as valid JSON.
- [ ] `pnpm build` includes the cron endpoint.
- [ ] A manual request without `CRON_SECRET` still receives 401.

**Dependencies:** None.

**Files likely touched:**

- `vercel.json`
- `README.md`

**Estimated scope:** Small.

### Checkpoint: Time and countdown foundation

- [ ] Countdown tests pass in a fixed Bogotá timezone fixture.
- [ ] Type check and production build pass.
- [ ] The cron schedule and README agree exactly.

## Task 3: Add login-token and session persistence

**Description:** Extend the Drizzle schema and add server-only helpers for hashed login tokens, session creation, lookup, expiration, and revocation.

**Acceptance criteria:**

- [ ] Login-token records contain normalized email, token hash, expiry, consumed timestamp, and creation timestamp.
- [ ] Session records contain token hash, normalized email, optional friend ID, expiry, and creation timestamp.
- [ ] Raw tokens are never stored or logged.
- [ ] Expired or consumed login tokens and expired sessions are rejected.

**Verification:**

- [ ] Auth-store tests prove one-time consumption, expiry rejection, and logout revocation.
- [ ] `pnpm db:push` produces additive schema changes only in the intended database.
- [ ] Existing `friends` rows remain unchanged and can log in by their current email.

**Dependencies:** Task 1 for the test command only.

**Files likely touched:**

- `src/db/schema.ts`
- `src/lib/auth/store.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/auth.test.ts`
- `.env.example`

**Estimated scope:** Medium.

## Task 4: Implement the passwordless login slice

**Description:** Add the login-link email and endpoints that request, verify, and revoke an authenticated session.

**Acceptance criteria:**

- [ ] `POST /api/auth/start` validates email, applies rate limits, sends a 15-minute login link, and returns a generic success response.
- [ ] `GET /api/auth/verify` atomically consumes the link, creates a session, sets the secure cookie, and redirects home.
- [ ] `POST /api/auth/logout` revokes the current session and clears the cookie.
- [ ] Invalid, expired, reused, or malformed tokens show a safe recovery path and never create a session.

**Verification:**

- [ ] Endpoint tests cover invalid email, throttling, valid verification, expiry, reuse, and logout.
- [ ] The rendered login email contains the configured application origin and no raw server data.
- [ ] No auth token or cookie value appears in server logs.

**Dependencies:** Task 3.

**Files likely touched:**

- `src/lib/email/LoginLink.tsx`
- `src/pages/api/auth/start.ts`
- `src/pages/api/auth/verify.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/auth-routes.test.ts`

**Estimated scope:** Medium.

## Task 5: Gate the page and preserve new-member registration

**Description:** Make the SSR page choose among email login, verified registration, and the authenticated dashboard. Harden registration so the verified session owns the submitted email.

**Acceptance criteria:**

- [ ] Signed-out visitors see an email-only login form and no circle data.
- [ ] A verified email without a friend record sees the normal name/birthday registration fields with email prefilled and read-only.
- [ ] A verified existing member goes directly to the dashboard.
- [ ] `/api/register` rejects unsigned requests and uses the session email rather than a client-provided email.
- [ ] Successful registration links the session to the new friend and opens the dashboard without another login.

**Verification:**

- [ ] Component tests cover login loading, success, validation, and error states.
- [ ] API tests cover unauthorized registration, duplicate registration, and successful verified registration.
- [ ] Browser smoke tests complete signed-out, existing-member, new-member, expired-link, and logout flows.

**Dependencies:** Tasks 1 and 4.

**Files likely touched:**

- `src/pages/index.astro`
- `src/components/EmailLoginForm.tsx`
- `src/components/RegisterForm.tsx`
- `src/pages/api/register.ts`
- `src/lib/actions.ts`

**Estimated scope:** Medium.

### Checkpoint: Authentication and onboarding

- [ ] Existing members can log in from a real email link.
- [ ] New members see registration only after verifying their email.
- [ ] Signed-out users cannot receive birthday DTOs.
- [ ] Sessions survive a refresh and are invalid after logout.
- [ ] Type check, tests, and build pass.

## Task 6: Build and test the packed-bubble layout

**Description:** Add the circle-packing dependency and a pure layout adapter that converts countdown DTOs into deterministic, non-overlapping bubble geometry.

**Acceptance criteria:**

- [ ] Earlier birthdays always have equal or larger radii than later birthdays.
- [ ] Circles do not overlap and remain within the computed SVG bounds.
- [ ] Ties are deterministic across renders.
- [ ] Diagram height grows for denser datasets so labels retain the defined minimum size.

**Verification:**

- [ ] Layout tests cover 0, 1, 7, 25, and tied birthday fixtures.
- [ ] Repeated layout calls with the same dimensions and input produce the same output.
- [ ] The added dependency is limited to the maintained D3 hierarchy package and its types.

**Dependencies:** Task 1.

**Files likely touched:**

- `package.json`
- `pnpm-lock.yaml`
- `src/components/BirthdayBubbleChart/layout.ts`
- `src/components/BirthdayBubbleChart/layout.test.ts`

**Estimated scope:** Small.

## Task 7: Replace the upcoming list with the bubble dashboard

**Description:** Render the packed layout as an accessible, responsive React/SVG component matching the supplied reference’s soft, tightly packed circles.

**Acceptance criteria:**

- [ ] Every visible bubble displays an abbreviated name on the first line and `Hoy`, days, or months on the second line.
- [ ] The closest birthday is visually largest; colors do not imply countdown order.
- [ ] The chart works without clipping at 320, 768, 1024, and 1440 CSS pixels.
- [ ] Reduced-motion users receive no entrance movement, and assistive technology receives an ordered textual equivalent.
- [ ] Empty and server-error states are distinct and actionable.

**Verification:**

- [ ] Component tests verify names, labels, semantic fallback, empty state, and reduced-motion behavior.
- [ ] Visual checks use realistic 7- and 25-person fixtures, including 27-character source names.
- [ ] Browser console has no React, SVG, hydration, or accessibility errors.

**Dependencies:** Tasks 5 and 6.

**Files likely touched:**

- `src/components/BirthdayBubbleChart/BirthdayBubbleChart.tsx`
- `src/components/BirthdayBubbleChart/BirthdayBubbleChart.test.tsx`
- `src/pages/index.astro`
- `src/styles/global.css`
- `src/components/UpcomingList.tsx` (removed after replacement)

**Estimated scope:** Medium.

## Task 8: Complete documentation and release verification

**Description:** Document the new auth flow, environment value, cron time, database update, and operational checks, then run the full release gate.

**Acceptance criteria:**

- [ ] README documents `APP_URL`, passwordless login behavior, session duration, schema push, logout, and the 5:00 a.m. schedule.
- [ ] No stale “next 30 days” or public-registration copy remains.
- [ ] No secret, raw login token, email list, or unrelated generated file is included in the diff.

**Verification:**

- [ ] `pnpm test` passes.
- [ ] `pnpm exec astro check` reports zero errors.
- [ ] `pnpm build` succeeds with the Vercel adapter.
- [ ] A Vercel preview completes the full magic-link flow and the scheduled route is configured for `0 10 * * *`.
- [ ] Keyboard, 320/768/1024/1440 responsive, reduced-motion, empty-state, and screen-reader checks pass.

**Dependencies:** Tasks 2, 5, and 7.

**Files likely touched:**

- `README.md`
- `.env.example`
- Any focused test fixtures required by the release checks

**Estimated scope:** Small.

### Checkpoint: Release candidate

- [ ] All task acceptance criteria are met.
- [ ] Schema additions are deployed before application code that depends on them.
- [ ] Existing members can log in without data migration.
- [ ] New members can verify, register, and immediately view the dashboard.
- [ ] The reference bubble hierarchy is recognizable and readable with production-sized names.
- [ ] Cron, authentication, registration, email sending, and logout smoke tests pass in a preview environment.

## Dependency Order

```text
Countdown utilities ───────────────┐
                                   ├─> Gated registration ──┐
Auth schema ─> Auth endpoints ─────┘                        │
                                                            ├─> Bubble dashboard ─> Release gate
Countdown utilities ─> Bubble layout ───────────────────────┘

Cron schedule ─────────────────────────────────────────────────────────> Release gate
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Treating email lookup as authentication | High | Verify ownership with a single-use magic link before selecting the registered/new-user branch. |
| Resend endpoint abuse or account enumeration | High | Generic responses, per-email throttling, token expiry, and server-side validation. |
| Full friend rows serialized to React | High | Map database rows to an explicit public countdown DTO before rendering. |
| Session tables deployed after dependent code | High | Apply additive schema changes first and verify them before preview deployment. |
| Dense bubbles make labels unreadable | Medium | Bound relative sizes and grow chart height rather than scaling every label below its minimum. Test 7 and 25 members. |
| UTC cron configuration is misread as local time | Medium | Keep `America/Bogota` in runtime date logic and document `0 10 * * *` as 5:00 a.m. Bogotá. |
| Birthday calculations shift near midnight | Medium | Use calendar dates in Bogotá and inject time in unit tests. |
| The product later needs separate friend groups | Medium | This plan preserves the current single-circle model. Add groups and memberships as a separate feature. |

## Assumptions Requiring Product Confirmation

1. Email login should verify ownership with a magic link. If the desired behavior is only “enter a known email and continue,” the auth schema and email-link tasks can be removed, but the result should be described as identification rather than secure login.
2. The dashboard contains every registered member in the one global circle, including the signed-in member.
3. Countdown formatting uses days through 30 days and whole months after that; `Hoy` replaces `0d`.
4. The visual label uses first name plus final-name initial. The full name remains available in the assistive textual list.
5. Separate friend groups, profile editing, account deletion, and birthday-email content changes are outside this scope.

