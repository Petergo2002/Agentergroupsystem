# Project Design System

> **Purpose:** This document defines the **single, canonical design system** for this project. All UI (manual or AI‑generated) **MUST** follow these rules without deviation. If a design decision is not covered here, extend this file first, then implement.

---

## 1. Foundations

### 1.1 Color System

All colors are defined as **semantic tokens**. Implement them in Tailwind via custom CSS variables (e.g. in `globals.css` / Tailwind config) and in TypeScript via a central `colors.ts`.

#### 1.1.1 Semantic palette

- **Primary**
  - `--color-primary`: `#10B981` (emerald‑500)  
  - `--color-primary-foreground`: `#FFFFFF`
- **Secondary**
  - `--color-secondary`: `#3B82F6` (blue‑500)  
  - `--color-secondary-foreground`: `#FFFFFF`
- **Background**
  - `--color-bg`: `#020617` (slate‑950) – app background  
  - `--color-bg-elevated`: `#020617` on main; use surfaces for cards/panels
- **Surface** (panels, cards, sheets)
  - `--color-surface`: `#020617` (or `#050816` if you want a tiny contrast step)  
  - `--color-surface-soft`: `#020617` with `border-white/10`  
  - `--color-surface-strong`: `#020617` with `border-white/20`
- **Border**
  - `--color-border`: `rgba(148, 163, 184, 0.35)` (slate‑400 at ~35%)  
  - `--color-border-subtle`: `rgba(148, 163, 184, 0.18)`
- **Text**
  - `--color-text`: `#F9FAFB` (primary text on dark)  
  - `--color-text-muted`: `#9CA3AF`  
  - `--color-text-soft`: `#6B7280`
- **Error**
  - `--color-error`: `#EF4444` (red‑500)  
  - `--color-error-soft`: `rgba(239, 68, 68, 0.12)`  
  - `--color-error-border`: `rgba(248, 113, 113, 0.5)` (red‑400)
- **Success**
  - `--color-success`: `#22C55E` (green‑500)  
  - `--color-success-soft`: `rgba(34, 197, 94, 0.12)`  
  - `--color-success-border`: `rgba(52, 211, 153, 0.5)`
- **Warning** (optional but fixed)
  - `--color-warning`: `#F97316` (orange‑500)  
  - `--color-warning-soft`: `rgba(249, 115, 22, 0.12)`
- **Info**
  - `--color-info`: `#0EA5E9` (sky‑500)  
  - `--color-info-soft`: `rgba(14, 165, 233, 0.12)`

#### 1.1.2 Tailwind mapping

All colors in UI code **must** be referenced via Tailwind classes wired to the tokens above. Examples (do not deviate):

- Backgrounds
  - App background: `bg-[#020617]` or `bg-background` (if using CSS vars)
  - Surfaces: `bg-[#020617] border-white/10`
- Primary
  - Default primary: `bg-emerald-600 hover:bg-emerald-700 text-white`
- Borders
  - Default border: `border-white/10`
- Text
  - Primary text: `text-white`
  - Muted text: `text-gray-400`

**Rule:** Do **not** invent new arbitrary colors. Use only:

- Hard‑coded neutrals already consistent in the app (`#020617`, `#111111`, `white/10`, `gray‑400`), or
- The semantic Tailwind palette bound to this design system.

---

### 1.2 Typography

#### 1.2.1 Font family

- **Single font family everywhere:**
  - `font-sans`: `system-ui, -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", sans-serif`
- No serif or mono for body content except for code.

#### 1.2.2 Heading scale

All headings use the same visual scale. Use Tailwind utilities exactly as below.

- **H1 – Page title**
  - Class: `text-2xl md:text-3xl font-bold tracking-tight`
  - Usage: Top page titles only (1 per page).
- **H2 – Section heading**
  - Class: `text-xl font-semibold`
- **H3 – Subsection heading**
  - Class: `text-lg font-semibold`
- **H4 – Minor title / card title**
  - Class: `text-base font-semibold`

#### 1.2.3 Body text

- **Body / default**
  - Class: `text-sm text-gray-300`
- **Muted**
  - Class: `text-sm text-gray-400`
- **Label / meta**
  - Class: `text-xs uppercase tracking-wide text-gray-400`

#### 1.2.4 Weights

- Regular body: `font-normal`
- Emphasis: `font-medium`
- Strong emphasis/headings: `font-semibold` or `font-bold` (for H1 only).

