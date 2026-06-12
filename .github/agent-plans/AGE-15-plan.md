# AGE-15: Copy Update Plan

## 1. Summary
Single string change on the homepage: replace "Every week at Level 4 compounds." with "Every week at Level 100 compounds." in `app/page.tsx`. No other content, styling, or structure should be touched. This is a pure copy edit, likely tied to brand/messaging alignment around the "Level 100" concept used elsewhere in the product.

## 2. Implementation steps
1. Open `app/page.tsx` and locate the exact string "Every week at Level 4 compounds."
2. Confirm there is only one occurrence (grep the repo to be safe).
3. Replace "Level 4" with "Level 100", preserving surrounding punctuation, whitespace, and JSX structure.
4. Verify no adjacent copy, className, or element was altered in the diff.
5. Run the dev server locally and visually confirm the new text renders on the homepage.
6. Run lint and typecheck to confirm no incidental issues.
7. Commit with message referencing AGE-15.

## 3. Files to create or modify
- `app/page.tsx` (modify, one line)

## 4. Edge cases
- The string might appear inside a JSX expression, template literal, or be split across lines; ensure the replacement matches the actual source formatting.
- If the same phrase appears in metadata, OG tags, or a constants file imported into the page, those would also need updating (verify via repo wide search).
- Watch for any test snapshots that include the old string; they will need regeneration.
- Confirm "Level 100" is the intended casing (not "level 100" or "LVL 100") per the issue text.

## 5. Testing approach
- Manual: load `/` in dev, confirm the new sentence renders exactly as "Every week at Level 100 compounds."
- Automated: if a snapshot or RTL test asserts on this homepage text, update the expected string. Otherwise no new tests are warranted for a static copy change.
- CI: lint, typecheck, and build must pass.