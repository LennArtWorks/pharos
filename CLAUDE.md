# PHAROS Project Context

## Tech Stack
- **Framework:** Svelte 5 (Strict use of Runes: $state, $derived, $effect, $props).
- **Meta-Framework:** SvelteKit.
- **Styling:** Tailwind CSS (following semantic ink/level system).
- **Icons:** Custom Figma-mapped Icon.svelte component.

## Design System Architecture (CRITICAL)
- **Button.svelte:** The base interactive primitive. Supports `tagName` prop ('a', 'button', 'div') to avoid illegal HTML nesting (e.g., buttons inside anchors).
- **NodeItem.svelte:** The visual representation of a file/folder/workspace.
- **TreeNodeItem.svelte:** The structural skeleton for recursion and D&D.
- **Rule:** Never put a `<button>` inside an `<a>`. If a NodeItem needs internal buttons (like Edit/Add), force `tagName="div"` and use `goto` for navigation.

## File System Logic
- **Extensions:** External files (.jpg, .pdf) should have extensions stripped in UI during rename but re-attached before API calls. Use the `while` loop stripping logic in NodeItem.
- **Permissions:** Use the `has(PERMISSIONS.X)` utility. Components like `Input` have built-in permission locking.