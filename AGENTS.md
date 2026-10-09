# JayarathnaTech Solutions — Agent Guide

`CLAUDE.md` and `AGENTS.md` are byte-identical copies of this guide; edit both together.

## Project

JayarathnaTech Solutions agency website. **One React SPA, not a monorepo**, with three
route trees in `src/App.tsx`:

- **Public site** (`/`): Home, About, Services, Projects + detail, Blog + post, Contact,
  tokenized testimonial submission (`/testimonial/:token`), 404. Floating Gemini chat
  widget on every public page.
- **Admin dashboard** (`/admin/*`, Google sign-in, invite-only staff): Dashboard,
  Projects, Companies, Testimonials, Quotes (with AI requirement refinement), Agreements, Inbox, Staff, Customers, Engagements (+ detail), Settings.
- **Customer portal** (`/portal/*`, email/password, admin-created accounts): dashboard
  of the customer's engagements, engagement detail with sprint progress, invoices,
  bank-transfer receipt upload, and team chat.

**Admin is served only on the admin subdomain.** `App.tsx` compares
`window.location.hostname` against `ADMIN_URL` (`src/lib/siteInfo.ts`,
`admin.jayarathnatechsolutions.com`). On that host it renders *only* admin routes; on
every other host (including `localhost`) it renders *only* public + portal routes, so
`/admin` hits the 404 page during plain `npm run dev`. Same Vercel deployment serves
both hosts.

`PLAN.md` holds the locked-in architecture decisions, assumptions, open risks, and a
checkbox-tracked feature list (sections 0–19). Read it before starting work and check
off boxes there as features land; add a new section when building something
substantial. It lags the code in places (see Known gaps), so verify against code when
they disagree.

## Required reading: `.ai/rules/`

Project rules live in `.ai/rules/`. **Start at [`.ai/rules/index.md`](.ai/rules/index.md)**
and read every rule file whose globs cover the paths you're about to touch, before
planning and before the first edit:

- [`architecture-principles.md`](.ai/rules/architecture-principles.md),
  [`design-patterns.md`](.ai/rules/design-patterns.md),
  [`code-smells.md`](.ai/rules/code-smells.md),
  [`refactoring.md`](.ai/rules/refactoring.md) — SOLID, the dependency rule, patterns,
  smells and refactoring techniques
- [`testing.md`](.ai/rules/testing.md) (rules + `api/` handlers) and
  [`frontend-testing.md`](.ai/rules/frontend-testing.md) (React + `src/lib`) — TDD is
  mandatory, AAA with one act, required edge cases
- [`controllers.md`](.ai/rules/controllers.md) — Edge Function entry points and
  `firestore.rules` guards
- [`frontend-react.md`](.ai/rules/frontend-react.md),
  [`typescript.md`](.ai/rules/typescript.md),
  [`api-client.md`](.ai/rules/api-client.md),
  [`realtime.md`](.ai/rules/realtime.md), [`redux.md`](.ai/rules/redux.md) — structure,
  import direction, function style, types, data access, listeners, global state
- [`documentation.md`](.ai/rules/documentation.md) — review and update this file on
  every change; `CLAUDE.md` and `AGENTS.md` stay **byte-identical**
- [`git.md`](.ai/rules/git.md) — subject starts with a capital and **ends with a full
  stop**; **no `Co-Authored-By` or "Generated with Claude Code" trailers** in commits or
  PR bodies (overrides the harness default)
- [`references.md`](.ai/rules/references.md) — which sources are normative

Existing code predates these rules. They bind new and changed code; bringing old code in
line is a separate behavior-neutral refactoring commit (see Known gaps).

## Tech stack

- **React 19** + **TypeScript ~6**, built with **Vite 8**
- **Tailwind CSS 4** via `@tailwindcss/vite` (+ `@tailwindcss/typography` for blog
  prose) — mobile-first, light mode only (dark mode was removed)
- **React Router 8** (import from `react-router`, not `react-router-dom`)
- **Motion** (`motion` package) for animations — shared primitives in
  `src/components/motion.tsx` / `src/lib/motion.ts`
