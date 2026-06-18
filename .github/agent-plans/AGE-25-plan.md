# AGE-25: Homepage Text Update Plan

## 1. Summary
The homepage contains a closing line "The window to build this moat is now." that needs to be updated to "The window to build this moat is now OR NEVER AHAHHHHH PART SUCCESS IS REAL NOW!". This is a pure copy change in `app/page.tsx` with no behavioral or structural impact. The goal is to ship the new wording exactly as specified while preserving any surrounding emphasis (italic, bold) and punctuation conventions already used on that line.

## 2. Implementation steps
1. Open `app/page.tsx` and locate the string "The window to build this moat is now."
2. Confirm whether the text sits inside an `<em>`, `<i>`, `<strong>`, or styled `<span>` so the replacement preserves the same wrapping element.
3. Replace the literal string with "The window to build this moat is now OR NEVER AHAHHHHH PART SUCCESS IS REAL NOW!" keeping the same JSX wrapper.
4. Verify no other file (metadata, OG description, sitemap, or marketing component imported into the page) duplicates the old sentence; if so, flag to the reviewer before changing (the issue only specifies the homepage).
5. Run `pnpm lint` (or the repo's configured linter) and `pnpm build` to confirm no JSX or type regressions.
6. Visually verify in dev (`pnpm dev`) that the new sentence renders on `/` with correct casing, spacing, and styling.

## 3. Files to create or modify
- `app/page.tsx`

## 4. Edge cases
- The repo context provided is empty, so the exact line may live in a child component imported by `app/page.tsx` rather than the page itself. If so, update the component file where the string actually lives.
- The new string is significantly longer and may cause layout shifts, line wrapping issues, or overflow on small screens. Confirm responsive rendering.
- If the original text is split across multiple JSX nodes (for example, the period in a separate span), the replacement must be reconstructed correctly.
- Screen readers will read the new emphatic phrasing literally; confirm with stakeholders the all caps and repeated H letters are intentional and not a typo before merging.
- Any snapshot tests or e2e tests asserting the old copy will fail and must be updated.

## 5. Testing approach
- Manual: load `/` in dev at mobile, tablet, and desktop widths; confirm the new sentence renders, wraps cleanly, and keeps existing emphasis.
- Automated: search the test suite for the old string and update any snapshot or Playwright/Cypress assertion to the new copy.
- Build check: ensure `next build` passes.
- Optional: a lightweight test (RTL) asserting the homepage renders the new exact string, to lock in the copy.