export type BannerVariant = 'info' | 'warning' | 'error' | 'success' | 'dev';

export interface BannerConfig {
  id: string;
  variant: BannerVariant;
  icon?: string;
  text: string;
  isProcess?: boolean;
  onStop?: () => Promise<void> | void;
}

export const bannerState = $state({
  banners: [] as BannerConfig[],
  activeId: null as string | null
});

export function addBanner(config: Omit<BannerConfig, 'id'> & { id: string }) {
  const existingIndex = bannerState.banners.findIndex(b => b.id === config.id);
  if (existingIndex > -1) {
    // 🚨 UPDATE: Do not overwrite activeId here!
    bannerState.banners[existingIndex] = config;
  } else {
    // 🚨 NEW: Only maximize if it's a completely new banner
    bannerState.banners.push(config);
    bannerState.activeId = config.id;
  }
}

export function removeBanner(id: string) {
  bannerState.banners = bannerState.banners.filter(b => b.id !== id);
  if (bannerState.activeId === id) {
    bannerState.activeId = bannerState.banners.length > 0 ? bannerState.banners[0].id : null;
  }
}