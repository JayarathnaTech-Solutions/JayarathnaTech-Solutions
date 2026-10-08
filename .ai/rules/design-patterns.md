# Design Patterns in React, TypeScript and Firebase

Catalog reference: <https://refactoring.guru/design-patterns/catalog>. This file is the project's verdict on each pattern — read it before introducing one.

## The First Question

**Does React, Firebase, ES modules, or the browser already implement this?** For most of the Gang of Four catalog the answer is yes, and the platform's version is the correct one. Hand-rolling a Singleton, Mediator, Observer, or Iterator in a React + Firebase app is a defect, not a design decision.

## Creational

| Pattern | Here | Verdict |
| --- | --- | --- |
| **Singleton** | An ES module is evaluated once; `src/firebase/config.ts` exports the one `app`, `auth` and `db` | **Use module scope.** Never write a `getInstance()` class or a mutable static. The one deliberate second instance is `src/firebase/secondaryApp.ts`, a *named* Firebase app that exists so creating a customer doesn't replace the admin's session — keep that reasoning in its comment. |
| **Factory Method** | A plain function, or a `Record<Key, () => T>` lookup | **Use for runtime-chosen implementations** (PDF by document type, upload preset by purpose). A lookup object beats a `switch` in a factory function. |
| **Abstract Factory** | — | **Refuse by default.** Families of related objects are rare in a web app. Config plus plain functions covers the real cases. |
| **Builder** | — | **Rarely write your own.** Prefer a typed object literal passed in one call. A builder is justified only when construction is genuinely stepwise and order-dependent. |
| **Prototype** | Object spread, `structuredClone` | **Use the language's.** Watch that a spread copy shares nested arrays (sprints, phases, line items) — copy what you mutate. |

## Structural

| Pattern | Here | Verdict |
| --- | --- | --- |
| **Adapter** | `src/lib/cloudinary.ts`, `src/lib/firestore.ts` mappers, `api/*Handler.ts` (Gemini), `src/lib/*Pdf.tsx` (@react-pdf), `src/lib/analytics.ts` | **The most valuable structural pattern here.** Wrap every third-party SDK or HTTP API behind your own module so the vendor type never leaks into components or business logic, and so tests can fake it. |
| **Bridge** | — | **Refuse by default.** Almost always speculative generality in an application codebase. |
| **Composite** | The React component tree | **Use for genuine trees** — nested menus, sprint → phase lists. Recursive components with a shared props interface. |
| **Decorator** | Wrapper components (`RequireAuth`, `RequireCustomerAuth`, `ErrorBoundary`), custom hooks wrapping hooks | **Good pattern, use React's composition.** Wrap with a component or a hook; do not monkey-patch modules. |
| **Facade** | A `src/lib` module fronting a messy subsystem (e.g. `customerProvisioning.ts` over Auth + Firestore) | **Fine — this is the GoF Facade.** One simple function in front of a multi-step flow. |
| **Flyweight** | — | **Refuse.** Memory-sharing micro-optimization with no place in this app. |
| **Proxy** | `firestore.rules` for access control; route guards for navigation | **Use the platform's.** A hand-written access-control proxy in the client is not security; the rules are. |

## Behavioral

