# Refactoring

Catalog reference: <https://refactoring.guru/refactoring/catalog>. Consult the site for the language-agnostic explanation of any named technique; this file covers when each one applies here and the discipline around it.

## Discipline

Non-negotiable, in order:

1. **Green tests first.** If the code you are about to restructure has no test, write one that pins current behavior *before* you touch it. Refactoring without a safety net is rewriting.
2. **Refactoring never changes behavior.** If the output changes, it is not a refactoring — it is a change, and it needs its own justification and its own tests.
3. **Separate the commits.** Never mix a rename or an extraction into a commit that also changes what the code does. A reviewer must be able to read a refactoring commit as a no-op. This includes bringing pre-rule code in line with these rules (arrow functions, `I`-prefixed interfaces, moving queries out of components).
4. **Smallest technique that resolves the smell.** Reach for Extract Function long before Extract Module, and Extract Module long before a new abstraction layer.
5. **Run the narrowest tests after each step**, not once at the end. `npx jest src/test/unit/Thing.test.tsx -t 'behavior'`.
6. **Run `npm run lint` and `npx tsc -b`** before finishing any TypeScript change.

## Techniques That Carry Their Weight Here

Grouped by the catalog's categories. These are the ones that come up repeatedly in a React + Firebase codebase.

### Composing Methods

- **Extract Function** — the default cure for Long Method and for a comment explaining a block. The single most-used technique; reach for it first. In a component, its sibling is **Extract Component**.
- **Extract Variable** — name an inscrutable sub-expression, especially inside a compound condition or a JSX conditional.
- **Replace Temp with Query** — prefer a derived value computed during render (or a `src/lib` helper) over a piece of state kept in sync by an effect.
- **Replace Method with Method Object** — when a handler has so many locals that Extract Function cannot get traction. In this codebase, that object is a **custom hook** or a `src/lib` operation.
- **Substitute Algorithm** — swapping a hand-rolled loop for array methods is this, and needs a test pinning the old behavior.

### Moving Features between Objects

- **Move Function** — the cure for Feature Envy. Behavior about a domain type belongs in its `src/lib` module (`engagement.ts`, `quote.ts`); orchestration with side effects belongs in a named operation or hook.
- **Extract Module / Extract Component** — the cure for Large Class, Divergent Change, and Data Clumps. Split along the axis of change, not alphabetically.
- **Hide Delegate** — the cure for Message Chains. Also removes repeated deep property access in render.
- **Inline Function** / **Remove Middle Man** — the cure for a lazy wrapper. Deleting a layer is a refactoring too, and usually the most valuable one.

### Organizing Data

- **Replace Magic Number with Symbolic Constant** — or a config value, or a union member. No bare literals in business rules (deposit percentage, size limits, model names).
- **Replace Type Code with Class / with Subclasses / with State-Strategy** — the escalation path out of a status string. Start with a **string-literal union** plus a `Record<Status, …>` lookup; graduate further only once transitions carry rules (and remember the rules that matter live in `firestore.rules`).
- **Replace Data Value with Object** — the cure for Primitive Obsession. In TypeScript this is an interface (money + currency, address).
- **Encapsulate Collection** — do not hand out a mutable array of children; expose intent-revealing functions, and never mutate state arrays in place.

### Simplifying Conditional Expressions

- **Replace Nested Conditional with Guard Clauses** — apply on sight. Deeply indented happy-paths are the most common readability defect in handlers and in `api/*Handler.ts`.
- **Decompose Conditional** — extract the condition and each branch into named functions or components.
- **Consolidate Conditional Expression** — collapse several checks that all produce the same result.
- **Replace Conditional with Polymorphism** — the cure for repeated `switch` on a type code. Lands as a lookup object or a Strategy; see [`design-patterns.md`](design-patterns.md).
- **Introduce Null Object** — use sparingly. Optional chaining and an explicit empty state are usually clearer in TypeScript and React.

### Simplifying Method Calls

- **Rename Function** — a name that lies is a defect. Rename freely under green tests.
- **Introduce Parameter Object** — the cure for Long Parameter List and Data Clumps. A single typed object argument.
- **Preserve Whole Object** — pass the domain object, not six of its fields (but see Interface Segregation for props).
- **Separate Query from Modifier** — a function that returns a value must not also cause a side effect. Especially important in `src/lib` operations and hooks.
- **Replace Error Code with Exception** — return types say what succeeded; thrown errors (like `CustomerAlreadyExistsError`) say what failed. Do not return `false` to mean "denied".

### Dealing with Generalization

- **Extract Interface** — only at a boundary, and only with a second implementation or a test that needs a fake. Not for one implementation.
- **Extract Superclass** / **Pull Up Method** — avoid; React favors composition, and class components are not used here.
- **Replace Inheritance with Delegation** — the default in React: compose components and hooks.
- **Collapse Hierarchy** — the cure for Speculative Generality. A generic component with one caller should be that caller's component.

## Techniques to Avoid Here

- **Introduce Foreign Method / Introduce Local Extension** on vendor code — wrap it in an Adapter instead. Never patch anything under `node_modules/`.
- **Change Value to Reference** and the bidirectional-association refactorings — Firestore documents reference each other by id (and rules depend on those ids, such as `advanceInvoiceId`); do not introduce in-memory object graphs that must be kept in sync.
- **Self Encapsulate Field** on plain data interfaces — keep them plain data; put behavior in `src/lib` functions.
- **Duplicate Observed Data** — use a Firestore listener or lift state; do not keep two copies of server data in sync by hand.

## Before You Call It Done

- Re-read the diff against [`code-smells.md`](code-smells.md): did you introduce a new smell while curing the old one?
- Confirm nothing under `node_modules/` changed, and `package.json` did not change unless the change was approved.
- Confirm the refactoring commit is behavior-neutral and separate from any behavior change.
