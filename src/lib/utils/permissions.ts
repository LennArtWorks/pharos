import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { hasPermission } from '$lib/config/permissions';

// This creates a reactive $can function you can use anywhere
export const can = derived(page, ($page) => {
  return (requiredFlag: string) => {
    const userRole = $page.data.userRole || 'Anonymous';
    const activeRoles = $page.data.activeRoles || {};
    return hasPermission(userRole, requiredFlag, activeRoles);
  };
});