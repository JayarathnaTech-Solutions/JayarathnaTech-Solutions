# TypeScript — Types and Interfaces

Applies to **all TypeScript in JayarathnaTech Solutions**: `src/`, `api/`, `vite.config.ts`, and test files.

## Location

**Every interface lives in `src/types/`.** Not beside the component, not inside a hook, not in a feature area.

```
src/types/
├── engagement.ts   # Engagement, Sprint, Phase, EngagementStatus, PhaseStatus
├── invoice.ts      # Invoice, InvoiceFeeLineItem, InvoiceType, InvoiceStatus, PaymentMethod
├── staff.ts        # StaffMember, StaffPersonalInfo, StaffRole
├── currency.ts     # Currency — shared by quote, engagement and invoice
├── …               # blog, chat, company, contact, customer, project, quote, settings, testimonial
└── index.ts        # barrel: `export type * from './<domain>'` per file
```

- Group interfaces by domain, one file per domain, named after it in camelCase.
- Re-export everything from `index.ts` with `export type * from './<domain>'`, so consumers import from one place: `import type { Engagement } from '../types'`. Never import a domain file directly.
- A new domain gets its own file and a line in `index.ts`; a domain file imports another domain's types with `import type` (as `quote.ts` imports `Currency`).
- Shared component prop interfaces, when a second component needs one, go in `props.ts`.
- Import interfaces with `import type`, always. They are erased at build time and a value import can create a cycle. (`verbatimModuleSyntax` is on, so the compiler enforces this.)

**`api/` is the exception to the location rule**: Edge Function handlers are also loaded by `vite.config.ts`, so they import only `src/` modules that never read `import.meta.env` (today just `src/lib/siteInfo.ts`). Their request/response interfaces (`ChatMessage`, `QuoteAiResult`) stay in the handler file that owns the contract.

**The known cost:** colocating prop interfaces with their component is the more common convention, and centralizing them means a component and its props sit in different files. This project centralizes anyway — it is a deliberate choice for one obvious home, not an oversight. Do not "fix" it by moving interfaces back next to their components.

There is no `src/utility/` or `src/utils/`; shared functions live in `src/lib/`.

## Interfaces Only

**Declare every object shape as an `interface`.** Do not use a `type` alias for an object shape, and do not use inline object literal types in a signature.

```ts
// Correct
interface IProject {
  id: string;
  title: string;
}

// Wrong — type alias for an object shape
type Project = {
  id: string;
  title: string;
};

// Wrong — inline object literal in a signature
const NavList = ({ role, onNavigate }: { role: StaffRole; onNavigate?: () => void }) => {};
```

This is contrary to the TypeScript handbook, which treats the two as interchangeable for object shapes. It is this project's convention regardless — **do not "correct" an interface into a type alias.** Many existing components still declare props inline; new and changed components use a named props interface.

### Where `type` Is Still Required

TypeScript cannot express these as an interface. This list is closed — anything not on it must be an interface.

| Case | Example |
| --- | --- |
| Union types | `type EngagementStatus = 'pending_advance' \| 'in_progress' \| 'delivered';` |
| Function and callback types | `type Formatter = (value: number) => string;` |
| Tuple types | `type Coordinate = [number, number];` |
| Mapped, conditional, and utility-derived types | `type PartialProject = Partial<IProject>;` |
| Types derived from a value | `type SiteContact = typeof siteContact;` |

**Prefer to avoid the case entirely where you can.** A small union used by one property belongs inline on that property, not in a named alias:

```ts
interface IUploadState {
  status: 'idle' | 'uploading' | 'done' | 'failed';
}
```

Name a union only when two or more places genuinely need it — the same "two real callers" rule as [`index.md`](index.md). `StaffRole`, `EngagementStatus` and `InvoiceStatus` are shared by components, `src/lib` and tests, so they are correctly named.

## Naming

**Every interface starts with a capital `I`**, followed by PascalCase: `IProject`, `IEngagement`, `IButtonProps`.

- Component props: `I<ComponentName>Props` — `IChatThreadProps` for `ChatThread`.
- Context values: `I<Name>ContextValue` — `IAuthContextValue`.
- Global state, if ever added: `I<SliceName>State` — see [`redux.md`](redux.md).
- API payloads: `I<Name>Request` / `I<Name>Response`.
- The `I` prefix applies to interfaces only. A `type` alias from the table above takes no prefix.

**The existing interfaces predate this rule** (`StaffMember`, `Engagement`, `Invoice`, …). New interfaces use the prefix; renaming the existing ones is one dedicated, behavior-neutral refactoring commit, not a piecemeal rename inside feature work.

Many style guides — including the TypeScript handbook — advise against Hungarian prefixes. This project uses one anyway. Marked here so it is not stripped by a future agent or a linter rule.

## Rules

- **No `any`.** Use `unknown` and narrow it (as the `api/` handlers and `toIsoString` do). If a vendor type forces `any`, isolate it at the boundary and convert immediately.
- **No implicit `any`.** `strict` is **not** enabled in `tsconfig.app.json`, `tsconfig.node.json` or `api/tsconfig.json` yet — a known gap. Write code that would compile under `strict` so turning it on is cheap.
- **Do not duplicate an interface** to avoid an import. Extend it, or use a utility type.
- **Interfaces describe data, not behavior you have not built.** An interface with one implementer and no second caller is speculative generality.
- **Firestore types stop at the boundary.** `DocumentData`, `DocumentSnapshot` and `Timestamp` appear only in `src/lib/firestore.ts` and data-access hooks; everything else uses this project's interfaces with ISO-string dates.
