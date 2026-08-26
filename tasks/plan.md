# Implementation Plan: Dependency Security Refresh

## Overview

Refresh the single pnpm dependency graph to remove all known audit findings while preserving the current Astro/Vercel, Turso/Drizzle, Resend, React Email, and Tailwind behavior. Tailwind CSS is a required part of the project and must remain enabled through the Tailwind v4 Vite plugin. The work should be performed as a dependency-focused change, with framework migration checks and clean-install verification before deployment.

Audit date: 2026-08-25. Plan and registry assumptions re-reviewed: 2026-08-26.

## Current Baseline

- Installation boundary: repository root; one committed `pnpm-lock.yaml`; no competing lockfiles.
- Runtime: Node `v24.18.0`; manifest engine is `>=22.12.0`; pnpm in use is `11.15.1`.
- Toolchain mismatch to correct: pnpm 11.15.1 and current pnpm 11.24.0 require Node `>=22.13`, so pinning pnpm 11 also requires raising the manifest Node minimum to `>=22.13.0`.
- `pnpm audit --json`: 1 critical, 24 high, 15 moderate, and 4 low findings across 662 packages.
- `pnpm audit --prod --json`: the same counts because `@astrojs/check` is currently declared as a production dependency.
- The critical finding is `tar@7.5.13` through `@astrojs/vercel@10.0.4 -> @vercel/nft -> @mapbox/node-pre-gyp`.
- Other important reachable production paths include Astro 6 XSS/SSRF findings, the Vercel adapter path override finding, `ws` through libSQL, and vulnerable framework build dependencies such as Vite, PostCSS, `js-yaml`, `devalue`, `sharp`, and SVGO.
- `pnpm audit signatures` passed for all 662 packages.
- Baseline `pnpm exec astro check` and `pnpm build` pass. The check reports two existing deprecation hints, but no errors.
- The working tree was clean before this plan was created.

## Upgrade Strategy Validated in an Isolated Probe

An uncommitted copy of the project was resolved with the following strategy:

- Keep Tailwind CSS. Retain and update both `tailwindcss` and `@tailwindcss/vite`, preserve the Vite plugin in `astro.config.mjs`, preserve `@import "tailwindcss"` in `src/styles/global.css`, and preserve the global stylesheet import in `src/layouts/base.astro`.
- Remove only `@astrojs/tailwind`. This deprecated package is the legacy Tailwind 3 integration, is not imported by this project, and does not support the project’s Tailwind 4 setup. Removing it does not remove Tailwind CSS.
- Move `@astrojs/check` to `devDependencies` and update it to `0.9.10`.
- The isolated probe updated the framework cluster to `astro@7.2.6`, `@astrojs/react@6.0.4`, and `@astrojs/vercel@11.0.8`. Although the registry’s raw `latest` tag is now Astro 7.2.7, it was published less than 24 hours before this review and pnpm’s release-age policy still selects 7.2.6. Implementation should use the newest patched release admitted by the configured 24-hour policy, then repeat every audit, peer, check, build, and visual verification gate.
- Update compatible direct dependencies to the tested latest versions: `@fontsource-variable/manrope@5.3.0`, `@libsql/client@0.17.4`, `@react-email/render@2.1.0`, `@tailwindcss/vite@4.3.3`, `date-fns@4.4.0`, `motion@13.1.1`, `react@19.2.8`, `react-dom@19.2.8`, `resend@6.22.1`, `tailwindcss@4.3.3`, `zod@4.4.3`, `@types/react@19.2.18`, and `@types/react-dom@19.2.5`.
- Keep `typescript@6.0.3`; `@astrojs/check@0.9.10` does not declare TypeScript 7 support.
- Add root pnpm overrides in `pnpm-workspace.yaml`:

  ```yaml
  overrides:
    "@vercel/routing-utils@5>path-to-regexp": "6.3.0"
    "@esbuild-kit/core-utils>esbuild": "0.28.1"
  ```

  The first addresses the exact vulnerable edge retained by the Vercel routing utility. The second updates the deprecated Drizzle Kit loader’s dev-only `esbuild` edge without forcing unrelated packages to use that version.
