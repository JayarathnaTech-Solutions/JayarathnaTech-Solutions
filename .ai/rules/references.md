# Reference Sources

The sources JayarathnaTech Solutions consults before implementing, and **how much weight each one carries**. When two sources conflict, the higher tier wins. When any source conflicts with a rule file in `.ai/rules/`, the rule file wins.

## Tier 1 — Normative

Authoritative. Follow them, and treat a conflict with your memory as your memory being wrong.

| Source | Authoritative for |
| --- | --- |
| <https://react.dev/learn> | React: components, hooks, state, effects, rendering |
| <https://firebase.google.com/docs/firestore> and <https://firebase.google.com/docs/rules> | Firestore queries, limits, and security-rules semantics |
| <https://firebase.google.com/docs/auth/web/start> | Firebase Auth (Google sign-in, email/password, email verification) |
| <https://reactrouter.com/> | React Router 8 routing, nesting, navigation |
| <https://vite.dev/guide/> | Vite: env vars, `import.meta.glob`, config, build |
| <https://vercel.com/docs/functions> | Vercel Edge Functions runtime and limits |
| <https://jestjs.io/docs/getting-started> | Jest: configuration, matchers, mocks, fake timers |
| <https://testing-library.com/docs/react-testing-library/intro/> | React Testing Library: rendering, queries, `user-event` |
| <https://www.typescriptlang.org/docs/> | TypeScript language and compiler options |
| The installed package source in `node_modules/` | What the code actually does, when docs are ambiguous — and which version is installed |

## Tier 2 — Design Authority

Consult before choosing a shape. Distilled into rule files, which are the binding form.

| Source | Authoritative for | Distilled in |
| --- | --- | --- |
| <https://blog.cleancoder.com/> | SOLID, Clean Architecture, the dependency rule, TDD discipline | [`architecture-principles.md`](architecture-principles.md) |
| <https://sourcemaking.com/> | Design patterns, refactoring, the AntiPatterns catalog | [`architecture-principles.md`](architecture-principles.md), [`design-patterns.md`](design-patterns.md) |
| <https://refactoring.guru/> | Design patterns, code smells, refactoring techniques | [`design-patterns.md`](design-patterns.md), [`code-smells.md`](code-smells.md), [`refactoring.md`](refactoring.md) |
| <https://github.com/alan2207/bulletproof-react> | React project structure and import direction | [`frontend-react.md`](frontend-react.md) |
| <https://www.reactnativeschool.com/> | React Native practice — only if a mobile app is added to this project | [`frontend-react.md`](frontend-react.md), [`frontend-testing.md`](frontend-testing.md) |

## Tier 3 — Community

<https://dev.to/> and comparable community blogs. Useful for prior art, war stories, and approaches you would not have considered.

**Not normative, and never a justification on its own.** A community post is one developer's opinion, unreviewed and undated in effect:

- **Check the date and the versions.** Most React and Firebase posts describe an older major version. A post predating hooks, the modular Firebase v9+ SDK, or React Router's current API is misleading here.
- **Corroborate before acting.** If a post's approach is not confirmed by Tier 1 or 2, do not adopt it.
- **A conflict with Tier 1 or 2 is resolved against the post, every time.** No exceptions for a post that is popular or highly reacted.
- **Never add a dependency because a post recommended it.** Dependency changes need the user's approval regardless of source.
- **Never paste code from a post.** Understand the idea, then write it in this codebase's conventions. Pasted code brings unknown licensing, unknown quality, and a style that does not match.

## Using Sources Well

- **Consult before implementing in unfamiliar territory** — a new subsystem, an unfamiliar integration, a structural decision. The distilled rule files are always binding; the sources are for depth when you need the argument, not a fetch before every edit.
- **Never let a source override the codebase.** An established convention here beats a better pattern from anywhere. Consistency wins; see [`index.md`](index.md).
- **Record what you learned.** If consulting a source settles a decision, write the decision into `CLAUDE.md` per [`documentation.md`](documentation.md) so the next person does not repeat the research.
- **Cite the source in the commit body** when it drove a non-obvious choice.
