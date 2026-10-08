# Data Access and HTTP Client

Applies to all client code in JayarathnaTech Solutions, and to any future React Native app. **The Firebase SDK is the data client and `fetch` is the HTTP client** — axios is not used.

## One Instance, One File

**`src/firebase/config.ts` holds the single configured Firebase app and exports `app`, `auth` and `db`. It is the only file in `src/` that calls `initializeApp` or connects the emulators.**

```
src/firebase/
├── config.ts        # the configured app, auth, db — the whole SDK setup
└── secondaryApp.ts  # the one deliberate second app: creating customers without replacing the admin's session
```

Every other external service has exactly one module that talks to it:

| Service | The one module | Transport |
| --- | --- | --- |
| Firestore / Auth | `src/firebase/config.ts` (+ data access in `src/lib/`) | Firebase SDK |
| Cloudinary uploads | `src/lib/cloudinary.ts` | `XMLHttpRequest` — the only place it is allowed, because `fetch` cannot report upload progress |
| Gemini | `api/*Handler.ts` (server side only) | `fetch` |
| This project's `/api/*` endpoints | a `src/lib` function or hook per endpoint, when it has a second caller | `fetch` |
| Web3Forms | `src/pages/Contact.tsx` today; a `src/lib` module once a second caller exists | `fetch` |
| Google Analytics | `src/lib/analytics.ts` | `gtag` |

Real-time listeners are not part of this layer: they follow [`realtime.md`](realtime.md).

**There is no per-call wrapper that only forwards.** A function whose whole body is `return fetch(url, init)` is a Middle Man (see [`code-smells.md`](code-smells.md)) and forces a reader to open two files to answer one question. The Firestore data-access functions in `src/lib/` are *not* that — they own the query and convert SDK types into this project's interfaces; see [`design-patterns.md`](design-patterns.md).

Forbidden everywhere else:

- `initializeApp` or `connect*Emulator` outside `src/firebase/`.
- Importing `axios`, `ky`, `superagent` or any other HTTP library.
- `XMLHttpRequest` outside `src/lib/cloudinary.ts`.
- **In new code**, a Firestore query, a `fetch` call, or a URL literal **inside a component or event handler**. The component calls a hook or `src/lib` function and renders the result. (`ChatWidget.tsx`, `admin/pages/Quotes.tsx`, `Contact.tsx` and several admin pages predate this; they are listed under `Known gaps` in `AGENTS.md`.)

## Request Defaults

```ts
const response = await fetch('/api/quoteAi', {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/json' },
  body: JSON.stringify({ notes }),
  signal: AbortSignal.timeout(30_000),
});
```

- **Same-origin paths for this project's own endpoints** (`/api/chat`). External hosts come from a constant or `import.meta.env`, never a hardcoded per-developer value, and never a committed secret. Only `VITE_*` values reach the client — and every one of them is public.
- **Always send and expect JSON** for `/api/*`. The handlers return `{ error }` bodies with a status; parse the body before deciding what to show.
- **Always set a timeout** (`AbortSignal.timeout`). A Gemini call with no timeout hangs the UI indefinitely.
- **Never set `Content-Type` for a `FormData` body.** The browser writes the multipart boundary itself; a fixed JSON content type breaks the upload.

## The Hook or Operation Is the Caller

**A hook or a `src/lib` operation calls Firestore or `fetch` directly.** The component calls that, not the SDK:

```ts
export const useEngagementInvoices = (engagementId: string) => {
  // getDocs + invoiceFromDoc, owning the query and the mapping
};
```

