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

## Jul 20 2026 - UI suite prep

- I asked how Claude knew saucedemo's selectors without visiting the site.
  Answer: training data, i.e. memory, not verification. So before writing any
  UI test we drove the real site in Chrome and read the live DOM at every step
  of the journey (login, locked-out error, inventory, cart, checkout
  validation, overview totals, completion page).
- The check caught a real staleness bug: the site now uses kebab-case
  data-test attributes (shopping-cart-badge, shopping-cart-link) where
  Claude's memory had older underscore versions (shopping_cart_badge).
  Locators written from memory would have failed. All locators and expected
  strings in the UI specs are pinned to the DOM as observed today, including
  the exact error messages and the $39.98 item total for the two journey
  items.

## Jul 20 2026 - UI suite

- Delegated both specs to Claude after the live DOM verification. Shape
  agreed beforehand: one end-to-end journey test (login, add two items,
  cart contents, checkout, overview totals, confirmation) rather than
  fragmented steps, because the UI layer's job here is proving the flow
  wires together; isolated validation lives in the API suite.
- The overview assertion computes the expected item total from the listed
  item prices instead of hardcoding $39.98, so the test states the rule,
  not the coincidence.
- Set Playwright's testIdAttribute to data-test so locators use
  page.getByTestId against saucedemo's own hooks. No CSS-class selectors,
  no sleeps, auto-waiting assertions only.
- UI suite passed first run; full suite (8 API + 3 UI) passed twice
  back-to-back.

## Jul 20 2026 - slow motion demo runs

- I wanted to watch the headed run, so we added slowMo temporarily. I asked
  whether the assessment's "no sleeps" bar forbids it; distinction drawn:
  slowMo is a uniform launch-option throttle for demos, not a hard wait
  inside test logic, but a hardcoded 600ms would read as a debugging
  leftover (or worse, sleep-dependence) to a reviewer. Ended up env-gating
  it: SLOWMO=600 gives a watchable run, default is zero delay. Verified
  both modes still pass.

## Jul 20 2026 - dotenv after all

- Originally decided against dotenv to keep the suite zero-dependency, with
  env vars set from the shell. Reversed when writing the README: I wanted
  the standard "copy .env.example to .env" instruction, and that is only
  honest if the file actually loads. Added dotenv (quiet, tolerant of the
  file being absent), verified a .env with SLOWMO=900 slows the run and
  that deleting it restores full speed. Defaults still mean the suite runs
  with no setup at all.

## Jul 20 2026 - Part 2 drafting

- I set the scenario assumption myself: the response-event recorder is a
  webhook handler writing directly to the data store, no ingest queue.
  Claude's first draft assumed a queue on the ingest side. The rewrite
  under my assumption surfaced a sharper point, that a synchronous handler
  turns any transient failure into permanent loss.
- I pushed back twice on the duplicate-events story: first that a good
  database would not produce duplicates from one call (true but the
  premise is wrong, providers cannot guarantee one call), then that
  webhooks do not retry. We verified against provider docs instead of
  arguing: Vonage retries delivery receipts every minute for 24 hours,
  Twilio retries status callbacks only a few times then drops them with
  no replay, Stripe retries for 3 days. Both sides of the draft got
  stronger, the over-count now cites Vonage's 24-hour hammering and the
  under-count cites Twilio's permanent loss after a few attempts.

## Jul 20 2026 - more written-part corrections

- Part 2 Q3 first draft said to re-run the reconciliation 24 to 48 hours
  later. I pushed back that in a live production issue you do not wait two
  days. The fix was better than the original: the bad windows from earlier
  in the week already aged, so you re-run them immediately. The answer now
  reads like incident triage instead of a scheduled experiment.
- Part 3 auth plan said a protected endpoint without a session "returns an
  auth error". I made it specify the three distinct correct behaviors: no
  session on a browser page redirects to login, no session on an API call
  returns 401, a valid session without permission returns 403. The 401
  versus 403 mix-up is a real bug class and the vague version would have
  read as textbook.

## Jul 20 2026 - this log ships

- Decided to commit this log to the repo as raw evidence for the README's AI
  usage section, rather than keeping it as local notes. The README section
  stays the summary; this file is the receipts.