- Probe result with Astro 7.2.6: `pnpm audit` and `pnpm audit --prod` both report zero findings; `pnpm audit signatures` verifies 644 packages; `pnpm peers check`, `pnpm exec astro check`, and `pnpm build` pass.

These are probe results, not changes to the repository. Re-run the registry audit before applying them because dependency metadata can change.

## Architecture and Supply-Chain Decisions

- Keep Astro server output and the Vercel adapter; the app’s deployment model does not need to change.
- Upgrade the Astro integration cluster together. Astro v7 upgrades to Vite 8 and uses a stricter Rust compiler, so the build is the primary compatibility gate.
- Tailwind retention is a hard requirement: keep `tailwindcss` and `@tailwindcss/vite` on the same v4 release, keep the Vite plugin configuration, and keep the global CSS import chain.
- Remove only the deprecated, unused `@astrojs/tailwind` package. Astro’s current documentation explicitly recommends the Tailwind v4 Vite plugin and describes `@astrojs/tailwind` as legacy Tailwind 3 support.
- Use scoped pnpm overrides only where an upstream exact transitive dependency still resolves to a vulnerable version. Revisit and remove each override when its parent package no longer needs it.
- Raise the Node engine minimum to `>=22.13.0`, pin `pnpm@11.24.0` via `packageManager`, and make CI/deploy installs frozen. Do not use `pnpm audit fix --force`.
- Make pnpm’s 24-hour minimum release-age policy explicit in `pnpm-workspace.yaml`; do not bypass it merely to consume a newly published patch. Re-evaluate newer releases after they clear the policy window.
- Since pnpm 11 no longer reads settings from the `pnpm` field in `package.json`, keep overrides and other pnpm settings in the root `pnpm-workspace.yaml`.