- **Return data, never the raw `Response` or `DocumentSnapshot`.** Map Firestore documents through their `<name>FromDoc` mapper; parse `fetch` JSON into a typed interface.
- **Type both directions** — the request body and the parsed response — with interfaces in `src/types/` (I-prefixed, per [`typescript.md`](typescript.md)). `api/` handler contracts stay in the handler file.
- **The path or collection name lives here.** The hook or operation is the one place a URL or collection path appears. Components never hold one.
- **Cancel reads when the screen unmounts** (an `AbortController` for `fetch`; an ignore flag or unsubscribe for Firestore). **Do not cancel writes** — a cancelled `POST` or `addDoc` may already have been committed, and the client would never learn it.
- **Handle every failure.** A `.catch(() => setData([]))` that turns a permission error into an empty list hides failures; surface an error state instead. (`useFirestoreCollection` currently does exactly this — a known gap.)
- **No logic beyond the request.** A hook that also computes business rules is doing `src/lib` work in the wrong place.

## Error Normalization

`fetch` and Firestore fail in different shapes. Every failure reaches the UI as one predictable interface:

```ts
export interface IApiError {
  status: number;
  message: string;
  errors: Record<string, string[]> | null;
}
```

Declare it in `src/types/` once a second caller needs it, with the `I` prefix per [`typescript.md`](typescript.md), and convert at the hook/operation boundary.

Map both contracts onto it:

| Source | Meaning | Handling |
| --- | --- | --- |
| Firestore `unauthenticated` / signed out | No session | Send the user to the right login (`/admin/login` or `/portal/login`) |
| Firestore `permission-denied` | Signed in but the rules refuse it (wrong role, unverified customer, not assigned) | Show a denial. Do not retry, and do not sign the user out |
| Firestore `not-found` / missing doc | Not found, or a record that is not theirs | Show a not-found state |
| `/api/*` `400` | Validation failed | Show the handler's `error` message against the input |
| `/api/*` `405` | Wrong method | A programming error; fix the caller |
| `/api/*` `429` | Gemini quota hit | Show the handler's message; do not retry automatically |
| `/api/*` `5xx`, Firestore `unavailable`, network error | Server or upstream fault | Generic message. Never show the raw body |

Validation errors per field go in `IApiError.errors`; leave it `null` for every other case.

**Do not swallow errors.** Normalize and re-throw (or return an error state). A helper that returns a fallback value hides failures from every caller.

## Authentication

- **Firestore requests are authenticated by the SDK** from the signed-in user — staff via Google sign-in, customers via email/password. Rules read `request.auth.token.email`, `uid` and `email_verified`.
- **A `/api/*` endpoint that must be restricted** receives `Authorization: Bearer <Firebase ID token>` from `auth.currentUser.getIdToken()`, and the Edge Function verifies it before calling the handler. None do yet — `quoteAi` and `requirementsDocAi` are admin-only in the UI but open to any caller (known gap).
- After a customer verifies their email, the ID token still says `email_verified: false` until it is refreshed (`getIdToken(true)`); rules will keep refusing writes until then.

## React Native

Applies only if a mobile app is added:

- **`localhost` does not resolve on a device or emulator.** The Android emulator reaches the host at `10.0.2.2`, the iOS simulator at `localhost`, and a physical device needs the machine's LAN address. Drive this from config; never hardcode it per developer.
- **Store any token in secure storage**, not `AsyncStorage` — it is unencrypted. On web, never `localStorage`.
- Plain HTTP is blocked by default on both platforms. Use HTTPS, or configure the local exemption deliberately for development only.

## Rules

- **Do not add an HTTP library.** `fetch` is the choice (plus `XMLHttpRequest` inside `cloudinary.ts` only). A dependency change needs approval regardless.
- **Do not retry blindly.** Never retry a `4xx` or `permission-denied`. Retry a network error or a `5xx` at most once, with backoff, and never on a non-idempotent write.
- **Never log a request or response containing a token, password, NIC details, or other personal data.** Payment receipts and NIC images go to their own Cloudinary presets for this reason.
- **Mock at the boundary in tests**, per [`frontend-testing.md`](frontend-testing.md): `firebase/*` modules and `globalThis.fetch`. No test makes a real network call or touches the live project. Cover the unauthenticated, permission-denied, not-found and validation paths — they are edge cases on the required list, not extras.
