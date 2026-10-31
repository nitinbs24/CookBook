# Recipe Book — UI/UX Brief

| | |
|---|---|
| **Status** | v1 — 31 Oct 2026 |
| **Implements** | `PRD.md` §3–§6 (screens and flows) |
| **Stack** | React + Vite, Tailwind CSS, `lucide-react` icons |
| **Source** | ui-ux-pro-max design-system search ("Minimalism & Swiss Style", Inter), adapted. See ADR 0007 (written in Phase 4) |

---

## 1. Direction

A quiet, content-first cookbook. The food photos and recipe text are the only colourful things on the page; the interface stays neutral, so it reads like a printed recipe card rather than a social feed.

| Principle | Means |
|---|---|
| Content first | Photos and recipe text carry the page; chrome is hairline borders and white space |
| One accent | A single warm accent (terracotta) for links, focus, and an active like; everything else is neutral |
| Grid discipline | 12-column grid, 24 px gutters, consistent 8 px spacing steps |
| Quiet motion | 150–200 ms colour and opacity transitions only; nothing slides or bounces |
| Food labels stay meaningful | The palette has no other greens or browns, so the veg / non-veg marks are never confused with UI colour |

**Avoid:** gradients, glassmorphism, 3D, heavy or layered shadows, emoji as icons, carousels that auto-rotate, testimonials (there are no real ones).

---

## 2. Platform

**Desktop only** (this replaces PRD NFR-4, "usable at 360 px").

| Item | Value |
|---|---|
| Minimum viewport | 1280 px (`body { min-width: 1280px }`); narrower windows scroll horizontally rather than reflow |
| Content width | `max-width: 1200px`, centred, 40 px side padding |
| Card grid | 4 columns (cards ~282 px wide) |
| Category tiles | 5 × 2 grid |
| Input | Mouse and keyboard; hover states are allowed but never the only way to reach something |

---

## 3. Design tokens

Defined as CSS variables on `:root` (light) and `.dark` (dark), and mapped to Tailwind colour names, so components never contain raw hex values.

### 3.1 Colour

| Token | Tailwind name | Light | Dark | Use |
|---|---|---|---|---|
| `--bg` | `bg` | `#FFFFFF` | `#0C0A09` | Page background |
| `--surface` | `surface` | `#FAFAF9` | `#1C1917` | Cards, inputs, table header, navbar |
| `--fg` | `fg` | `#1C1917` | `#FAFAF9` | Body text, headings |
| `--muted-fg` | `muted` | `#57534E` | `#A8A29E` | Secondary text, meta, placeholders |
| `--border` | `line` | `#E7E5E4` | `#292524` | Hairlines, dividers, input borders |
| `--primary` | `primary` | `#1C1917` | `#FAFAF9` | Primary button background |
| `--on-primary` | `on-primary` | `#FFFFFF` | `#0C0A09` | Primary button text |
| `--accent` | `accent` | `#C2410C` | `#FB923C` | Links, focus ring, active like heart, stars |
| `--destructive` | `danger` | `#B91C1C` | `#F87171` | Delete buttons, error text |
| `--veg` | `veg` | `#15803D` | `#4ADE80` | Veg mark |
| `--nonveg` | `nonveg` | `#92400E` | `#F59E0B` | Non-veg mark (egg counts as non-veg) |

Contrast (text on `--bg`) is at least 4.5:1 for `fg`, `muted`, `accent`, `danger`, `veg`, and `nonveg` in both themes. Re-check if any value changes.

### 3.2 Theme

- `ThemeContext` holds `light | dark | system`, stored in `localStorage.rb_theme`, default `system`.
- `system` follows `prefers-color-scheme` and updates live.
- The `.dark` class goes on `<html>`. A tiny inline script in `index.html` applies it before first paint, so there is no light flash.
- The toggle in the navbar cycles through the three options. It is an icon button (Sun / Moon / Monitor) with an `aria-label` naming the current mode.

### 3.3 Typography

Inter (Google Fonts), weights 400 / 500 / 600 / 700.

| Role | Size / line-height | Weight |
|---|---|---|
| Display (landing headline) | 48 / 56 | 700, tracking −0.02em |
| H1 (page title) | 32 / 40 | 600, tracking −0.01em |
| H2 (section) | 24 / 32 | 600 |
| H3 (card title, form group) | 20 / 28 | 600 |
| Body | 16 / 24 | 400 |
| Small (meta, labels) | 14 / 20 | 500 |
| Caption (badges, table meta) | 12 / 16 | 500 |

