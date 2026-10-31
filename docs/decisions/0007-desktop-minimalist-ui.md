# ADR-0007: Desktop-only minimalist UI with CSS-variable tokens and a dark mode

## Status
Accepted (supersedes PRD NFR-4, "usable on a phone-width screen")

## Date
2026-10-31

## Context
The owner asked for a minimalist theme, desktop only, plus a dark mode. The PRD originally required a 360 px layout (NFR-4). The UI must keep the veg / non-veg marks (green / brown) easy to read, and meet WCAG contrast in both themes. The details are in `docs/UI_UX_BRIEF.md`.

## Decision
- **Desktop only:** `body { min-width: 1280px }`, content centred at `max-width: 1200px`, a 4-column card grid. There are no responsive breakpoints; narrower windows scroll horizontally.
- **Swiss minimalism:** neutral stone greys, one terracotta accent, hairline borders, Inter, and no gradients or heavy shadows. The UI has no greens or browns, so the food-type marks stay unambiguous.
- **Tokens as CSS variables:** colours are defined once on `:root` (light) and `.dark` (dark) in `frontend/src/index.css`, then mapped to Tailwind names (`bg`, `surface`, `fg`, `muted`, `line`, `primary`, `accent`, `danger`, `veg`, `nonveg`) with `@theme inline`. Components never use raw hex values. Every text token is at least 4.5:1 against both the background and the surface in both themes (checked with a script when the brief was written).
- **Theme switching:** `ThemeContext` stores `light | dark | system` in `localStorage.rb_theme` and puts the `.dark` class on `<html>`. A small inline script in `index.html` applies the saved theme before first paint, so there is no light flash. Tailwind's `dark:` variant follows the class (`@custom-variant dark`).
- **Shared component classes** (`btn-*`, `input`, `link`) are Tailwind v4 `@utility` rules, so they can `@apply` each other. `@layer components` classes can't be applied in v4.
- **Native first:** the veg / non-veg toggle uses real radio inputs (arrow keys and screen readers work without custom code). Dialogs will use the native `<dialog>` element. Icons are `lucide-react` SVGs.

## Alternatives Considered

### Responsive layout as in the original PRD
- Pros: works on phones.
- Cons: more layout work and testing; the owner explicitly scoped this to desktop.
- Rejected.

### A component library (shadcn/ui, MUI)
- Pros: ready-made dialogs, menus, and toasts.
- Cons: extra dependencies and their default look, when the screens need about a dozen simple components.
- Rejected under the ponytail rule (no dependency for a few lines).

### Tailwind `dark:` classes on every component, with no CSS variables
- Pros: no custom CSS.
- Cons: every component carries two colour sets, which drift apart.
- Rejected: one set of variables per theme keeps components theme-agnostic.

## Consequences
- The app is unusable on phones by design.
- Adding a colour means adding a variable to both `:root` and `.dark`, plus a `@theme inline` mapping, and re-checking its contrast.
- The inline theme script in `index.html` and `ThemeContext` must stay in sync (same storage key, same rules).
