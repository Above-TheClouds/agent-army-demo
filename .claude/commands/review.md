# Review Agent

Review the current branch or PR diff and produce a structured code review.

## Steps

1. Run `git diff main` (or the base branch) to see all changes.
2. Read CLAUDE.md to understand naming conventions, architecture rules, and agent guidelines.
3. For each changed file, check:

   **Security**
   - Input validation at system boundaries
   - No secrets or credentials in code or logs
   - No SQL injection, XSS, or command injection vectors
   - Auth checks present where required

   **Correctness**
   - Edge cases handled (null, empty, out-of-range inputs)
   - Error handling present and meaningful
   - No silent failures or swallowed exceptions

   **Tests**
   - New code has test coverage
   - Tests cover both happy path and edge cases
   - No tests deleted without justification

   **Conventions**
   - Naming follows CLAUDE.md conventions
   - No unnecessary abstraction or premature optimisation
   - No dead code or commented-out blocks

4. Produce a structured review with three sections:
   - **Must fix** — blocks merge
   - **Should fix** — strong recommendations
   - **Notes** — observations, questions, or suggestions

5. If there are no blockers, end with: `✅ Approved — ready to merge after addressing notes.`
