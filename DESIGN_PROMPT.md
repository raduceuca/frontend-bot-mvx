# MultiversX Bot — Visual Design Spec

> **Purpose**: Technical spec for restyling the frontend. Written for a coding agent.
> **Prerequisite**: Apply `IMPLEMENTATION_SPEC.md` first (copy changes). This document is visual only.
> **Stack**: React + TypeScript + Tailwind CSS v4 + Framer Motion + Font Awesome + Satoshi (400/500/700).

---

## 1. Design Direction

### The problem with the current UI
The current UI uses heavy glow effects, military-style labels (`CORE CONFIGURATION MATRIX`, `tracking-widest uppercase font-black`), and overdecorated surfaces (`ring-offset-2 ring-offset-black/80`, `backdrop-blur-xl`). This reads as generic "dark mode crypto app." It communicates nothing about what this product actually does.

### What we want instead
**Mechanical precision.** The kind of UI you'd see on instrumentation software, industrial control panels, or developer tooling that takes itself seriously. Think:

- **Stripe Dashboard** — mathematically precise spacing, invisible grid, zero decoration
- **Figma's panels** — tight, functional, every pixel has a job
- **Apple's developer tools** — monochrome with one accent, dense but legible
- **Swiss design** — the grid is the design, not decoration on top of a grid

### Core principles
1. **No decoration.** If a visual element doesn't convey information, remove it. No glow, no gradient backgrounds, no blur effects, no decorative shapes.
2. **Density over drama.** Tighter padding, smaller gaps, more information visible at once. This is a tool, not a landing page.
3. **Monospace is structural.** Use `font-mono` for data values, labels, and identifiers — because they ARE technical. Not for style.
4. **One accent color.** Emerald (`#34D399`) for interactive elements and success states. That's it. Everything else is grayscale.
5. **Borders define structure.** 1px borders at low opacity. They separate sections. They don't glow, pulse, or animate.
6. **Motion is functional.** Fade in on mount (0.15s). State transitions (0.1s). Nothing else.

---

## 2. Tokens

### Colors

```
BACKGROUNDS
--bg-0:    #09090B       /* true base — zinc-950 */
--bg-1:    #111114       /* raised surface — cards, panels */
--bg-2:    #18181B       /* interactive surface — inputs, hover areas — zinc-900 */
--bg-3:    #27272A       /* elevated — active states, selections — zinc-800 */

BORDERS
--border-0:  #27272A     /* subtle — zinc-800 */
--border-1:  #3F3F46     /* default — zinc-700 */
--border-2:  #52525B     /* emphasis — zinc-600 */

TEXT
--text-0:    #FAFAFA      /* primary — zinc-50 */
--text-1:    #A1A1AA      /* secondary — zinc-400 */
--text-2:    #71717A      /* tertiary — zinc-500 */
--text-3:    #52525B      /* disabled — zinc-600 */

ACCENT
--accent:       #34D399    /* emerald-400 — interactive, success, active */
--accent-dim:   #065F46    /* emerald-900 — subtle accent backgrounds */
--accent-text:  #022C22    /* text on accent bg */

SEMANTIC
--error:    #EF4444      /* red-500 */
--warning:  #EAB308      /* yellow-500 */
--info:     #3B82F6      /* blue-500 */
```

This is a zinc scale. Not "warm darks" — actual neutral darks. The only color is emerald.

**Implementation**: Add to `src/styles/style.css` under `:root`. Use Tailwind's zinc scale directly where possible (`bg-zinc-950`, `border-zinc-800`, `text-zinc-400`).

### Typography

Satoshi stays as the sans-serif. `font-mono` uses the system monospace stack.

```
HEADINGS
H1:    text-2xl   font-semibold  tracking-tight  text-zinc-50
H2:    text-lg    font-semibold  tracking-tight  text-zinc-50
H3:    text-sm    font-medium    text-zinc-50

BODY
Body:  text-sm    font-normal    text-zinc-400   leading-relaxed
Small: text-xs    font-normal    text-zinc-500

LABELS (monospace)
Label: text-[11px]  font-mono  font-normal  text-zinc-500  uppercase  tracking-wider

DATA VALUES (monospace)
Value: text-sm  font-mono  text-zinc-50
```

**Rules:**
- `font-black` → does not exist in this system. Max weight is `font-semibold`.
- `tracking-widest` → does not exist. Max is `tracking-wider`, and only on mono labels.
- `uppercase` → only on mono labels (11px). Never on headings.
- No text shadows, no text gradients, no text glow.

