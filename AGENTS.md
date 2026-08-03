# AGENTS.md

## Project

JayarathnaTech Solutions agency website: a public marketing site (Home, About, Services,
Projects, Contact, Testimonials) plus a guarded admin dashboard (project/testimonial/quote/
staff management). This is **one single-page app**, not a monorepo — "client side" and
"admin side" are route segments (`/` vs guarded `/admin/*`) within the same React app, not
separate deployable projects.

`PLAN.md` is the single source of truth for scope and progress — it holds the locked-in
architecture decisions, assumptions, open risks, and a numbered, checkbox-tracked feature
list. Read it before starting work, and check off boxes there as features land instead of
tracking progress elsewhere.

## Tech stack

- **React 19** + **TypeScript**, built with **Vite 8**
- **Tailwind CSS 4** via the `@tailwindcss/vite` plugin — mobile-first
- **React Router 8** — public routes open, `/admin/*` guarded by `RequireAuth`
- **Firebase** — Auth (Google sign-in only, admin-invited, no self-signup) + Firestore
  only. **Spark (free) tier — no Cloud Functions**; all logic lives in the client +
  Firestore security rules. Project: `jayarathnatech-solutions`
- **No Firebase Storage** — Google requires the Blaze (paid) plan to enable Cloud
  Storage on projects created after Oct 2024, and we're staying on Spark. File
  uploads (project cover images) go through **Cloudinary**'s free tier instead
  (unsigned client-side uploads — no backend needed). See PLAN.md step 10.
- **Hosting**: Vercel for the app; not yet connected
- **Vitest + React Testing Library + `@firebase/rules-unit-testing`** for tests, run
  against the Firebase Local Emulator Suite

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint
- `npm run preview` — preview a production build
- `npm test` — run the test suite once (Vitest)
- `npm run test:watch` — Vitest in watch mode
- `npm run emulators` — start the Firebase Local Emulator Suite (Auth :9099,
  Firestore :8080, Emulator UI :4000). Requires a JRE on PATH for the Firestore
  emulator.

## Code style

- ESLint flat config (`eslint.config.js`): `js.configs.recommended`,
  `typescript-eslint` recommended, `react-hooks`, `react-refresh` — not type-aware/strict
- No Prettier configured — don't assume auto-formatting is enforced
- TypeScript targets ES2023 (`tsconfig.app.json` / `tsconfig.node.json`) with
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` enabled

## Firebase notes

- Real project config lives in `.env` (gitignored); `.env.example` documents the
  `VITE_FIREBASE_*` / `VITE_CLOUDINARY_*` vars
- `VITE_USE_FIREBASE_EMULATORS` in `.env` controls whether the app talks to the local
  emulators or the live project. Currently `false` — day-to-day dev writes directly to
  the live project, since the Firestore emulator's first-time jar download is very
  slow on this network. `npm run emulators` is still configured (`firebase.json`) for
  when security-rule tests are written (`@firebase/rules-unit-testing` requires the
  emulator, it can't target the live project)
- No Cloud Functions on Spark plan — Firestore security rules (`firestore.rules`) are
  the *only* backend safeguard, so treat rules changes as security-sensitive and test
  them against the emulator with `@firebase/rules-unit-testing`
- `firestore.rules` currently denies all reads/writes by default (placeholder) —
  real per-collection rules land in PLAN.md step 8
- Auth providers (Google sign-in) and Firestore database creation are managed via
  `firebase` CLI / console, not in application code

## Other conventions

- `design/` holds UI mockups (PNG) for both public and admin pages — check there before
  building a screen to match the intended design
- Folder structure: `src/pages` (public routes), `src/admin` (admin routes + layout +
  `RequireAuth` guard), `src/components` (shared UI), `src/firebase` (SDK init/config),
  `src/types` (shared TS types), `src/test` (Vitest setup)
