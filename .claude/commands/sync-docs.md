Analyze the current state of the codebase and update `CLAUDE.md`, `AGENTS.md` and `docs/` to keep them in sync with the code.

## Steps

1. Run `git diff main...HEAD --name-only` for changes since branching, and `git diff --name-only` for uncommitted work.
2. Read `CLAUDE.md`, `AGENTS.md`, and the relevant file in `docs/`.
3. For each changed area, decide whether it introduces or changes:
   - A new section, component, or user-facing claim
   - A design token, motion curve, or component class
   - A content rule, guard, or validator
   - A fact about Irshad's business, or a new unconfirmed one
   - An image, with its licence and provenance
   - A new gate, or a trigger for an existing one
4. Update `CLAUDE.md` for architecture and domain context. Update `AGENTS.md` only if a new mandatory rule, command policy, or Definition of Done item is implied.
5. Update the matching `docs/` file:
   - `content-rules.md` — a new honesty rule (include the bug that prompted it)
   - `dandeli-facts.md` — a verified fact, or one rejected and why
   - `style-guide.md` — tokens, type, motion, component classes
   - `seo.md` — schema or metadata decisions
   - `launch-runbook.md` — anything newly blocked on Irshad
6. **Do not add information that can be trivially derived by reading the code.** Focus on non-obvious constraints, the reasoning behind a decision, and the incident a rule was written after.
7. Do not remove existing content unless it is demonstrably outdated.

## Output

A concise summary of what was updated in each file, or confirmation that no updates were needed.
