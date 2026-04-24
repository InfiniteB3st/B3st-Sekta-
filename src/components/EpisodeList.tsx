import React, { useState } from 'react';
import { Play, Mic, Subtitles, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface Episode {
  mal_id: number;
  title: string;
}

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode: number;
  onEpisodeSelect: (ep: number) => void;
}

/**
 * HiAnime 1:1 Episode List Node
 * Features Jikan Titles and Range Pagination for 100+ series.
 */
export const EpisodeList: React.FC<EpisodeListProps> = ({ episodes, currentEpisode, onEpisodeSelect }) => {
  const [activeRange, setActiveRange] = useState(0); // 0 = 1-100, 1 = 101-200
  
  const rangeSize = 100;
  const numRanges = Math.ceil(episodes.length / rangeSize);
  const ranges = Array.from({ length: numRanges }, (_, i) => i);
  
  const visibleEpisodes = episodes.slice(activeRange * rangeSize, (activeRange + 1) * rangeSize);

  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-8 border-primary pl-8">
        <div className="space-y-2">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Access <span className="text-primary italic">Nodes</span>
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">
            Total Transmissions: {episodes.length}
          </p>
        </div>

        {/* RANGE SELECTOR DROPDOWN */}
        {numRanges > 1 && (
          <div className="relative group">
            <select 
              value={activeRange}
              onChange={(e) => setActiveRange(Number(e.target.value))}
              className="appearance-none bg-surface border-2 border-white/5 rounded-2xl py-4 pl-8 pr-16 text-[10px] font-black uppercase tracking-widest text-[#ffb100] outline-none cursor-pointer focus:border-primary transition-all hover:bg-white/5"
            >
              {ranges.map(r => (
                <option key={r} value={r}>
                  Range: {r * rangeSize + 1} - {Math.min((r + 1) * rangeSize, episodes.length)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -track-y-1/2 text-primary pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 max-h-[800px] overflow-y-auto custom-scrollbar pr-4 pb-10">
        {visibleEpisodes.length > 0 ? (
          visibleEpisodes.map((ep) => (
            <button
              key={ep.mal_id}
              onClick={() => onEpisodeSelect(ep.mal_id)}
              title={ep.title || `Transmission ${ep.mal_id}`}
              className={cn(
                "group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden flex items-center gap-8 w-full",
                currentEpisode === ep.mal_id 
                  ? "bg-primary text-black border-primary shadow-xl z-10"
                  : "bg-[#0a0a0a] border-white/5 hover:border-primary/40 text-white"
              )}
            >
              <div className={cn(
                "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black italic text-lg border",
                currentEpisode === ep.mal_id ? "bg-black/10 border-black/10" : "bg-black/40 border-white/5 text-primary"
              )}>
                {ep.mal_id}
              </div>
              
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="space-y-1">
                  <h4 className="text-[14px] font-black italic uppercase tracking-tighter line-clamp-1">
                    Episode {ep.mal_id}
                  </h4>
                  <p className={cn("text-[9px] font-bold uppercase tracking-widest truncate max-w-sm", currentEpisode === ep.mal_id ? "text-black/60" : "text-gray-500")}>
                    {ep.title || 'Signal Stabilized'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                      currentEpisode === ep.mal_id ? "text-black/60" : "text-gray-600"
                    )}>
                      <Subtitles size={10} /> SUB
                    </span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                      currentEpisode === ep.mal_id ? "text-black/60" : "text-gray-600"
                    )}>
                      <Mic size={10} /> DUB
                    </span>
                  </div>
                  <Play 
                    className={cn(
                      "transition-all group-hover:scale-125",
                      currentEpisode === ep.mal_id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} 
                    fill="currentColor" 
                    size={20} 
                  />
                </div>
              </div>

              {currentEpisode === ep.mal_id && (
                <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
              )}
            </button>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-700 font-black uppercase tracking-widest text-[10px] italic">
             Connecting to Jikan Nodes...
          </div>
        )}
      </div>
    </section>
  );
};
