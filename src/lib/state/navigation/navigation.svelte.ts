import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { UIFileIconType } from '$lib/config/filesystem';
import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

export interface NavItem {
  id: string;
  path: string;
  type: UIFileIconType | string;
  name: string;
  icon: FigmaIconName;
}

class NavigationEngine {
  history = $state<NavItem[]>([]);
  currentIndex = $state(-1);
  bookmarks = $state<NavItem[]>([]);

  isDraggingFile = $state(false);
  optimisticPath = $state<string | null>(null);

  // LOCK: Tells the engine we are intentionally traversing the history array
  targetIndex: number | null = null;

  init() {
    if (!browser) return;
    const savedHistory = localStorage.getItem('fsr-nav-history');
    const savedBookmarks = localStorage.getItem('fsr-nav-bookmarks');
    const savedIndex = localStorage.getItem('fsr-nav-index');

    if (savedHistory) this.history = JSON.parse(savedHistory);
    if (savedBookmarks) this.bookmarks = JSON.parse(savedBookmarks);
    if (savedIndex) this.currentIndex = parseInt(savedIndex, 10);

    $effect.root(() => {
      $effect(() => {
        localStorage.setItem('fsr-nav-history', JSON.stringify(this.history));
        localStorage.setItem('fsr-nav-bookmarks', JSON.stringify(this.bookmarks));
        localStorage.setItem('fsr-nav-index', this.currentIndex.toString());
      });
    });
  }

  get canGoBack() { return this.currentIndex > 0; }
  get canGoForward() { return this.currentIndex < this.history.length - 1; }

  get activeBookmarkId() {
    // 1. Optimistic UI: Instantly highlight the bookmark while the page loads
    if (this.optimisticPath) {
      const matched = this.bookmarks.find(b => b.path === this.optimisticPath);
      if (matched) return matched.id;
    }
    // 2. Stable UI: The actual loaded page
    const currentItem = this.history[this.currentIndex];
    if (!currentItem) return null;
    return this.bookmarks.find(b => b.id === currentItem.id)?.id || null;
  }

  // Views will now fail this check (because they aren't 'folder'), correctly muting the drag!
  get canGoBackDuringDrag() {
    if (!this.canGoBack) return false;
    const prevPage = this.history[this.currentIndex - 1];
    return prevPage && ['folder', 'workspace', 'sysfolder'].includes(prevPage.type);
  }

  get canGoForwardDuringDrag() {
    if (!this.canGoForward) return false;
    const nextPage = this.history[this.currentIndex + 1];
    return nextPage && ['folder', 'workspace', 'sysfolder'].includes(nextPage.type);
  }

  registerVisit(item: NavItem) {
    this.optimisticPath = null;
    if (browser && window.location.pathname !== item.path) return;

    // TRAVERSAL LOCK: If we used the arrows, snap to the target index and do NOT record a new visit.
    if (this.targetIndex !== null) {
      this.currentIndex = this.targetIndex;
      this.targetIndex = null;
      return;
    }

    if (this.history[this.currentIndex]?.id === item.id) return;

    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(item);

    const maxHistory = GLOBAL_SETTINGS.APP_SETTINGS?.MAX_APPNAV_HISTORY || 50;
    if (this.history.length > maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  syncWithBrowserHistory(path: string) {
    const index = this.history.findIndex(h => h.path === path);
    if (index !== -1) this.currentIndex = index;
  }

  async goBack() {
    if (!this.canGoBack || this.targetIndex !== null) return;
    this.targetIndex = this.currentIndex - 1;
    await goto(this.history[this.targetIndex].path, { keepFocus: true });
  }

  async goForward() {
    if (!this.canGoForward || this.targetIndex !== null) return;
    this.targetIndex = this.currentIndex + 1;
    await goto(this.history[this.targetIndex].path, { keepFocus: true });
  }

  async jumpToHistoryIndex(index: number) {
    if (index < 0 || index >= this.history.length || this.targetIndex !== null) return;
    this.targetIndex = index;
    await goto(this.history[this.targetIndex].path, { keepFocus: true });
  }

  bookmarkCurrentPage() {
    const current = this.history[this.currentIndex];
    if (current) {
      const exists = this.bookmarks.find(t => t.id === current.id);
      if (!exists) this.bookmarks.push(current);
    }
  }

  closeBookmark(id: string) {
    this.bookmarks = this.bookmarks.filter(t => t.id !== id);
  }
}

export const appNav = new NavigationEngine();