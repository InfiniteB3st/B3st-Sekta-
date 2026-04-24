import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter as FilterIcon, Search, ChevronRight, LayoutGrid, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { jikanService } from '../services/jikan';
import { useSearchParams } from 'react-router-dom';
import { AnimeCard } from '../components/AnimeCard';

const GENRES = [
  { id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }, { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasy' }, { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' }, { id: 36, name: 'Slice of Life' }
];

export default function Filter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // States
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  useEffect(() => {
    loadResults();
  }, [searchParams]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const data = await jikanService.searchAnime(q);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    const params: any = {};
    if (search) params.q = search;
    if (selectedGenre) params.genre = selectedGenre;
    setSearchParams(params);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-black pt-32 px-6 md:px-20 pb-40 space-y-16 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-12">
        <div className="flex items-end justify-between border-b border-white/5 pb-12">
          <div className="space-y-4">
             <h1 className="text-7xl font-black italic text-white uppercase tracking-tighter">
               Discovery <span className="text-primary italic">Engine</span>
             </h1>
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Found {results.length} results matching parameters</p>
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="bg-white/5 border-2 border-white/10 px-10 py-5 rounded-[2rem] text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-4 hover:bg-white hover:text-black transition-all"
          >
            <FilterIcon size={18} />
            Configure Site Nodes
          </button>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <Loader2 className="text-primary animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-800">Accessing Database Manifests...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {results.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl bg-[#0a0a0a] border-2 border-white/5 rounded-[4rem] p-16 space-y-12 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Terminal Logic</h2>
                <button onClick={() => setShowFilters(false)} className="p-6 bg-white/5 text-gray-500 rounded-full hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-12">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">Terminal Query</label>
                  <div className="relative group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input 
                      type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Input search target..."
                      className="w-full bg-black border-2 border-white/5 rounded-3xl py-6 pl-20 pr-10 text-white font-black outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">Species Filter (Genre)</label>
                  <div className="flex flex-wrap gap-3">
                    {GENRES.map(g => (
                      <button 
                        key={g.id} onClick={() => setSelectedGenre(g.id)}
                        className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedGenre === g.id ? 'bg-primary border-primary text-black' : 'border-white/5 text-gray-600'}`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleApply}
                className="w-full bg-primary text-black py-8 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl"
              >
                Sync Database Access
                <ChevronRight size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
