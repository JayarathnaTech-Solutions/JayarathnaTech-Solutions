# JayarathnaTech Solutions

The marketing site and admin dashboard for JayarathnaTech Solutions, a web & software
development agency. One React app, route-segmented into a public site and a guarded
`/admin` dashboard — not a monorepo.

## Public site

- **Home, About, Services, Projects, Project Detail, Contact** — the marketing site
- **Testimonial submission** — a tokenized link (`/testimonial/:token`) clients use to
  leave a review after an admin generates an invite

## Admin dashboard (`/admin`, Google sign-in, invite-only)

- **Dashboard** — pending testimonials, open quotes, unread messages, and project counts
  at a glance
- **Projects** — manage the portfolio shown on the public Projects page, with Cloudinary
  cover-image uploads
- **Testimonials** — approve, reject, or re-approve submissions, and generate invite links
- **Quotes** — build client quotes with line items, margin/profit buffers, and PDF export
- **Inbox** — contact form submissions from the public site
- **Staff** — invite and manage teammates by role (admin-only)

## Tech stack

- **React 19** + **TypeScript**, built with **Vite 8**
- **Tailwind CSS 4** (`@tailwindcss/vite`), mobile-first
- **React Router 8** — public routes open, `/admin/*` guarded by `RequireAuth`
- **Motion** (Framer Motion) for scroll reveals, page transitions, and micro-interactions
- **Firebase** — Google-sign-in Auth (admin-invited, no self-signup) + Firestore. Spark
  (free) tier — no Cloud Functions; all logic lives in the client and Firestore security
  rules
- **Cloudinary** — unsigned client-side image uploads (no Firebase Storage, which requires
  the paid Blaze plan)
- **Web3Forms** — contact form delivery
- **Vitest + React Testing Library + `@firebase/rules-unit-testing`** for tests
- **Vercel** for hosting

## Getting started

```bash
npm install
cp .env.example .env   # fill in Firebase / Cloudinary / Web3Forms keys
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Generate `public/sitemap.xml` from live project data, then typecheck and build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview a production build locally |
| `npm test` | Run the app test suite once (jsdom, Firebase SDK mocked — no emulator needed) |
| `npm run test:watch` | Same suite, watch mode |
| `npm run test:rules` | Firestore security-rules tests against the local emulator |
| `npm run emulators` | Start the Firebase Local Emulator Suite (Auth, Firestore, Emulator UI) |

## Project structure

```
src/
  pages/        Public routes
  admin/        Admin routes, layout, RequireAuth guard, admin-only components
  components/   Shared UI (Navbar, Footer, motion primitives, ...)
  lib/          Cross-cutting helpers shared by both public and admin code
  firebase/     Firebase SDK init/config
  types/        Shared TypeScript types
  test/         Vitest setup and test suites
```

See `AGENTS.md` for conventions and `PLAN.md` for the feature/architecture history.

## License

Proprietary — see [LICENSE.md](./LICENSE.md).
