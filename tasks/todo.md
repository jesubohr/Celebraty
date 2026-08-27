# Dependency Security Refresh Checklist

## Phase 1: Manifest and Graph Remediation

- [ ] Raise the Node minimum to `>=22.13.0`, pin `pnpm@11.24.0`, and add root dependency-resolution policy.
- [ ] Explicitly enforce pnpm’s 24-hour minimum release age and strict mode.
- [ ] Keep Tailwind CSS through `tailwindcss` and `@tailwindcss/vite`, updated together on Tailwind v4.
- [ ] Remove only the deprecated, unused Tailwind 3 integration package `@astrojs/tailwind`.
- [ ] Preserve the Tailwind Vite plugin, `@import "tailwindcss"`, and global stylesheet import chain.
- [ ] Move `@astrojs/check` to `devDependencies`.
- [ ] Update Astro, React integration, Vercel adapter, and compatible direct dependencies.
- [ ] Keep TypeScript on the supported v6 line.
- [ ] Add scoped `path-to-regexp` and Drizzle Kit `esbuild` overrides.
- [ ] Regenerate `pnpm-lock.yaml` with the pinned pnpm version.

## Checkpoint: Dependency Graph Clean

- [ ] `pnpm install --frozen-lockfile --ignore-scripts`
- [ ] `pnpm audit --json`
- [ ] `pnpm audit --prod --json`
- [ ] `pnpm audit signatures`
- [ ] `pnpm peers check`
- [ ] Confirm the production bundle contains Tailwind utilities and custom theme/component styles.

## Phase 2: Framework Migration and Runtime Validation

- [ ] Review Astro v7 migration guide against the repository.
- [ ] Run `pnpm exec astro check`.
- [ ] Run `pnpm build`.
- [ ] Visually verify Tailwind layout, responsive behavior, custom colors, and interaction states.
- [ ] Update README’s Astro version.
- [ ] Smoke-test registration, duplicate handling, cron auth, and email rendering.
- [ ] Test a Vercel preview deployment.

## Checkpoint: Release Candidate

- [ ] Re-run all audits and checks from a clean install.
- [ ] Review the final manifest, workspace settings, and lockfile diff.
- [ ] Confirm no secrets or unrelated changes are included.

## Follow-up

- [ ] Decide whether to retire deprecated `@react-email/components` in this change.
