# Celebraty 🎂

A small, beautiful birthday reminder app for friend circles. Register your name, email, and birthdate — every morning, everyone on the list gets an email when someone has a birthday that day.

## Stack

- **Astro 5** — server-rendered, minimal JS
- **Turso (libSQL + Drizzle)** — SQLite at the edge
- **Resend + React Email** — transactional email
- **Tailwind CSS v4 + motion/react** — soft/warm UI with purposeful animations
- **Vercel** — hosting + daily cron at 08:00 Colombia time

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
   ```

4. Push the database schema:
   ```bash
   pnpm db:push
   ```

5. Run the dev server:
   ```bash
   pnpm dev
   ```

## Commands

| Command         | Action                                   |
| :-------------- | :--------------------------------------- |
| `pnpm dev`      | Start dev server at `localhost:4321`     |
| `pnpm build`    | Build for production                     |
| `pnpm db:push`  | Push schema changes to Turso             |
| `pnpm db:studio`| Open Drizzle Studio to inspect the DB   |

## Deploy

Push to GitHub and connect to Vercel. Add all env vars from `.env.example` in the Vercel dashboard. The cron job runs automatically at `0 13 * * *` UTC (08:00 Bogotá).

To test the cron manually:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/daily-birthdays
```
