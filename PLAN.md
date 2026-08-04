# JayarathnaTech Solutions — Build Plan

This is the single source of truth for what we're building and how far along it is.
As a feature is completed, check its box (`- [ ]` → `- [x]`). Nothing here is code —
this file only tracks scope and progress.

## Locked-in decisions

- **Site**: JayarathnaTech's own agency site (not a resold/multi-tenant product).
- **Database**: Firestore only (no Realtime Database).
- **Auth**: Google sign-in only, admin-invited only (no self-signup). Roles: **Admin**
  (full access, incl. staff management) and **Editor** (projects/testimonials/quotes,
  no staff management). A third staff role, **Developer** (Section 18), was added
  later for engagement-scoped access to Engagements and chat — same Google-sign-in
  `staff` mechanism, no new auth provider.
- **Customer Portal auth**: customers are a *separate* account type from staff —
  Firebase Auth **email/password**, not Google, and a `customers` collection keyed
  by **uid** (not email, unlike `staff` — see Assumptions). Admin creates the
  account and a temp password from the admin panel; the customer verifies their
  email (Firebase's built-in flow) and is forced to set their own password on
  first login. See Section 18.
- **Firebase plan**: Spark (free tier) — **no Cloud Functions**. All logic lives in the
  client + Firestore security rules.
- **Styling**: Tailwind CSS, mobile-first.
- **App structure**: single React + TypeScript + Vite SPA with React Router; public
  routes are open, `/admin/*` is guarded.
- **Hosting**: Vercel for the app; Firebase provides Auth and Firestore only.
  Domain not yet chosen.
- **File storage**: no Firebase Storage — Google now requires the Blaze plan to
  enable Cloud Storage on any project created after Oct 2024, and we're staying on
  Spark. Project cover images use Cloudinary's free tier instead (unsigned
  client-side uploads, no backend needed).
- **Language**: English only for v1.
- **Content**: About/Services pages are hardcoded in code (not admin-editable) for v1.
- **Project schema**: extended beyond the original title/description/cover image to
  also support optional `category`, `client`, `technologies` (string list), `challenge`,
  `solution`, and `keyFeatures` (string list) — needed for the Projects listing filter
  tabs and the richer detail-page layout. All new fields are optional so existing docs
  keep working; the admin add/edit project form (section 10) still needs to be built to
  capture them.
