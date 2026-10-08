# Architecture Principles

Sources: Robert C. Martin's blog — <https://blog.cleancoder.com/> — and <https://sourcemaking.com/> (patterns, refactoring, and the AntiPatterns catalog).

**How to use this file.** The durable principles are distilled here and are binding on every change. Consult the sources directly when you are working in unfamiliar territory or need the full argument behind a rule — not as a fetch before every edit, which would be slow and usually redundant.

## SOLID

| Principle | What it means here | The smell when you break it |
| --- | --- | --- |
| **Single Responsibility** | A module has one reason to change. A `src/lib` function does one business operation; a page component renders and wires events; an `api/<name>.ts` entry point adapts HTTP and nothing else, delegating to its `<name>Handler.ts`. | Divergent Change, Large Class |
| **Open/Closed** | Extend behavior without editing the code that uses it — a new entry in a `Record<Status, …>` lookup or a new component passed as a prop, not another `else if`. | Switch Statements, Shotgun Surgery |
| **Liskov Substitution** | Anything that implements a contract (a prop interface, a handler result shape) must be usable wherever the contract is. Do not reuse a prop to mean something different, throw where the contract returns, or narrow what it accepts. | Refused Bequest |
| **Interface Segregation** | Narrow contracts. A component must not receive a whole object when it reads two fields of it; a consumer must not depend on functions it never calls. Split a fat props interface rather than passing `undefined` to satisfy it. | Refused Bequest, Large Class |
| **Dependency Inversion** | High-level policy depends on abstractions; details depend on the abstraction too. In practice: every external boundary sits behind a module this project owns — Firestore behind the data-access functions in `src/lib/firestore.ts` and `src/lib/use*.ts`, Cloudinary behind `src/lib/cloudinary.ts`, Gemini behind `api/*Handler.ts`, PDF rendering behind `src/lib/*Pdf.tsx`. Components and business logic call those, never the vendor SDK directly. | Inappropriate Intimacy, Vendor Lock-In |

## The Dependency Rule

Source-code dependencies point **inward**, toward policy. Details — the DOM, Firestore, `fetch`, a vendor SDK — depend on business rules; business rules never depend on details.

Concretely in this codebase:

- Pure business logic (`src/lib/quote.ts`, `src/lib/engagement.ts`, `src/lib/format.ts`, …) **must not** import React, `firebase/*`, `fetch`, `window`, or `import.meta.env`. It takes typed arguments and returns typed values. Components and handlers adapt to it and back.
- An `api/*Handler.ts` must not know it is running on Vercel's Edge runtime: it takes the API key and the parsed body and returns `{ status, body }`. The `api/<name>.ts` wrapper and the Vite dev plugin adapt HTTP to it.
- A vendor SDK's types (`DocumentSnapshot`, `Timestamp`, `UploadApiResponse`, Gemini response shapes) must not appear in a signature outside its adapter. `src/lib/firestore.ts` already converts `Timestamp` to ISO strings at the boundary — keep it that way.

**The honest exception:** the Firebase client SDK is called from the browser, and Firestore security rules are the only server-side enforcement on the Spark plan. This project accepts that pages issue Firestore reads and writes through the SDK — there is no backend to hide them behind. The Dependency Rule still holds where it pays: business rules out of components, vendors behind adapters in `src/lib/`, persistence shapes converted by the mappers in `src/lib/firestore.ts` (see [`design-patterns.md`](design-patterns.md)), and **authorization in `firestore.rules`**, never only in the UI.

## The Three Laws of TDD

From Uncle Bob, and the reason the cycle in [`testing.md`](testing.md) is shaped as it is:

1. Write no production code until a failing test demands it.
2. Write no more of a test than is sufficient to fail.
3. Write no more production code than is sufficient to pass the currently failing test.

## Humble Object

Keep code that touches the framework so thin it has no logic worth testing, and put the logic where it can be tested directly. `api/chat.ts` — parse the body, call `handleChatRequest`, serialize the result — is humble; the handler holds the logic and is tested without HTTP. A page component that computes totals, transitions and permissions inline is not; that logic belongs in `src/lib/`.

## Anti-Patterns to Refuse

Catalog names from the published AntiPatterns catalog (Brown, Malveau, McCormick, Mowbray) as reproduced at <https://sourcemaking.com/antipatterns>. Treat each row as a blocking finding.

### Development

| Anti-pattern | How it shows up here | Cure |
| --- | --- | --- |
| **The Blob** (God Class) | A page component (`EngagementDetail.tsx`, `Quotes.tsx`) that owns fetching, validation, business rules, PDF export and every sub-view for a resource | Extract Component / Extract Function along the axis of change |
| **Spaghetti Code** | Deeply nested conditionals in render; logic spread across component, hook, and rules with no boundary | Guard clauses, then extract functions into `src/lib/` |
| **Cut-and-Paste Programming** | The same Firestore query, mapper, or validation copied between pages | Extract Function → a `src/lib` helper or hook (`useFirestoreCollection` exists for exactly this) |
| **Lava Flow** | Dead routes, commented-out blocks, and unreachable branches kept "just in case" | Delete. Git remembers |
| **Golden Hammer** | Every problem becomes a context, an effect, or a new Edge Function, because that is the tool last used | Pick the mechanism the problem calls for |
| **Poltergeists** | Short-lived modules whose only job is to call another module | Inline it |
| **Boat Anchor** | An unused dependency left in `package.json` | Remove it |
| **Input Kludge** | Ad-hoc `as` casts on request bodies or form data instead of a validating type guard (see `isChatMessage` in `api/chatHandler.ts`) — and, for Firestore, trusting client input that `firestore.rules` does not check | A type guard at the boundary; key allowlists and type checks in the rules |
| **Functional Decomposition** | Modules that are bags of unrelated helpers with no domain | Group by domain, or use plain functions honestly |
| **Dead End** | Patched or forked vendor code | Wrap it in an Adapter. Never edit `node_modules/` |
| **Walking through a Minefield** | Shipping code no test exercises | See [`testing.md`](testing.md) |
| **Continuous Obsolescence** | Upgrading dependencies with no reason and no test coverage to catch the fallout | Upgrade deliberately, with approval |

### Architecture

| Anti-pattern | How it shows up here | Cure |
| --- | --- | --- |
| **Reinvent the Wheel** | Hand-rolling a singleton, event bus, observer, or router that ES modules, Firebase, or React Router already provide | Use the platform — see [`design-patterns.md`](design-patterns.md) |
| **Swiss Army Knife** | One module or hook that does everything for a subsystem | Interface Segregation; split by consumer |
| **Vendor Lock-In** | Firebase, Cloudinary, or Gemini types spread through components and business logic | Adapter at the boundary |
| **Architecture by Implication** | Building without stating the structure, so every developer invents their own | Write the decision into `CLAUDE.md` — see [`documentation.md`](documentation.md) |
| **Design by Committee** | An abstraction specified for every imagined case and used by one caller | Collapse it. Speculative Generality |
| **Stovepipe System** | An integration built so specifically that nothing else can reuse it | Extract the reusable boundary |
| **Cover Your Assets** | Documentation and code that hedge instead of deciding | State the decision and its constraint |

Project-management anti-patterns from the same catalog are out of scope for these rules.

## Before You Implement

Working in an area you have not touched before — a new subsystem, an unfamiliar integration, a structural decision — consult the sources above before choosing a shape. Then record the decision per [`documentation.md`](documentation.md) so the next person does not have to re-derive it.
