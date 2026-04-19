"use client";

import { useEffect } from "react";
import { useSocialStore } from "@/lib/social-store";
import { User, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const SimilarMinds = ({ open, onSelectUser }: { open: boolean, onSelectUser: (user: any) => void }) => {
  const { similarMinds, fetchSimilarMinds, isLoading } = useSocialStore();

  useEffect(() => {
    fetchSimilarMinds();
  }, [fetchSimilarMinds]);

  if (!open) return null;

  return (
    <div className="mt-8 px-2">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Similar Minds
        </span>
      </div>

      <div className="space-y-3">
        {isLoading && similarMinds.length === 0 && (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-card/50 rounded-lg" />
            ))}
          </div>
        )}

        {similarMinds.length === 0 && !isLoading && (
          <p className="text-[10px] text-muted-foreground/50 italic px-2">
            No matches yet...
          </p>
        )}

        {similarMinds.map((match: any) => (
          <button
            key={match.target_user.id}
            onClick={() => onSelectUser(match.target_user)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-card group transition-all border border-transparent hover:border-border/50"
          >
            <div className="size-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-zinc-500 group-hover:text-primary transition-colors" />
            </div>
            
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-xs font-bold text-foreground truncate w-full text-left">
                {match.target_user.username}
              </span>
              <span className="text-[9px] text-primary font-black uppercase tracking-widest">
                {Math.round(match.score * 100)}% Match
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
