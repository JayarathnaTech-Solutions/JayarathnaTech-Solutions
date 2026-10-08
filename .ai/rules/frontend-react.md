# React and React Native

Sources: <https://react.dev/learn> (normative for React), <https://github.com/alan2207/bulletproof-react> (architecture), <https://www.reactnativeschool.com/> (React Native practice, if a mobile app is ever added).

## Status in This Repository

**JayarathnaTech Solutions is one Vite + React 19 single-page app at the repository root** — not a monorepo, and not separate apps. Three route trees in `src/App.tsx` share one bundle:

- the **public site** (`src/pages/`, wrapped in `PublicLayout`);
- the **admin dashboard** (`src/admin/`, served only on the `admin.` subdomain, guarded by `RequireAuth`);
- the **customer portal** (`src/portal/`, guarded by `RequireCustomerAuth`).

These rules bind all three. The React Native sections below apply only if a mobile app is added later; nothing in this repository is React Native today.

## Read Before Implementing

- **<https://react.dev/learn>** is the authority for React. Where an older tutorial, a blog post, or a memory of class components conflicts with it, react.dev wins.
- **<https://github.com/alan2207/bulletproof-react>** is the authority for structure and import direction. This project maps its ideas onto the existing folders below rather than adopting its folder names.
- **<https://www.reactnativeschool.com/>** for React Native specifics, if a mobile app is ever started.

## Project Structure

Bulletproof-react's layers, mapped onto this repository:

```
src
├── App.tsx, main.tsx  # application layer: routes, providers, root component
├── admin/             # feature area — admin dashboard (pages/, components/, auth hooks + context)
├── portal/            # feature area — customer portal (pages/, components/, auth hooks + context)
├── pages/             # feature area — public site pages
├── assets/            # static files (images)
├── components/        # shared components
├── content/           # static content (blog metadata + markdown)
├── firebase/          # Firebase SDK init — the configured app, auth and db
├── lib/               # shared logic, hooks, data access, external-service adapters
├── types/             # every interface — see typescript.md
└── test/              # tests and their support code — see frontend-testing.md
```

**Tests and their helpers are not beside the code.** They live in `src/test/` (`unit/`, `rules/`, `support/`) — see [`frontend-testing.md`](frontend-testing.md).

A feature area owns its own subtree:

```
src/admin/
├── pages/        # one component per route
├── components/   # components only this area uses
├── AdminLayout.tsx, RequireAuth.tsx
└── useAuthStatus.ts, AuthContext.ts, useDevelopers.ts   # this area's hooks and context
```

**Deliberate departures from bulletproof-react:**

- The three route trees *are* the feature modules; there is no `src/features/` folder. Do not restructure toward one.
- Shared code lives in `src/lib/` (logic, hooks, adapters, data access) and `src/components/` (UI); there is no separate `hooks/`, `config/`, `utils/` or `utility/` folder.
- Interfaces live in `src/types/` — see [`typescript.md`](typescript.md).
- Global state is React context, not a store folder — see [`redux.md`](redux.md) for when that changes.

**Default to putting code in a feature area.** Promote something to `src/components/` or `src/lib/` only when a second area actually needs it — the same "two real callers" rule as [`index.md`](index.md). `ChatThread` (used by both admin and portal engagement pages) is the model case.

## Unidirectional Imports

The dependency flow is **shared → feature areas → app**, and it is enforced, not merely encouraged:

- Shared modules (`components/`, `lib/`, `firebase/`, `types/`, `content/`, `assets/`) may be imported by anything.
- A feature area (`pages/`, `admin/`, `portal/`) may import from shared modules only.
- `App.tsx` / `main.tsx` may import from feature areas and shared.

Forbidden, without exception:

- A feature area importing from `App.tsx` or `main.tsx`.
- A shared module importing from a feature area or from the app layer.
- **A feature area importing from another feature area** — `admin/` ↔ `portal/` ↔ `pages/`. Two areas that need each other's code have a shared concern — lift it into `src/components/` or `src/lib/`.

