# AI usage log

Working notes on how Claude was used to build this suite. Raw material for the
README's AI usage section. Format per entry: what was delegated, what I decided
or corrected, outcome.

## Jul 20 2026 - project setup

- Delegated package.json to Claude. It looked up live npm versions instead of
  guessing, and pinned @types/node to ^22 (matching my Node runtime, not the
  latest v26 line) and TypeScript to ^5.9 (skipping the new TS 7 since
  Playwright tooling still documents 5.x). Accepted as-is.
- Claude scaffolded playwright.config.ts with two projects (ui/api). I
  questioned whether the "Desktop Chrome" device profile would break on Ubuntu.
  Answer: it is a viewport/UA preset running on Playwright's own downloaded
  Chromium, portable across OSes; the trap would have been channel: 'chrome',
  which we are not using. Also surfaced that fresh Linux boxes may need
  npx playwright install --with-deps. Goes in the README install section.
- Chromium-only instead of the default 3-browser matrix. Deliberate scope cut
  for a timeboxed suite; cross-browser goes in the "with more time" README
  section.

## Jul 20 2026 - credentials

- I asked whether we should hide credentials as best practice. Decision: the
  saucedemo and restful-booker credentials are published demo values, so full
  secret machinery (dotenv, required .env) would be ceremony and would break
  the zero-setup clean-clone run. Compromise: process.env overrides with the
  published values as defaults, plus a .env.example documenting the pattern,
  and a README line on how real projects inject secrets from CI.

## Jul 20 2026 - API suite

- I flagged that create might return 201, not the 200 Claude planned to assert.
  Instead of trusting the model or the API docs, we probed the live API:
  POST /booking returns 200, DELETE returns 201 (not 200/204), GET after
  delete returns 404, POST with a missing required field returns 500 rather
  than a 400 validation error. All assertions pinned to observed behavior,
  each quirk commented in the test code.
- Delegated the helper + two spec files to Claude after agreeing the shape:
  self-contained tests (each creates and deletes its own booking), no shared
  state, negative tests assert the data was untouched after rejected writes,
  delete proven by re-read 404 not by delete's status alone.
- Suite run twice back-to-back against the live sandbox: 8/8 both times.

## Jul 20 2026 - this log ships

- Decided to commit this log to the repo as raw evidence for the README's AI
  usage section, rather than keeping it as local notes. The README section
  stays the summary; this file is the receipts.
