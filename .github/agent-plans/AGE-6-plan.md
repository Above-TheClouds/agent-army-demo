# AGE-6: Copy Update Implementation Plan

## 1. Summary
This is a small copy change: update the existing string "Live Demo · WeLoveFounders Expert Talk" to "Live Demo · WeLoveFounders Expert Talk Now!" wherever it appears in the codebase. The change adds urgency to the CTA/banner copy, likely to improve click-through or engagement on a promotional element. Since this is purely a text update, the work is low-risk but requires care to catch every occurrence (including any translation files, OG/meta tags, or analytics event labels that may reference the exact string).

## 2. Implementation steps
1. **Locate all occurrences** of the existing string. Run a case-sensitive repo-wide search for `Live Demo · WeLoveFounders Expert Talk` (note the middle-dot `·`, U+00B7 — not a regular bullet). Also search for variants without the middle dot in case it's rendered via a separator component.
2. **Catalog each hit** and categorize: UI component copy, i18n/locale JSON, marketing/landing page content, meta/OG tags, email templates, analytics event names, tests/snapshots.
3. **Confirm the canonical source.** If copy lives in an i18n file (e.g., `locales/en.json`), update there rather than in the component. If hardcoded, update inline.
4. **Update the string** in each location to `Live Demo · WeLoveFounders Expert Talk Now!` — preserve the middle-dot character exactly and watch for trailing punctuation/whitespace.
5. **Check translations.** If non-English locale files exist, flag them for translation rather than blindly appending "Now!" — leave a TODO or open a follow-up issue.
6. **Update snapshots/tests** that assert on the old string (Jest snapshots, Playwright/Cypress text matchers).
7. **Verify analytics impact.** If the string is used as an event label or selector, either keep the analytics label stable (decouple from display copy) or coordinate with the data team on the rename.
8. **Visually QA** the change in the running app — confirm line wrapping, button width, and any container that may now overflow with the added "Now!".
9. **Open PR** with before/after screenshots.

## 3. Files to create or modify
Best guesses (confirm via search):
- `locales/en.json` or `i18n/en.ts` — if copy is internationalized
- `components/LiveDemoBanner.tsx` / `components/ExpertTalkCTA.tsx` — likely component(s) rendering the string
- `pages/index.tsx` or landing page route — if hardcoded on a marketing page
- `public/og-image` metadata or `next-seo.config` — if used in social previews
- `__snapshots__/*.snap` — any Jest snapshots containing the old copy
- `e2e/*.spec.ts` — any Playwright/Cypress tests asserting the text
- Email templates (`emails/*.tsx` or `templates/*.html`) — if reused

## 4. Edge cases
- **Middle-dot character mismatch:** The `·` (U+00B7) may be confused with `•` (U+2022) or a literal bullet component; search may miss occurrences.
- **String split across elements:** "Live Demo" and "WeLoveFounders Expert Talk" may be rendered as separate spans with a separator component — a single-string search won't find it.
- **Translations:** Non-English locales shouldn't get an English "Now!" appended.
- **Layout overflow:** Added word may push a button/banner past its container, especially on mobile.
- **Analytics drift:** If the display string is also the event label, historical data may break or fragment.
- **Cached/CDN content:** Static OG images or pre-rendered pages may need a rebuild/cache purge.
- **Snapshot tests** will fail and need regeneration.

## 5. Testing approach
- **Unit/snapshot:** Update and re-run Jest snapshots; verify only intended diffs.
- **Component test:** Assert the banner/CTA component renders the new string exactly.
- **E2E:** Update any Playwright/Cypress selectors using text match; run smoke test on the page hosting the banner.
- **Visual regression:** If Chromatic/Percy is in use, review the diff for layout shifts on desktop and mobile breakpoints.
- **Manual QA:** Load the page in dev, confirm copy, check responsive widths (320px, 768px, 1280px), and verify any hover/click states still work.
- **i18n check:** Confirm non-English locales fall back gracefully and don't display a broken or mixed-language string.