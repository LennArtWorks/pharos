import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';

export class SelectState {
  value = $state<string | number | null>(null);
  label = $state<string | null>(null);
  contentSnippet = $state<Snippet | null>(null);
}

const SELECT_KEY = Symbol('select');

export function setSelectContext() {
  const state = new SelectState();
  setContext(SELECT_KEY, state);
  return state;
}

export function getSelectContext() {
  return getContext<SelectState>(SELECT_KEY);
}