**Rule:** Do not use arbitrary sizes like `text-[13px]`. Use only the scale above.

---

### 1.3 Spacing & Sizing

We use an 8px base grid.

#### 1.3.1 Spacing scale (Tailwind)

- `0` → `0px`
- `1` → `4px`  
- `2` → `8px`
- `3` → `12px`
- `4` → `16px`
- `5` → `20px`
- `6` → `24px`
- `8` → `32px`
- `10` → `40px`
- `12` → `48px`
- `16` → `64px`

**Allowed spacing values:** `1,2,3,4,5,6,8,10,12,16`. Do not introduce others unless you first update this document.

#### 1.3.2 Layout rules

- **Page padding:** `px-6 py-4` on primary shells / headers.
- **Card padding:** `p-4` or `p-6`. Inside complex cards, nested elements use `space-y-3` or `space-y-4`.
- **Section gaps:**
  - Vertical stacking: `space-y-4` or `space-y-6`.
  - Horizontal layouts: `gap-3` or `gap-4`.
- **Max width for main content:** `max-w-5xl` or `max-w-6xl` for detailed UIs.

#### 1.3.3 Radius

- Global radius: **8px**.
- Mapping:
  - Default radius: `rounded-lg` (8px).
  - Pills/badges: `rounded-full`.

No other radii unless strictly needed (e.g. bespoke PDF preview frame). If needed, add to this doc.

---

## 2. Component Standards (shadcn/ui)

All components are built on top of shadcn/ui primitives with Tailwind. The following rules are **binding**.

### 2.1 Button

- **Base variant:**
  - Classes: `inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none`
  - `ring-offset-background` if using CSS vars.
- **Variants:**
  - `variant="default"` (primary)
    - `bg-emerald-600 hover:bg-emerald-700 text-white`
  - `variant="outline"`
    - `border border-white/10 bg-transparent hover:bg-white/10 text-gray-100`
  - `variant="ghost"`
    - `bg-transparent hover:bg-white/10 text-gray-300`
  - `variant="destructive"`
    - `bg-red-600 hover:bg-red-700 text-white`
- **Sizes:**
  - `size="sm"`: `h-8 px-3 text-xs`
  - `size="default"`: `h-9 px-4 text-sm`
  - `size="lg"`: `h-10 px-5 text-sm`

**Icons:**

- Left icon margin: `mr-2`.
- Right icon margin: `ml-2`.
- Icon size in buttons: `w-4 h-4`.

### 2.2 Card

- Wrapper: `Card` with:
  - `bg-[#020617] border border-white/10 rounded-lg`.
  - Inner padding via `CardContent` using `p-4` or `p-6`.
- `CardHeader`:
  - `border-b border-white/10 pb-3 mb-3` when used as a top section.

### 2.3 Input