The codebase currently follows this. Enforce it with ESLint rather than review — the built-in `no-restricted-imports` covers it without a new dependency (bulletproof-react's `import/no-restricted-paths` would need `eslint-plugin-import`, which needs approval):

```js
{
  files: ['src/admin/**'],
  rules: { 'no-restricted-imports': ['error', { patterns: ['**/portal/**', '**/pages/**', '**/App'] }] },
},
{
  files: ['src/portal/**'],
  rules: { 'no-restricted-imports': ['error', { patterns: ['**/admin/**', '**/pages/**', '**/App'] }] },
},
{
  files: ['src/pages/**'],
  rules: { 'no-restricted-imports': ['error', { patterns: ['**/admin/**', '**/portal/**', '**/App'] }] },
},
{
  files: ['src/components/**', 'src/lib/**', 'src/firebase/**', 'src/types/**'],
  rules: { 'no-restricted-imports': ['error', { patterns: ['**/admin/**', '**/portal/**', '**/pages/**', '**/App'] }] },
},
```

Not yet in `eslint.config.js` — listed under `Known gaps` in `AGENTS.md`. This is the frontend expression of the Dependency Rule in [`architecture-principles.md`](architecture-principles.md).

## React Rules

Non-negotiable, from react.dev:

- **Components are pure functions of their props and state.** No mutation of props, no side effects during render, no reading or writing shared state while rendering. The same inputs render the same output.
- **Hooks only at the top level** of a component or another hook. Never inside a condition, loop, or nested function. If you want a hook inside a condition, extract a component.
- **Keys must be stable identities** — a Firestore doc id, a slug — not array indices. An index key corrupts state when items are inserted, removed, or reordered.
- **Lift state to the closest common parent** when two components need it. Do not duplicate it and try to keep the copies in sync.
- **Effects are an escape hatch for synchronizing with external systems** (a Firestore listener, `onAuthStateChanged`, a timer), not a general-purpose "run some code" tool. Do not use an effect to derive state from props — compute it during render. Do not use one to respond to a user event — do that in the handler.
- **Do not reach for global state before the app demonstrably needs it.** Local state and lifting cover most of it; auth is the one global concern today and lives in `AuthContext` / `CustomerAuthContext`. When state genuinely spans areas, see [`redux.md`](redux.md).

## Function Style

**Every function is an arrow function assigned to a `const`.** This applies to components, hooks, event handlers, helpers, test helpers and object methods, in `src/`, `api/` and `jest/`. There is no `function` keyword in new code, as a declaration or an expression, and no method shorthand in an object literal.

```tsx
// Correct
export const LoginForm = ({ onDone }: ILoginFormProps) => {
  const handleSubmit = () => { /* ... */ };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
};

// Wrong
export function LoginForm({ onDone }: ILoginFormProps) { /* ... */ }
function handleSubmit() { /* ... */ }
const api = { load() { /* ... */ } };
```

react.dev writes components as function declarations, and **so does most of the existing code in this repository** — it predates this rule. New and changed functions use arrow functions; converting existing files is a separate, behavior-neutral refactoring commit, never mixed into a feature change. Do not "correct" an arrow function back into a declaration.

- **A default export is a separate statement**: `const App = () => { /* ... */ };` then `export default App;`.
- **A generic arrow in a `.tsx` file needs a trailing comma** (`<TValues,>() => …`), or TSX parses `<TValues>` as a JSX tag. A `.ts` file does not.
- **A `const` is not hoisted.** Declare a helper before any top-level code that *calls* it while the module loads. Calling it from inside another function that runs later is fine, so a private helper may still sit below the component that uses it.
- **An object whose arrow method returns the object itself needs an explicit interface.** With method shorthand TypeScript could infer it; an arrow property referencing its own initializer falls back to implicit `any`.
- **The only exception is class syntax the platform or a library requires**: React error boundaries (`ErrorBoundary` — there is no hook equivalent), custom `Error` subclasses (`CustomerAlreadyExistsError`), the Jest environment in `jest/jsdom-environment.cjs`, and browser-API fakes that are constructed with `new` (`MockIntersectionObserver` in `src/test/setup.ts`).

ESLint should enforce this with `no-restricted-syntax` on `FunctionDeclaration` and `FunctionExpression`; that is not configured yet (known gap), because the existing code would fail it until converted.

## React Native

Applies only if a React Native app is added to this project. Everything above applies there too. In addition:

- Check platform behavior before assuming parity: layout, gestures, keyboard handling, safe areas, and permissions differ between iOS and Android. Test both.
- Use `FlatList`/`SectionList` with a stable `keyExtractor` for any list that can grow. Never `map()` a large array into views.
- No web-only APIs — `window`, `document`, `localStorage`, CSS files. Use the platform equivalents.
- Navigation state is app-level and belongs in the app layer, not inside a feature.

## Data Layer

- **Firestore through the Firebase SDK, HTTP through `fetch`.** No axios or other HTTP library. Full rules in [`api-client.md`](api-client.md).
- No Firestore query construction, request call, or URL literal inside a component in new code. A component calls a hook or a `src/lib` function and renders what it returns. (Several existing pages still query Firestore or call `fetch` inline — a known gap.)
- **Data access lives in `src/lib/`** — mappers in `src/lib/firestore.ts`, hooks in `src/lib/use*.ts`, external services in their own module (`cloudinary.ts`). See [`design-patterns.md`](design-patterns.md).
- Handle loading, empty, error and permission-denied states explicitly; surface validation errors against the right inputs.
- Firebase Auth manages its own session persistence. Never copy an ID token into `localStorage` yourself, and never commit one.
- **Authorization is enforced by `firestore.rules`.** UI guards (`RequireAuth`, `AdminLayout` role redirects, nav `visibleTo`) are for flow only; every one must be backed by a rule.

## Testing

**[`frontend-testing.md`](frontend-testing.md) is the authority, and it binds before the first line of a new component.** Test first with Jest and React Testing Library, Arrange-Act-Assert with one act per test, and walk its edge-case table — loading, empty, error, and unauthorized states are required cases, not optional extras. Test behavior through the rendered component as a user experiences it, never implementation details.

Jest is already set up (`npm test`). A component whose first test arrives after it ships has already abandoned TDD.
