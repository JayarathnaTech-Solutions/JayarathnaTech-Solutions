# Code Smells — React and Firebase Manifestations

Catalog reference: <https://refactoring.guru/refactoring/smells>. A smell is a **trigger**, not a verdict. Name the smell, then apply the matching technique from [`refactoring.md`](refactoring.md).

**If you cannot name a concrete smell in the code you are touching, you do not have a refactoring justification.** Write the straightforward code and move on.

## Bloaters

| Smell | How it shows up here | Cure |
| --- | --- | --- |
| **Long Method** | An event handler that validates, checks permissions, writes to Firestore, uploads to Cloudinary, and sets five pieces of state | Extract Function; move the business operation to `src/lib/` |
| **Large Class** | The fat page component — every concern for a resource in one file (fetching, forms, tables, dialogs, PDF export) | Extract Component; move data access to a hook, business rules to `src/lib/` |
| **Primitive Obsession** | `status: string`, a money amount as a bare `number` with the currency elsewhere, an address as loose strings | Replace Data Value with Object; a string-literal union for status (as `EngagementStatus` already is), an interface for money and addresses |
| **Long Parameter List** | `createThing(name, email, plan, trialDays, referrer, ...)` | Introduce Parameter Object — a single typed object argument (as `createCustomerAccount({ … })` does) |
| **Data Clumps** | The same three or four fields travelling together through several props or signatures | Extract interface / Introduce Parameter Object |

## Object-Orientation Abusers

| Smell | How it shows up here | Cure |
| --- | --- | --- |
| **Switch Statements** | A `switch`/ternary chain on a status or role, repeated in more than one component | Replace Conditional with Polymorphism → a `Record<Status, …>` lookup (see `engagementStatusLabels`) or a Strategy |
| **Temporary Field** | A `useState` or module variable set only during one operation | Make it a local or a function parameter |
| **Refused Bequest** | A component accepting a broad props interface and using almost none of it | Narrow the props; Replace Inheritance with Delegation |
| **Alternative Classes with Different Interfaces** | Two upload or PDF helpers doing the same job with different signatures | Extract Interface; align the signatures |

## Change Preventers

| Smell | How it shows up here | Cure |
| --- | --- | --- |
| **Divergent Change** | One file edited for unrelated reasons — billing changes *and* chat changes touch the same component | Extract Component / Module along the axes of change |
| **Shotgun Surgery** | Adding one Firestore field means editing the type, the mapper, the rules key allowlist, two pages, and three tests by hand with nothing tying them together | Move Field / Extract Module to pull the concept into one place; keep type + mapper + rules + rules test changing together |
| **Parallel Inheritance Hierarchies** | Every new role forces a new `isX()` rules function *and* a new nav entry *and* a new redirect | Collapse into a single data-driven definition where the platform allows it |

## Dispensables

| Smell | How it shows up here | Cure |
| --- | --- | --- |
| **Duplicate Code** | The same Firestore query or mapping written in several pages | Extract Function → a `src/lib` hook (`useFirestoreCollection`) or mapper |
| **Dead Code** | Unused routes, components, exports, commented-out blocks | Delete it. Git remembers |
| **Speculative Generality** | An interface with one implementation; an env flag nothing reads; a generic component with one caller | Inline / Collapse. **Do not write it in the first place** |
| **Lazy Class** | A module that only forwards one call | Inline it |
| **Data Class** | A type with no behavior while every rule about it lives in components | Move Function — put the rules beside the type in `src/lib/` (as `engagement.ts` does for engagements) |
| **Comments** | A comment explaining *what* a confusing block does | Extract Function with a name that says it. Keep comments that explain *why* — this codebase relies on them for platform quirks |

## Couplers

| Smell | How it shows up here | Cure |
| --- | --- | --- |
| **Feature Envy** | A component reaching deep into an engagement's sprints and invoices to compute its progress | Move Function into `src/lib/engagement.ts` |
| **Message Chains** | `engagement.sprints[engagement.currentSprint].phases.find(...).status` repeated in render | Hide Delegate — a named helper |
| **Middle Man** | A module whose functions forward one-for-one to another with no narrowing, translation, or added behavior. **A data-access function is not Middle Man**; see below | Remove Middle Man; call the wrapped function directly |
| **Inappropriate Intimacy** | The portal reaching into admin-only modules, or a component mutating another feature's state | Move Function, or lift the shared concern into `src/lib/` or `src/components/` |
| **Incomplete Library Class** | A vendor SDK missing what you need | Wrap it in an Adapter. Never patch `node_modules/` |

### The Data-Access Function Is Not a Middle Man

A function in `src/lib/firestore.ts` whose whole body is one Firestore call plus a mapper is doing its job. The forwarding is not the point — the boundary is: it converts SDK types (`Timestamp`, `DocumentSnapshot`) into this project's interfaces, it is the one place a collection's shape is known, and it is the seam tests mock. Three requirements make it a boundary rather than a pass-through, full rules in [`design-patterns.md`](design-patterns.md):

- **It returns this project's types, never SDK types** — `Engagement`, not `DocumentSnapshot<DocumentData>`. New interfaces carry the `I` prefix per [`typescript.md`](typescript.md).
- **It is segregated by consumer** — Interface Segregation. A page that needs one query must not import a module exposing thirty. Split by domain rather than growing one file forever.
- **It owns the query** — collection path, `where`, `orderBy`, `limit`, and the mapper live inside it. A component assembling a query and handing it over has put the detail back on the wrong side of the boundary.

## React- and Firebase-Specific Smells

Not in the general catalog, but treat each as a blocking finding in this codebase:

- **N+1 reads** — a `getDoc` per item inside a loop or per row of a list. Batch with an `in` query (chunked with `src/lib/chunk.ts`, Firestore caps `in` at 30) or denormalize. This is the most common real cost and latency defect on Firestore.
- **Business logic in render or in a JSX event handler** — move it to `src/lib/`.
- **`import.meta.env` read outside an env-reading module** — and never in any module reachable from `vite.config.ts` (it crashes `vite build`; see `src/lib/signature.ts`).
- **Validation only in the UI** — anything a malicious client could skip must also be in `firestore.rules`.
- **Writing unfiltered form state to Firestore** — build the document explicitly; the rules' key allowlists (`hasOnly`) must match.
- **Query logic inside a component's render** — the query belongs in a hook or data-access function.
- **An effect that derives state from props or responds to a user event** — compute during render, or do it in the handler (react.dev).
- **A listener without cleanup** — every `onSnapshot` / `onAuthStateChanged` returns its unsubscribe from the effect. See [`realtime.md`](realtime.md).
