/**
 * Session state — the currently authenticated user.
 *
 * Set in (organisation)/+layout.svelte from page.data.user and kept reactive.
 * Components import session directly instead of reading page.data.user in leaf
 * components or prop-drilling currentUserId through view trees.
 *
 * Uses App.Locals['user'] from app.d.ts as the canonical type — single definition,
 * shared across server auth, SvelteKit locals, and this client-side store.
 */

export const session = $state({
	user: null as App.Locals['user'],
	orgRoles: {} as Record<string, string[]>
});
