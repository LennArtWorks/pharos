# PHAROS — Animation & Motion Guidelines

The Pharos motion language is **snappy and reactive** — transitions are fast and purposeful, never slow or decorative. The UI should feel alive and responsive, never clunky.

---

## Core Principle

> Fast = trustworthy. Slow = broken.

If it takes longer than 200ms, it's too slow for an interactive element. Reserve longer durations for content that enters the viewport for the first time (mounts), where a brief breath gives the user orientation.

---

## Established Easing Functions

### `snappyBezier` (preferred for mounts and reveals)
```ts
const snappyBezier = (t: number) => --t * t * ((1.7 + 1) * t + 1.7) + 1;
```
A back-easing variant — slightly overshoots then settles. Gives a lively, springy feel.
Use for: `slide` transitions, `fly` transitions.

### `cubic-bezier(0.25, 1, 0.5, 1)` (preferred for squish/scale keyframes)
A fast-out-slow-in curve. Snappy start, soft landing.
Use for: keyframe animations (`@keyframes squish`), CSS transitions on scale.

---

## Reference Implementations (existing, do not modify)

| Component | Animation | Implementation |
|-----------|-----------|----------------|
| `TreeNodeItem` — expand/collapse | `slide` transition | `duration: 150, easing: snappyBezier` |
| `TreeNodeItem` — on toggle | Squish (`scaleY`) | `@keyframes squish`, 300ms, `cubic-bezier(0.25, 1, 0.5, 1)` |
| `Button` | Color changes | `transition-colors` (Tailwind default) |
| Drag-over nav arrows (`CalendarHeader`) | Accent ring + opacity flicker | `transition-opacity`, 180ms |

---

## Calendar-Specific Rules

### Entry mounts (CalendarNode, WeekNode)
Use Svelte's `fly` transition with a small `y` offset and `snappyBezier`:
```ts
import { fly } from 'svelte/transition';
// snappyBezier = (t) => --t * t * ((1.7 + 1) * t + 1.7) + 1

<div transition:fly={{ y: 4, duration: 120, easing: snappyBezier }}>
```

### Entry hover
Add `duration-75` to any `transition-colors` on calendar entry components for instant-feeling response:
```html
class="transition-all duration-75"
```

### Drag source state
When an entry is being dragged, apply lifted visual:
```svelte
let isDragging = $state(false);
// class: isDragging ? 'opacity-60 scale-[0.98]' : ''
```

### Drag-over cell/column highlight
```html
class="transition-colors duration-100"
```

### All-day row height changes (entry add/remove)
Use Svelte `animate:flip` with `duration: 150`.

### Resize (WeekNode / DayNode top/bottom handle)
- **During active drag**: no CSS transition — raw position updates for immediate feedback.
- **On mouseup (commit)**: briefly add `style="transition: top 100ms ease-out, height 100ms ease-out"` then remove after transition ends.

---

## General Rules

| Scenario | Duration | Easing |
|----------|----------|--------|
| Color / background change (hover, active) | 75–100ms | `ease-out` (Tailwind default) |
| Element mount / enter | 100–150ms | `snappyBezier` |
| Element exit / leave | 100ms | linear or ease-in |
| Expand / collapse (height) | 150ms | `snappyBezier` |
| Drag feedback | 0ms during drag; 100ms on release | `ease-out` |
| Scale / squish keyframe | 300ms | `cubic-bezier(0.25, 1, 0.5, 1)` |

**Never use:** `transition-all` on unknown properties (it captures layout too); `duration > 300ms` for interactive elements; `ease-in-out` (feels mushy).

---

## What NOT to animate

- Layout shifts caused by data changes (use `animate:flip` for list reordering instead)
- Scroll position (never animate `scrollTop` with slow easing)
- Now indicator position updates (just snap — it moves every 60s)
- Form field value changes (instant)