| Pattern | Here | Verdict |
| --- | --- | --- |
| **Strategy** | A function or component passed as a prop; a `Record<Status, …>` lookup | **The most valuable behavioral pattern here.** The standard cure for a `switch` on a type code. |
| **Chain of Responsibility** | Nested route guards in `App.tsx` | **Use the router's nesting.** Never hand-roll a linked list of handlers. |
| **Command** | Event handlers; `src/lib` operations like `createCustomerAccount` | **Already the house style.** A discrete business operation becomes a named `src/lib` function — do not invent a `Command` class hierarchy. |
| **Observer** | `onSnapshot`, `onAuthStateChanged`, React state and context | **Use the platform's.** Never write your own event emitter. Every subscription is unsubscribed in the effect's cleanup — see [`realtime.md`](realtime.md). |
| **Mediator** | React context (`AuthContext`, `CustomerAuthContext`), lifting state to a common parent | **Use context or lifting.** A hand-written mediator object is a god object with a polite name. |
| **Iterator** | Array methods, generators, `src/lib/chunk.ts` | **Use the language's.** Writing an `Iterator` class to page a result set is reinventing a loop. |
| **State** | Engagement status (`pending_advance → in_progress → delivered`), invoice status | **Use when transitions carry rules.** Here the transitions are enforced in `firestore.rules` (`engagementStatusTransitionAllowed()`); the client mirrors them in `src/lib/engagement.ts`. Never scatter `if (status === …)` across components. |
| **Template Method** | — | **Use sparingly.** Prefer composition, hooks, and render props over a shared skeleton. |
| **Memento** | — | **Narrow use.** Only for real snapshot/undo/versioning needs (a draft quote, a form reset). |
| **Visitor** | — | **Refuse by default.** Justified only for operations over a stable, closed structure (e.g. walking a markdown AST). Not for domain types. |

## Data Access (Required)

Every Firestore collection that the app reads gets a mapper in `src/lib/firestore.ts` (`<name>FromDoc`) that converts the snapshot into this project's interface, and every repeated query or write gets a named function or hook in `src/lib/` (`createContactMessage`, `useFirestoreCollection`, `useEngagementDetail`, …). This is the project's persistence boundary — the role a Repository plays in a server codebase. Firebase does not supply it itself, which is why it gets a house rule here instead of a catalog verdict.

- **Segregate by consumer.** One growing `firestore.ts` is not a waiver against Interface Segregation (see [`architecture-principles.md`](architecture-principles.md)) — when a domain's access grows, split it into its own module rather than exporting thirty functions from one file.
- **The data-access function owns query construction** — collection path, `where`, `orderBy`, `limit`, batching with `chunk`. Components depend on the function or hook, never on `collection()`/`query()` directly. Existing pages still call the SDK directly; new code does not (see `Known gaps` in `AGENTS.md`).
- **Return this project's types**, never `DocumentSnapshot` or `Timestamp`. Convert timestamps to ISO strings at the boundary, as the existing mappers do.
- **Location:** mappers in `src/lib/firestore.ts`; hooks in `src/lib/use<Name>.ts`; the interfaces they return in `src/types/`.
- **`I` prefix for new interfaces, the same convention as everywhere else in TypeScript** (see [`typescript.md`](typescript.md)).

## Rules of Application

- **Two callers, not one.** Introduce a pattern on the second concrete use case, or when a test is otherwise impossible to write. Never on the first, and never "for future flexibility." The data-access requirement above is the project's standing exception: it applies from the first collection, because it is the persistence boundary, not a speculative one.
- **One pattern per problem.** Do not stack a Factory that builds a Strategy wrapped in a Decorator unless every layer earns itself independently.
- **Depend on your own modules only at boundaries.** Firestore, Cloudinary, Gemini, Web3Forms, PDF rendering and analytics each sit behind one `src/lib` (or `api/`) module. Do not invent extra layers inside those modules.
- **Name by domain, not by pattern.** `invoicePdf.tsx`, `uploadImage`, not `PdfGeneratorFactory`. Exceptions: conventions React establishes (`use…`, `…Context`, `…Provider`), the `Require…` route-guard components, and the `I`-prefix for interfaces.

## Platform-Specific Notes

This is a client-rendered SPA on Firebase's Spark plan, with no server of its own beyond `firestore.rules` and the stateless functions in `api/` — which narrows the useful set:

- Response shaping belongs in the `src/lib/firestore.ts` mappers, not in a pattern of your own.
- Validation belongs in a type guard at the boundary (client forms, `api/` handlers) **and** in `firestore.rules`. A "validator strategy" class is over-engineering.
- Authorization belongs in `firestore.rules` and, for UI flow only, the `Require…` guards and `AdminLayout` redirects. A hand-rolled Proxy or Chain for access control duplicates them.
