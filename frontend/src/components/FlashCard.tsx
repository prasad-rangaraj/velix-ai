import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThumbsUp, X, Minus, Sparkles, Volume2, Info } from "lucide-react";

export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example: string;
  phonetic?: string;
  savedFrom?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface FlashCardProps {
  word: VocabWord;
  onRating: (id: string, rating: "easy" | "hard" | "skip") => void;
}

export const FlashCard = ({ word, onRating }: FlashCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = 0.9;
    window.speechSynthesis.speak(ut);
  }, []);

  const handleRating = (rating: "easy" | "hard" | "skip") => {
    if (rating === "easy") {
      setCelebrate(true);
      setTimeout(() => onRating(word.id, rating), 600);
    } else {
      onRating(word.id, rating);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg gap-8 py-4">
      {/* 3D Card Container */}
      <div 
        className="relative w-full h-[320px] cursor-pointer group"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped(!flipped)}
      >
        <motion.div
          className="w-full h-full relative"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front Face: Word & Phonetics */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center overflow-hidden border"
            style={{ 
              background: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(16px) saturate(180%)",
              borderColor: "rgba(255, 255, 255, 0.4)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.5)",
              backfaceVisibility: "hidden"
            }}
          >
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />

            <motion.h2 
              className="text-4xl font-extrabold tracking-tight mb-2"
              style={{ color: "var(--text)" }}
            >
              {word.word}
            </motion.h2>
            
            {word.phonetic && (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-mono text-sm border border-indigo-100/50"
                onClick={(e) => { e.stopPropagation(); speak(word.word); }}
              >
                {word.phonetic}
                <Volume2 size={14} className="opacity-70" />
              </div>
            )}

            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1 opacity-40 group-hover:opacity-70 transition-opacity">
              <Sparkles size={16} className="text-indigo-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Tap to Flip</p>
            </div>
          </div>

          {/* Back Face: Definition & Example */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-[2.5rem] p-10 flex flex-col overflow-hidden border"
            style={{ 
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(255, 255, 255, 1)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden"
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-100/50 text-indigo-600">
                <Info size={16} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-500/70">Meaning</span>
            </div>

            <p className="text-lg font-medium leading-relaxed mb-6" style={{ color: "var(--text)" }}>
              {word.definition}
            </p>

            <div className="mt-auto p-5 rounded-2xl bg-slate-50/80 border border-slate-100/50 italic text-sm text-slate-500 relative">
              <span className="absolute -top-3 left-4 px-2 py-0.5 bg-white border border-slate-100 rounded text-[9px] font-bold uppercase tracking-tighter not-italic">Example</span>
              &ldquo;{word.example}&rdquo;
            </div>
          </div>
        </motion.div>

        {/* Celebration Particles (Simple Framer Motion dots) */}
        <AnimatePresence>
          {celebrate && (
            <motion.div 
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                  style={{ background: i % 2 === 0 ? "#6366F1" : "#10B981" }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Interaction Bar */}
      <motion.div 
        layout
        className="flex items-center p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg shadow-indigo-500/5 gap-1.5"
      >
        <button
          onClick={() => handleRating("hard")}
          className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all active:scale-95 group"
        >
          <X size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Again</span>
        </button>

        <div className="w-[1px] h-8 bg-slate-200/50" />

        <button
          onClick={() => handleRating("skip")}
          className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl hover:bg-slate-50 text-slate-400 transition-all active:scale-95 group"
        >
          <Minus size={18} />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Later</span>
        </button>

        <div className="w-[1px] h-8 bg-slate-200/50" />

        <button
          onClick={() => handleRating("easy")}
          className="flex flex-col items-center gap-1 px-8 py-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 hover:bg-emerald-600 group"
        >
          <ThumbsUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Known</span>
        </button>
      </motion.div>
    </div>
  );
};

