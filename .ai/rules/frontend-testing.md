# Frontend Testing — React with Jest

Sources: <https://jestjs.io/docs/getting-started> (normative for Jest), <https://testing-library.com/docs/react-testing-library/intro/> (normative for React Testing Library), <https://react.dev/learn> (normative for React behavior).

This file governs **how the JayarathnaTech Solutions React app and `src/lib/` are tested**. [`testing.md`](testing.md) states the same mandates for `firestore.rules` and the `api/` handlers; the discipline is identical. Where this file and a general testing guide differ, this file wins.

## Status in This Repository

**Everything under `src/` is covered by these rules** — the public site (`src/pages`), the admin dashboard (`src/admin`), the customer portal (`src/portal`), shared components and `src/lib`. Tests use Jest 30 with `@testing-library/react` + `@testing-library/user-event` and `@testing-library/jest-dom` matchers. Its Jest mechanics (the `jest/` support folder, the Babel transform, ESM `node_modules`) are recorded in `CLAUDE.md` under Testing. If a React Native app is ever added, it follows this file with React Native Testing Library in place of React Testing Library.

The runner is already set up (`npm test`), so there is no excuse for a component arriving before its test. You cannot write a failing test first if there is nothing to run it with — retrofitting tests onto untested components is a different and much worse job, and much of the existing app is in that position (see `Known gaps` in `AGENTS.md`).

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

**1. Write a failing test.** One test, for the next single behavior. Run it and *watch it fail*, with the failure message saying what you expect it to say. On the frontend the wrong-reason red is especially easy to miss: a test that fails with `Unable to find an element with the text: Save` because the component does not render it yet is red for the right reason; one that fails because a router or context provider is missing from the render, a Firebase call is unmocked, an ESM package is not transformed, or the query is simply misspelled is **not red yet**. Fix the test first.

**2. Make the test pass.** The simplest code that turns it green. Not the reusable component, not the generic hook, not the prop you already know the next screen will want. The next test drives the generalization if it is really needed.

**3. Refactor.** Clean up under green, using [`refactoring.md`](refactoring.md) and [`code-smells.md`](code-smells.md). Behavior must not change; the test that just passed must still pass, **unchanged and unmodified**. This step is where a component gets split, a hook gets extracted, and duplicated render setup moves into `src/test/support/`. **It is not optional and is the one most often skipped.**

Then go back to step 1 for the next behavior.

**Do not break the cycle:**

- One behavior at a time. Do not write five tests and then five components.
- Do not start the next test while the current one is red.
- Do not leave the loop after step 2. If there is nothing to clean up, say so — do not silently drop the step.
- Do not write production code in step 1, and do not change behavior in step 3.

**Non-negotiables:**

