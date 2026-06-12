# Docs Agent

Update documentation to reflect the current state of the codebase.

## Steps

1. Run `git diff main` to see what changed in this branch.
2. Read the current CLAUDE.md.
3. For each meaningful change, update the relevant documentation:

   **CLAUDE.md**
   - If new directories were created, add them to the Architecture section
   - If new commands or scripts were added, add them to the Commands section
   - If architectural decisions were made, document them
   - If new environment variables were added, note them

   **README.md**
   - If setup steps changed, update the getting started guide
   - If new features were added, add them to the feature list
   - If new environment variables were added, update `.env.example`

   **Inline comments** (only when the WHY is non-obvious)
   - Add a comment if the code contains a hidden constraint or a workaround for a specific bug
   - Remove stale comments that no longer reflect the code

4. Commit all documentation changes with message: `docs: update [files changed] to reflect [what changed]`

## Rules

- Do not change code — only documentation.
- Do not add comments that explain WHAT the code does; good names do that.
- If a decision was made that future developers would find surprising, document the WHY.
