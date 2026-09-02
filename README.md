# Celebraty 🎂

A small, beautiful birthday reminder app for friend circles. Sign in with your email, join the circle with your name and birthdate, and see everyone's birthday around a year ring — every morning, everyone in the circle gets an email when someone has a birthday that day.

## Stack

- **Astro 7** — server-rendered, minimal JS
- **Turso (libSQL + Drizzle)** — SQLite at the edge
- **Resend + React Email** — transactional email and passwordless login links
- **Tailwind CSS v4 + motion/react** — soft/warm UI with purposeful animations
- **date-fns** — birthday countdown and year-ring date geometry
- **Vercel** — hosting + daily cron at 5:00 a.m. Bogotá (10:00 UTC)

## Authentication

Celebraty uses passwordless email login instead of a password:

1. A visitor enters their email on the landing page.
2. `POST /api/auth/start` emails a single-use login link that expires after 15 minutes. Requests are rate-limited per normalized email, and the response is always the same generic message so an attacker can't tell whether an email is registered.
3. Opening the link hits `GET /api/auth/verify`, which consumes the token exactly once and sets an `HttpOnly`, `Secure` (in production), `SameSite=Lax` session cookie that lasts 30 days.
4. An email already tied to a `friends` row goes straight to the birthday dashboard. A new email sees the registration form with the address prefilled and read-only, since it's already verified.
5. `POST /api/auth/logout` revokes the session server-side and clears the cookie.

## Setup

1. Create a Turso database:
   ```bash
   turso db create celebrety
   turso db tokens create celebrety
   ```

2. Create a Resend account and verify your sending domain.

3. Copy `.env.example` → `.env.local` and fill in your values:
   ```
   TURSO_URL=
   TURSO_AUTH_TOKEN=
   RESEND_API_KEY=
   FROM_EMAIL=
   CRON_SECRET=
   APP_URL=
   ```
   `APP_URL` is the app's public origin (no trailing slash). It's used to build login-link URLs instead of trusting the request's `Host` header.

4. Push the database schema (adds `friends`, `login_tokens`, and `sessions`):
   ```bash
   pnpm db:push
   ```

5. Run the dev server:
   ```bash
   pnpm dev
   ```

## Commands

| Command          | Action                                 |
| :--------------- | :-------------------------------------- |
| `pnpm dev`       | Start dev server at `localhost:4321`    |
| `pnpm test`      | Run the test suite                      |
| `pnpm build`     | Build for production                    |
| `pnpm db:push`   | Push schema changes to Turso            |
| `pnpm db:studio` | Open Drizzle Studio to inspect the DB   |

## Deploy

Push to GitHub and connect to Vercel. Add all env vars from `.env.example` in the Vercel dashboard, including `APP_URL` set to the deployed origin. Run `pnpm db:push` against the target database before deploying application code that depends on the `login_tokens` and `sessions` tables. The cron job runs automatically at `0 10 * * *` UTC (5:00 a.m. Bogotá).

To test the cron manually:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/daily-birthdays
```
