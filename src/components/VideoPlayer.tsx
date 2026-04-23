import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  SkipForward, ChevronLeft, ChevronRight, Layout, HardDrive,
  Monitor, Subtitles, Mic 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AddonResolver, AddonSource } from '../services/AddonResolver';
import { syncWatchHistory, supabase } from '../services/supabaseClient';
import { EpisodeList } from './EpisodeList';
import { jikanService } from '../services/jikan';

interface VideoPlayerProps {
  animeId: number;
  animeTitle: string;
  imageUrl: string;
  episode: number;
  userId: string;
  onEpisodeChange: (ep: number) => void;
  onBack: () => void;
}

/**
 * HiAnime 1:1 REPLICA PLAYER ENGINE
 * Features: Addon Resolution, Range Logic, and Real-Time DB Sync.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  animeId, animeTitle, imageUrl, episode, userId, onEpisodeChange, onBack 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [duration] = useState(1440); // Standard 24 min simulation
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  
  // Dynamic Feed Architecture
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [addons, setAddons] = useState<AddonSource[]>([]);
  const [activeAddon, setActiveAddon] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<number>(0);

  // 1. Initial Metadata Retrieval (Jikan Sync)
  useEffect(() => {
    jikanService.getEpisodes(animeId).then(setEpisodes);
  }, [animeId]);

  // 2. Extension Node Discovery (Supabase Sync)
  useEffect(() => {
    AddonResolver.getEnabledAddons(userId).then(list => {
      setAddons(list);
      if (list.length > 0) setActiveAddon(list[0].id);
    });
  }, [userId]);

  // 3. Resolve Active Node to Stream Endpoint
  useEffect(() => {
    if (activeAddon) {
      AddonResolver.resolveStream(activeAddon, animeId, episode).then(url => {
        setStreamUrl(url);
        setCurrentTime(0);
        setProgress(0);
        setShowNextOverlay(false);
      });
    }
  }, [activeAddon, animeId, episode]);

  // 4. Playback Logic & Progress Persistence
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          
          if (duration - next <= 120 && !showNextOverlay) setShowNextOverlay(true);
          setProgress((next / duration) * 100);

          // Atomic Sync (30s Cycle)
          syncTimerRef.current += 1;
          if (syncTimerRef.current >= 30) {
            syncTimerRef.current = 0;
            syncWatchHistory({
              user_id: userId,
              anime_id: animeId,
              anime_title: animeTitle,
              episode_id: episode,
              progress_ms: next * 1000,
              image_url: imageUrl,
              status: 'Watching'
            });
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, duration, showNextOverlay, userId, animeId, episode, animeTitle, imageUrl]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = Math.floor(s % 60);
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "w-full bg-black transition-all duration-700 animate-in fade-in",
      isTheater ? "fixed inset-0 z-[100] h-full" : "rounded-[4rem] aspect-video relative overflow-hidden shadow-3xl border border-white/5"
    )}>
      
      {/* NATIVE PLAYER MASK */}
      <div className="absolute inset-0 flex items-center justify-center p-20 cursor-pointer bg-surface" onClick={togglePlay}>
         <AnimatePresence>
           {!isPlaying && (
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 1.2, opacity: 0 }}
               className="w-28 h-28 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] z-20"
             >
               <Play fill="currentColor" size={48} className="ml-2" />
             </motion.div>
           )}
         </AnimatePresence>
         
         <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 opacity-[0.03] select-none">
            <Monitor size={120} />
            <h4 className="text-xl font-black uppercase tracking-[0.5em] italic">Active Addon Stream</h4>
         </div>
      </div>

      {/* HI-ANIME CONTROL INTERFACE */}
      <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-6 group">
        
        <div className="relative h-2 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden group/bar">
            <div className="h-full bg-primary shadow-[0_0_20px_var(--primary)]" style={{ width: `${progress}%` }} />
            <div className="absolute right-0 top-0 h-full w-4 bg-white/40 blur-md translate-x-full group-hover/bar:translate-x-0 transition-transform" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12 text-white">
             <button onClick={togglePlay} className="hover:text-primary transition-all active:scale-90">
               {isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} />}
             </button>
             <button onClick={() => onEpisodeChange(episode + 1)} className="hover:text-primary transition-all">
               <SkipForward size={28} />
             </button>
             <div className="text-[14px] font-black italic tracking-tighter flex items-center gap-4">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="text-gray-700">/</span>
                <span className="text-gray-500">{formatTime(duration)}</span>
             </div>
             <div className="flex items-center gap-4 group/vol">
                <Volume2 size={24} className="text-gray-500 group-hover/vol:text-primary transition-colors" />
                <div className="w-0 group-hover/vol:w-24 h-1 bg-white/10 rounded-full transition-all overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: `${volume * 100}%` }} />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-10">
             <button onClick={() => setIsTheater(!isTheater)} className={cn("transition-all", isTheater ? "text-primary" : "text-white hover:text-primary")}>
               <Layout size={28} />
             </button>
             <div className="bg-white/5 h-8 w-px mx-4" />
             <button className="text-white hover:text-primary transition-all hover:rotate-90">
               <Settings size={28} />
             </button>
             <button className="text-white hover:text-primary transition-all">
               <Maximize size={28} />
             </button>
          </div>
        </div>
      </div>

      {/* HI-ANIME TOP HEADER */}
      <div className="absolute top-0 inset-x-0 p-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-8 pointer-events-auto">
            <button onClick={onBack} className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center text-white border border-white/10 hover:border-primary transition-all group">
              <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-1">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">{animeTitle}</h3>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Now Broadcasting: Episode {episode}</p>
            </div>
         </div>
      </div>

      {/* AUTO-PROPAGATE OVERLAY */}
      <AnimatePresence>
        {showNextOverlay && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="absolute bottom-40 right-12 z-50 pointer-events-auto"
          >
            <button 
              onClick={() => onEpisodeChange(episode + 1)}
              className="bg-primary text-black px-12 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] flex items-center gap-5 hover:scale-110 active:scale-95 transition-all shadow-[0_25px_80px_rgba(var(--primary-rgb),0.5)] border-4 border-black"
            >
              <span className="text-xs">Propagate Next</span>
              <ChevronRight size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 -bottom-[500px]">
         <section className="bg-[#111] p-12 rounded-[4rem] border border-white/5 space-y-8 animate-in fade-in duration-1000">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-6">
                  <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                    Streaming <span className="text-primary italic">Nodes</span>
                  </h3>
               </div>
               <div className="flex items-center gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest italic">
                  <Monitor className="text-primary" size={16} /> Connection: {activeAddon || 'Resolving...'}
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               {addons.map(a => (
                 <button
                  key={a.id}
                  onClick={() => setActiveAddon(a.id)}
                  className={cn(
                    "relative group p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4",
                    activeAddon === a.id 
                      ? "bg-primary border-primary text-black shadow-2xl scale-[1.03]" 
                      : "bg-surface border-white/5 text-gray-500 hover:border-primary/30 hover:text-white"
                  )}
                 >
                   <HardDrive className={cn("transition-transform group-hover:scale-125", activeAddon === a.id ? "text-black" : "text-primary")} size={32} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{a.name}</span>
                   {activeAddon === a.id && (
                     <div className="absolute top-4 right-4 w-2 h-2 bg-black rounded-full animate-ping" />
                   )}
                 </button>
               ))}
            </div>
         </section>
      </div>

    </div>
  );
};
