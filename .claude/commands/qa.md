# QA Agent

Review the current branch and produce a QA checklist, risk assessment, and tests where possible.

## Steps

1. Run `git diff main` to see all changes.
2. Read `CLAUDE.md` to understand the architecture and any domain-specific risk areas.

3. **Risk assessment** — for each changed file, identify:
   - What user-facing behaviour changed
   - What could silently break (edge cases, race conditions, null inputs)
   - What other parts of the system this touches (data, auth, external APIs)

4. **QA checklist** — produce a checklist of what a human tester should verify:
   - Happy path scenarios
   - Edge cases (empty, null, max length, concurrent actions)
   - Error states and recovery
   - Mobile / responsive behaviour if UI was changed
   - Accessibility: keyboard navigation, focus management, screen reader labels

5. **Unit tests** — for any changed business logic that lacks test coverage, write the missing tests.
   - Cover the happy path and at least two edge cases per function
   - Do not delete or weaken existing tests

6. **End-to-end tests** — if Playwright or Cypress is configured in the project, write e2e tests for the critical user flows identified in step 3. Skip this step if no e2e framework is set up.

7. Run the full test suite and report results. Fix any failures caused by the current changes (do not suppress or skip tests).

8. Produce a final report with four sections:
   - **Risk: High** — must be tested before merge
   - **Risk: Medium** — should be tested, acceptable to defer to staging
   - **Risk: Low** — covered by automated tests
   - **Tests written** — list of new test files and what they cover

## Rules

- Do not change application code — only test files.
- Do not write tests that mock the thing being tested (e.g. mocking a function to test that same function).
- If a risk cannot be covered by automation, say so explicitly and add it to the manual QA checklist.
- If the change touches auth, payments, or data deletion — mark it High risk regardless of test coverage.
