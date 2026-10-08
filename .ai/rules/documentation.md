# Keeping CLAUDE.md and AGENTS.md Current

## The Mandate

**No change is complete until [CLAUDE.md](../../CLAUDE.md) and [AGENTS.md](../../AGENTS.md) have been reviewed and updated.** This applies to every change and every implementation — not only to large ones, and not only when it feels worth it.

The update ships **in the same commit as the change**, never as a follow-up. A commit that changes behavior or convention without the matching doc review is incomplete.

## The Two Files Are One File

`CLAUDE.md` and `AGENTS.md` are kept **byte-identical**. Every edit goes into both. Verify before committing:

```bash
diff CLAUDE.md AGENTS.md && echo IDENTICAL
```

Both files are hand-written; nothing in them is generated. `PLAN.md` is separate: it tracks scope and progress with checkboxes, and is updated when a feature lands, not mirrored into these files.

## What to Record

Record what the **next** agent or developer would otherwise have to rediscover:

- A new convention, or a change to an existing one.
- An architectural decision, and the constraint behind it.
- A new directory, layer, or module role, and what belongs in it.
- A new command, environment variable, or setup step (and the matching line in `.env.example`).
- A new rule file in `.ai/rules/`, linked from the required-reading list.
- A non-obvious trap: something that looks wrong but is deliberate, or looks safe but is not.
- **A gap that closed.** When something in `Known gaps` is fixed, delete that entry in the same commit. A stale warning is worse than no warning — it sends people to fix what is already fixed.
- **A gap that opened.** Anything knowingly left incomplete goes into `Known gaps` with enough detail to act on.

## What Not to Record

These files are **standing guidance, not a changelog.** Adding to them has a cost: every line is loaded into context on every future session, and volume dilutes the rules that matter.

Do not add:

- A per-change log entry. Git already records what changed and when.
- A narrative of a bug and its fix, unless the fix established a convention.
- Anything derivable from reading the code or `git log`.
- Temporary state — a branch in progress, a test currently failing.
- Restatements of what an existing rule file in `.ai/rules/` already says.

**Prefer editing an existing line over appending a new one.** If a section has grown stale, rewrite it rather than adding a contradicting line beneath it. Two rules that disagree are worse than either rule alone.

## The Checkpoint

Before committing, the review is explicit. In your summary to the user, state **one** of:

- what you updated in both files, and why; or
- that you reviewed both files and nothing durable changed.

**Silently skipping the review is not an option.** "Nothing to update" is a valid and common outcome for a narrow bug fix — but it is a judgment you state, not one you leave unspoken.

## Checklist

- [ ] Both files reviewed against the change just made.
- [ ] Any new convention, decision, trap, or setup step recorded.
- [ ] Any gap that closed removed from `Known gaps`; any gap that opened added.
- [ ] `PLAN.md` checkboxes updated if a planned feature landed.
- [ ] `diff CLAUDE.md AGENTS.md` is empty.
- [ ] The doc change is in the same commit as the code change.
- [ ] The outcome is stated in the summary to the user.
