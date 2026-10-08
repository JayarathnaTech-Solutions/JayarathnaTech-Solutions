# Real-Time Updates

Sources: <https://firebase.google.com/docs/firestore/query-data/listen> and <https://firebase.google.com/docs/rules> (normative), and the installed `firebase` source in `node_modules`.

JayarathnaTech Solutions pushes changes to connected clients with **Firestore real-time listeners** (`onSnapshot`) — today, the engagement group chat in `src/components/ChatThread.tsx`, shared by the admin and portal engagement pages. Auth state is the other subscription (`onAuthStateChanged` in `useAuthStatus` / `useCustomerAuthStatus`). There is no WebSocket server, no broadcast layer and no Cloud Functions. A listener shows data that has already been committed; every screen must still be correct after a plain reload.

## Server Side — Rules for Listened Collections

### Access

- **Every listened collection is private.** Chat messages, engagements and invoices are participant data; a listener on a collection open to everyone is never correct here.
- **A listener is a `list` query, and the rules must allow it exactly.** Firestore rejects a whole query that *could* return a document the user cannot read, so the client's `where`/`orderBy` must line up with the rule (e.g. `engagements/{id}/messages` is readable only by `engagementParticipant(engagementId)`).
- **One `match` block per listened collection**, using the named role helpers. The rule is the whole access decision, and it is tested through the emulator — see [`testing.md`](testing.md).
- **Judge the token and the documents the rule `get()`s, not the UI's idea of the role.** Rules read `request.auth.token.email`, `uid` and `email_verified`, plus the `staff` / `engagements` docs. A customer who just verified their email keeps `email_verified: false` in their token until it is refreshed (`getIdToken(true)`).

### Messages

- **A pushed item is a past-tense fact.** A chat message is created once and never changed: `allow update, delete: if false`. A listener never has to reconcile edits.
- **The write happens first; the listener reports it.** Write through the SDK (`addDoc`), and let the snapshot render it — do not also append it to local state by hand.
- **Validate the shape on create**: sender identity matches `request.auth`, `senderRole` matches the caller's role, attachments are `https://` URLs (`isHttpsUrl`).
- **Keep documents small.** Firestore caps a document at 1 MiB; attachments are Cloudinary URLs, never inline data. A page of messages is bounded by the query, not by trust.

### Testing

- Rules tests prove, for every listened collection: a participant can `list`, a non-participant and an unverified customer cannot, the create shape is enforced, and updates and deletes are refused.
- Seed with `withSecurityRulesDisabled`, run against the emulator; never against the live project.

## Client Side

### One Subscription Owner

- **`onSnapshot` and `onAuthStateChanged` are called from a hook or the one component that owns the subscription**, never from several places for the same data. New subscriptions live in a `src/lib/use<Name>.ts` hook that returns this project's types; `ChatThread` currently subscribes inline (known gap — extract when a second caller appears).
- **The effect returns the unsubscribe function.** Open in the effect, unsubscribe in its cleanup, nothing else, so it survives React StrictMode running it twice and never leaks after unmount.
- **Always pass the error callback.** A `permission-denied` on a listener is a real outcome (customer not yet verified, developer unassigned); show it, do not leave an endless spinner.
- **Map every snapshot through its `<name>FromDoc` mapper**, so SDK types never reach components.

### State That Takes Pushed Data

- **Replace from the snapshot, keyed by document id.** Set state from `snapshot.docs.map(mapper)` rather than appending per event; the same snapshot delivered twice must leave the same state.
- **Pending writes are not committed.** A local snapshot fires before the server confirms, with `serverTimestamp()` fields still `null` — `toIsoString` falls back to "now" for that case. Never treat a pending write as proof the rules accepted it.
- **A stale read never overrides a newer pushed state.** If a screen also loads the same data with `getDocs`, the listener's state wins; do not let a slower one-off read overwrite it.
- **Reconnection is the SDK's job.** Firestore resubscribes and replays changes after a network drop; do not build a manual resync. Offline persistence is not enabled, so a reload while offline shows the error state.

### Testing

- **Fake at the `firebase/firestore` module**, not by mocking the hook under test. Capture the `onSnapshot` callback and push snapshot-shaped objects through it, so the real component, mapper and cleanup run.
- Cover, for every subscription: renders what arrives, a repeated snapshot does not duplicate items, a pending write with a `null` timestamp renders, the error callback shows a denial, and unmounting calls the unsubscribe.