- Base class:
  - `h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

**States:**

- Error: add `border-red-500` and show helper text `text-xs text-red-400 mt-1`.
- Disabled: rely on `disabled:` utilities only.

### 2.4 Dialog

- Use shadcn `Dialog` primitives.
- **Overlay:** `bg-black/60 backdrop-blur-sm`.
- **Content:**
  - `bg-[#111111] border border-white/10 rounded-lg p-6 max-w-lg w-full`.
- Buttons inside `DialogFooter` follow the same Button rules.

### 2.5 Sheet

- Side sheet for secondary flows.
- **Content:**
  - `bg-[#111111] border-l border-white/10 w-full max-w-md` (for right side).
- Padding: `p-6` inside.

### 2.6 Table

- Use shadcn `Table` primitives.
- **Header row:** `bg-white/5` with `text-xs text-gray-400 uppercase`.
- **Cell padding:** `px-3 py-2`.
- **Borders:** rows separated by `border-b border-white/5`.

### 2.7 Navbar

- Top navigation bar:
  - `h-14 flex items-center justify-between px-6 border-b border-white/10 bg-[#111111]`.
- Title:
  - `text-sm font-semibold text-white`.
- Right actions: `flex items-center gap-2` using the Button component.

### 2.8 Sidebar

- Vertical sidebar:
  - `w-60 bg-[#020617] border-r border-white/10 flex flex-col`.
- Nav items:
  - `flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5`.
  - Active item: `bg-white/10 text-white`.

---

## 3. Tailwind Conventions

- **No arbitrary pixel values** except for already standardized backgrounds (`bg-[#0a0a0a]`, `bg-[#111111]`) and where present in legacy code.
- **Spacing:** use the scale in §1.3.
- **Colors:** use semantic mapping; avoid raw hex unless mapping new tokens.
- **Flex/grid:**
  - Layout: `flex`, `flex-col`, `gap-*`.
  - Grid for lists: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- **Scroll areas:**
  - Use `overflow-y-auto` on main content; never on root `body`.

Class ordering should follow a consistent pattern:

1. Layout (`flex`, `grid`, `items-*`, `justify-*`).
2. Sizing (`w-*`, `h-*`, `max-w-*`).
3. Spacing (`p-*`, `m-*`, `gap-*`, `space-*`).
4. Borders & radius (`border-*`, `rounded-*`).
5. Colors (`bg-*`, `text-*`).
6. Typography (`text-*`, `font-*`).
7. Effects (`shadow-*`, `ring-*`, `transition-*`).

---

## 4. Naming Conventions

### 4.1 Component names

- React components: **PascalCase**.
  - `ReportStudioV2`, `TemplateList`, `RapportSettingsSimple`.
- Shared UI components under `components/ui`: generic names (`Button`, `Card`, `Input`).
- Feature components: `FeatureArea/DescriptiveName`, e.g.:
  - `components/report-studio-v2/TemplateEditor.tsx`.
  - `components/rapport/RapportSettingsSimple.tsx`.

### 4.2 File and folder structure

- Feature‑first mapping:
  - `components/report-studio-v2/*` – Report Studio v2.
  - `components/rapport/*` – Report builder / main reports UI.
  - `components/admin/*` – admin‑only shells.
- UI primitives in `components/ui/*` only.

**Rule:** When adding a new piece of UI logic for a feature, place it in that feature’s folder. Do not mix feature and primitive layers.

---

## 5. Design Principles

### 5.1 Simplicity

- Prefer fewer controls per view.
- Group related actions into clear sections or cards.
- Avoid secondary borders within a card; rely on spacing and typography.

### 5.2 Clean spacing

- Always leave at least `py-4 px-6` around primary content areas.
- Use `space-y-*` and `gap-*` instead of manual margins where possible.
- Do not compress UIs: small text + zero padding is forbidden.

### 5.3 Consistent radius

- All interactive elements and surfaces use `rounded-lg`.
- Only badges and pills use `rounded-full`.

---

## 6. State Rules

### 6.1 Loading state

- Buttons:
  - Add spinner icon (`IconLoader2`) with `animate-spin w-4 h-4` before label.
  - Disable button: `disabled` + `disabled:opacity-50 disabled:pointer-events-none`.
- Panels / whole pages:
  - Centered spinner and label, e.g. `flex items-center justify-center h-full text-gray-400`.

### 6.2 Disabled state

- Inputs and buttons share:
  - `disabled:opacity-50 disabled:cursor-not-allowed`.
- Do not change layout on disable; only visual opacity and pointer.

### 6.3 Error state

- Input with error:
  - `border-red-500`.
  - Helper text: `text-xs text-red-400 mt-1`.
- Toasts or banners:
  - Background: `bg-red-500/10`.
  - Icon: red icon (e.g. `IconAlertCircle` with `text-red-500`).

---

## 7. Icons & Layout

### 7.1 Icon rules

- Use **Tabler Icons** consistently.
- Default icon size in most contexts: `w-4 h-4`.
- Large decorative icons (empty states, hero): `w-12 h-12`.
- Always align icons with text using `flex items-center gap-2`.

### 7.2 Layout patterns

- **Page layout:**
  - Optional sidebar + top navbar.
  - Content: `flex-1 overflow-hidden flex flex-col`.
  - Inner scroll: `flex-1 overflow-y-auto p-4 md:p-6`.
- **Cards in grids:**
  - `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- **Detail views (editor panes):**
  - Left: main content `flex-1`.
  - Right: optional details / preview `w-[360px]` or `max-w-sm`.

---

## 8. Usage by AI Models

- All generated UIs **must**:
  - Use the colors, spacing, and typography defined here.
  - Use shadcn/ui components with the variants and sizes described.
  - Place new feature UI within the correct feature folder.
  - Respect state rules (loading, disabled, error).
- If a design need is **not** covered here, the model should:
  1. Propose a minimal extension to `DESIGN_SYSTEM.md`.
  2. Only then use the new pattern in implementation.

This file is the **single source of truth** for visual and structural UI decisions in this project.
