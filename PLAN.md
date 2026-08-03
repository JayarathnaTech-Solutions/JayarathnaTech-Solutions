# JayarathnaTech Solutions — Build Plan

This is the single source of truth for what we're building and how far along it is.
As a feature is completed, check its box (`- [ ]` → `- [x]`). Nothing here is code —
this file only tracks scope and progress.

## Locked-in decisions

- **Site**: JayarathnaTech's own agency site (not a resold/multi-tenant product).
- **Database**: Firestore only (no Realtime Database).
- **Auth**: Google sign-in only, admin-invited only (no self-signup). Roles: **Admin**
  (full access, incl. staff management) and **Editor** (projects/testimonials/quotes,
  no staff management).
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
- **Contact form**: writes to Firestore only — no email notifications (no Cloud Functions).
- **Testing**: automated tests are required for v1 (not just manual click-through).

## Assumptions

- First-ever Admin account is bootstrapped manually (seeded directly in the Firebase
  console or via a one-off script) — there's no in-app way to create the first admin.
- PDF export uses a client-side library (e.g. `@react-pdf/renderer`), not server-rendered.
- Single Firebase project for v1 (no separate staging project). Day-to-day local dev
  connects directly to the live project (`VITE_USE_FIREBASE_EMULATORS=false`) — the
  Local Emulator Suite is configured (`firebase.json`, `npm run emulators`) but not
  used by default since the Firestore emulator's first-time jar download is very slow
  on this network. Revisit using it once security rules exist to test.
- Test stack: Vitest + React Testing Library, plus `@firebase/rules-unit-testing`
  for security-rule tests — these specifically require the Local Emulator Suite
  (they can't run against the live project), so budget time for that jar download
  when step 8 (Firestore Security Rules) starts.
- Vercel free tier is sufficient for hosting.
- Contact/testimonial forms use standard fields (name, email, phone optional, message).
- Quotes use a single currency (exact default TBD, e.g. USD or LKR).
- Testimonial invite links don't expire by default; admin manages validity manually.

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
- [ ] Contact form (name, email, phone optional, message) with client-side validation
- [ ] Submit → write to Firestore `contactMessages`
- [ ] Success/error UI states
- [ ] SEO meta tags

## 6. Public — Testimonial Submission Flow
- [ ] `/testimonial/:token` route, public, no login
- [ ] Validate token against `testimonialInvites` collection
- [ ] Submission form (client name, message, rating optional)
- [ ] Write to `testimonials` with status "pending", mark invite as used
- [ ] Invalid/expired/used token handling (error state)

## 7. Auth & Access Control
- [ ] Firebase Auth Google sign-in for `/admin/login`
- [ ] `staff` Firestore collection (doc id = uid or email; fields: email, name, role, invitedBy, createdAt)
- [ ] Auth guard: require signed-in + present in `staff` before allowing `/admin/*`
- [ ] Role-based UI gating: Admin vs Editor (hide staff-management from Editors)
- [ ] Document the manual bootstrap step for the first Admin (Firebase console seed)

## 8. Firestore Security Rules
- [ ] `staff` — Admins write; staff can read their own doc
- [ ] `projects` — public read, any staff write
- [ ] `testimonials` — public read (approved only), public create via valid invite token, staff approve/update
- [ ] `testimonialInvites` — staff-only list, public get-by-exact-id-only (no `list`) for token validation
- [ ] `quotes` — staff-only read/write
- [ ] `contactMessages` — public create only, staff-only read/update
- [ ] Write rules tests using `@firebase/rules-unit-testing` against the emulator

## 9. Admin — Dashboard
- [ ] Admin layout/shell (nav, protected route wrapper)
- [ ] Dashboard landing page (pending testimonials, open quotes, unread messages counts)

## 10. Admin — Project Management
- [ ] Project list view with edit/delete
- [ ] Add/edit project form — title, description, cover image upload to Cloudinary,
      plus category, client, technologies (tag list), challenge, solution, and key
      features (see extended Project schema in Locked-in decisions)
- [ ] Delete confirmation flow
- [ ] Image upload progress/error handling

## 11. Admin — Testimonials
- [ ] Generate invite link UI (creates `testimonialInvites` doc, produces shareable URL)
- [ ] Pending testimonials queue (approve/reject)
- [ ] Approved testimonials list (unpublish option)

## 12. Admin — Quote Builder
- [ ] Quote list view with status filter (Draft/Sent/Accepted/Rejected)
- [ ] Create/edit form: client info, dynamic line items, auto-calculated total
- [ ] Status transitions
- [ ] Client-side PDF export with branded template
- [ ] Unit tests for total calculation logic

## 13. Admin — Contact Messages Inbox
- [ ] List of submitted messages, newest first
- [ ] Mark as read/unread
- [ ] Basic filtering/search (optional)

## 14. Admin — Staff Management (Admin-only)
- [ ] Staff list view
- [ ] Invite staff form (add email + role to `staff` collection)
- [ ] Edit role / remove staff member
- [ ] Access restricted to Admin role only (UI + rules)

## 15. Testing
- [ ] Auth/admin route guard tests
- [ ] Firestore security rules tests (emulator-based)
- [ ] Quote total calculation unit tests
- [ ] Public form validation tests (contact + testimonial submission)

## 16. SEO & Polish
- [ ] Per-page meta titles/descriptions, Open Graph tags
- [ ] sitemap.xml generation
- [ ] Favicon, mobile responsiveness pass across all pages
- [ ] 404 page

## 17. Deployment
- [ ] Firebase Auth providers enabled, Firestore/Storage rules deployed
- [ ] Environment variables set in Vercel
- [ ] Vercel deployment connected to repo, production build verified
- [ ] Post-deploy smoke test of all public pages + admin login
