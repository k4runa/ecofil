"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, MessageSquare, Sparkles, Clock } from "lucide-react";
import { useSocialStore } from "@/lib/social-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const SocialDrawer = ({ user, onClose }: { user: any | null, onClose: () => void }) => {
  const { messages, fetchMessages, sendMessage } = useSocialStore();
  const [content, setContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const history = user ? messages[user.id] || [] : [];

  useEffect(() => {
    if (user) {
      fetchMessages(user.id);
      // Polling for new messages every 5 seconds while open
      const interval = setInterval(() => fetchMessages(user.id), 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async () => {
    if (!content.trim() || !user) return;
    try {
      await sendMessage(user.id, content.trim());
      setContent("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {user && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-card border-l border-border z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter uppercase">{user.username}</h2>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Now</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-accent rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Match Insight */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Insight</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You both share a unique taste in cinema. Start a conversation about your favorite films!
                </p>
              </div>

              {history.map((msg: any) => {
                const isMe = msg.sender_id !== user.id;
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                      isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-accent text-foreground rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border bg-background/50">
              <div className="relative group">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-[60px] pr-12 rounded-2xl border-border/50 bg-card/50 focus:bg-card transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!content.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
