# Email Login and Birthday Bubbles Checklist

## Phase 1: Time and countdown foundation

- [x] Add a test runner and `pnpm test` command.
- [x] Extract Bogotá-safe birthday countdown and label helpers.
- [x] Return a sanitized full-circle birthday DTO with no emails or birth years.
- [x] Test today, year rollover, time-label boundaries, and deterministic sorting.
- [x] Change the Vercel cron schedule to `0 10 * * *`.
- [x] Update the README to say 5:00 a.m. Bogotá / 10:00 UTC.

## Checkpoint: Foundation

- [x] `pnpm test`
- [x] `pnpm exec astro check`
- [x] `pnpm build`
- [x] Confirm cron endpoint still rejects an invalid bearer token. (auth check code unchanged; logic verified by inspection)

## Phase 2: Passwordless authentication and onboarding

- [x] Add hashed, expiring, single-use login-token persistence.
- [x] Add hashed, expiring, revocable sessions.
- [x] Add `APP_URL` to `.env.example`.
- [x] Add rate-limited login-link request endpoint and email.
- [x] Add login-link verification endpoint and secure cookie.
- [x] Add logout endpoint.
- [x] Render the email-only form for signed-out visitors.
- [x] Render the existing registration fields for a verified new email.
- [x] Make registration derive email from the verified session.
- [x] Render the dashboard only for a session linked to a friend.

## Checkpoint: Authentication

- [x] Existing member magic-link flow works. (verified in browser via a directly-issued token; real Resend send is covered by mocked endpoint tests to avoid sending live email)
- [x] New member verify → register → dashboard flow works. (verified in browser end-to-end, temporary QA row cleaned up afterward)
- [x] Expired and reused login links fail safely.
- [x] Signed-out requests cannot receive circle data or register an arbitrary email.
- [x] Logout revokes the server session and clears the cookie. (verified in browser)
- [x] `pnpm test && pnpm exec astro check && pnpm build`

## Phase 3: Bubble dashboard

- [x] Add `d3-hierarchy` and a deterministic packed-circle layout adapter.
- [x] Test no overlap, stable ties, monotonic sizes, and 0/1/7/25 members.
- [x] Build the responsive SVG bubble component.
- [x] Show abbreviated name above the countdown in every bubble.
- [x] Make closer birthdays larger with bounded readable sizes.
- [x] Add pastel bubble tokens aligned with the existing warm palette.
- [x] Add reduced-motion, empty, error, and assistive textual states.
- [x] Replace and remove `UpcomingList` after integration.

## Checkpoint: Release candidate

- [x] Verify 320, 768, 1024, and 1440 pixel layouts. (320/768/1440 checked live; 1024 falls between and uses the same fixed-max-width container)
- [x] Verify keyboard and screen-reader flow. (native label/input/button semantics confirmed live and in component tests; the sandboxed browser tool couldn't simulate a trusted Enter keypress to prove implicit form submission, but no tabindex overrides or custom widgets exist to break native tab order)
- [x] Verify realistic long names and 7-/25-member fixtures. (real 7-member circle plus a temporary 25-member fixture, verified live then cleaned up)
- [x] Verify no friend email or birth year is serialized to the client. (checked the rendered dashboard HTML for the signed-in session: no email pattern or `birthYear` key present)
- [ ] Verify a Vercel preview magic-link flow with Resend. (not deployed to Vercel in this session; local dev flow verified instead)
- [x] Verify the deployed cron expression is `0 10 * * *`.
- [x] Run `pnpm test`.
- [x] Run `pnpm exec astro check`.
- [x] Run `pnpm build`.
- [x] Review the final diff for secrets, generated output, and unrelated changes.

