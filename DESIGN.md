# Design System — agent-army-demo

Matches the AI Agent Army presentation deck exactly.

---

## Brand

**Primary color (gold):** `#ffd700` → `var(--gold)`
**Background:** `#07080c` → `var(--bg)`
**Text primary:** `#e8e4dc` → `var(--text)`
**Text muted:** `rgba(232, 228, 220, 0.55)` → `var(--muted)`
**Card background:** `rgba(255, 255, 255, 0.035)` → `var(--card)`
**Border:** `rgba(255, 215, 0, 0.14)` → `var(--border)`
**Glow:** `rgba(255, 215, 0, 0.12)` → `var(--glow)`

---

## Typography

**Serif (headings):** `Georgia, 'Times New Roman', serif` — italic for emphasis, weight 400
**Sans (body/UI):** `Manrope, system-ui, sans-serif`
**Mono (code):** `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`

**Scale:**
- Label/eyebrow: 11px, weight 700, `var(--gold)`, uppercase, letter-spacing 0.24em
- Body small: 13–14px, weight 300–400, `var(--muted)`
- Body: 16–20px, weight 300, `var(--muted)`, line-height 1.7
- Heading large: `clamp(28px, 4vw, 48px)`, serif, weight 400
- Hero: `clamp(40px, 7vw, 80px)`, serif, weight 400

---

## Spacing

**Base unit:** 4px
**Section padding:** 120px top/bottom, 48px left/right
**Card padding:** 28px 24px
**Gap between cards:** 24px

---

## Components

**Primary button:** background `var(--gold)`, color `#07080c`, weight 700, padding `13px 32px`, border-radius 4px
**Ghost button:** border `1px solid var(--border)`, color `var(--muted)`, padding `13px 32px`, border-radius 4px
**Card:** background `var(--card)`, border `1px solid var(--border)`, border-radius 8px
**Tag/pill:** border `1px solid var(--border)`, border-radius 999px, padding `8px 20px`, color `var(--muted)`
**Nav:** height 56px, background `rgba(7,8,12,0.88)`, backdrop-filter blur(12px)

---

## Layout

**Max content width:** 1100px, centered with `margin: 0 auto`
**Page padding:** 48px horizontal
**Grid:** `repeat(auto-fit, minmax(220px, 1fr))`, gap 24px

---

## Tone

**Style:** Dark, minimal, editorial
**Motion:** None — no animations or transitions
**Density:** Spacious — let content breathe

---

## What agents must never do

- Hardcode color values — always use `var(--token)` from globals.css
- Use Tailwind classes or inline style objects with raw hex values
- Add decorative animations or hover effects not already present
- Change the serif/sans/mono font families
- Use font weights other than 300, 400, 600, 700
