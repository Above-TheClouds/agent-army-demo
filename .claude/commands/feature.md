# Feature Agent

Read the Linear issue at $ARGUMENTS and implement it.

## Steps

1. Fetch the issue title, description, and any linked issues from Linear using the Linear MCP or by reading the URL provided.
2. Read CLAUDE.md to understand the architecture, naming conventions, and relevant directories.
3. If the feature involves any UI changes, read DESIGN.md and follow it exactly — colors, spacing, typography, and component patterns.
4. Explore the codebase to find the files most likely to be affected.
5. Implement the feature following the conventions in CLAUDE.md.
6. Write unit tests covering the happy path and at least two edge cases.
7. Run the test suite and fix any failures before continuing.
7. Open a draft PR with:
   - Title: `[LINEAR-ID]: [issue title]`
   - Body: summary of what was built, files changed, and how to test
   - Link back to the Linear issue

## Rules

- Do not commit directly to `main`.
- Do not push without passing tests.
- If anything is unclear, post a comment on the Linear issue asking for clarification — do not guess.