- **Quotes**: internal admin tool only, exported as PDF (no public shareable quote link).
- **Contact form**: submits via Web3Forms (external form-to-email API, access key in
  `VITE_WEB3FORMS_ACCESS_KEY`) for email delivery, and — on a successful Web3Forms
  submission — also writes the same message to Firestore `contactMessages` (client-side,
  best-effort; a Firestore write failure doesn't affect the user-facing success state)
  so it shows up in the admin inbox (Section 13).
- **Testing**: automated tests are required for v1 (not just manual click-through).
- **Customer engagements**: a customer's paid project ("engagement") is a *separate*
  Firestore collection (`engagements`) from the public-portfolio `projects`
  collection — they serve different purposes (private billing/progress vs. public
  showcase) and shouldn't share a schema or security rules. See Section 18.
- **Payments (v1)**: bank transfer only, fully manual — customer uploads a receipt
  (Cloudinary), admin reviews and marks it verified. No payment gateway in v1.
  **PayPal is explicitly deferred** until a PayPal account exists; the `Invoice`
  schema has an optional fee-line-item field reserved for PayPal's processing fee
  so adding it later isn't a breaking schema change, but no PayPal SDK/checkout
  code exists yet. Building it will very likely require revisiting the
  no-Cloud-Functions decision above, since verifying a PayPal payment securely
  wants a server-side capture/webhook step that client + Firestore rules can't do
  safely alone.
- **Payment gating is enforced in Firestore rules, not just the UI**: a 50%
  advance invoice must be admin-verified before an engagement can move to
  `in_progress`, and the 50% final invoice must be admin-verified before it can
  be marked `delivered`. Customers can submit payment proof but can never write
  `status: 'verified'` themselves — see `firestore.rules` and Section 18's rules
  tests. This is the most security-sensitive rule set in the app.

## Assumptions

- First-ever Admin account is bootstrapped manually (seeded directly in the Firebase
  console or via a one-off script) — there's no in-app way to create the first admin.
  Concretely: the `staff` collection's doc id is the person's **email** (not uid —
  Section 14 invites people by email before they've ever signed in, so the uid isn't
  known yet; the security rule checks `request.auth.token.email == staffId` instead,
  and the invitee's display name is auto-backfilled into the doc on their first
  sign-in). Bootstrap is: manually create a doc at `staff/{email}` with fields
  `email`, `name`, `role: "admin"`, `invitedBy`, `createdAt` — no prior sign-in needed.
- PDF export uses a client-side library (`@react-pdf/renderer`), not server-rendered
  — lazy-loaded (dynamic `import()`) so it doesn't bloat the public site's bundle.
- Single Firebase project for v1 (no separate staging project). Day-to-day local dev
  connects directly to the live project (`VITE_USE_FIREBASE_EMULATORS=false`) — the
  Local Emulator Suite is only used for the rules test suite (see below), not for
  everyday dev.
- Test stack: Vitest + React Testing Library for app code (`npm test`, no emulator
  needed — Firebase SDK calls are mocked), plus `@firebase/rules-unit-testing` for
  security-rule tests (`npm run test:rules`), which specifically requires the Local
  Emulator Suite and is kept in a separate Vitest config/npm script so `npm test`
  doesn't depend on it. The Firestore emulator jar (~150MB) is a slow first-time
  download on some networks — `npm run test:rules` triggers it automatically via
  `firebase emulators:exec` if not already cached.
- Vercel free tier is sufficient for hosting.
- Contact/testimonial forms use standard fields (name, email, phone optional, message).
- Quotes are per-quote USD or LKR (selectable in the quote form, defaults to USD)
  rather than one fixed site-wide currency.
- Testimonial invite links don't expire by default; admin manages validity manually.
- `customers` collection doc id is the Auth **uid**, the opposite of `staff` (keyed
  by email). This is intentional, not an inconsistency: `staff` invites are
  created by email before the invitee has ever signed in, so the uid isn't known
  yet; a customer account, by contrast, is created and signed-up for in the same
  admin action (Section 18's secondary-Firebase-app flow), so the real uid is
  already in hand when the Firestore doc is written.
  - Admin can't use the normal client Auth SDK to create a customer account
    without it signing the admin out of their own session mid-click
    (`createUserWithEmailAndPassword` signs in as the newly created user). The
    workaround: a second, isolated Firebase App instance
    (`src/firebase/secondaryApp.ts`) used only for that one call, immediately
    signed out afterward — the admin's primary session never sees it. This is a
    client-side trick made necessary by staying on Spark tier; a real backend
    (Firebase Admin SDK) would do this more cleanly.
  - Accepted risk: if account creation fails partway (e.g. the Firestore
    `customers` doc write fails right after the Auth user was created), you get
    an orphaned Auth user with no matching Firestore doc. There's no Cloud
    Function to reconcile this — it needs manual cleanup via the Firebase
    console if it ever happens. Not worth engineering around for v1 traffic.
- Customer temp passwords are generated client-side and shown to the admin
  exactly once (a "copy now" panel) — never persisted to Firestore. The admin
  relays it to the customer out-of-band (email/chat), matching how the original
  staff-invite flow also doesn't email invitees automatically.
- An engagement's `sprints` is a nested, admin-defined structure: each sprint
  (e.g. "Sprint 1", "Sprint 2") has its own phase checklist (default template:
  Analysis → Design → Development → Testing → Deploy, editable), and each
  phase's status (not_started / in_progress / completed) is tracked
  independently — more than one phase can be in progress at once, admin has
  full manual control (no auto-advance). No fixed global stage list, no
  integration with an external PM tool (Jira/Linear/etc). The last phase of
  the last sprint is treated as the delivery phase by convention, not a
  separate flag — see `hasReachedDelivery()` in `src/lib/engagement.ts`.
  This shape went through two earlier iterations during development (a plain
  `string[]` + single `currentSprintIndex` pointer, then briefly a flat
  `{name,status}[]`); `engagementFromDoc` in `src/lib/firestore.ts` migrates
  any of the older shapes on read, so no manual data fix-up was needed for
  engagements created before the final shape landed.
- The engagement chat (`engagements/{id}/messages`) is one shared thread per
  engagement (customer + admin + assigned developers), not per-person DMs, and
  messages are immutable once posted (no edit/delete, by anyone, including
  admin) — same append-only philosophy as an audit log.
- No email notifications for new chat messages, stage changes, or payment
  verification in v1 — the only outbound email is Firebase Auth's built-in
  verification email. A customer has to check the portal to see updates.

## Open risks

- **Bootstrap gap**: no in-app path to create the first admin — must not be forgotten
  when setting up the Firebase project.
- **No abuse protection on public forms**: without Cloud Functions there's no
  server-side rate-limiting/spam filtering on the contact form or testimonial
  submissions — only Firestore rules + client-side validation (Firebase App Check is
  a possible future mitigation).
- **Firestore security rules are the single point of failure** for authorization since
  there's no backend server — a mistake there is a direct data-leak or
  privilege-escalation risk, so these need careful design and thorough testing.
- **Free-tier ceilings**: Spark plan quotas cap Firestore/Storage usage; upgrading to
  Blaze later would reopen the Cloud Functions option (email notifications, server PDF
  generation, etc.).
- Domain not yet chosen — custom domain/DNS setup deferred.
- **Payment gating has no server double-check**: since there's no backend, whether
  an invoice is "verified" or an engagement is "delivered" is decided entirely by
  Firestore security rules evaluated against client writes. A bug in
  `firestore.rules` here is a direct money-related privilege-escalation risk
  (e.g. a customer marking their own payment verified), not just a data leak —
  see Section 18's rules test suite, which specifically targets this.
- **PayPal will likely force revisiting Spark tier**: securely verifying a PayPal
  payment (webhook signature verification, server-side order capture) really
  wants a backend. When PayPal is eventually wired up, expect that decision to
  come back into question — flagged now so it isn't a surprise mid-implementation.
- **Cloudinary receipt/attachment uploads are unsigned and client-trusted**, same
  as the existing public project-image uploads — there's no way to verify
  server-side that an uploaded "payment receipt" is what it claims to be before
  a human (the admin) looks at it. Acceptable for a manual-review flow, would not
  be acceptable if verification were ever automated.
- **Orphaned Auth users on partial customer-creation failure** (see Assumptions)
  — no automated cleanup path on Spark tier.

---

## 0. Project Setup
- [x] Install and configure Tailwind CSS
- [x] Install and configure React Router
- [x] Create Firebase project (Auth, Firestore enabled, Spark plan; no Storage — see
      locked-in decisions)
- [x] Install Firebase SDK and initialize config (env vars for Firebase config)
- [x] Set up Firebase Local Emulator Suite for local dev (Auth, Firestore)
- [x] Install test stack: Vitest, React Testing Library, `@firebase/rules-unit-testing`
- [ ] Connect Vercel project for deployment
- [x] Set up folder structure (public routes, admin routes, shared components, firebase lib, types)
- [x] Set up Cloudinary account (free tier) + unsigned upload preset for project cover images

## 1. Public — Home Page
- [x] Hero section (agency intro, mobile-first responsive)
- [x] Featured projects section (pulled from Firestore `projects`)
- [x] Featured testimonials section (pulled from approved `testimonials`)
- [x] CTA to Contact/Services
- [x] Basic SEO meta/OG tags

## 2. Public — About Page
- [x] Static hardcoded content (agency story, mission, team)
- [x] SEO meta tags

## 3. Public — Services Page
- [x] Static hardcoded content listing services offered
- [x] SEO meta tags

## 4. Public — Projects Page
- [x] Projects listing grid (from Firestore `projects`), with category filter tabs and
      "Load More" pagination
- [x] Project detail view (title, description, cover image, plus optional category,
      client, technologies, challenge, solution, key features — see schema note below)
- [x] Empty state (no projects yet)
- [x] SEO meta tags

## 5. Public — Contact Page
- [x] Contact form (name, email, phone optional, message) with client-side validation
- [x] Submit → Web3Forms (see Locked-in decisions — not Firestore `contactMessages`)
- [x] Success/error UI states
- [x] SEO meta tags

## 6. Public — Testimonial Submission Flow
- [x] `/testimonial/:token` route, public, no login
- [x] Validate token against `testimonialInvites` collection
- [x] Submission form (client name, message, rating optional)
- [x] Write to `testimonials` with status "pending", mark invite as used
- [x] Invalid/expired/used token handling (error state)

## 7. Auth & Access Control
- [x] Firebase Auth Google sign-in for `/admin/login`
- [x] `staff` Firestore collection (doc id = **email**; fields: email, name, role, invitedBy, createdAt)
- [x] Auth guard: require signed-in + present in `staff` before allowing `/admin/*`
- [x] Role-based UI gating: Admin vs Editor (hide staff-management from Editors)
- [x] Document the manual bootstrap step for the first Admin (Firebase console seed)

## 8. Firestore Security Rules
- [x] `staff` — Admins write; staff can read their own doc
- [x] `projects` — public read, any staff write
- [x] `testimonials` — public read (approved only), public create via valid invite token, staff approve/update
- [x] `testimonialInvites` — staff-only list, public get-by-exact-id-only (no `list`) for token validation
- [x] `quotes` — staff-only read/write
- [x] `contactMessages` — public create only, staff-only read/update
- [x] Write rules tests using `@firebase/rules-unit-testing` against the emulator
      (27 tests, `npm run test:rules` — auto-starts/stops the Firestore emulator
      via `firebase emulators:exec`, separate from `npm test` since it needs the
      emulator jar; see `src/test/rules/firestore.rules.test.ts`)

## 9. Admin — Dashboard
- [x] Admin layout/shell (nav, protected route wrapper)
- [x] Dashboard landing page (pending testimonials, open quotes, unread messages counts)

## 10. Admin — Project Management
- [x] Project list view with edit/delete
- [x] Add/edit project form — title, description, cover image upload to Cloudinary,
      plus category, client, technologies (tag list), challenge, solution, and key
      features (see extended Project schema in Locked-in decisions)
- [x] Delete confirmation flow
- [x] Image upload progress/error handling

## 11. Admin — Testimonials
- [x] Generate invite link UI (creates `testimonialInvites` doc, produces shareable URL)
- [x] Pending testimonials queue (approve/reject)
- [x] Approved testimonials list (unpublish option)

## 12. Admin — Quote Builder
- [x] Quote list view with status filter (Draft/Sent/Accepted/Rejected)
- [x] Create/edit form: client info, dynamic line items, auto-calculated total
- [x] Status transitions
- [x] Client-side PDF export with branded template
- [x] Unit tests for total calculation logic

## 13. Admin — Contact Messages Inbox
- [x] List of submitted messages, newest first
- [x] Mark as read/unread
- [x] Basic filtering/search (optional)

## 14. Admin — Staff Management (Admin-only)
- [x] Staff list view
- [x] Invite staff form (add email + role to `staff` collection)
- [x] Edit role / remove staff member
- [x] Access restricted to Admin role only (UI + rules)

## 15. Testing
- [x] Auth/admin route guard tests (`RequireAuth` states + `AdminStaff` role gate)
- [x] Firestore security rules tests (emulator-based) — see Section 8
- [x] Quote total calculation unit tests
- [x] Public form validation tests (contact + testimonial submission)

## 16. SEO & Polish
- [x] Per-page meta titles/descriptions, Open Graph tags (via shared `Seo` component)
- [x] sitemap.xml generation
- [x] Favicon — branded JayarathnaTech "J" mark matching `Logo.tsx`
- [x] Mobile responsiveness pass across all public pages
- [x] 404 page (matches `design/404-page.png`, now rendered inside `PublicLayout` so it
      gets the same Navbar/Footer as every other page)
- [x] Site-wide footer — logo/tagline, quick links, services, contact info, GitHub link
- [x] Unified typography system — Inter font loaded site-wide, consistent H1/H2/H3 and
      body-text scale across every page
- [x] Custom scrollbar styling matching the dark theme

## 17. Deployment
- [x] Firebase Auth providers enabled (Google sign-in), Firestore rules deployed
      (no Storage — not used, see Locked-in decisions)
- [x] `vercel.json` SPA rewrite (`/(.*) → /index.html`) so client-side routes
      (e.g. `/admin/login`, `/projects/:id`) don't 404 on direct load/refresh
- [ ] Environment variables set in Vercel — the 9 `VITE_*` vars from `.env.example`:
      `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
      `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
      `VITE_USE_FIREBASE_EMULATORS` (set to `false`), `VITE_CLOUDINARY_CLOUD_NAME`,
      `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_WEB3FORMS_ACCESS_KEY` — same values as
      the local `.env` (not committed to git)
- [ ] Vercel deployment connected to repo, production build verified — requires the
      account owner (Vercel dashboard access not available to the assistant); Vite
      framework preset auto-detects `npm run build` / `dist` output
- [ ] Post-deploy smoke test of all public pages + admin login

## 18. Customer Portal
- [x] Extend `StaffRole` with a **Developer** role (engagement-scoped access,
      reuses the existing Google-sign-in `staff` mechanism — no new auth provider)
- [x] `customers` collection (doc id = uid) + `src/firebase/secondaryApp.ts` +
      `src/lib/customerProvisioning.ts` — admin creates a customer's Auth user
      and Firestore doc without disturbing their own session (see Assumptions)
- [x] `engagements` collection — a customer's paid project, separate from the
      public `projects` portfolio: title/description, total value + currency,
      status (`pending_advance` → `in_progress` → `delivered`), assigned
      developer emails, admin-defined sprint list + current-sprint pointer
- [x] `invoices` collection — advance (50%) + final (50%), auto-generated
      together via `writeBatch` when admin sets the contract value (reuses
      `calcDeposit`/`calcBalance` from `src/lib/quote.ts`), bank-transfer proof
      upload + admin verification, optional fee-line-item field reserved for a
      future PayPal fee
- [x] Firestore rules: `customers`, `engagements`, `invoices`,
      `engagements/{id}/messages` — payment-gated status transitions, customers
      structurally unable to self-verify a payment, admin-only writes on
      engagements, immutable chat log. Extensive rules tests in
      `src/test/rules/{customers,engagements,invoices,chat}.rules.test.ts`
      (71 total rules tests across all five files as of this feature)
- [x] Admin UI — Customers (create/list), Engagements (list + detail: contract
      value, sprint planning/progression, developer assignment, delivery gate),
      Invoices (verify, export PDF)
- [x] Customer portal (`/portal/*`, separate `src/portal/` route tree,
      email/password login, email-verification + forced-first-login-password
      gates, dashboard listing the customer's engagements, read-only engagement
      detail with bank-transfer receipt upload)
- [x] Engagement group chat — one thread per engagement (customer + admin +
      assigned developers), real-time via Firestore listeners, text +
      Cloudinary attachments, shared `ChatThread` component used by both the
      admin and portal engagement-detail pages
- [x] Invoice PDF export (`src/lib/invoicePdf.tsx`, cloned from the existing
      quote-PDF pattern) and admin dashboard widgets (engagements awaiting
      advance, payments needing review)
- [x] Admin-editable bank transfer details (`settings/bankDetails`, a single
      global doc — any signed-in staff or customer can read it, only admin can
      write it — see `src/admin/pages/Settings.tsx`), replacing what was
      initially hardcoded placeholder text in the customer-facing bank details
      panel
- [x] The final (50%) invoice stays hidden from the customer until the
      engagement reaches its last sprint (or is delivered) — showing both
      invoices immediately was confusing since the final payment isn't due yet
- [ ] PayPal checkout/gateway integration — deferred, see Locked-in decisions;
      requires a PayPal business account (not yet created) and will likely
      require revisiting the Spark-tier/no-Cloud-Functions decision
- [ ] Email notifications (new chat message, stage change, payment verified) —
      deferred; no outbound email service beyond Firebase Auth's built-in
      verification email exists yet
