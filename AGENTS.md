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
- `npm run build` — generates `public/sitemap.xml` from live Firestore project data,
  then `tsc -b && vite build`
- `npm run lint` — ESLint
- `npm run preview` — preview a production build
- `npm test` — run the app test suite once (Vitest, jsdom, Firebase SDK mocked —
  no emulator needed)
- `npm run test:watch` — Vitest in watch mode (same suite as `npm test`)
- `npm run test:rules` — Firestore security-rules test suite
  (`src/test/rules/firestore.rules.test.ts`, `@firebase/rules-unit-testing`,
  separate Vitest config). Runs via `firebase emulators:exec`, which starts the
  Firestore emulator, runs the tests, then shuts it down — no manual emulator
  step needed. First run downloads the emulator jar (~150MB), which can be slow
  on some networks.
- `npm run emulators` — start the Firebase Local Emulator Suite standalone (Auth
  :9099, Firestore :8080, Emulator UI :4000), e.g. for manual/interactive testing.
  Requires a JRE on PATH for the Firestore emulator.

## Code style

- ESLint flat config (`eslint.config.js`): `js.configs.recommended`,
  `typescript-eslint` recommended, `react-hooks`, `react-refresh` — not type-aware/strict
- No Prettier configured — don't assume auto-formatting is enforced
- TypeScript targets ES2023 (`tsconfig.app.json` / `tsconfig.node.json`) with
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` enabled

## Firebase notes

- Real project config lives in `.env` (gitignored); `.env.example` documents the
  `VITE_FIREBASE_*` / `VITE_CLOUDINARY_*` / `VITE_WEB3FORMS_ACCESS_KEY` vars
- `VITE_USE_FIREBASE_EMULATORS` in `.env` controls whether the app talks to the local
  emulators or the live project. Currently `false` — day-to-day dev writes directly to
  the live project. The emulator is only used for `npm run test:rules` (see Commands)
- No Cloud Functions on Spark plan — Firestore security rules (`firestore.rules`) are
  the *only* backend safeguard, so treat rules changes as security-sensitive: they're
  covered by `npm run test:rules`, but changes still need careful review since a
  mistake there is a direct data-leak or privilege-escalation risk
- `firestore.rules` implements full per-collection rules (staff/projects/testimonials/
  testimonialInvites/quotes/contactMessages — see PLAN.md step 8) and is deployed to
  the live project. Changes to `firestore.rules` or `firestore.indexes.json` are
  **not live** until explicitly deployed (`firebase deploy --only firestore --project
  jayarathnatech-solutions`) — editing the file locally has no effect on the live app
  until that runs
- `staff` collection doc id is the person's **email**, not uid (see PLAN.md
  Assumptions) — invites are created by email before the invitee has ever signed in
- Auth providers (Google sign-in) and Firestore database creation are managed via
  `firebase` CLI / console, not in application code

## Other conventions

- `design/` holds UI mockups (PNG) for both public and admin pages — check there before
  building a screen to match the intended design
- Folder structure: `src/pages` (public routes), `src/admin` (admin routes + layout +
  `RequireAuth` guard), `src/components` (shared UI), `src/firebase` (SDK init/config),
  `src/types` (shared TS types), `src/test` (Vitest setup)
