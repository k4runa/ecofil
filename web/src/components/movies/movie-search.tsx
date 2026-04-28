"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X, Film, Check, Plus, Star } from "lucide-react";
import { movieApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { toast } from "sonner";
import { MovieDetailsModal } from "./movie-details-modal";
import { cn } from "@/lib/utils";

export function MovieSearch() {
  const { user } = useAuthStore();
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const [query, setLocalQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set());

  const categories = [
    { name: "Action", icon: "🔥" },
    { name: "Sci-Fi", icon: "🚀" },
    { name: "Comedy", icon: "😂" },
    { name: "Drama", icon: "🎭" },
    { name: "Horror", icon: "👻" },
    { name: "AI Picks", icon: "✨" }
  ];

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTracked = async () => {
      try {
        const res = await movieApi.getMovies();
        const movies = res.data?.data?.watched_movies || res.data?.data?.movies || res.data || [];
        setTrackedIds(new Set(movies.map((m: any) => m.tmdb_id)));
      } catch (err) {
        console.log("Failed to fetch tracked movies for search (Background):", err);
      }
    };
    fetchTracked();
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await movieApi.searchMovies(query);
      const allResults = res.data?.data?.results || [];
      
      // Filter logic: Only items with poster AND a valid rating (not 0)
      const filtered = allResults.filter((m: any) => {
        const rating = m.primary_rating?.value || m.ratings?.tmdb?.value || 0;
        return m.poster_url && Number(rating) > 0;
      });

      setResults(filtered);
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMovie = async (movie: any) => {
    // Force integer for backend validation
    const tmdbId = parseInt(String(movie.tmdb_id || movie.id));
    if (isNaN(tmdbId)) {
      toast.error("Invalid movie ID");
      return;
    }

    if (addingId === tmdbId || trackedIds.has(tmdbId)) return;
    setAddingId(tmdbId);
    try {
      await movieApi.addMovie({ tmdb_id: tmdbId });
      toast.success(`${movie.title} added to library!`);
      setTrackedIds((prev) => new Set(prev).add(tmdbId));
      window.dispatchEvent(new CustomEvent("movie-added", { detail: { tmdb_id: tmdbId } }));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add movie");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-12 pb-20 w-full animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tighter text-white">Discovery</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Search for cinematic masterpieces
          </p>
        </div>

        <div className="relative group max-w-2xl w-full">
          <div className="absolute inset-0 bg-white/5 blur-3xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
          <div className="relative flex items-center bg-zinc-950/80 border border-white/5 rounded-2xl p-2 backdrop-blur-2xl focus-within:border-white/20 focus-within:bg-black transition-all">
            <div className="pl-4 pr-3">
              <Search className="w-5 h-5 text-zinc-600 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Start typing to explore..."
              value={query}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-bold text-white placeholder:text-zinc-800"
            />
            {query && (
              <button
                onClick={() => {
                  setLocalQuery("");
                  setSearchQuery("");
                }}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {!query && !isSearching ? (
        <div className="py-32 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-[3rem] space-y-6 animate-in zoom-in-95 duration-700">
           <div className="size-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto border border-white/5">
              <Search className="w-8 h-8 text-zinc-700" />
           </div>
           <div className="space-y-2">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
               Your next favorite movie is waiting
             </p>
             <p className="text-zinc-800 text-xs font-bold">
               Try searching for a title, genre, or actor.
             </p>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500 w-full">
          <div className="flex items-center justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">
               {isSearching ? "Searching..." : results.length > 0 ? `FOUND ${results.length} RESULTS` : ""}
             </h3>
             {isSearching && <Loader2 className="w-4 h-4 animate-spin text-white" />}
          </div>

          {results.length === 0 && !isSearching ? (
            <div className="py-20 text-center space-y-4 bg-zinc-950/50 rounded-[3rem] border border-white/5">
              <div className="size-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-sm font-bold text-zinc-500">No high-quality matches found for "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
              {results.map((movie) => {
                const tmdbId = movie.tmdb_id || movie.id;
                const isTracked = trackedIds.has(tmdbId);
                const rating = movie.primary_rating?.value || movie.ratings?.tmdb?.value || 0;

                return (
                  <motion.div
                    key={tmdbId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-4 flex flex-col gap-5 hover:bg-zinc-900/80 transition-all cursor-pointer group"
                  >
                    <div className="w-full aspect-[2/3] bg-zinc-950 rounded-[2rem] overflow-hidden relative shadow-2xl">
                      {movie.poster_url ? (
                        <img
                          src={movie.poster_url}
                          className="w-full h-full object-cover transition-opacity duration-500"
                          alt=""
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-12 h-12 text-zinc-900" />
                        </div>
                      )}

                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-[11px] font-black text-white shadow-xl">
                        <Star className="w-3.5 h-3.5 fill-white" />
                        {Number(rating).toFixed(1)}
                      </div>

                      <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleAddMovie(movie);
                           }}
                           className={cn(
                             "size-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90",
                             isTracked ? "bg-emerald-500 text-white" : "bg-white text-black hover:scale-110"
                           )}
                         >
                           {addingId === tmdbId ? (
                             <Loader2 className="w-5 h-5 animate-spin" />
                           ) : isTracked ? (
                             <Check className="w-5 h-5" />
                           ) : (
                             <Plus className="w-5 h-5" />
                           )}
                         </button>
                      </div>
                    </div>
                    <div className="px-2 space-y-1">
                       <h4 className="text-sm font-black truncate text-zinc-100 group-hover:text-white transition-colors">
                         {movie.title}
                       </h4>
                       <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                           {movie.year || "N/A"}
                         </p>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <MovieDetailsModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onAdd={handleAddMovie}
        isAdding={addingId === selectedMovie?.tmdb_id}
        isTracked={trackedIds.has(selectedMovie?.tmdb_id)}
      />
    </div>
  );
}
