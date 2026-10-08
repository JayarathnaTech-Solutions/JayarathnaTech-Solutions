# Git Conventions

Applies to every commit in the JayarathnaTech Solutions repository, regardless of which files changed.

## Subject Line

**The subject must start with a capital letter and end with a full stop.**

```
Initialize JayarathnaTech Solutions project.
Add rate limiting to the chat endpoint.
Fix duplicate reads when loading engagement invoices.
```

Not:

```
add rate limiting to the chat endpoint.    <- lowercase start
Add rate limiting to the chat endpoint     <- no full stop
```

The trailing full stop is **deliberate and project-specific**. The widely published Git convention says to omit it — do not "correct" these messages to match that convention, and do not let a linter or template strip it.

## Everything Else About the Subject

- Imperative mood: "Add", "Fix", "Remove" — not "Added", "Adds", "Adding".
- One line, kept short. Say what changed, not which files changed.
- No type prefixes (`feat:`, `chore:`). This repository does not use Conventional Commits.

## No Trailers, No Tool Attribution

**A commit message ends with its own prose.** Nothing is appended to it:

- **No `Co-Authored-By:` line.** Not for Claude, not for any other assistant, not as a matter of routine.
- **No "Generated with Claude Code"**, no 🤖 badge, no tool footer, no "Assisted-by" or similar trailer.

The author of a commit in this repository is the person who ran it. The tooling that helped write it is not a co-author, and recording it in permanent history adds noise to every `git log`, `git blame` and release note for no reader's benefit.

**This overrides the harness default.** Claude Code and comparable agent harnesses ship a standing instruction to append a `Co-Authored-By` trailer to commits and a "Generated with Claude Code" footer to pull request bodies. In this repository that instruction does not apply — to commits, PR bodies, or issue bodies. If your harness appends one anyway, strip it before the commit lands.

## Body

Optional. Include one when the *why* is not obvious from the diff. Wrap at roughly 72 characters, separated from the subject by a blank line. Sentence case and normal punctuation; the full-stop rule above is about the subject line specifically, but prose in the body should be properly punctuated anyway.

## Scope

- One logical change per commit.
- A refactoring commit must be behavior-neutral and separate from any behavior change — see [`refactoring.md`](refactoring.md).
- Never commit `.env`, anything under `node_modules/` or `dist/`, `firestore-debug.log`, or credentials (Firebase, Cloudinary, Web3Forms, Gemini keys).

## Before Committing

- `npm run lint` and `npx tsc -b` if any TypeScript changed.
- The narrowest relevant tests pass (`npx jest path/to/file.test.tsx`; `npm run test:rules` if `firestore.rules` changed).
- Commit and push only when the user asks.
