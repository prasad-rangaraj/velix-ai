import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SidebarLayout, PageHeader } from "@/layouts/SidebarLayout";
import { FlashCard } from "@/components/FlashCard";
import type { VocabWord } from "@/components/FlashCard";
import { Badge, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Search, BookMarked, RefreshCw, Volume2, Loader2 } from "lucide-react";
import { api } from "@/utils";

// ── Phoneme breakdown (ELSA shows IPA but no actionable explanation) ──
// ── Phoneme breakdown (ELSA shows IPA but no actionable explanation) ──
interface Word extends Omit<VocabWord, "id" | "difficulty"> {
  id: any;
  phonemes: { symbol: string; sound: string; tip: string }[];
  difficulty?: "easy" | "medium" | "hard";
  saved_from?: string;
  example_sentence?: string;
}

const difficultyBadge: Record<string, "success" | "warning" | "error"> = {
  easy: "success", medium: "warning", hard: "error",
};

type Mode = "list" | "flashcard";

export const Vocabulary = () => {
  const [mode, setMode]           = useState<Mode>("list");
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState<string | null>(null);
  
  const [words, setWords]         = useState<Word[]>([]);
  const [queue, setQueue]         = useState<Word[]>([]);
  const [loading, setLoading]     = useState(true);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(ut);
  };

  useEffect(() => {
    Promise.all([
      api.GET<any>("/api/vocabulary/words"),
      api.GET<any>("/api/vocabulary/review")
    ]).then(([wRes, rRes]) => {
      if (wRes.data?.words) setWords(wRes.data.words);
      if (rRes.data?.words) setQueue(rRes.data.words);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    (w.saved_from?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  const handleRating = async (id: any, rating: "easy" | "hard" | "skip") => {
    // Optimistic UI updates
    if (rating === "easy") {
      setQueue((q) => q.filter((x) => x.id !== id));
    } else if (rating === "hard") {
      const card = queue.find(x => x.id === id);
      if (card) {
        setQueue((q) => [...q.filter((x) => x.id !== id), card]);
      }
    }
    // API Call
    api.POST("/api/vocabulary/review", { word_id: Number(id), rating }).catch(() => {});
  };

  const currentCard = queue[0];

  if (loading) return (
    <SidebarLayout>
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
        <p className="text-sm font-medium text-slate-500">Loading vocabulary...</p>
      </div>
    </SidebarLayout>
  );

  return (
    <SidebarLayout>
      <div className="p-7 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="label mb-1.5">Spaced Repetition</p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>Vocabulary</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{words.length} words auto-saved · tap a card to see phoneme guide</p>
          </div>
          <div className="flex gap-2">
            {(["list", "flashcard"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  background: mode === m ? "var(--accent-dk)" : "var(--surface)",
                  color: mode === m ? "white" : "var(--text-2)",
                  borderColor: mode === m ? "var(--accent-dk)" : "var(--border)",
                  boxShadow: mode === m ? "0 2px 8px var(--accent-glow)" : "none",
                }}>
                {m === "list" ? "Word Bank" : "Flash Cards"}
              </button>
            ))}
          </div>
        </div>

        {mode === "list" ? (
          <>
            {/* Search */}
            <div className="relative mb-5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ pointerEvents: "all", color: "var(--text-3)" }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words or session names…" className="input pl-10" />
            </div>

            {/* Word grid */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((word) => {
                const isOpen = expanded === word.id;
                return (
                  <div key={word.id} className="card overflow-hidden">
                    {/* Word header */}
                    <button className="w-full p-4 text-left hover:bg-[var(--surface-2)] transition-colors"
                      onClick={() => setExpanded(isOpen ? null : word.id)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-bold text-base cursor-pointer hover:underline underline-offset-4" 
                            style={{ color: "var(--text)" }}
                            onClick={(e) => { e.stopPropagation(); speak(word.word); }}>
                            {word.word}
                          </p>
                          {word.phonetic && (
                            <p className="text-xs font-mono mt-0.5 flex items-center gap-1.5 cursor-pointer" 
                               style={{ color: "var(--accent)" }}
                               onClick={(e) => { e.stopPropagation(); speak(word.word); }}>
                              {word.phonetic}
                              <Volume2 size={11} style={{ pointerEvents: "all" }} />
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {word.saved_from && (
                            <Badge variant="outline">
                              <BookMarked size={9} style={{ pointerEvents: "all" }} /> {word.saved_from}
                            </Badge>
                          )}
                          <Badge variant={difficultyBadge[word.difficulty ?? "easy"]}>{word.difficulty}</Badge>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed mb-1.5" style={{ color: "var(--text-2)" }}>{word.definition}</p>
                      <p className="text-xs italic" style={{ color: "var(--text-3)" }}>&ldquo;{word.example}&rdquo;</p>
                    </button>

                    {/* ── Phoneme breakdown (competitor gap: ELSA shows IPA but no guidance) ── */}
                    {isOpen && (
                      <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mt-3 mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                            Pronunciation Guide
                          </p>
                          <button onClick={() => speak(word.word)} className="p-1 rounded-md hover:bg-[var(--bg)] transition-colors" style={{ color: "var(--accent)" }}>
                            <Volume2 size={12} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(word.phonemes || []).map((ph, pi) => (
                            <div key={pi} className="rounded-xl p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-sm" style={{ color: "var(--accent)" }}>{ph.symbol}</span>
                                <span className="text-xs" style={{ color: "var(--text-2)" }}>{ph.sound}</span>
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>{ph.tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!filtered.length && (
                <div className="col-span-2">
                  <EmptyState icon={Search} title={`No results for "${search}"`} body="Try searching the word or the session it came from." />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-3 w-full max-w-md mb-4 mt-2">
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily Mastery progress</span>
                <span className="text-xs font-bold text-indigo-600">{words.length - queue.length}/{words.length} words</span>
              </div>
              <div className="w-full h-3 rounded-full p-1" style={{ background: "var(--border)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${words.length > 0 ? ((words.length - queue.length) / words.length) * 100 : 100}%` }}
                  className="h-full rounded-full transition-all relative" 
                  style={{ 
                    background: "linear-gradient(90deg, #6366F1, #818CF8)",
                    boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)"
                  }} 
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full" />
                </motion.div>
              </div>
            </div>
            {queue.length > 0 ? (
              <FlashCard 
                word={{
                  ...currentCard,
                  savedFrom: currentCard.saved_from, // Map snake_case to camelCase for the component
                  example: currentCard.example_sentence || currentCard.example // Bridge potential key differences
                }} 
                onRating={handleRating} 
              />
             ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card p-10 text-center max-w-md border-none shadow-2xl shadow-indigo-500/10"
                  style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)" }}
                >
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl">
                    🎉
                  </div>
                  <h2 className="font-extrabold text-2xl mb-2" style={{ color: "var(--text)" }}>Peak Performance!</h2>
                  <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-2)" }}>You've reviewed your entire vocabulary queue for today. Your future self will thank you for the consistency.</p>
                  
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { 
                        api.GET<any>("/api/vocabulary/review")
                          .then(({ data }) => { if (data?.words) setQueue(data.words); }) 
                      }}
                      className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2">
                      <RefreshCw size={16} /> Refresh Queue
                    </button>
                    <button onClick={() => setMode("list")} className="btn-secondary w-full py-4 text-sm">
                      Browse Word Bank
                    </button>
                  </div>
                </motion.div>
              )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