Reference guidance: [Astro v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/), [Astro Tailwind styling guidance](https://docs.astro.build/en/guides/styling/#tailwind), [deprecated `@astrojs/tailwind` integration](https://docs.astro.build/en/guides/integrations-guide/tailwind/), [Tailwind’s Astro installation guide](https://tailwindcss.com/docs/installation/framework-guides/astro), [pnpm dependency-resolution settings and overrides](https://pnpm.io/settings/dependency-resolution), and [pnpm configuration location](https://pnpm.io/package_json).

## Task List

### Phase 1: Manifest and Graph Remediation

## Task 1: Pin the installation toolchain and dependency policy

**Description:** Raise the Node minimum to satisfy pnpm 11, pin the current pnpm 11 release used for the refresh, and establish the root pnpm settings file needed for scoped overrides.

**Acceptance criteria:**

- [ ] `package.json` declares Node `>=22.13.0` and `packageManager: "pnpm@11.24.0"`.
- [ ] `pnpm-workspace.yaml` is present at the repository root, explicitly sets `minimumReleaseAge: 1440` and `minimumReleaseAgeStrict: true`, and contains only intentional root-level settings.
- [ ] A clean install can be run with the pinned manager and `--frozen-lockfile`.

**Verification:**

- [ ] Node `22.13.0` and the project’s current Node 24 runtime both satisfy the manifest.
- [ ] `corepack pnpm --version` reports `11.24.0`.
- [ ] `pnpm install --frozen-lockfile --ignore-scripts` succeeds after the lockfile update.

**Dependencies:** None.

**Files likely touched:**

- `package.json`
- `pnpm-workspace.yaml`

**Estimated scope:** Small.

## Task 2: Update the Astro and integration cluster

**Description:** Update Astro, the React integration, and the Vercel adapter together to remove the framework and adapter advisories. Remove only the unused Tailwind 3 integration package, while preserving the project’s required Tailwind 4 dependencies and configuration. Keep TypeScript on the latest version supported by `@astrojs/check`.

**Acceptance criteria:**

- [ ] Astro resolves to the newest patched release admitted by the 24-hour release-age policy (`7.2.6` at review time); `@astrojs/react` and `@astrojs/vercel` resolve to compatible current releases.
- [ ] Only the deprecated `@astrojs/tailwind` package is removed from the manifest and lockfile importer.
- [ ] `tailwindcss` and `@tailwindcss/vite` remain installed on the same Tailwind v4 release.
- [ ] `astro.config.mjs` still loads `@tailwindcss/vite`; `global.css` and `base.astro` retain the Tailwind import chain.
- [ ] `@astrojs/check` is in `devDependencies`, not production dependencies.
- [ ] No peer dependency warnings remain.

**Verification:**

- [ ] `pnpm peers check` passes.
- [ ] `pnpm exec astro check` reports zero errors.
- [ ] `pnpm build` completes with the Vercel adapter.
- [ ] Generated production CSS contains the project’s Tailwind utilities and custom theme/component styles.

**Dependencies:** Task 1.

**Files likely touched:**

- `package.json`
- `pnpm-lock.yaml`

**Files verified but not expected to change:**

- `astro.config.mjs`
- `src/styles/global.css`
- `src/layouts/base.astro`

**Estimated scope:** Small.

## Task 3: Refresh the remaining direct dependencies and lockfile

**Description:** Apply the compatible direct-version refresh validated by the isolated probe, including libSQL/Drizzle runtime edges, React Email renderer, Tailwind v4, React, Resend, date handling, and Zod. Regenerate the lockfile with the pinned pnpm version.

**Acceptance criteria:**

- [ ] All direct dependency updates are intentional and exact-pinned as in the existing manifest style.
- [ ] `tailwindcss` and `@tailwindcss/vite` are updated together to `4.3.3` or the same newer compatible v4 release.
- [ ] The lockfile contains integrity metadata for every resolved package and no competing lockfile is introduced.
- [ ] `pnpm why` confirms the vulnerable pre-refresh versions are no longer selected.

**Verification:**

- [ ] `pnpm install --frozen-lockfile --ignore-scripts` succeeds from a clean dependency directory.
- [ ] `pnpm audit --json` reports zero critical, high, moderate, and low findings.
- [ ] `pnpm audit --prod --json` reports zero findings.

**Dependencies:** Task 2.

**Files likely touched:**

- `package.json`
- `pnpm-lock.yaml`

**Estimated scope:** Medium.

## Task 4: Add and validate scoped transitive remediations

**Description:** Add the two narrowly scoped overrides required by the current parent packages: `path-to-regexp` under `@vercel/routing-utils@5`, and `esbuild` under the deprecated Drizzle Kit loader chain. Treat each override as temporary technical debt and document its parent/advisory reason in the plan or commit message.

**Acceptance criteria:**

- [ ] The vulnerable `path-to-regexp@6.1.0` edge is replaced by `6.3.0` under the Vercel routing utility.
- [ ] The vulnerable `esbuild@0.18.20` edge is replaced by `0.28.1` under `@esbuild-kit/core-utils`.
- [ ] Overrides do not create peer dependency problems or alter unrelated dependency edges.
- [ ] The lockfile records the overridden versions and remains reproducible.

**Verification:**

- [ ] `pnpm why path-to-regexp` shows only the patched resolution.
- [ ] `pnpm why esbuild` shows the patched resolution and expected consumers.
- [ ] `pnpm audit`, `pnpm audit --prod`, `pnpm audit signatures`, and `pnpm peers check` pass.

**Dependencies:** Tasks 2–3.

**Files likely touched:**

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`

**Estimated scope:** Small.

### Checkpoint: Dependency Graph Clean

- [ ] Full and production audits are both clean.
- [ ] Registry signatures verify for the complete lockfile.
- [ ] No peer dependency issues remain.
- [ ] Review the manifest and lockfile diff before continuing.

### Phase 2: Framework Migration and Runtime Validation

## Task 5: Validate Astro v7 behavior and update project documentation

**Description:** Review the Astro v7 migration notes, run the application checks, and update the README’s stale Astro version. Inspect the small migration surface for reserved files, invalid markup, whitespace-sensitive inline elements, and Vite-plugin behavior.

**Acceptance criteria:**

- [ ] `astro.config.mjs` remains valid with Vite 8 and the Tailwind v4 plugin.
- [ ] No existing `src/fetch.ts`, legacy content collections, or custom adapter API usage is introduced or broken.
- [ ] README accurately states the installed Astro major version and current commands.

**Verification:**

- [ ] `pnpm exec astro check` passes with zero errors.
- [ ] `pnpm build` succeeds.
- [ ] Run `pnpm preview` and manually check the registration page, upcoming-birthdays rendering, responsive styling, focus/hover states, and custom Tailwind colors/components.

**Dependencies:** Checkpoint: Dependency Graph Clean.

**Files likely touched:**

- `README.md`
- `astro.config.mjs` only if the migration check identifies a required config adjustment

**Estimated scope:** Small.

## Task 6: Smoke-test application security-sensitive flows

**Description:** Verify the dependency refresh did not regress the public registration endpoint, database access, email rendering, or the authenticated daily cron endpoint. This is a runtime confidence pass, not a redesign of application security behavior.

**Acceptance criteria:**

- [ ] Invalid registration JSON and invalid field values continue to receive 4xx responses.
- [ ] Duplicate email registration continues to return the expected conflict response.
- [ ] The cron endpoint rejects a missing or incorrect bearer token.
- [ ] The production build still contains the Vercel server output and cron route.

**Verification:**

- [ ] Run focused endpoint tests or local HTTP smoke tests with test environment variables.
- [ ] Render a birthday digest using the updated React Email renderer.
- [ ] Confirm no secrets are added to source, the lockfile, build output, or logs.

**Dependencies:** Task 5.

**Files likely touched:**

- Existing endpoint/email files only if a compatibility failure is found
- Test files if focused smoke tests are added

**Estimated scope:** Medium.

### Checkpoint: Release Candidate

- [ ] Full audit, production audit, signature audit, peer check, type check, build, and smoke tests pass.
- [ ] `git diff` contains only the approved dependency/config/documentation changes.
- [ ] Vercel preview deployment is tested before production promotion.

### Phase 3: Follow-up Supply-Chain Cleanup

## Task 7: Decide how to retire deprecated React Email components

**Description:** `@react-email/components@1.0.12` is deprecated even though it is not currently reported by `pnpm audit`. Decide whether to replace its wrapper components with maintained/intrinsic JSX or to defer that migration as a separate change.

**Acceptance criteria:**

- [ ] The decision is recorded: migrate now or explicitly defer with an owner/review date.
- [ ] If migrated, email HTML output is unchanged in a rendered comparison.
- [ ] Deprecated-package warnings are reduced without introducing a new unreviewed dependency.

**Verification:**

- [ ] Render the digest before and after the change and compare the resulting HTML.
- [ ] Re-run the full dependency audit and build.

**Dependencies:** Release Candidate checkpoint.

**Files likely touched:**

- `src/lib/email/DailyBirthdayDigest.tsx`
- `package.json`
- `pnpm-lock.yaml`

**Estimated scope:** Medium.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Astro v7 changes the Vite/compiler behavior | Medium | Upgrade the official integration cluster together; run `astro check`, build, preview, and inspect rendered output. |
| Tailwind is accidentally removed while deleting the legacy integration | High | Retain `tailwindcss`, `@tailwindcss/vite`, the Vite plugin, `@import "tailwindcss"`, and the layout stylesheet import; verify generated CSS and the rendered page. |
| A scoped override is incompatible with a parent package | High | Keep selectors narrow, run peer checks/build/smoke tests, and remove the override when the parent releases a fixed range. |
| A future registry refresh changes the tested latest versions | Medium | Re-run `pnpm outdated`, native audits, signature verification, and the isolated resolution before editing the repository. |
| A just-published release has not had time for ecosystem scrutiny | Medium | Enforce pnpm’s 24-hour minimum release age and upgrade only after the version is admitted by that policy. |
| Production and dev graphs diverge | Medium | Gate both `pnpm audit` and `pnpm audit --prod`; keep `@astrojs/check` dev-only. |
| Deprecated React Email packages remain in the graph | Low | Track them as a separate follow-up; do not replace them with an unreviewed package merely to silence warnings. |

## Open Questions

- Should the deprecated React Email component migration be included in the same change, or tracked separately after the vulnerability remediation is merged?
