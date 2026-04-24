import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../services/supabase';
import { jikanService, Anime } from '../services/jikan';
import { Search, Play, ChevronRight, Zap } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [heroAnime, setHeroAnime] = useState<Anime | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const supabase = getSupabase();

  useEffect(() => {
    const fetchHero = async () => {
      try {
        if (user && supabase) {
          // 1. Check history for returning user
          const { data: history } = await (supabase as any)
            .from('watch_history')
            .select('anime_id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (history) {
            const anime = await jikanService.getAnimeById(history.anime_id);
            setHeroAnime(anime);
            setIsNewUser(false);
            
            // Sync Favicon
            const favicon = document.querySelector('link[rel="icon"]');
            if (favicon) (favicon as any).href = anime.images.webp.large_image_url;
          } else {
            // New user with high quality default (Solo Leveling 1080p)
            const anime = await jikanService.getAnimeById(52299); 
            setHeroAnime(anime);
            setIsNewUser(true);
            const favicon = document.querySelector('link[rel="icon"]');
            if (favicon) (favicon as any).href = anime.images.webp.large_image_url;
          }
        } else {
          // Random High Quality Discovery for non-logged in
          const randomIds = [52299, 5114, 11061, 38524, 40028]; // Trending / Classic Mix
          const randomId = randomIds[Math.floor(Math.random() * randomIds.length)];
          const anime = await jikanService.getAnimeById(randomId);
          setHeroAnime(anime);

          const favicon = document.querySelector('link[rel="icon"]');
          if (favicon) (favicon as any).href = anime.images.webp.large_image_url;
        }
      } catch (err) {
        console.error('Landing Discovery Failure:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, [user, supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/filter?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] relative overflow-hidden flex flex-col pt-8">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-[#0f0f0f]/20 z-10" />
        {heroAnime && (
          <img 
            src={heroAnime.images.webp.large_image_url} 
            alt="" 
            className="w-full h-full object-cover blur-sm opacity-20 scale-110 animate-pulse-slow"
          />
        )}
      </div>

      {/* Header Deck */}
      <header className="relative z-50 w-full max-w-[1600px] mx-auto px-10 flex flex-col items-center gap-16 py-12">
        <Link to="/home" className="logo-text text-6xl md:text-8xl hover:scale-105 transition-transform flex items-center justify-center gap-4">
          <span className="font-black italic text-white uppercase tracking-tighter">B3st</span>
          <span className="font-black italic text-primary uppercase tracking-tighter">Sekta</span>
        </Link>

        {/* Centered Search Engine */}
        <form onSubmit={handleSearch} className="w-full max-w-4xl relative group">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={28} />
          <input 
            type="text"
            placeholder="Search anime database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a]/80 backdrop-blur-2xl border-2 border-white/5 rounded-[40px] py-8 pl-20 pr-10 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xl font-black italic text-white placeholder:text-gray-800 shadow-2xl"
          />
          <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-primary text-black rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all">
             <ChevronRight size={24} strokeWidth={3} />
          </button>
        </form>
      </header>

      {/* Hero Visual Node */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-10 pb-20">
        <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center justify-center">
            <div className="space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 bg-primary/10 text-primary border border-primary/20 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg animate-bounce-slow">
                 <Zap size={16} /> {isNewUser ? 'NEW USER DETECTED' : 'RESUME WATCHING'}
              </div>
              <h3 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.85] text-white">
                 A PROFESSIONAL <br /> <span className="text-primary italic">WATCH EXPERIENCE</span>
              </h3>
              <p className="max-w-xl mx-auto lg:mx-0 text-gray-500 text-sm font-black uppercase tracking-[0.2em] leading-relaxed">
                 High-fidelity streaming experience with custom extension support. Secure. Private. Fast.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-10">
                <button 
                  onClick={() => navigate('/home')}
                  className="hianime-btn-yellow flex items-center gap-4 text-sm group"
                >
                  ENTER B3ST SEKTA
                  <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
                <Link 
                  to="/auth" 
                  className="bg-white/5 hover:bg-white/10 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-white/10 transition-all text-gray-400 hover:text-white"
                >
                  SIGN IN NOW
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex justify-center perspective-1000 group">
               {heroAnime && (
                 <div className="w-[450px] aspect-[2.8/4] rounded-[60px] overflow-hidden border-8 border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] rotate-y-12 group-hover:rotate-y-0 transition-transform duration-1000 relative">
                   <img 
                    src={heroAnime.images.webp.large_image_url} 
                    alt={heroAnime.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                   <div className="absolute bottom-12 inset-x-10">
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white truncate">{heroAnime.title}</h4>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2">
                        {isNewUser ? 'GLOBAL PRIORITY' : 'LAST SYNCHRONIZED'}
                      </p>
                   </div>
                 </div>
               )}
            </div>
        </div>
      </main>

      <footer className="relative z-50 py-12 border-t border-white/5 text-center px-10">
         <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em] leading-loose">
           &copy; 2026 B3ST SEKTA ARCHITECTURE / GLOBAL INFRASTRUCTURE BY DEEPMIND
         </p>
      </footer>
    </div>
  );
}