### Spacing

```
RADIUS
none:   0          (use for: nothing in this app currently)
sm:     4px        (rounded — badges, small pills)
md:     6px        (rounded-md — buttons, inputs, chips)
lg:     8px        (rounded-lg — cards, panels, modals)

No rounded-xl, rounded-2xl, rounded-3xl, or rounded-full on containers.
rounded-full is allowed ONLY on dot indicators and avatars.
```

```
PADDING
tight:    px-3 py-2       (buttons, inputs, small cards)
default:  px-4 py-3       (standard card content)
spacious: px-5 py-4       (section headers, panel headers)

GAPS
within card:      gap-3
between cards:    gap-3
between sections: gap-8 lg:gap-12
```

Tighter than typical. This is a dense tool UI, not a marketing site.

### Shadows

None. Use borders for depth.

Exception: the feedback modal overlay uses `bg-black/60` backdrop.

### Borders

```
DEFAULT:   border border-zinc-800          (or border-[#27272A])
HOVER:     border-zinc-700                 (or border-[#3F3F46])
FOCUS:     border-emerald-500/50  ring-1 ring-emerald-500/20
DIVIDER:   border-b border-zinc-800
```

1px everywhere. No 2px borders. No ring-offset. No ring-2.

### Motion

```
MOUNT:     opacity 0→1, duration 150ms, ease-out
HOVER:     background-color transition, duration 100ms
FOCUS:     border-color + ring transition, duration 100ms
EXIT:      opacity 1→0, duration 100ms

NO:
- Scale transforms on hover (no hover:scale-*)
- Bounce, pulse, or spring animations on decorative elements
- animate-bounce on typing dots — use opacity pulse instead
- Stagger delays > 50ms
- Any animation > 200ms duration
```

---

## 3. Component Patterns

### 3.1 Label

```tsx
<label className='text-[11px] font-mono font-normal text-zinc-500 uppercase tracking-wider'>
  Agent Nonce
</label>
```

That's it. No `font-black`, no `text-white/30`, no `tracking-widest`.

### 3.2 Section Header

```tsx
<div className='flex flex-col gap-1'>
  <span className='text-[11px] font-mono font-normal text-zinc-500 uppercase tracking-wider'>
    Capabilities
  </span>
  <h2 className='text-lg font-semibold tracking-tight text-zinc-50'>
    What the agent can do
  </h2>
</div>
```

Left-aligned. No centering unless it's the hero.

### 3.3 Card

```tsx
<div className='bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors duration-100'>
  <div className='flex items-center gap-2.5'>
    <div className='w-8 h-8 rounded-md bg-zinc-800 text-emerald-400 flex items-center justify-center text-sm'>
      <FontAwesomeIcon icon={faBrain} />
    </div>
    <h3 className='text-sm font-medium text-zinc-50'>
      Autonomous Trades
    </h3>
  </div>
  <p className='text-xs text-zinc-500 leading-relaxed'>
    Reads market data, picks tokens, and executes swaps — all on its own.
  </p>
</div>
```

Icon + title on same line. Description below. Tight.

### 3.4 Feature Callout (Token Safari)

```tsx
<div className='bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-4'>
  <div className='w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg shrink-0'>
    <FontAwesomeIcon icon={faLeaf} />
  </div>
  <div className='flex-1 flex flex-col gap-1'>
    <div className='flex items-center gap-2'>
      <span className='text-sm font-medium text-emerald-400'>Token Safari</span>
      <span className='text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded'>
        try it
      </span>
    </div>
    <p className='text-xs text-zinc-500 leading-relaxed'>
      Send 1 EGLD. The agent picks trending tokens, swaps, and sends them back.
    </p>
  </div>
</div>
```

Inline layout. Compact. The accent background is barely visible.

### 3.5 Buttons

```
PRIMARY:
bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium text-sm rounded-md px-4 py-2 transition-colors duration-100 disabled:opacity-40

SECONDARY:
bg-zinc-800 hover:bg-zinc-700 text-zinc-50 font-medium text-sm rounded-md px-4 py-2 border border-zinc-700 transition-colors duration-100 disabled:opacity-40

GHOST:
bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-50 font-medium text-sm rounded-md px-3 py-2 transition-colors duration-100

DANGER:
bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-sm rounded-md px-4 py-2 border border-red-500/20 transition-colors duration-100
```