### 3.4 Spacing, radius, elevation

| Token | Value |
|---|---|
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64, 96 px |
| Radius | 6 px (inputs, buttons), 8 px (cards, tiles, images), 999 px (chips, toggle) |
| Border | 1 px `--border` |
| Shadow | None at rest. Cards on hover: `0 1px 2px rgb(0 0 0 / 0.06)`, plus the border turns `--fg` at 20% |
| Focus | `outline: 2px solid var(--accent); outline-offset: 2px` on every interactive element (never removed) |

### 3.5 Motion

- Colour, border, and opacity transitions at 150 ms (hover) to 200 ms (dialogs fading in). Ease-out.
- No layout animation. No scroll-triggered reveals.
- `@media (prefers-reduced-motion: reduce)` sets every transition to 0 ms.

### 3.6 Icons

`lucide-react`, 20 px in the UI, 16 px inline with text, stroke 1.75. Icon-only buttons always have an `aria-label`; decorative icons get `aria-hidden="true"`.

---

## 4. Components

| Component | Spec |
|---|---|
| **Navbar** | 64 px tall, `surface` background, bottom hairline, sticky. Left: wordmark "Recipe Book". Centre: FoodType toggle. Right: theme toggle, "Add recipe" (users), then the account menu (My recipes, Want to try, Admin for admins, Log out) or Log in / Sign up for guests |
| **FoodTypeToggle** | Segmented control with three options: Both · Veg · Non-veg. The active option has a `primary` background. Veg / Non-veg options show their dot. It is a radio group for keyboard users (arrow keys move between options) |
| **VegMark** | 14 px square outline in `veg` or `nonveg`, a filled 6 px dot inside, plus the text "Veg" or "Non-veg" (12 px caption). Never colour alone |
| **RecipeCard** | 4:3 cover image (lazy, with a reserved aspect ratio so nothing shifts), then title (H3, 2 lines max), dish name (muted, links to the dish filter), and a meta row: VegMark · ★ 4.5 (12) · ♥ 31 · author. The whole card is one link; the dish name is a separate link inside it |
| **CategoryTile** | Square image, or a neutral `surface` block with the category initial when `imageUrl` is null. Name (H3) and "N recipes" (muted). Tiles with 0 matching recipes are not rendered (the API leaves them out) |
| **LikeButton** | Heart icon plus count. Outline when not liked; filled `accent` when liked. Optimistic: it flips at once and reverts with a toast if the API call fails. Guests see it but get the guest prompt |
| **ImageGallery** | Large 4:3 cover image. Up to two thumbnails below it; clicking one swaps the cover |
| **IngredientList** | Table-like rows: quantity + unit (right-aligned, tabular numbers), name, note (muted, italic). Sticky in the right column on the recipe page |
| **InstructionSections** | Section heading (H3) when present. Numbered steps (the number in a 28 px circle outline). Duration shown as a clock icon + "8 min" chip. Tip in a `surface` box with a lightbulb icon |
| **ReviewList / ReviewForm** | Average rating, star bar, and count at the top. Each review: name, stars, date, comment. The form has a 1–5 star radio group (keyboard reachable) and a textarea. It is hidden on your own recipe, and replaced by "You reviewed this" after you post. Admins see a delete button on every review |
| **Pagination** | Prev · page numbers (current one bold with an underline) · Next. It updates `?page=` in the URL |
| **ConfirmDialog** | Modal with a focus trap; Escape closes it. Title, one sentence on what will be deleted, then Cancel (secondary) and Delete (`danger`). Focus returns to the button that opened it |
| **GuestPrompt** | A dialog: "Sign up to like and review recipes" with Sign up and Log in buttons |
| **EmptyState** | Icon, one-line message, and an optional call to action (e.g. "No recipes yet — Add the first one") |
| **Skeleton** | `surface` blocks the same shape as the content they stand in for, with no shimmer animation |
| **Toast** | Bottom right, 4 s, `role="status"`. Used for API errors and confirmations (e.g. "Recipe deleted") |
| **Buttons** | Primary (`primary` background), Secondary (border only), Ghost (text only), Danger. 40 px tall, 16 px horizontal padding, 14 px / 500 text |
| **Inputs** | 40 px tall, `surface` background, 1 px border; the border turns `accent` on focus. The label sits above (never a placeholder-only label). The error message goes below the field in `danger`, linked with `aria-describedby` |

