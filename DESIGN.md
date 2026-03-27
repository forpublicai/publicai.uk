# Design System — publicai.uk

## Product Context
- **What this is:** A working prototype of a proposed UK public AI service — a sovereign AI layer alongside the BBC, courts, and local councils
- **Who it's for:** UK government officials (AI Minister's office, DSIT advisors) and BBC R&D leadership; secondary audience is the general public
- **Space/industry:** Civic tech / public sector AI — adjacent to editorial, government digital services, institutional publishing
- **Project type:** Marketing/demo site with an interactive live AI demo (`/demo`) powered by the Claude API and real public data feeds

## Aesthetic Direction
- **Direction:** Editorial/Magazine — strong typographic hierarchy, serif headings, disciplined restraint
- **Decoration level:** Minimal — typography and whitespace do all the work; no decorative blobs, gradients, or icon arrays
- **Mood:** Authoritative but not stuffy. The site should feel like the _Financial Times_ or a serious British public institution — trustworthy, precise, understated. Not a startup trying to look trustworthy. Actually trustworthy.
- **Anti-patterns to avoid:** Purple gradients, 3-column icon-circle feature grids, bubbly uniform border-radius, emoji as decoration, stock-photo heroes, "Unlock the power of..." copy

## Typography

- **Display/Hero:** **Source Serif 4** (via `next/font` → `--font-serif` / `font-serif`) — editorial, authoritative; used for `h1`–`h3` and section titles
- **Body:** **Source Sans 3** (`--font-sans` / `font-sans`) — body copy, UI labels, captions
- **Note:** `layout.tsx` loads these Google fonts; fallbacks remain system UI stacks. Older docs referenced Georgia; implementation is Source Serif for consistency with Next/font subsetting.
- **UI/Labels:** Same as body — `text-xs font-semibold uppercase tracking-[0.2em]` for eyebrow labels; this pattern is the site's most distinctive typographic signature — use it consistently
- **Data/Tables / Code / Tool Trace:** `font-mono` (system mono) — used exclusively in the tool trace panel for log-line output; no new font dependency needed
- **Loading:** System fonts only — zero flash of unstyled text, zero layout shift
- **Scale:**
  - Hero: `text-4xl md:text-5xl` (36px / 48px)
  - Section heading: `text-2xl md:text-3xl` (24px / 30px)
  - Card heading: `text-lg` (18px)
  - Body: `text-base` (16px)
  - Small/caption: `text-sm` (14px)
  - Eyebrow/label: `text-xs` (12px)

## Color

- **Approach:** Restrained — one strong **marketing** accent, warm stone neutrals, colour is rare and meaningful
- **Accent / Primary (marketing):** `#f0442c` — eyebrow labels, primary CTAs, header links, consent checkbox; hover `#d33a24`
- **Demo / embedded chat chrome:** `#8C1515` (primary burgundy) on dark surfaces (`#0f0a0a`, `#1a1212`, etc.) — **intentionally separate** from marketing orange-red so the live demo reads as a distinct “product window”
- **Text primary:** `stone-900` (`#1c1917`) — headings, strong UI labels
- **Text secondary:** `stone-600` (`#57534e`) — body copy, nav links, descriptions
- **Text muted:** `stone-500` (`#78716c`) — captions, placeholder text, tool trace empty state
- **Border:** `stone-200` (`#e7e5e4`) — all card and section borders
- **Surface / Background:** `white` — cards, panels; `white/80` or `white/90` with `backdrop-blur-sm` for sticky header
- **CTA — dark:** `stone-900` bg + white text; hover `stone-800`
- **CTA — red:** `#f0442c` bg + white text; hover `#d33a24`
- **CTA — ghost:** `border-stone-300` + `stone-800` text; hover `bg-stone-100`
- **Semantic (tool trace only):**
  - Tool call in-flight (`→`): `text-stone-600` with `animate-pulse`
  - Tool call result (`✓`): `text-stone-700` — intentionally NOT green (keeps palette clean)
  - Tool call error (`✗`): `text-red-500`
- **Dark mode:** Not in scope for this phase

## Spacing

- **Base unit:** 4px (Tailwind default)
- **Density:** Comfortable — generous breathing room for a high-trust institutional feel
- **Scale (Tailwind):** `space-1` (4px) → `space-2` (8px) → `space-3` (12px) → `space-4` (16px) → `space-6` (24px) → `space-8` (32px) → `space-10` (40px) → `space-12` (48px) → `space-16` (64px)

