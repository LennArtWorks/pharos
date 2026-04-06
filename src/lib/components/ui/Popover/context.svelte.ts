import { getContext, setContext } from 'svelte';

export class PopoverState {
  isOpen = $state(false);
  closeOnClick = $state(false);
  triggerNode = $state<HTMLElement | null>(null); // NEW: Track the trigger DOM node

  constructor(closeOnClick: boolean = false) {
    this.closeOnClick = closeOnClick;
  }

  toggle = () => (this.isOpen = !this.isOpen);
  close = () => (this.isOpen = false);
  open = () => (this.isOpen = true);
}

const POPOVER_KEY = Symbol('popover');

export function setPopoverContext(closeOnClick: boolean = false) {
  const state = new PopoverState(closeOnClick);
  setContext(POPOVER_KEY, state);
  return state;
}

export function getPopoverContext() {
  return getContext<PopoverState>(POPOVER_KEY);
}