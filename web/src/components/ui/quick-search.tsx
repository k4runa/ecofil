"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Star, Plus, Check, Film, ArrowRight } from "lucide-react";
import { movieApi } from "@/lib/api";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function QuickSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveTab, setSearchQuery } = useDashboardStore();
  const username = useAuthStore((state) => state.user?.username);
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set());

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch tracked movies to show Check/Plus
  useEffect(() => {
    const fetchTracked = async () => {
      if (!username) return;
      try {
        const res = await movieApi.getMovies();
        const movies = res.data?.data?.watched_movies || [];
        setTrackedIds(new Set(movies.map((m: any) => m.tmdb_id || m.id)));
      } catch (err) { }
    };
    fetchTracked();
  }, [username, open]);

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const res = await movieApi.searchMovies(query);
      const allResults = res.data?.data?.results || [];
      // Only show top 5 high-quality results in quick search
      const filtered = allResults.filter((m: any) => m.poster_url).slice(0, 5);
      setResults(filtered);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAll = () => {
    setSearchQuery(query);
    setActiveTab("search");
    setOpen(false);
  };

  const handleAdd = async (e: React.MouseEvent, movie: any) => {
    e.stopPropagation();
    // Ensure tmdb_id is an integer for the backend
    const tmdbId = parseInt(String(movie.tmdb_id || movie.id));
    if (isNaN(tmdbId)) {
      toast.error("Invalid movie ID");
      return;
    }

    try {
      await movieApi.addMovie({ tmdb_id: tmdbId });
      toast.success(`${movie.title} added!`);
      setTrackedIds(prev => new Set(prev).add(tmdbId));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add movie");
    }
  };

  return (
    <div className="relative w-full max-w-md group" ref={containerRef}>
      <div className={cn(
        "relative flex items-center bg-zinc-900 border transition-all duration-300 rounded-xl overflow-hidden",
        open ? "border-white/20 bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]" : "border-white/10"
      )}>
        <Search className={cn(
          "absolute left-4 w-4 h-4 transition-colors",
          query ? "text-white" : "text-zinc-600"
        )} />
        <input
          type="text"
          placeholder="Quick search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          className="w-full pl-12 pr-10 py-2.5 bg-transparent text-sm font-bold text-white placeholder:text-zinc-700 outline-none"
        />
        {loading && (
          <Loader2 className="absolute right-4 w-4 h-4 animate-spin text-zinc-500" />
        )}
      </div>

      <AnimatePresence>
        {open && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
          >
            <div className="p-2 space-y-1">
              {results.length > 0 ? (
                <>
                  {results.map((movie) => {
                    const tmdbId = movie.tmdb_id || movie.id;
                    const isAdded = trackedIds.has(tmdbId);
                    const rating = movie.primary_rating?.value || movie.ratings?.tmdb?.value || 0;

                    return (
                      <div
                        key={tmdbId}
                        onClick={() => {
                          setSearchQuery(movie.title);
                          setActiveTab("search");
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer group/item"
                      >
                        <div className="w-10 h-14 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                          {movie.poster_url ? (
                            <img src={movie.poster_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-4 h-4 text-zinc-800 m-auto" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-zinc-100 truncate group-hover/item:text-white">{movie.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1 text-[10px] font-black text-white">
                              <Star className="w-2.5 h-2.5 fill-white" />
                              {Number(rating).toFixed(1)}
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{movie.year || "N/A"}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleAdd(e, movie)}
                          className={cn(
                            "p-2 rounded-lg transition-all opacity-0 group-hover/item:opacity-100",
                            isAdded ? "text-emerald-500" : "text-zinc-500 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={handleSeeAll}
                    className="w-full mt-2 flex items-center justify-center gap-2 p-3 bg-zinc-900/50 hover:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all rounded-xl border border-white/5"
                  >
                    See all results
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              ) : !loading ? (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-zinc-600">No results found for "{query}"</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