No glow. No ring-offset. No shadow. No `active:scale-95`. No inner shine.

### 3.6 Input / Textarea

```tsx
<input
  className='w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-100'
/>
```

For the chat textarea, same but with `resize-none` and `text-sm font-normal` (not mono — it's natural language input).

### 3.7 Suggestion Chips

```tsx
<button className='px-2.5 py-1 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-700 transition-colors duration-100'>
  🌿 Token Safari
</button>
```

### 3.8 Status Messages (Chat)

```tsx
{/* In progress */}
<div className='flex items-center gap-2 text-xs text-zinc-500'>
  <div className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
  Agent is working…
</div>

{/* Error */}
<div className='flex items-center gap-2 text-xs text-red-400'>
  <span className='text-[10px]'>✕</span> Connection lost. Try again?
</div>

{/* Success */}
<div className='flex items-center gap-2 text-xs text-emerald-400'>
  <span className='text-[10px]'>✓</span> Job complete.
</div>
```

No pill backgrounds. No borders. Just colored text with an indicator.

### 3.9 Chat Bubbles

```tsx
{/* User */}
<div className='flex justify-end'>
  <div className='max-w-[75%] bg-zinc-800 text-zinc-50 rounded-lg rounded-br-sm px-3 py-2.5 text-sm'>
    {msg.content}
  </div>
</div>

{/* Agent */}
<div className='flex justify-start gap-2.5'>
  <div className='w-6 h-6 shrink-0 mt-0.5 rounded-md bg-zinc-800 flex items-center justify-center text-emerald-400 text-[10px]'>
    <FontAwesomeIcon icon={faRobot} />
  </div>
  <div className='max-w-[75%] bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg rounded-bl-sm px-3 py-2.5 text-sm whitespace-pre-wrap'>
    {msg.content}
  </div>
</div>
```

No avatar for user. Smaller agent avatar. Tighter padding.

### 3.10 Badge / Status Pill

```tsx
<div className='flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20'>
  <FontAwesomeIcon icon={faSpinner} spin className='text-[8px]' />
  Processing
</div>
```

Tiny. Functional. Not decorative.

---

## 4. Page-Level Implementation

### 4.1 Global

Set body background:
```css
body { background-color: #09090B; }
```

That's `zinc-950`. The darkest neutral in the system.

### 4.2 Landing Page — `Home.tsx`

```tsx
const styles = {
  homeContainer: 'flex flex-col items-center w-full max-w-5xl mx-auto px-4 pb-16 gap-12 lg:gap-16'
};
```

`max-w-5xl` not 6xl — tighter. `gap-12` not 20 — denser.

### 4.3 Hero — `homeHero.styles.ts`

Replace entirely:

```ts
export default {
  heroContainer: 'relative flex flex-col items-center justify-center w-full pt-16 pb-20 lg:pt-24 lg:pb-28 px-4',
  heroSectionTop: 'relative z-10 flex flex-col items-center justify-center gap-6 w-full',
  heroSectionTopContent: 'flex flex-col items-center gap-4 text-center',
  heroTitle: 'text-4xl lg:text-6xl font-semibold tracking-[-0.03em] text-zinc-50',
  heroDescription: 'text-lg lg:text-xl text-zinc-400 tracking-tight max-w-md',
  heroSectionTopButtons: 'flex items-center gap-3 mt-2',
} satisfies Record<string, string>;
```

Smaller title (6xl not 8xl). Tighter max-width. No min-height forcing.

**In `HomeHero.tsx`:**
- Remove ALL background elements (dot grid, gradient line, blur blobs, SVG patterns)
- The hero is just text on `zinc-950`. Nothing else.
- Button: primary style from 3.5
- Eyebrow: label style from 3.1
- Body paragraph: `text-sm text-zinc-500 max-w-md`

Clean up all unused imports.

### 4.4 Capabilities — `HomeCapabilities.tsx`

Use section header from 3.2 (left-aligned or center, your call).
Cards from 3.3 in a `grid grid-cols-1 md:grid-cols-3 gap-3`.
Token Safari callout from 3.4 below the grid, full width.

No backdrop blur. No decorative lines. No outer glow.

### 4.5 Dashboard — `Dashboard.tsx`

Remove `backgroundImage: 'url(/background.svg)'`. Use `bg-[#09090B]`.

```tsx
<div className='flex flex-col gap-4 items-center flex-1 w-full overflow-auto pt-4 pb-6 lg:pt-6 lg:pb-10'>
```

### 4.6 CreateJob — `CreateJob.tsx`

**Replace styles object:**

```ts
const styles = {
  container: 'flex flex-col gap-4 w-full mx-auto p-4 lg:p-0 flex-1',
  glassCard: 'bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden',
  header: 'px-5 py-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-3',
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4',
  statItem: 'bg-zinc-950 border border-zinc-800 p-3 rounded-md flex flex-col gap-1 hover:border-zinc-700 transition-colors duration-100',
  actionButton: 'px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-md font-medium text-sm transition-colors duration-100 disabled:opacity-40',
  badge: 'flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono'
} satisfies Record<string, string>;
```

**All config labels:** `text-[11px] font-mono font-normal text-zinc-500 uppercase tracking-wider`

**All config inputs:** `bg-transparent border-none p-0 text-zinc-50 font-mono text-sm focus:ring-0 w-full`

**Header title:** `text-lg font-semibold text-zinc-50 tracking-tight` (not `font-black uppercase`)

**Header subtitle:** `text-xs text-zinc-500` (not `font-mono uppercase tracking-widest`)

**Finish button:** secondary style: `bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700`

**Send to bot button:** Keep violet accent: `bg-violet-600 hover:bg-violet-500 text-white` but remove `ring-2 ring-offset-2 ring-offset-black/80`.

**Chat header:** `border-b border-zinc-800` only. No `bg-white/5`.

**Input bar:** `bg-zinc-950 border border-zinc-800 rounded-md` — no `rounded-2xl`.

**Send button:** `w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-md` — no shadow, no `hover:scale-105`.

**Empty state:** Robot icon at `text-3xl text-zinc-600`. Text at `text-xs text-zinc-500`. No `font-black tracking-[0.2em] uppercase`.

**Idle state circle:** `w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800` — not `rounded-full`, not `shadow-inner`.

**Typing indicator:** Replace `animate-bounce` with `animate-pulse` at reduced opacity:
```tsx
<span className='w-1 h-1 bg-zinc-500 rounded-full animate-pulse' />
<span className='w-1 h-1 bg-zinc-500 rounded-full animate-pulse [animation-delay:150ms]' />
<span className='w-1 h-1 bg-zinc-500 rounded-full animate-pulse [animation-delay:300ms]' />
```

**Feedback modal:** Same glassCard style but `max-w-sm`. Stars keep their amber color. "Skip" button = ghost style. "Submit" button = primary style.

### 4.7 Sidebar

```
MENU ITEM:
text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 px-3 py-2 rounded-md transition-colors duration-100

ACTIVE:
text-zinc-50 bg-zinc-800/50 border-l-2 border-emerald-500
```

### 4.8 Dashboard Header

```
WELCOME: text-sm text-zinc-400 font-normal
TITLE:   text-2xl font-semibold text-zinc-50 tracking-tight
```

Remove `text-3xl xs:text-5xl lg:text-6xl` — too big for a dashboard. `text-2xl` is enough.

---

## 5. Checklist

### P0 — Foundation
- [ ] Add color tokens to `src/styles/style.css`
- [ ] Set `body { background-color: #09090B; }`
- [ ] Replace `homeHero.styles.ts`
- [ ] Strip HomeHero.tsx of all decorative elements
- [ ] Replace CreateJob.tsx styles object + all label/heading classes
- [ ] Remove `backgroundImage` from Dashboard.tsx

### P1 — Polish
- [ ] Create HomeCapabilities with card + callout patterns
- [ ] Update Home.tsx container styles
- [ ] Update sidebar styles
- [ ] Update DashboardHeader size
- [ ] Replace all `animate-bounce` → `animate-pulse`
- [ ] Replace all `rounded-3xl` → `rounded-lg`
- [ ] Replace all `ring-2 ring-offset-*` → remove

### P2 — Sweep
- [ ] Audit: zero instances of `font-black` remain
- [ ] Audit: zero instances of `tracking-widest` remain
- [ ] Audit: zero instances of `backdrop-blur` remain
- [ ] Audit: zero instances of `shadow-[0_0_*` glow remain
- [ ] Audit: all text meets 4.5:1 contrast ratio against background

---

## 6. Do Not Change

- Copy (handled by IMPLEMENTATION_SPEC.md)
- Functionality, API calls, state, routing
- Component hierarchy
- Satoshi font
- Emerald as accent hue
