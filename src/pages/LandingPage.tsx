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
      <header className="relative z-50 w-full max-w-[1600px] mx-auto px-10 flex flex-col items-center gap-16 py-12 flex-1 justify-center">
        <Link to="/home" className="logo-text text-8xl md:text-[10rem] hover:scale-105 transition-transform flex items-center justify-center gap-6 mb-8">
          <span className="font-black italic text-white uppercase tracking-tighter">B3st</span>
          <span className="font-black italic text-primary uppercase tracking-tighter">Sekta</span>
        </Link>

        {/* Centered Search Engine */}
        <div className="w-full max-w-4xl space-y-12">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={32} />
            <input 
              type="text"
              placeholder="Search anime database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a]/80 backdrop-blur-3xl border-2 border-white/5 rounded-[50px] py-10 pl-24 pr-12 focus:outline-none focus:ring-8 focus:ring-primary/10 focus:border-primary transition-all text-2xl font-black italic text-white placeholder:text-gray-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]"
            />
            <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 p-5 bg-primary text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
               <ChevronRight size={32} strokeWidth={4} />
            </button>
          </form>

          <div className="flex justify-center">
            <button 
              onClick={() => navigate('/home')}
              className="bg-primary text-black px-20 py-8 rounded-[3rem] font-black italic text-xl uppercase tracking-[0.3em] flex items-center gap-6 hover:scale-110 active:scale-95 transition-all shadow-[0_30px_80px_rgba(var(--primary-rgb),0.4)]"
            >
              ENTER SITE
              <Play fill="currentColor" size={24} />
            </button>
          </div>
        </div>
      </header>

    </div>
  );
}