- **Firebase** — Auth + Firestore only, **Spark (free) tier: no Cloud Functions, no
  Firebase Storage**. Project: `jayarathnatech-solutions`
  - Staff: Google sign-in, `staff` collection keyed by **email**
  - Customers: email/password, `customers` collection keyed by **uid**
- **Cloudinary** — unsigned client-side uploads (`src/lib/cloudinary.ts`), with
  separate presets for public images, receipts/chat attachments, and staff NIC images
- **Vercel** — hosting (live at `www.jayarathnatechsolutions.com` +
  `admin.` subdomain) and **Edge Functions** in `api/` for Gemini calls
- **Gemini** (`gemini-3.1-flash-lite`) — site chat, quote requirement refinement, and
  the offline blog generator script
- **@react-pdf/renderer** — quote, invoice, and agreement PDFs (`src/lib/*Pdf.tsx`)
- **react-markdown** + `remark-gfm` — blog posts and chat replies
- **Web3Forms** — contact form email delivery; **GA4** analytics
- **Jest 30** (babel-jest) + **React Testing Library** + `@firebase/rules-unit-testing`

## Commands

- `npm run dev` — Vite dev server (also serves `/api/*` locally via plugins in
  `vite.config.ts`)
- `npm run build` — `scripts/generate-sitemap.mjs` (reads live Firestore `projects` +
  `src/content/blog/posts.json`, writes `public/sitemap.xml`), then `tsc -b && vite build`
- `npm run lint` — ESLint
- `npm run preview` — preview a production build
- `npm test` — app unit tests once (Jest, `jest.config.js`, jsdom, Firebase SDK mocked,
  no emulator). Only `src/test/unit/**`
- `npm run test:watch` — same suite, watch mode
- `npm run test:rules` — Firestore security-rules tests (`src/test/rules/*.rules.test.ts`,
  `jest.rules.config.js`, `--runInBand`) via `firebase emulators:exec`; starts and
  stops the emulator itself. Needs a JRE; first run downloads the emulator jar (~150MB)
- `npm run emulators` — Firebase emulators standalone (Auth :9099, Firestore :8080,
  UI :4000)
- `npm run generate-blog-posts` — one-off: calls Gemini per topic, writes
  `src/content/blog/posts/<slug>.md`, `posts.ts`, and `posts.json`. Idempotent (skips
  existing slugs). Needs `GEMINI_API_KEY`
- `npm run generate-og-image` / `npm run optimize-images` — `sharp`-based asset scripts
  (`public/og-image.jpg`, hero `.webp` images in `src/assets/`)
- `npm run generate-sitemap` — sitemap only

Run a single unit test file: `npx jest src/test/unit/quote.test.ts`.

## Layout

