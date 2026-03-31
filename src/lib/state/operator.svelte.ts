// A lightweight global store for Optimistic UI updates
export const opState = $state({
  optimisticDevMode: null as boolean | null,
  optimisticSimulating: null as boolean | null,
  optimisticRole: null as string | null
});