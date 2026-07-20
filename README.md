# QA Automation Assessment

UI and API test suite built with Playwright Test and TypeScript. 11 tests total, all passing against the live public targets.

- UI target: [saucedemo.com](https://www.saucedemo.com) (Swag Labs demo store)
- API target: [restful-booker.herokuapp.com](https://restful-booker.herokuapp.com) (public booking API with token auth)

## Install and run

Requires Node 20+.

```
npm ci
npx playwright install chromium
npx playwright test
```

On a fresh Linux machine, use `npx playwright install --with-deps chromium` instead of the second command so the browser's system libraries get installed too.

Run commands:

```
npm test                 # run everything, UI and API
npm run test:ui          # UI suite only
npm run test:api         # API suite only
npm run test:ui:headed   # UI suite in a visible browser, one test at a time
npm run report           # open the HTML report of the last run
```

No configuration is needed to run the suite. For optional overrides, copy `.env.example` to `.env` and set what you want; the file is loaded automatically and ignored by git.

- `BOOKER_USER` / `BOOKER_PASS` - auth credentials for the booking API. Default to the sandbox's published demo values.
- `SAUCE_USER` / `SAUCE_PASS` - store login for the UI suite. Default to the published `standard_user` demo account.
- `SLOWMO` - milliseconds of delay per browser action, off by default. `SLOWMO=600` together with `npm run test:ui:headed` gives a watchable slow-motion demo run.

The credentials are hardcoded as defaults on purpose: they are published demo values, not secrets, and requiring an env file would break the zero-setup clone. In a real project they would be injected from CI secret storage.

The API target is a free Heroku app that cold-starts, so the very first API request after a quiet period can take a few seconds. Timeouts account for this.

## Tooling

Playwright Test with TypeScript, one runner for both suites. The system described in the role is an API-driven messaging platform with a web dashboard, which means test coverage has to span both an HTTP API and a browser UI. Playwright covers both in a single framework: browser tests with auto-waiting, and API tests through its request context, sharing one config, one reporter, and one CI entry point.

My browser automation background is production Cypress and Puppeteer. Playwright is new to me and was picked up for this assessment. The headless model is the same as Puppeteer's, so the ramp was mostly learning Playwright's fixture and locator idioms rather than new concepts.

## What is tested where

**API layer** (8 tests): the full booking lifecycle with an auth token. Create, read back with field-level assertions, update verified by re-read, delete proven by a subsequent 404. Negative cases: writes with an invalid token are rejected with 403 and the data is verified unchanged, reading a nonexistent id returns 404, and creating with a missing required field is rejected. Every test creates and cleans up its own booking, so tests run in any order, in parallel, and never assert on the shared sandbox's global state.

**UI layer** (3 tests): one end-to-end journey proving the critical path wires together, with a real assertion at each stage: login lands on the product list, adding two items updates the cart badge, the cart shows exactly those items and prices, checkout accepts buyer details, the overview's item total equals the sum of the listed prices (computed, not hardcoded), and finishing shows the confirmation with an emptied cart. Two rejection tests: a locked-out user sees the exact lockout error, and checkout without a first name shows the exact validation error without advancing.

The split is deliberate. Business logic, CRUD permutations, and validation live at the API layer, where tests are fast and stable. The UI layer only proves the user journey connects, because pushing CRUD permutations through a browser produces slow, brittle suites that fail for reasons unrelated to what they test. Selectors use the app's own `data-test` hooks via `getByTestId`, there are no sleeps anywhere, and nothing depends on execution order.

A note on honest assertions: this API returns 200 on create, 201 on delete, and 500 (rather than a 400 validation error) on a missing required field. Each was verified against the live API before being asserted, and the quirks are commented in the tests. Against a real system the 500 would be a bug report.

## With more time

- A GitHub Actions workflow running both projects on push, with the HTML report and failure traces uploaded as artifacts. The config already switches retries and `forbidOnly` on a `CI` env var.
- Smoke vs regression tagging so CI can run a fast gate on every commit and the full suite nightly.
- Contract checks on the API responses (JSON schema per endpoint) instead of field-by-field assertions only.
- Cross-browser projects for Firefox and WebKit. Chromium-only was a deliberate cut to keep this timeboxed suite fast.
- The remaining saucedemo personas (`problem_user`, `performance_glitch_user`) as a visual/performance regression exercise.

## AI usage

This suite was co-built with Claude (Anthropic's CLI). The raw working log is committed as [AI-LOG.md](./AI-LOG.md); the short version:

**Delegated**: scaffolding (package.json, config, folder layout), first drafts of the spec files and helpers after the shape of each suite was agreed, and the mechanical parts of DOM verification.

**Kept my hands on**: every design decision, and each one is logged. The UI vs API split, self-contained fixtures over shared state, one journey test instead of fragmented steps, no page-object layer for a suite this size, env-overridable credentials with published defaults instead of secret machinery that would break the zero-setup clone.

**Caught and corrected**: the ones that mattered. I questioned whether the API returns 200 or 201 on create, so instead of trusting the model or the docs we probed the live API and pinned every status assertion to observed behavior (create 200, delete 201, missing field 500). I asked how Claude knew saucedemo's selectors without visiting the site; the answer was training-data memory, so we drove the real site and read the live DOM first, which caught stale underscore-style selectors where the site now uses kebab-case. And a temporary slow-motion setting added for a demo run nearly shipped hardcoded; it's now env-gated and off by default.
