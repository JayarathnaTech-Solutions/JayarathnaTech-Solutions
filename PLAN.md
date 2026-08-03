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
- **Hosting**: Vercel for the app; Firebase provides Auth, Firestore, Storage only.
  Domain not yet chosen.
- **Language**: English only for v1.
- **Content**: About/Services pages are hardcoded in code (not admin-editable) for v1.
- **Quotes**: internal admin tool only, exported as PDF (no public shareable quote link).
- **Contact form**: writes to Firestore only — no email notifications (no Cloud Functions).
- **Testing**: automated tests are required for v1 (not just manual click-through).

## Assumptions

- First-ever Admin account is bootstrapped manually (seeded directly in the Firebase
  console or via a one-off script) — there's no in-app way to create the first admin.
- PDF export uses a client-side library (e.g. `@react-pdf/renderer`), not server-rendered.
- Single Firebase project for v1 (no separate staging project); local dev uses the
  Firebase Local Emulator Suite.
- Test stack: Vitest + React Testing Library, plus `@firebase/rules-unit-testing`
  against the emulator for security-rule tests.
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
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure React Router
- [ ] Create Firebase project (Auth, Firestore, Storage enabled, Spark plan)
- [ ] Install Firebase SDK and initialize config (env vars for Firebase config)
- [ ] Set up Firebase Local Emulator Suite for local dev (Auth, Firestore, Storage)
- [ ] Install test stack: Vitest, React Testing Library, `@firebase/rules-unit-testing`
- [ ] Connect Vercel project for deployment
- [ ] Set up folder structure (public routes, admin routes, shared components, firebase lib, types)

## 1. Public — Home Page
- [ ] Hero section (agency intro, mobile-first responsive)
- [ ] Featured projects section (pulled from Firestore `projects`)
- [ ] Featured testimonials section (pulled from approved `testimonials`)
- [ ] CTA to Contact/Services
- [ ] Basic SEO meta/OG tags

## 2. Public — About Page
- [ ] Static hardcoded content (agency story, mission, team)
- [ ] SEO meta tags

## 3. Public — Services Page
- [ ] Static hardcoded content listing services offered
- [ ] SEO meta tags

## 4. Public — Projects Page
- [ ] Projects listing grid (from Firestore `projects`)
- [ ] Project detail view (title, description, cover image)
- [ ] Empty state (no projects yet)
- [ ] SEO meta tags

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
- [ ] Add/edit project form (title, description, cover image upload to Firebase Storage)
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