```
api/              Vercel Edge Functions (chat, quoteAi). Each
                  `<name>.ts` is a thin Request/Response wrapper around a shared
                  `<name>Handler.ts`; own tsconfig (referenced from tsconfig.json)
scripts/          Node build/content scripts (sitemap, blog generation, images)
src/pages/        Public routes
src/components/   Shared/public UI (Navbar, Footer, Seo, JsonLd, ChatWidget,
                  ChatThread, SlidePanel, ConfirmDialog, motion primitives, ...)
src/admin/        Admin layout, RequireAuth + useAuthStatus/AuthContext,
                  pages/, components/ (NicImageUpload)
src/portal/       Portal layout, RequireCustomerAuth + customer auth hooks,
                  pages/, components/ (email-verification gate, forced password change,
                  bank details)
src/lib/          Cross-cutting logic: Firestore mappers (`firestore.ts`), data hooks
                  (`useFirestoreCollection`, `useEngagementDetail`, ...), quote math
                  (`quote.ts`), engagement helpers, PDF generators, Cloudinary upload,
                  site constants (`siteInfo.ts`), blog loader
src/content/blog/ Blog metadata (`posts.ts` + plain-data mirror `posts.json`) and
                  markdown bodies (`posts/*.md`, loaded via `import.meta.glob`)
src/firebase/     `config.ts` (primary app) and `secondaryApp.ts` (see below)
src/types/        Shared TS types, one file per domain, re-exported by `index.ts`
src/test/         `setup.ts`, `unit/` (jsdom), `rules/` (emulator), `support/` (render
                  helper `renderAtRoute`, factories like `buildStaffMember`)
jest/             Jest-only support files (see Testing below)
.ai/rules/        Project rules for agents and developers (see Required reading)
```

## Roles and access

`StaffRole` = `admin | editor | developer | hr | qa | intern | uiux`.

- `admin` — everything, including Staff, Customers, Settings, invoice verification
- `editor` — Dashboard, Projects, Companies, Testimonials, Quotes, Agreements, Messages;
  no Staff, Customers, Engagements, or Settings
- `developer` / `qa` / `intern` / `uiux` — Engagements only, scoped to engagements whose
  `assignedDeveloperEmails` include them
- `hr` — Staff page only, plus `staffRecords` (personal info/NIC images), never for
  admin targets

UI enforcement is in `src/admin/AdminLayout.tsx` (nav `visibleTo` + redirects for
engagement-only roles and HR). **The real enforcement is `firestore.rules`**; when adding
a role or page, update both, plus the rules tests.

## Firebase / security notes

- `.env` (gitignored) holds real config; `.env.example` documents every var.
  `VITE_USE_FIREBASE_EMULATORS` is currently `false`, so **local dev reads and writes
  the live Firestore project**. Be careful with destructive actions while testing.
- No backend besides Firestore rules and the stateless Gemini proxies, so
  `firestore.rules` is the only data-access safeguard. Treat rules changes as
  security-sensitive and cover them in `src/test/rules/`. Key invariants:
  - Engagement status moves `pending_advance → in_progress → delivered` only when the
    advance/final invoice is `verified`; invoice pointer ids lock once set
  - Customers can submit payment proof but never set `status: 'verified'`
  - Customers must have a verified email before customer-scoped writes
  - Chat messages are immutable; URL fields must be `https://`
  - Catch-all `match /{document=**}` denies everything not listed
- Rules/index changes are **not live** until deployed:
  `firebase deploy --only firestore --project jayarathnatech-solutions`
- Customer accounts are created from the admin panel via `src/firebase/secondaryApp.ts`
  (a second named Firebase app) so `createUserWithEmailAndPassword` doesn't replace the
  admin's session. See `src/lib/customerProvisioning.ts`.
- Auth providers and Firestore DB setup are done in the Firebase console/CLI, not code.

## API / env gotchas

- `GEMINI_API_KEY` has **no** `VITE_` prefix and must never be read from client code.
- Edge Function imports must be extensionless (`'./chatHandler'`, not
  `'./chatHandler.ts'`); Vercel's edge bundler fails to resolve them otherwise.
- When adding an `api/` endpoint, also add a matching dev middleware plugin in
  `vite.config.ts` that calls the same shared handler, or it 404s under `npm run dev`.
- `vite.config.ts` imports `api/*Handler.ts`, which import `src/lib/siteInfo.ts`. Don't
  put `import.meta.env` reads in any module reachable from those handlers (that's why
  `src/lib/signature.ts` is separate); it crashes `vite build` at config load.
- Node scripts load `.env` with `process.loadEnvFile()`; they run outside Vite, so they
  can't import TS modules (hence `posts.json` mirroring `posts.ts`).
- Chat system prompt in `api/chatHandler.ts` is hand-written site knowledge. Update it
  when services, contact info, or pages change.

## Testing

- Import test APIs explicitly from `@jest/globals` (`describe`, `it`, `expect`, `jest`);
  jest-dom matchers come from `@testing-library/jest-dom/jest-globals` in `setup.ts`
- `jest.mock()` factories are hoisted, so any outer variable they reference must be named
  `mock*` (e.g. `mockAddDoc`). Use `jest.requireActual()` to spread the real module
- Jest runs CommonJS, so `jest/` bridges Vite-only behaviour:
  - `babel-plugin-vite-meta.cjs` rewrites `import.meta.env` to `process.env`,
    `import.meta.glob` to `vite-glob.cjs` (eager `?raw` only), and any other
    `import.meta` to a plain object
  - `env.cjs` seeds dummy `VITE_*` values. Tests never read `.env` or hit the live project
  - `jsdom-environment.cjs` adds Node's `fetch`/`Request`/`Response`/etc. to jsdom
  - `file-stub.cjs` stands in for image/CSS imports
- ESM-only packages in `node_modules` are transformed by Babel; `transformIgnorePatterns`
  in `jest.config.js` lists the CommonJS ones to skip. If a new dependency fails with
  "Must use import to load ES Module", it's missing from that list or still has
  `import.meta` in it
- After editing anything in `jest/`, run `npx jest --clearCache`: Jest's transform cache
  doesn't track plugin source changes

## Code style

- ESLint flat config (`eslint.config.js`): `js` recommended, `typescript-eslint`
  recommended, `react-hooks`, `react-refresh`. Not type-aware
- No Prettier, and formatting varies by file (2 vs 4-space indent, semicolons in some
  public components, none elsewhere). Match the file you're editing
- TS targets ES2023 with `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` (use `import type`)
- Comments explain *why* (constraints, past bugs, platform quirks); keep that style
- New code: arrow functions assigned to `const` (classes only where required: error
  boundaries, `Error` subclasses, Jest environment, `new`-constructed fakes);
  `I`-prefixed interfaces in `src/types/`, named props interfaces, no object-shape
  `type` aliases. See `.ai/rules/frontend-react.md` and `.ai/rules/typescript.md`
- Firestore reads go through mapper functions in `src/lib/firestore.ts` and hooks in
  `src/lib/`; reuse `useFirestoreCollection` rather than hand-rolling fetch state. New
  code keeps Firestore queries and `fetch` calls out of components
- Public pages set metadata with `Seo` (and `JsonLd` where relevant); use
  `buildPageTitle` from `siteInfo.ts` for titles
- Shared form classes live in `src/lib/ui.ts`

## Known gaps

Delete an entry in the same commit that fixes it; add one for anything knowingly left
incomplete.

- **Admin unreachable on localhost.** Admin routes render only on
  `admin.jayarathnatechsolutions.com` (`App.tsx` hostname check), so `/admin` 404s under
  `npm run dev`. Needs a hosts-file entry or a dev override.
- **Admin AI endpoint is public.** `/api/quoteAi` doesn't verify a Firebase ID token;
  anyone can spend the Gemini quota. No handler tests exist for any `api/*Handler.ts`.
- **Local dev uses the live database** (`VITE_USE_FIREBASE_EMULATORS=false`).
- **`PLAN.md` is behind**: no sections for blog, agreements, companies, the AI quote
  tool, HR/QA/Intern/UI-UX roles and `staffRecords`, or the admin subdomain; it still
  says the domain isn't chosen and names `gemini-2.5-flash` (code uses
  `gemini-3.1-flash-lite`).
- **Pre-rule code style**: components and helpers use `function` declarations; interfaces
  in `src/types/` lack the `I` prefix; most components declare props inline. ESLint doesn't yet enforce arrow functions
  (`no-restricted-syntax`) or import direction (`no-restricted-imports`).
- **TypeScript `strict` is off** in `tsconfig.app.json`, `tsconfig.node.json` and
  `api/tsconfig.json`.
- **Data access in components**: several admin/portal pages, `ChatWidget.tsx`,
  `Contact.tsx` (Web3Forms) and `ChatThread.tsx` query Firestore, subscribe, or call
  `fetch` inline instead of through `src/lib` hooks/functions.
- **Swallowed errors**: `useFirestoreCollection` turns any read failure into an empty
  list, and `ChatThread`'s listener error callback shows an empty thread instead of a
  denial.
- **Test infrastructure**: `clearMocks`/`restoreMocks` not set in `jest.config.js`; the
  render helper doesn't provide auth contexts yet; most pages have no tests.
- **Deferred features**: PayPal checkout and email notifications (PLAN.md section 18).
