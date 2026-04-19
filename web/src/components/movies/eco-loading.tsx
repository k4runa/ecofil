"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const messages = [
  { threshold: 0, text: "Eco is initializing..." },
  { threshold: 20, text: "Analyzing your taste patterns..." },
  { threshold: 40, text: "Scanning the cinematic multiverse..." },
  { threshold: 60, text: "Selecting personalized masterpieces..." },
  { threshold: 80, text: "Finalizing your daily picks..." },
  { threshold: 95, text: "Ready to explore." },
];

export function EcoLoading() {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(messages[0].text);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Non-linear progress simulation
        const increment = Math.random() * (prev > 80 ? 2 : 10);
        return Math.min(prev + increment, 100);
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const msg = [...messages].reverse().find((m) => progress >= m.threshold);
    if (msg) setCurrentMessage(msg.text);
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-8 py-12 animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-2xl relative z-10">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full -z-10 animate-pulse" />
      </div>

      <div className="w-full space-y-4 text-center">
        <div className="flex justify-between items-end px-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"
            >
              {currentMessage}
            </motion.p>
          </AnimatePresence>
          <span className="text-[10px] font-mono font-bold text-zinc-500">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
        </div>
      </div>

      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest animate-pulse">
        Secured by Cinematic Oracle
      </p>
    </div>
  );
}
