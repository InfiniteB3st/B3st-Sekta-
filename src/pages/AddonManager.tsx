import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Globe, ShieldCheck, Plus, Trash2, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Addon {
  addon_id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: string;
}

const AVAILABLE_ADDONS = [
  { id: 'netflix-node', name: 'Netflix Stream Node', description: 'Access premium Netflix-exclusive anime streams.', version: 'v1.2' },
  { id: 'hianime-core', name: 'HiAnime Core', description: 'Original HiAnime source for 1080p stable streaming.', version: 'v2.4' },
  { id: 'aniwave-bridge', name: 'AniWave Bridge', description: 'Direct bridge to AniWave mirrors.', version: 'v1.0' },
  { id: 'mal-sync', name: 'MAL Sync Pro', description: 'Advanced metadata synchronization with MyAnimeList.', version: 'v3.0' }
];

export default function AddonManager() {
  const { user } = useAuth();
  const [installedAddons, setInstalledAddons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) fetchAddonStates();
  }, [user]);

  const fetchAddonStates = async () => {
    const { data, error } = await supabase
      .from('user_addons')
      .select('addon_id, enabled')
      .eq('user_id', user?.id);

    if (!error && data) {
      const states: Record<string, boolean> = {};
      data.forEach(item => {
        states[item.addon_id] = item.enabled;
      });
      setInstalledAddons(states);
    }
    setLoading(false);
  };

  const toggleAddon = async (addonId: string, currentState: boolean) => {
    const newState = !currentState;
    
    // Optimistic UI
    setInstalledAddons(prev => ({ ...prev, [addonId]: newState }));

    const { error } = await supabase
      .from('user_addons')
      .upsert({
        user_id: user?.id,
        addon_id: addonId,
        enabled: newState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,addon_id' });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to sync addon state.' });
      fetchAddonStates(); // Revert
    } else {
      setMessage({ type: 'success', text: `${addonId} ${newState ? 'Enabled' : 'Disabled'}` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const installAddon = async (addonId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('user_addons')
      .insert({
        user_id: user?.id,
        addon_id: addonId,
        enabled: true
      });

    if (error) {
      setMessage({ type: 'error', text: 'Extension already installed or sync error.' });
    } else {
      setMessage({ type: 'success', text: 'Extension Installed Successfully' });
      await fetchAddonStates();
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 border-l-4 border-primary pl-6 py-2">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Extension Store</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Scale your playback experience with custom extensions</p>
      </div>

      {message && (
        <div className={cn(
          "p-6 rounded-3xl flex items-center gap-4 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-4",
          message.type === 'success' ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
        )}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {AVAILABLE_ADDONS.map((addon) => {
          const isInstalled = addon.id in installedAddons;
          const isEnabled = installedAddons[addon.id];

          return (
            <div 
              key={addon.id}
              className={cn(
                "group relative bg-surface rounded-[2.5rem] border p-8 transition-all duration-500 overflow-hidden",
                isInstalled && isEnabled ? "border-primary/40 bg-primary/5 shadow-[0_20px_50px_-10px_rgba(255,177,0,0.1)]" : "border-white/5 hover:border-white/10"
              )}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Zap size={100} />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Globe size={28} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-700 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    {addon.version}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">{addon.name}</h3>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed italic">{addon.description}</p>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  {!isInstalled ? (
                    <button 
                      onClick={() => installAddon(addon.id)}
                      className="flex-1 bg-white hover:bg-primary text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                    >
                      <Plus size={18} />
                      Install Extension
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => toggleAddon(addon.id, isEnabled)}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl",
                          isEnabled 
                            ? "bg-primary text-black shadow-primary/20" 
                            : "bg-surface border border-white/10 text-gray-500"
                        )}
                      >
                        {isEnabled ? <ShieldCheck size={18} /> : <Zap size={18} />}
                        {isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </button>
                      <button className="w-14 h-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-red-500/20">
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