---

## 5. Screens

### 5.1 Landing `/`
Centred single column, 640 px wide. Display headline ("Cook what other home cooks swear by."), a two-line intro, then three buttons: **Sign up** (primary), **Log in** (secondary), **Continue as guest** (ghost). Below that, three feature highlights in a row, each with an icon, a title, and one line: Browse by main ingredient · Veg / non-veg everywhere · Save what you want to try. No navbar toggle on this page. Redirects to `/home` if there is a token or the guest flag.

### 5.2 Login / Register
Centred card, 400 px. Name (register only), email, and password fields with inline errors. One server error line for a wrong login ("Email or password is incorrect"). A link to the other form. After success, go to `/home`.

### 5.3 Home `/home`
1. **Trending this week**: H2, then a single row of up to 4 visible cards, with a horizontal scroll strip for the rest (scroll buttons at both ends, not drag-only). Hidden when the list is empty.
2. **Browse by ingredient**: 5 × 2 category tile grid.
3. **Latest recipes**: H2 with a search input on the right (debounced 300 ms, matches title and dish name), then the 4-column card grid (12 per page) and pagination.

### 5.4 Category `/category/:slug`
Breadcrumb (Home / Paneer), H1 with the count. When a dish filter is active: a chip "Paneer Butter Masala ×" that clears it. Card grid, newest first, then pagination. Empty state when nothing matches the toggle.

### 5.5 Recipe `/recipes/:id`
- **Top**, 12 columns. Left 7: ImageGallery. Right 5: VegMark and category chip, title (H1), dish name, author and date, a stats row (prep · cook · servings · difficulty), rating, then LikeButton. Owner sees Edit and Delete; admins see Delete.
- **Middle**. Left 7: description, then InstructionSections. Right 5: IngredientList (sticky, `top: 88px`).
- **Bottom**, 7 columns: Reviews.

### 5.6 Recipe form `/recipes/new`, `/recipes/:id/edit`
One column, 760 px, in grouped sections with H3 headings: Photos (1–3 drop zones, the first marked "Cover", upload progress, remove) · Basics (title, description, category select, dish name, food type radio, difficulty, servings, prep / cook minutes) · Ingredients (rows of name / qty / unit / note with remove, then "Add ingredient") · Instructions (section cards, each with a title and step rows of text / minutes / tip, plus "Add step" and "Add section"). A sticky footer bar holds Cancel and **Save recipe**. On a failed save it scrolls to and focuses the first error.

### 5.7 My recipes `/me/recipes` · Want to try `/me/likes`
H1, card grid, pagination. Both follow the toggle. Empty states: "You haven't posted a recipe yet — Add recipe" and "Like a recipe to save it here — Browse recipes".

### 5.8 Admin `/admin`
H1, then two tabs: **Recipes** · **Users**.
- Recipes: a search box (title), then a table with thumbnail 48 px, title (link), author (name and email), category, VegMark, rating, likes, date, and a Delete action. Pagination.
- Users: a table with name, email, role badge, recipes count, and joined date. Clicking a row opens that user's recipes in the same table layout, with a back link.
Hidden from non-admins; the route sends them to `/home`.

---

## 6. States and feedback

| Situation | Treatment |
|---|---|
| Loading a list | Skeleton cards in the same grid |
| Loading a recipe | Skeleton for the gallery and text block |
| Empty list | EmptyState with a call to action |
| API error | Toast, plus an inline retry for whole-page failures |
| 404 recipe | "Recipe not found" page with a link home |
| Guest action | GuestPrompt dialog |
| Save in progress | Button shows a spinner and the "Saving…" label, and is disabled |
| Destructive action | ConfirmDialog, then a toast on success |

---

## 7. Accessibility checklist

- [ ] Text contrast ≥ 4.5:1 in light and dark mode
- [ ] Visible focus outline on every interactive element
- [ ] Every input has a visible `<label>`; errors linked with `aria-describedby`
- [ ] Icon-only buttons have `aria-label`
- [ ] Veg / non-veg always has a text label
- [ ] Dialogs trap focus, close on Escape, and return focus
- [ ] Star rating and food-type toggle work with arrow keys
- [ ] Images have `alt` (the recipe title; decorative images use `alt=""`)
- [ ] `prefers-reduced-motion` respected
- [ ] Every hover-only affordance also works by keyboard
