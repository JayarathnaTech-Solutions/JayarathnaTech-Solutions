# Edge Functions and Access Rules

Applies to `api/**`, `firestore.rules`, and the dev-server API plugins in `vite.config.ts`.

JayarathnaTech Solutions has no controller layer and no middleware stack. Its two server-side entry points are:

- **Vercel Edge Functions** in `api/` — currently `chat`, `quoteAi` and `requirementsDocAi`, each proxying Gemini so `GEMINI_API_KEY` stays server-side.
- **Firestore security rules** in `firestore.rules` — the only enforcement for every read and write the browser makes.

What follows is this project's equivalent of "what guards an endpoint is declared next to the code it guards."

## The Guard Lives with the Entry Point

**An Edge Function declares everything about how it is reached in its own `api/<name>.ts` file**: `export const config = { runtime: 'edge' }`, the method check (`405` for anything but `POST`), body parsing (`400` on invalid JSON), and — once an endpoint needs it — the authentication check. Nothing about who may call an endpoint is left to the client.

- **What every endpoint needs is written the same way in each wrapper.** The three wrappers are deliberately identical in shape; a new one copies that shape. Do not invent a shared base or a helper that hides the method check — a reader must see the guard in the file.
- **The wrapper holds the guard and nothing else.** No business logic, prompt text, or Gemini call in `api/<name>.ts`; that lives in `api/<name>Handler.ts`, which returns `{ status, body }` and is tested directly. See the Humble Object in [`architecture-principles.md`](architecture-principles.md).
- **Every endpoint has a matching dev middleware plugin in `vite.config.ts`** that applies the same method and JSON checks and calls the same handler. A route missing there 404s under `npm run dev`.
- **Relative imports in `api/` are extensionless** (`'./chatHandler'`). Vercel's Edge bundler fails to resolve them otherwise.
- **Name each guard explicitly**: method, content type, size limits (`MAX_MESSAGE_LENGTH`, `MAX_INPUT_LENGTH`), and the error message a caller sees. Constants at the top of the handler, not literals buried in the logic.

## Collection Rules Live on the Collection

**In `firestore.rules`, each collection has its own `match` block that states every operation explicitly** — `get`, `list`, `create`, `update`, `delete` — using the named role helpers (`isAdmin()`, `isStaff()`, `isVerifiedCustomer()`, `isAssignedToEngagement()`, …).

- **One function per role**, as the file already does. A helper returning a role string tripped a "Null value error" in the rules evaluator before; do not reintroduce it.
- **Writes validate shape**: a key allowlist with `hasOnly`, type checks, and `isHttpsUrl()` for anything rendered as an `href`/`src`.
- **State transitions are gated in rules** (`engagementStatusTransitionAllowed()`), never only in the UI.
- **Never widen the catch-all.** `match /{document=**}` denies everything; a new collection gets its own block.

## The Exceptions

- **A public endpoint stays public on purpose.** `api/chat.ts` serves anonymous site visitors; it is guarded by input limits, not authentication. Record that decision in the handler's comments.
- **Admin-only AI endpoints must not stay public.** `api/quoteAi.ts` and `api/requirementsDocAi.ts` are only called from the admin panel but currently accept any caller — listed under `Known gaps` in `AGENTS.md`. The fix is to send the signed-in staff member's Firebase ID token and verify it in the wrapper before calling the handler.

## The Safety Net

Rules default to deny; a forgotten guard on an Edge Function defaults to open. Tests are what catch either mistake:

- **`src/test/rules/*.rules.test.ts`** must cover, for every collection, the allowed and the denied case for each role and each operation. **Add tests for every new collection or rule**, and change an existing expectation only on purpose.
- **Each `api/*Handler.ts` needs a handler test** for its success case and every rejection (`400`, `405`, `429`, `5xx`, missing key) — see [`testing.md`](testing.md). None exist yet; this is a known gap.
- Rules changes are not live until `firebase deploy --only firestore --project jayarathnatech-solutions`. A passing rules suite with an undeployed rules file protects nothing.
