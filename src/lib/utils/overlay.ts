import { goto } from '$app/navigation';

export function openOverlay(name: string, id?: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set('overlay', name);
  if (id) {
    url.searchParams.set('id', id);
  } else {
    url.searchParams.delete('id');
  }
  goto(url, { keepFocus: true, noScroll: true });
}

export function closeOverlay() {
  const url = new URL(window.location.href);
  url.searchParams.delete('overlay');
  url.searchParams.delete('id');
  goto(url, { keepFocus: true, noScroll: true });
}