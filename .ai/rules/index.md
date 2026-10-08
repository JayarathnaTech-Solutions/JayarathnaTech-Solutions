# Project Rules Index

Rules for **JayarathnaTech Solutions**: one React + TypeScript + Vite single-page app (public site, `/admin` dashboard, `/portal` customer portal) on Firebase Auth + Firestore (Spark plan, no Cloud Functions), with Vercel Edge Functions in `api/` for the Gemini calls. There is no server you own beyond `firestore.rules` and those stateless functions.

Read every rule file whose globs cover the paths you are about to touch. Read them **before** planning and **before** the first edit, not after review.

| Globs | Rule file | Covers |
| --- | --- | --- |
| `src/**`, `api/**`, `firestore.rules`, `scripts/**`, `src/test/**` | [`architecture-principles.md`](architecture-principles.md) | SOLID, the dependency rule, the three laws of TDD, and the anti-patterns to refuse |
| `src/**`, `api/**`, `firestore.rules`, `scripts/**`, `src/test/**` | [`design-patterns.md`](design-patterns.md) | Which GoF pattern to reach for, which React/Firebase/the platform already provides, which to refuse |
| `src/**`, `api/**`, `firestore.rules`, `scripts/**`, `src/test/**` | [`refactoring.md`](refactoring.md) | How to change existing code safely; the technique to apply once a smell is named |
| `src/**`, `api/**`, `firestore.rules`, `scripts/**`, `src/test/**` | [`code-smells.md`](code-smells.md) | What to look for; the trigger that sends you to a refactoring technique |
| `firestore.rules`, `api/**`, `src/test/rules/**` | [`testing.md`](testing.md) | TDD workflow, AAA structure, required edge cases, rules *and* handler coverage — the "backend" side |
| `api/**`, `firestore.rules`, `vite.config.ts` (dev API plugins) | [`controllers.md`](controllers.md) | Edge Function entry points, what guards each endpoint and collection, the safety net |
| *(any change)* | [`documentation.md`](documentation.md) | Mandatory CLAUDE.md / AGENTS.md review before every commit |
| *(any commit)* | [`git.md`](git.md) | Commit message format and scope |
| `src/**/*.tsx`, `src/**/*.ts`, and any future React Native app | [`frontend-react.md`](frontend-react.md) | React structure, import direction, hook and rendering rules, function style |
| `src/test/unit/**`, `src/test/support/**`, `src/test/setup.ts`, `jest.config.js`, `jest/**` | [`frontend-testing.md`](frontend-testing.md) | TDD with Jest + React Testing Library, AAA structure, what to test at each layer, frontend edge cases |
| Any global client state (`src/admin/AuthContext.ts`, `src/portal/CustomerAuthContext.ts`, a future `src/store/**`) | [`redux.md`](redux.md) | When global state is justified, and the Redux Toolkit layout to use if it is ever adopted |
| `*.ts`, `*.tsx`, `src/types/**` | [`typescript.md`](typescript.md) | Interfaces only, `I` prefix, all interfaces under `src/types/` |
| `src/lib/firestore.ts`, `src/lib/use*.ts`, `src/lib/cloudinary.ts`, `src/firebase/**`, any `fetch` or Firestore call | [`api-client.md`](api-client.md) | The data-access layer: Firestore SDK, `fetch` for HTTP, one module per external service, error normalization |
| `src/components/ChatThread.tsx`, any `onSnapshot` / `onAuthStateChanged` subscription | [`realtime.md`](realtime.md) | Firestore real-time listeners, cleanup, and state that takes pushed data |
| *(any change)* | [`references.md`](references.md) | Which external sources to consult, and how much weight each carries |

The first five apply to **every** change to `firestore.rules`, `api/`, or the logic in `src/lib/`; they are one workflow, not five topics — see below. [`frontend-react.md`](frontend-react.md), [`frontend-testing.md`](frontend-testing.md), [`redux.md`](redux.md), [`typescript.md`](typescript.md) and [`api-client.md`](api-client.md) apply to everything under `src/` and to any future React Native app. **[`frontend-testing.md`](frontend-testing.md) applies first**: Jest is set up (`npm test`), and the first test is written and seen to fail before the component exists. [`realtime.md`](realtime.md) covers every live subscription, whichever area of the app opens it. [`documentation.md`](documentation.md) and [`git.md`](git.md) apply whenever you change anything and commit it, whatever the change touched.