## Layout

- **Approach:** Grid-disciplined — strict `max-w-5xl mx-auto px-6` content container; predictable alignment
- **Max content width:** `max-w-5xl` (1024px)
- **Padding:** `px-6` horizontal on all sections for consistent gutter
- **Border radius hierarchy:**
  - Full-pill buttons: `rounded-full`
  - Cards and panels: `rounded-2xl`
  - Input fields: `rounded-full` or `rounded-xl`
  - Small chips/tags: `rounded-full`
  - NOT uniform — pills for interactive elements, larger radius for containers
- **Two-panel demo layout:**
  - Desktop (≥768px): `grid grid-cols-[1fr_320px] gap-6` — chat left, tool trace right
  - Mobile (<768px): single column — chat full width on top; tool trace collapses to `"How it works ▾"` toggle

## Mode Switcher (demo page)

- Style: underline tabs — `text-xs font-semibold uppercase tracking-[0.2em]`
- Active: `border-b-2` in `#f0442c`, `text-stone-900`
- Inactive: `text-stone-500`, no underline, hover `text-stone-700`
- Role: `role="tablist"` / `role="tab"` / `aria-selected` for accessibility
- No background fill — matches editorial vocabulary of the rest of the site

## Tool Trace Panel

- Header: `text-xs font-semibold uppercase tracking-[0.2em] text-stone-500` — "HOW THIS WORKS"
- Font: `font-mono text-sm`
- Empty state: `text-stone-400` centred — "Ask a question to see how Public AI works — this panel shows each source it calls in real time."
- In-flight: `→ tool_name("args")…` — `text-stone-600 animate-pulse`
- Result: `✓ tool_name · N results · Source` — `text-stone-700`
- Error: `✗ tool_name · error` — `text-red-500`
- Provenance note (always at bottom): `text-xs text-stone-500` — "Answers assembled via structured tool calls. No content stored. Each institution controls its own data."

## Motion

- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** `ease-out` for entering, `ease-in` for exiting
- **Duration:** micro 50–100ms (state changes), short 150–250ms (transitions)
- Tool trace in-flight: `animate-pulse` on the `→` lines only
- Loading dots in chat: animated `●●●` in `stone-900` bubble
- No `transition: all` — list properties explicitly
- Respect `prefers-reduced-motion` — wrap all animations in `@media (prefers-reduced-motion: no-preference)`

## Accessibility

- Mode switcher: `role="tablist"`, each tab `role="tab"` + `aria-selected`; arrow keys between tabs
- Chat input: `aria-label="Ask a question"`, `aria-describedby` → current mode label
- Send button: `aria-label="Send question"`
- Message list: `aria-live="polite"` — announces new messages to screen readers
- Tool trace: `aria-live="off"` — supplementary, doesn't interrupt screen reader
- Session limit input: `aria-label="10 question limit reached"` when disabled
- Share button: `aria-label="Copy link to this conversation"`
- All interactive elements: minimum 44×44px touch target
- `focus-visible` rings on all interactive elements; never `outline: none` without replacement
- Contrast: body text 4.5:1 WCAG AA minimum; `stone-600` on white passes at all text sizes

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Serif (Georgia) for headings | Authority, British editorial register, zero web font overhead |
| 2026-03-19 | `#f0442c` as the single accent | Existing brand red; strong, distinctive, non-corporate |
| 2026-03-19 | Stone neutrals as the palette | Warm, not corporate grey; pairs naturally with the serif |
| 2026-03-19 | Eyebrow label pattern `text-xs uppercase tracking-[0.2em]` | Most distinctive typographic signature — use consistently across all sections |
| 2026-03-19 | Monospace in tool trace only | Keeps log-line style intentional, not a general code aesthetic |
| 2026-03-19 | No green for tool call results | `stone-700` keeps the palette clean; green would introduce a semantic colour not present elsewhere |
| 2026-03-19 | Underline tabs for mode switcher | Matches editorial vocabulary; avoids "SaaS product tab" pill pattern |
| 2026-03-19 | Minimal decoration | Site needs to feel like a public institution, not a startup; decoration erodes trust with this audience |
| 2026-03-19 | No dark mode (Phase 1) | Adds complexity without clear user need for this audience |
| 2026-03-19 | Initial design system created | Created by /design-consultation based on existing codebase tokens + design spec from /plan-design-review |
