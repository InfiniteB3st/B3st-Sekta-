import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Anime, jikanService } from '../services/jikan';
import { AnimeCard } from '../components/AnimeCard';
import { Sidebar } from '../components/Sidebar';
import { Filter as FilterIcon, Search } from 'lucide-react';

export default function Filter() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const data = await jikanService.searchAnime(query || 'naruto'); // default search if none
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [query]);

  return (
    <div className="flex flex-col lg:flex-row gap-8" id="filter-page">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
              {query ? `Search Results: ${query}` : 'All Anime'}
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide">
              Found {results.length} results matching your search
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-surface hover:bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm font-bold transition-all">
              <FilterIcon size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading ? (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-surface animate-pulse rounded-lg" />
            ))
          ) : results.length > 0 ? (
            results.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2 italic">No results found</h3>
              <p className="text-gray-500 max-w-sm">
                We couldn't find any anime matching "{query}". Try different keywords or browse our top collection.
              </p>
            </div>
          )}
        </div>
      </div>

      <Sidebar />
    </div>
  );
}