**Existing code predates these rules.** Where it does not yet follow one (function declarations instead of arrow functions, interfaces without the `I` prefix, `fetch` calls inside components, and so on), the rule binds **new and changed code**; bringing old code into line is a separate, behavior-neutral refactoring commit per [`refactoring.md`](refactoring.md), never a drive-by inside a feature change. Known deviations are listed under `Known gaps` in `AGENTS.md`.

## Mandatory Workflow for Rules, Edge Functions and Logic

Before writing or editing `firestore.rules`, anything under `api/`, or logic under `src/lib/`:

1. **Read the surrounding code first.** An established pattern in this codebase beats a better pattern introduced inconsistently. Consistency wins.
2. **Consult the source before choosing a shape**, in unfamiliar territory or on a structural decision. [`references.md`](references.md) says which sources are normative and how to weigh a community blog post against them.
3. **Write the failing test before the implementation.** TDD is mandatory here — see [`testing.md`](testing.md) for rules and handlers, [`frontend-testing.md`](frontend-testing.md) for UI and `src/lib`. Watch the test fail before you make it pass.
4. **Name the smell before designing the cure.** Go through [`code-smells.md`](code-smells.md) against the code you are about to touch. If you cannot name a concrete smell, you do not have a refactoring justification — write the straightforward code instead.
5. **Pick the technique, not the rewrite.** [`refactoring.md`](refactoring.md) maps each smell to a named technique. Apply the smallest one that resolves it.
6. **Check the platform before the pattern.** [`design-patterns.md`](design-patterns.md) lists what React, Firebase, ES modules and the browser already implement. Hand-rolling a Singleton, Mediator, Observer, or Iterator here is a defect, not a design.
7. **Refactor under green tests, in a separate step from behavior change.** Never mix a rename or extraction into a commit that also changes what the code does.
8. **Update `CLAUDE.md` and `AGENTS.md` before you commit.** Mandatory on every change — see [`documentation.md`](documentation.md). State in your summary what you updated, or that you reviewed both and nothing durable changed.

## Non-Negotiables

- **Docs move with the code.** Every change ends with a `CLAUDE.md` / `AGENTS.md` review, in the same commit. The two files stay byte-identical.
- **Policy does not depend on details.** No React, Firebase SDK, `Request`/`Response`, or other vendor type inside pure business logic (`src/lib/quote.ts`, `src/lib/engagement.ts`, …). See [`architecture-principles.md`](architecture-principles.md).
- **Security lives in `firestore.rules`, not the UI.** Hiding a button is not access control. Every rule change ships with rules tests that prove both the allowed and the denied case.
- **Test first, always.** No implementation code that no failing test demanded — Jest for UI, `src/lib` and `api/` handlers; Jest against the Firestore emulator for rules. Never weaken or delete a test to make a change pass.
- **No speculative abstraction.** One caller is not a reason for an interface. Introduce a pattern on the second real use case or when a test is otherwise impossible to write — not before. Speculative Generality is itself a smell.
- **Never hand-roll what React, Firebase, or the platform provides.** See the verdict column in [`design-patterns.md`](design-patterns.md).
- **Name modules and functions after the domain, not the pattern.** `invoicePdf.tsx`, `createCustomerAccount`, not `PdfFactoryImpl`. The exception is a convention React itself establishes (`use…` for hooks, `…Context`, `…Provider`).
- **A pattern that needs a comment to justify it is the wrong pattern.**

## Source

The taxonomy of patterns, smells, and techniques used across these files follows <https://refactoring.guru/> and <https://sourcemaking.com/> (and behind it, Gang of Four and Fowler's *Refactoring*). Consult those sites for the language-agnostic explanation of any named item. The React/Firebase-specific verdicts, mappings, and prohibitions in these files are this project's own and take precedence where they differ.
