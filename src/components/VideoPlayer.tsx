import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  SkipForward, ChevronLeft, ChevronRight, Layout, HardDrive,
  Monitor, Subtitles, Mic, RotateCcw, RotateCw, Palette, Type, Globe 
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
  userId: string | null;
  onEpisodeChange: (ep: number) => void;
  onBack: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  animeId, animeTitle, imageUrl, episode: currentEpisode, userId, onEpisodeChange, onBack 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [duration] = useState(1440); // 24m
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Advanced Player State
  const [language, setLanguage] = useState<'EN' | 'JP'>('EN');
  const [jumpTime, setJumpTime] = useState(10);
  const [subsEnabled, setSubsEnabled] = useState(true);
  const [subtitleSize, setSubtitleSize] = useState(100);
  
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [addons, setAddons] = useState<AddonSource[]>([]);
  const [activeAddon, setActiveAddon] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<number>(0);

  useEffect(() => {
    jikanService.getEpisodes(animeId).then(setEpisodes);
  }, [animeId]);

  useEffect(() => {
    AddonResolver.getEnabledAddons(userId || 'guest').then(list => {
      setAddons(list);
      if (list.length > 0) setActiveAddon(list[0].id);
    });
  }, [userId]);

  useEffect(() => {
    if (activeAddon) {
      AddonResolver.resolveStream(activeAddon, animeId, currentEpisode).then(url => {
        setStreamUrl(url);
        setCurrentTime(0);
        setProgress(0);
        setShowNextOverlay(false);
      });
    }
  }, [activeAddon, animeId, currentEpisode]);

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

          syncTimerRef.current += 1;
          if (syncTimerRef.current >= 30) {
            syncTimerRef.current = 0;
            syncWatchHistory({
              user_id: userId,
              anime_id: animeId,
              anime_title: animeTitle,
              episode_id: currentEpisode,
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
  }, [isPlaying, duration, showNextOverlay, userId, animeId, currentEpisode, animeTitle, imageUrl]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = Math.floor(s % 60);
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const jump = (direction: 'back' | 'forward') => {
    setCurrentTime(prev => {
      const next = direction === 'forward' ? Math.min(prev + jumpTime, duration) : Math.max(prev - jumpTime, 0);
      setProgress((next / duration) * 100);
      return next;
    });
  };

  return (
    <div className={cn("w-full bg-black min-h-screen", isTheater ? "fixed inset-0 z-[100]" : "space-y-20 p-6 md:p-12 lg:p-20")}>
      <div className={cn("bg-black transition-all duration-700 relative overflow-hidden group/player", isTheater ? "w-full h-full" : "rounded-[3rem] aspect-video shadow-3xl border border-white/5 mx-auto max-w-6xl")}>
        
        {/* NATIVE PLAYER CORE */}
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer bg-surface" onClick={togglePlay}>
          <AnimatePresence>
            {!isPlaying && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="w-32 h-32 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(var(--primary-rgb),0.6)] z-20 border-8 border-black/20"
              >
                <Play fill="currentColor" size={56} className="ml-2" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 opacity-[0.02] select-none">
              <Monitor size={120} />
              <h4 className="text-xl font-black uppercase tracking-[0.5em] italic">Pro Streaming Node</h4>
          </div>
        </div>

        {/* PRO PLAYER HUD */}
        <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-6 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
          
          {/* Progress Architecture */}
          <div className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden group/bar">
              <div className="h-full bg-primary shadow-[0_0_15px_var(--primary)]" style={{ width: `${progress}%` }} />
              <div className="absolute right-0 top-0 h-full w-1/3 bg-white/30 blur-xl translate-x-full group-hover/bar:translate-x-0 transition-transform" />
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-10">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-all active:scale-90">
                {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
              </button>
              
              <div className="flex items-center gap-6">
                <button onClick={() => jump('back')} className="text-white hover:text-primary transition-all"><RotateCcw size={22} /></button>
                <button onClick={() => jump('forward')} className="text-white hover:text-primary transition-all"><RotateCw size={22} /></button>
              </div>

              <div className="text-xs font-black italic tracking-tighter flex items-center gap-3">
                  <span className="text-white">{formatTime(currentTime)}</span>
                  <span className="text-gray-700">/</span>
                  <span className="text-gray-500">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-3 group/vol">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-primary">
                    {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>
                  <div className="w-0 group-hover/vol:w-20 transition-all overflow-hidden h-1 bg-white/10 rounded-full">
                    <div className="h-full bg-primary" style={{ width: `${volume * 100}%` }} />
                  </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={cn("transition-all hover:rotate-45", showSettings ? "text-primary scale-110" : "text-white hover:text-primary")}
              >
                <Settings size={26} />
              </button>
              <button onClick={() => setIsTheater(!isTheater)} className={cn("transition-all", isTheater ? "text-primary" : "text-white hover:text-primary")}>
                <Layout size={26} />
              </button>
              <button className="text-white hover:text-primary transition-all"><Maximize size={26} /></button>
            </div>
          </div>
        </div>

        {/* GEAR WHEEL SETTINGS (MODAL) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-32 right-10 w-80 bg-black/90 backdrop-blur-3xl border-2 border-white/5 rounded-[2.5rem] p-8 z-[100] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] space-y-8"
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 pb-4 border-b border-white/5 italic">Engine Configuration</h4>
              
              <div className="space-y-6">
                {/* Language Node */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white">
                    <Globe size={18} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Metadata</span>
                  </div>
                  <div className="bg-white/5 p-1 rounded-full flex gap-1">
                    <button onClick={() => setLanguage('JP')} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black transition-all", language === 'JP' ? "bg-primary text-black" : "text-white hover:bg-white/5")}>JP</button>
                    <button onClick={() => setLanguage('EN')} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black transition-all", language === 'EN' ? "bg-primary text-black" : "text-white hover:bg-white/5")}>EN</button>
                  </div>
                </div>

                {/* Jump Protocol */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white">
                    <SkipForward size={18} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Jump Arc</span>
                  </div>
                  <select 
                    value={jumpTime} 
                    onChange={(e) => setJumpTime(Number(e.target.value))}
                    className="bg-white/5 text-white text-[9px] font-black px-3 py-1 rounded-lg outline-none"
                  >
                    <option value={5}>5 SEC</option>
                    <option value={10}>10 SEC</option>
                    <option value={30}>30 SEC</option>
                  </select>
                </div>

                {/* Subtitle Node */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white">
                    <Subtitles size={18} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Projection</span>
                  </div>
                  <button 
                    onClick={() => setSubsEnabled(!subsEnabled)}
                    className={cn("px-4 py-1.5 rounded-full text-[9px] font-black transition-all", subsEnabled ? "bg-primary text-black" : "bg-red-500/20 text-red-500")}
                  >
                    {subsEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Scaling Factor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <Type size={18} className="text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Visual Scale</span>
                    </div>
                    <span className="text-[9px] font-black text-primary">{subtitleSize}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="200" step="10" 
                    value={subtitleSize} 
                    onChange={(e) => setSubtitleSize(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HI-ANIME TOP HEADER */}
        <div className="absolute top-0 inset-x-0 p-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-8 pointer-events-auto">
              <button onClick={onBack} className="w-14 h-14 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 hover:border-primary transition-all group">
                <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">{animeTitle}</h3>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest italic">Node Link: ACTIVE • Episode {currentEpisode}</p>
              </div>
          </div>
        </div>

        {/* PROPAGATION OVERLAY */}
        <AnimatePresence>
          {showNextOverlay && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute bottom-40 right-10">
              <button onClick={() => onEpisodeChange(currentEpisode + 1)} className="bg-primary text-black px-12 py-6 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-4 hover:scale-105 transition-all shadow-2xl">
                <span>NEXT EPISODE</span>
                <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-20">
         {/* SELECTOR PANELS */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
               <EpisodeList episodes={episodes} currentEpisode={currentEpisode} onEpisodeSelect={onEpisodeChange} />
            </div>
            
            <section className="bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-8 h-fit">
               <div className="flex items-center gap-4">
                  <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Stream <span className="text-primary italic">Nodes</span></h3>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {addons.map(a => (
                    <button key={a.id} onClick={() => setActiveAddon(a.id)} className={cn("p-6 rounded-2xl border-2 transition-all flex items-center justify-between", activeAddon === a.id ? "bg-primary border-primary text-black" : "bg-surface border-white/5 text-gray-500 hover:text-white hover:border-primary/50")}>
                      <div className="flex items-center gap-5">
                        <HardDrive size={20} className={activeAddon === a.id ? "text-black" : "text-primary"} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">{a.name}</span>
                      </div>
                      <div className={cn("w-2 h-2 rounded-full", activeAddon === a.id ? "bg-black animate-pulse" : "bg-white/10")} />
                    </button>
                  ))}
               </div>
            </section>
         </div>
      </div>
    </div>
  );
};