- Never write a component, hook, `src/lib` function, or context that no failing Jest test demanded.
- Never weaken, skip, or delete a test to make a change pass. Fix the code.
- Never reach for `.skip`, `.todo`, or a commented-out assertion to get to green. A skipped test is a missing test.
- A reported bug starts with a **failing test that reproduces it**, then the fix.
- Run the narrowest set after each step — see [Mechanics](#mechanics).

## AAA Structure

Every test has exactly three phases, in order, separated by blank lines:

```tsx
it('shows an error when Web3Forms rejects the message', async () => {
    // Arrange
    jest.mocked(fetch).mockResolvedValue({ json: async () => ({ success: false }) } as Response)
    const user = userEvent.setup()
    render(<Contact />)
    await fillValidForm(user)

    // Act
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Assert
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
})
```

- **One act per test.** Two clicks in one test means two tests — unless the second click *is* the behavior, as in a double-submit or replay check.
- Everything the user does to reach the starting state is **Arrange**. Only the interaction under test is **Act**.
- Blank-line separation is the minimum. `// Arrange` / `// Act` / `// Assert` comments are optional for short tests, expected once a test exceeds a screen.
- No assertions in Arrange. If setup needs verifying, the setup is too complex — move it into `src/test/support/`.
- No new arrangement after Act. An `await` for the result of the act is Assert, not Arrange.

## Test Behavior, Not Implementation

The test must fail when the user-visible behavior breaks and **must not fail when only the implementation changes**. A test that breaks on every rename is a tax, not a safety net.

**Query the way a user finds things**, in this order of preference: accessibility role and name, label text, visible text, then `data-testid` as the last resort for something with no accessible handle. Never query by component name, class name, style, or DOM structure.

Forbidden:

- Asserting on component internals — state, props, hook return values read from outside, or `container.innerHTML` beyond a genuine structural need.
- Shallow rendering. Render the real tree.
- **Snapshot tests as the primary assertion.** A large snapshot asserts nothing anyone reads and gets rubber-stamped on the first failure. Write explicit assertions. A small, deliberate, reviewed snapshot for a pure formatting helper is the only acceptable use.
- Mocking the component or hook under test.
- Asserting that a mock was called when you could assert on what the user sees instead. `toHaveBeenCalledWith` is for verifying a boundary you own — a Firestore write payload, a `fetch` body, an analytics event, a navigation — not a substitute for checking the screen.

## What to Test at Each Layer

The layers come from [`frontend-react.md`](frontend-react.md). Every layer gets tests; none of them substitutes for another.

| Layer | Tool | What the test proves |
| --- | --- | --- |
| **Pages and components** (`src/pages`, `src/admin/pages`, `src/portal/pages`, `src/components`) | RTL `render` + `screen` + `user-event` | What the user sees and can do: rendered output, interaction, loading, empty, error and unauthorized states |
| **Route guards and layouts** (`RequireAuth`, `RequireCustomerAuth`, `AdminLayout` role redirects) | RTL with `MemoryRouter` | Each auth state and role lands on the right screen |
| **Hooks** (`src/lib/use*.ts`, `src/admin/use*.ts`, `src/portal/use*.ts`) | RTL `renderHook` | Returned values and transitions across rerenders. Prefer testing a hook through a component that uses it; use `renderHook` when the hook is shared and has branches of its own |
| **Global state** (`AuthContext`, `CustomerAuthContext`, or Redux slices if ever adopted) | Plain Jest / RTL | Each transition produces the next state — see [`redux.md`](redux.md) |
| **Data access** (`src/lib/firestore.ts` mappers and writes, `src/lib/customerProvisioning.ts`) | Jest with `firebase/*` mocked | Mappers produce the right interface from a snapshot (missing fields, legacy docs, `Timestamp` → ISO); writes send the right payload; failures surface the right error |
| **External-service adapters** (`src/lib/cloudinary.ts`, PDF builders, `src/lib/analytics.ts`) | Jest with the vendor mocked | The adapter's own behavior only — what it sends, how it reports progress and failure |
| **Pure logic** (`src/lib/quote.ts`, `engagement.ts`, `format.ts`, `blog.ts`, …) | Plain Jest | Pure logic, at its boundaries |

**Component tests are the primary layer** — they prove that rendering, state, handlers, routing and data loading actually compose. Isolated tests exist for logic with enough branches that driving it through the UI would be slow or indirect.

**Do not pad.** A test asserting that a setter sets the value it was given, or that React renders a `<p>`, is noise — delete it. **The requirement is that isolable logic gets isolated coverage, not that every file gets a `.test.tsx`.**

## Edge Cases Are Required

The happy path is the *start* of coverage, never the whole of it. Walk this list for every behavior and write a test for every row that applies. **Say explicitly which rows you judged not applicable and why.**

| Category | Cases to cover |
| --- | --- |
| **Async states** | loading, success, **error**, and empty — every one of the four, for every screen that fetches |
| **Empty and absent** | empty list, empty string, missing optional field, explicit `null`, a field an older Firestore document lacks |
| **Boundaries** | zero, one, many items; first and last page (`chunk` paging); the list exactly at the page size |
| **Form validation** | each rule that can fail, asserted as a message **against the right input** |
| **Authentication** | signed out → redirected to the right login (`/admin/login`, `/portal/login`); an unverified customer → the verification gate; `mustChangePassword` → the forced change form |
| **Authorization** | each staff role that must be refused (`AdminLayout` redirects, `NotStaff`), and a Firestore `permission-denied` surfaced as a refusal, not a blank screen |
| **Not found** | a missing project, blog post, engagement or invite → the not-found state, not a crash on `undefined` |
| **Interaction** | the disabled state actually blocks the action; **double submit does not fire two writes**; a click during loading is ignored |
| **Race and staleness** | a slow response arriving after the input changed must not overwrite newer state; an unmounted component must not set state |
| **Offline and failure** | network or Firestore error surfaces a retry path; retry actually re-requests |
| **Viewport** | anything that branches on screen size (mobile nav drawer vs sidebar, sticky mobile CTA) needs a test per branch |
| **Browser permissions and APIs** | anything that depends on a browser capability (autoplay for the chat chime, clipboard, `IntersectionObserver`) — granted **and denied** |
| **Navigation** | the screen navigates where it claims to, with the params it claims to |
| **Lists** | stable `key` identity across reorder and removal; ties broken deterministically |
| **Time** | debounce, timeout, auto-open delays and expiry with `jest.useFakeTimers()`. Never assert against a drifting real clock |
| **Type coercion** | a numeric value arriving as a string from a form; `"0"` and `"false"` |

A behavior with branches is not covered until **every branch has a test**. Each `if`, ternary, `&&` in JSX, guard clause, and role check is a branch.

## Mocking Boundaries

Mock at the edges of the system, and nowhere else.

- **Mock Firestore and Auth at the `firebase/*` module boundary** with `jest.mock('firebase/firestore', () => ({ ...jest.requireActual(…), getDocs: jest.fn(…) }))`, as the existing tests do. Variables a hoisted `jest.mock` factory references must be named `mock*`. Never let a test reach the live project — `jest/env.cjs` points the SDK at dummy config for exactly this reason.
- **Mock HTTP at `fetch`** (`globalThis.fetch = jest.fn<typeof fetch>()`), and Cloudinary at `src/lib/cloudinary.ts`. Never make a real request.
- **Mock browser APIs jsdom lacks** once, centrally — in `src/test/setup.ts` or `jest/`, not scattered through test files.
- **Do not mock** your own components, pure `src/lib` logic, or utilities. If a test is painful without mocking one of those, the design is wrong: that is a [`code-smells.md`](code-smells.md) trigger, not a reason for a mock. Mocking an auth hook to set the signed-in role (as `RequireAuth.test.tsx` does) is acceptable — it is the auth boundary.
- **Do not mock the router** into meaninglessness. Render inside a `MemoryRouter` and assert on where navigation went.
- Reset mocks between tests. Configure it once (`clearMocks`/`restoreMocks` in `jest.config.js`) rather than per file — shared mock state leaking between tests produces passes that depend on execution order.
- Test data comes from **factories in `src/test/support/`**, not object literals copy-pasted across files. Set only the fields the assertion depends on; everything else is noise that hides which field mattered.

## Mechanics

**Already set up:**

- **Jest 30** is the runner, via babel-jest. There is no ready-made preset for a Vite app, so the transform lives in `jest.config.js` plus the `jest/` folder (Vite `import.meta` bridging, dummy env, jsdom + `fetch` environment, asset stub). That is the one pipeline — do not add a second one, a second config, or Vitest back alongside it.
- **React Testing Library** (`@testing-library/react`) for rendering and queries, with `@testing-library/user-event` preferred over `fireEvent` wherever it covers the interaction, because it goes through the same sequence of events a real click or keystroke does.
- **Import test APIs from `@jest/globals`** (`describe`, `it`, `expect`, `jest`). Matchers come from `@testing-library/jest-dom/jest-globals`, loaded in `src/test/setup.ts`.
- **A single render helper in `src/test/support/`** that wraps the component in the app's real providers — `MemoryRouter`, `AuthContext` / `CustomerAuthContext`, `MotionConfig`. Every component test goes through it once it exists. A test constructing its own provider stack is duplication that will drift.
- **Confirm installed versions in `package.json` before relying on an API.** Jest, RTL and jest-dom have all moved APIs across majors; do not assume from memory.
- Adding or changing dependencies in this repository needs the user's approval.

**Running:**

- Narrowest first: `npx jest src/test/unit/Thing.test.tsx -t 'the behavior name'`.
- Then the file, then the suite (`npm test`). Watch mode (`npm run test:watch`) is the right default while cycling.
- After editing anything in `jest/`, run `npx jest --clearCache` — the transform cache does not track the plugin's source.
- **Coverage is a diagnostic, not a target.** Use it to find the branch you forgot; never chase a percentage, and never add a test purely to move the number.

**Placement and naming:**

- **Tests live in `src/test/`, never beside the code:**
  - `src/test/unit/` — everything that runs in jsdom: pages, components, guards, hooks, data-access mappers, `src/lib` logic, and `api/` handler tests. `src/pages/Contact.tsx` → `src/test/unit/Contact.test.tsx`; an admin page is prefixed with its area (`AdminStaff.test.tsx`).
  - `src/test/rules/` — Firestore rules tests, run against the emulator; governed by [`testing.md`](testing.md).
  - `src/test/support/` — the render helper, factories and shared fakes — **not** tests.
  - This departs from Jest's and bulletproof-react's colocation on purpose. Do not move tests next to their components.
- Name the test after the behavior, from the user's point of view: `it('disables the button while the request is in flight')`. Not `it('works')`, not `it('calls handleSubmit')`.
- TypeScript rules apply to test files too: interfaces only, `I`-prefixed for new ones, under `src/types/` — see [`typescript.md`](typescript.md).

## Definition of Done

A frontend change is not finished until all of these hold:

- Every new behavior went through the full cycle: a test written and **seen to fail for the right reason**, the simplest code to pass it, then a refactor pass under green.
- Every branch in the changed code has a test.
- The edge-case table above was walked, with any skipped rows named and justified.
- Loading, empty, error and unauthorized states are covered for every screen that fetches.
- Every test follows AAA with a single act, and queries the way a user would.
- No `.skip`, no `.todo`, no snapshot standing in for a real assertion.
- The narrowest relevant tests pass, then the file, then the suite.
- `CLAUDE.md` and `AGENTS.md` reviewed per [`documentation.md`](documentation.md).
