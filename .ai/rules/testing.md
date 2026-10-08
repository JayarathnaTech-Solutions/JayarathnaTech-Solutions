# Testing — Rules and Edge Functions

This file states the project's **mandates** for the server side of JayarathnaTech Solutions: `firestore.rules` and the `api/` Edge Function handlers. [`frontend-testing.md`](frontend-testing.md) states the same discipline for the React app and `src/lib/`; the tooling is Jest in both cases. Where this file and a general testing guide differ, this file wins.

## TDD Is Mandatory

Write the test **before** the implementation. Not after, not "alongside."

Follow this cycle, once per behavior:

```
            ┌─────────────────────────┐
            │  1. Write a failing     │
            │     test                │
            └────────────┬────────────┘
                         │
                         ▼
            ┌─────────────────────────┐
            │  2. Make the test       │
            │     pass                │
            └────────────┬────────────┘
                         │
                         ▼
            ┌─────────────────────────┐
            │  3. Refactor            │
            └────────────┬────────────┘
                         │
                         └──► back to step 1 for the next behavior
```

**1. Write a failing test.** One test, for the next single behavior. Run it and *watch it fail*, with the failure message saying what you expect it to say. A test that has never failed proves nothing — it may be asserting a tautology, hitting the wrong collection, or never reaching the rule at all. A rules test that "fails" because the emulator isn't running, or because the seeded `staff` doc is missing, is not red yet; fix the test first.

**2. Make the test pass.** Write the simplest code that turns it green. Not the general solution, not the extensible one, not the one you already know you will need next. The simplest. Resisting the urge to build ahead is the point of the step — the next test will drive the generalization if it is really needed.

**3. Refactor.** Clean up now, while the test is green, using [`refactoring.md`](refactoring.md) and [`code-smells.md`](code-smells.md). Behavior must not change; the test that just passed must still pass, unchanged. **This step is not optional and is the one most often skipped** — skipping it is what turns "simplest thing that works" from a discipline into a mess.

Then go back to step 1 for the next behavior.

**Do not break the cycle:**

- One behavior at a time. Do not write five tests and then five rules.
- Do not start the next test while the current one is red.
- Do not leave the loop after step 2. If there is nothing to clean up, say so — do not silently drop the step.
- Do not write production code in step 1, and do not change behavior in step 3.

**Non-negotiables:**

- Never write a rule or handler branch that no failing test demanded.
- Never weaken or delete a test to make a change pass. Fix the code.
- If a bug is reported, the first commit is a **failing test that reproduces it**. Then the fix.
- Run the narrowest set after each step: one rules file through the emulator, or `npx jest path/to/handler.test.ts -t 'behavior'`.

## AAA Structure

Every test has exactly three phases, in order, separated by blank lines:

```ts
it('blocks an editor from changing the bank details', async () => {
    // Arrange
    const db = testEnv.authenticatedContext('editor-uid', { email: EDITOR_EMAIL }).firestore()

    // Act
    const write = setDoc(doc(db, 'settings', 'bankDetails'), { bankName: 'Hacked', accountName: '', accountNumber: '', branchSwift: '' })

    // Assert
    await assertFails(write)
})
```

- **One act per test.** Two writes in one test means two tests — unless the second *is* the behavior, as in a replay or a forbidden status transition after a legal one.
- Blank-line separation is the minimum. `// Arrange` / `// Act` / `// Assert` comments are optional for short tests, expected once a test exceeds a screen.
- No assertions in Arrange. If setup needs verifying, the setup is too complex — move it into the file's `beforeEach` seed (written with `withSecurityRulesDisabled`).
- No new arrangement after Act.

Existing rules tests sometimes assert several roles in one `it` (see `settings.rules.test.ts`); new tests follow one act per test, and old ones are split only in a separate refactoring commit.

## Edge Cases Are Required

The happy path is the *start* of coverage, never the whole of it. Before calling a behavior tested, walk this list and write a test for every row that applies. Say explicitly which rows you judged not applicable and why.

