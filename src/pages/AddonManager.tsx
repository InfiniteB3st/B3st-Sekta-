import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, Plus, Globe, Trash2, ShieldCheck, 
  AlertTriangle, RefreshCw, Loader2, Link as LinkIcon,
  ChevronRight, HardDrive, Settings, ExternalLink, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

interface AddonManifest {
  addon_id: string;
  name: string;
  version: string;
  description: string;
  url: string;
  enabled: boolean;
}

export default function AddonManager() {
  const { user } = useAuth();
  const [addons, setAddons] = useState<AddonManifest[]>([]);
  const [manifestUrl, setManifestUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAddons();
  }, [user]);

  const loadAddons = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('user_addons')
        .select('*')
        .eq('user_id', user.id);
      if (data) setAddons(data as any);
    } else {
      const local = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
      setAddons(local);
    }
  };

  const installAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulation of manifest resolution
      const manifest = {
        addon_id: `node-${Math.random().toString(36).substr(2, 5)}`,
        name: manifestUrl.replace('https://', '').split('/')[0] || 'Remote Node',
        version: '1.0.0',
        description: 'Advanced Stream Mapping Bridge',
        url: manifestUrl,
        enabled: true
      };

      if (user) {
        const { error: dbError } = await supabase
          .from('user_addons')
          .upsert({
            user_id: user.id,
            addon_id: manifest.addon_id,
            name: manifest.name,
            url: manifest.url,
            enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,addon_id' });
        if (dbError) throw dbError;
      } else {
        const local = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
        local.push(manifest);
        localStorage.setItem('sekta_addons', JSON.stringify(local));
      }

      setAddons(prev => [...prev, manifest]);
      setManifestUrl('');
    } catch (err: any) {
      setError(`Installation Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uninstallAddon = async (id: string) => {
    if (user) {
      await supabase.from('user_addons').delete().eq('user_id', user.id).eq('addon_id', id);
    } else {
      const local = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
      const filtered = local.filter((a: any) => a.addon_id !== id);
      localStorage.setItem('sekta_addons', JSON.stringify(filtered));
    }
    setAddons(prev => prev.filter(a => a.addon_id !== id));
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-20 space-y-20 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Block */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-primary bg-primary/5 w-fit px-6 py-2 rounded-full border border-primary/10">
            <Puzzle size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node Management System</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic text-white uppercase tracking-tighter">
            Installed <span className="text-primary italic">Add-ons</span>
          </h1>
          <p className="text-gray-600 max-w-2xl font-black uppercase tracking-widest text-[11px] leading-loose">
            Expand your B3st Sekta library with community-driven nodes. Each Add-on provides unique metadata and streaming endpoints.
          </p>
        </div>

        {/* Global Key Form */}
        <form onSubmit={installAddon} className="relative group">
           <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
           <div className="relative bg-[#0a0a0a] border-2 border-white/5 p-4 rounded-[3.5rem] flex items-center shadow-2xl focus-within:border-primary transition-all">
              <Globe className="ml-8 text-gray-700 group-focus-within:text-primary transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="PASTE ADD-ON MANIFEST URL (e.g. https://...)"
                value={manifestUrl}
                onChange={(e) => setManifestUrl(e.target.value)}
                className="flex-1 bg-transparent px-8 py-4 text-sm font-black text-white tracking-widest outline-none placeholder:text-gray-800"
                required
              />
              <button 
                disabled={loading}
                className="bg-primary text-black px-12 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} strokeWidth={4} />}
                Install Node
              </button>
           </div>
           {error && (
             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-16 left-12 flex items-center gap-3 text-red-500 font-black uppercase text-[10px] tracking-widest bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20">
               <AlertTriangle size={14} /> {error}
             </motion.div>
           )}
        </form>

        {/* Addon Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <AnimatePresence>
             {addons.map((addon) => (
               <motion.div 
                 key={addon.addon_id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="bg-[#0f0f0f] border border-white/5 p-10 rounded-[3rem] space-y-8 group hover:border-primary/30 transition-all shadow-xl"
               >
                 <div className="flex justify-between items-start">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                     <HardDrive size={32} />
                   </div>
                   <button 
                    onClick={() => uninstallAddon(addon.addon_id)}
                    className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>

                 <div className="space-y-3">
                   <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">{addon.name}</h3>
                   <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[8px]">
                     <RefreshCw size={10} className="animate-spin-slow" /> Version {addon.version}
                   </div>
                   <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed line-clamp-2">
                     {addon.description}
                   </p>
                 </div>

                 <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                      <ShieldCheck size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Authorized</span>
                    </div>
                    <LinkIcon size={14} className="text-gray-800" />
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>

           {addons.length === 0 && !loading && (
             <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center gap-8 text-gray-800">
                <Puzzle size={80} className="opacity-20" />
                <div className="text-center space-y-4">
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter">No Active Nodes</h4>
                  <p className="text-[10px] uppercase font-bold tracking-[0.4em]">Inject a manifest URL to begin deployment</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
