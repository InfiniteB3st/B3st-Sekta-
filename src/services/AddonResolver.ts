import { supabase } from './supabaseClient';

export interface AddonSource {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

/**
 * MASTER ARCHITECT: AddonResolver Engine
 * Bridges the gap between B3ST SEKTA UI and the underlying streaming infrastructure.
 */
export const AddonResolver = {
  /**
   * Fetches the user's enabled addons from Supabase or LocalStorage for guests.
   */
  getEnabledAddons: async (userId: string): Promise<AddonSource[]> => {
    // Mapping IDs to human-readable metadata
    const ADDON_MAP: Record<string, { name: string; description: string }> = {
      'netflix-node': { name: 'Netflix Node', description: 'Ultra-HD Premium Stream' },
      'hianime-core': { name: 'HiAnime Core', description: 'Stable 1080p Mirror' },
      'aniwave-bridge': { name: 'AniWave Bridge', description: 'Global CDN Network' },
      'mal-sync': { name: 'MAL Sync Pro', description: 'Metadata Sync Only' }
    };

    if (userId === 'guest') {
      const localAddons = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
      if (localAddons.length === 0) {
        // Default set for new guests
        return [{ id: 'hianime-core', name: 'HiAnime Core', description: 'Stable 1080p Mirror', enabled: true }];
      }
      return localAddons.map((item: any) => ({
        ...item,
        name: ADDON_MAP[item.addon_id]?.name || item.addon_id,
        description: ADDON_MAP[item.addon_id]?.description || 'Custom Extension Source'
      }));
    }

    const { data, error } = await supabase
      .from('user_addons')
      .select('addon_id, enabled')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (error) {
      console.error('Addon Resolution Failed:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.addon_id,
      name: ADDON_MAP[item.addon_id]?.name || item.addon_id,
      description: ADDON_MAP[item.addon_id]?.description || 'Custom Extension Source',
      enabled: item.enabled
    }));
  },

  /**
   * Simulated Resolver Logic:
   * In a production environment, this would call the specific API for the addon.
   */
  resolveStream: async (addonId: string, animeId: number, episode: number): Promise<string> => {
    console.log(`B3ST SEKTA - Resolving Stream: [Addon: ${addonId}] [Anime: ${animeId}] [Ep: ${episode}]`);
    
    // In a real implementation:
    // switch(addonId) {
    //   case 'netflix-node': return fetchNetflixStream(animeId, episode);
    //   ...
    // }

    // Returning a demo placeholder that adheres to the 1:1 replica flow
    // Replace with real provider endpoints if available.
    return `https://test-videos.co.uk/vids/big_buck_bunny.mp4`;
  }
};