| Category | Cases to cover |
| --- | --- |
| **Boundaries** | zero, one, many; min and max length (`MAX_MESSAGE_LENGTH`, `MAX_INPUT_LENGTH`, `MAX_HISTORY_MESSAGES`); off-by-one either side of every limit |
| **Empty and absent** | empty string, empty array, missing optional field, explicit `null`, a field omitted from the write |
| **Validation** | each rule that can fail: a key outside the `hasOnly` allowlist, a wrong type, a non-`https://` URL; for handlers, each `400` with its message |
| **Authentication** | unauthenticated request → denied (rules) / rejected (handlers that require sign-in) |
| **Authorization** | every role that must be denied: editor vs admin, HR targeting an admin, a developer not assigned to the engagement, another customer's engagement, an **unverified** customer |
| **Not found** | reading or updating a document that does not exist; a referenced invoice id that does not exist |
| **Uniqueness** | duplicate create (staff invite by an email that exists, customer email already in use) |
| **State transitions** | every illegal transition rejected (`pending_advance → delivered`, moving forward with an unverified invoice, changing locked invoice pointers), not just the legal ones accepted |
| **Idempotency** | reusing a testimonial invite after it is marked used; repeating a write does not double-create |
| **Type coercion** | string where a number is expected, `"0"`, `"false"`, numeric-string ids |
| **Size** | payload at and beyond the accepted maximum |
| **Time** | expiry exactly at the cutoff; freeze time with `jest.useFakeTimers()` — never assert against a drifting clock |
| **Ordering** | ties broken deterministically; the assertion must not depend on insertion order by accident |
| **Upstream failure** (handlers) | Gemini `429`, other non-OK status, malformed response, missing API key |

A behavior with branches is not covered until **every branch has a test**. Each `if`, ternary, guard clause, rules condition joined by `||`/`&&`, and role helper is a branch.

## Both Layers Are Required

Every server-side change ships with the tests for its layer. They catch different defects and neither substitutes for the other.

**Rules tests — `src/test/rules/`.** The primary layer for data access. One file per collection or concern (`customers`, `engagements`, `invoices`, `chat`, `settings`, plus `firestore.rules.test.ts` for the rest), exercised through the real Firestore emulator with `@firebase/rules-unit-testing`. These prove that the rules, the role helpers and the documents they `get()` actually compose. Every collection needs, at minimum: each allowed operation per role, each denied role, and each shape violation.

**Handler tests — for `api/*Handler.ts`.** No HTTP and no network: call `handleChatRequest(apiKey, body)` directly with `fetch` mocked, and assert on the returned `{ status, body }`. Cover:

- input validation and every rejection status
- the success mapping from the Gemini response
- upstream failures and the missing-key case
- anything with enough branches that driving it through the UI would be slow or indirect

Do not pad. A test that only asserts a constant equals itself, or that the Firebase SDK works, is noise — delete it. If a module genuinely has no logic to isolate, say so in your summary instead of writing a hollow test. **The requirement is that isolable logic gets isolated coverage, not that every file gets a test file.**

## Mechanics in This Repo

- Jest 30 via babel-jest. Rules tests use `jest.rules.config.js` (node environment, 20s timeout); handler and app tests use `jest.config.js`.
- `npm run test:rules` starts the Firestore emulator with `firebase emulators:exec`, runs the rules suite with `--runInBand`, and stops it. It needs a JRE. Files must run serially: `firebase.json` uses `singleProjectMode`, so parallel files would wipe each other's data.
- Rules tests use the `demo-jayarathnatech` project id and load `firestore.rules` from disk. They never touch the live `jayarathnatech-solutions` project.
- Seed with `testEnv.withSecurityRulesDisabled()` in `beforeEach`, clear with `clearFirestore()` in `afterEach`. Seed only the fields the assertion depends on, plus what the rules `get()`.
- Rules changes are not live until `firebase deploy --only firestore --project jayarathnatech-solutions`.
- Handler tests go under `src/test/unit/` (they need no emulator); mock `fetch` on `globalThis`, never call Gemini.

## Definition of Done

A change is not finished until all of these hold:

- Every new behavior went through the full cycle: a test written and seen to fail, the simplest code to pass it, then a refactor pass under green.
- Every branch in the changed code has a test.
- The edge-case table above was walked, with any skipped rows named and justified.
- Rules tests exist for every allowed and denied path; handler tests exist for the isolable logic.
- Every new test follows AAA with a single act.
- The narrowest relevant tests pass, and `npm run lint` and `npx tsc -b` are clean.
- Ask the user to run the full suites: `npm test` and `npm run test:rules`.
