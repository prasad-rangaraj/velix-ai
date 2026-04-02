import { useState, useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { cn } from "@/lib/utils";
import { Swords, Send, Loader2 } from "lucide-react";
import { useDebateStore, type DebateArgument } from "@/store/debate";

const TOPICS = [
  { cat: "Business",   items: ["Remote work should be the default", "AI will replace most white-collar jobs", "Four-day work week improves productivity"] },
  { cat: "Ethics",     items: ["Companies should disclose all AI usage to users", "Data privacy is more important than personalisation"] },
  { cat: "Technology", items: ["Open-source AI is safer than closed models", "Social media companies should be regulated like utilities"] },
  { cat: "Society",    items: ["Universities are becoming less valuable", "Universal basic income is economically viable"] },
];

export const DebateArena = () => {
  const { activeSessionId, topic, args, roundCount, isLoading, isSubmitting, startDebate, submitArgument, resetDebate, fetchPastSessions } = useDebateStore();
  const [inputTopic, setInputTopic] = useState("");
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    fetchPastSessions();
  }, [fetchPastSessions]);

  const start = (t: string, cat: string = "Business") => {
    startDebate(t, cat);
  };

  const submit = () => {
    if (!userInput.trim() || isSubmitting) return;
    submitArgument(userInput);
    setUserInput("");
  };

  const avgScore = (a: DebateArgument) => a.score ? Math.round((a.score.claim + a.score.evidence + a.score.rebuttal) / 3) : 0;

  return (
    <SidebarLayout>
      <div className="p-7 max-w-5xl mx-auto">
        <PageHeader
          title="Debate Arena"
          eyebrow="Argumentation Training"
          subtitle="AI argues the opposite. Structure your logic, defend your position, earn your score."
        />

        {!activeSessionId ? (
          <div className="grid grid-cols-2 gap-6">
            {/* Topic picker */}
            <div className="card p-5">
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Choose a Topic</p>
              <div className="flex flex-col gap-4">
                {TOPICS.map((group) => (
                  <div key={group.cat}>
                    <p className="label mb-2">{group.cat}</p>
                    <div className="flex flex-col gap-1.5">
                      {group.items.map((item) => (
                        <button key={item} onClick={() => start(item, group.cat)} disabled={isLoading}
                          className="text-left text-sm px-3.5 py-2.5 rounded-xl border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                          style={{ background: "var(--bg)", color: "var(--text-2)", borderColor: "var(--border)" }}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom topic + explainer */}
            <div className="flex flex-col gap-4">
              <div className="card p-5">
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>Custom Topic</p>
                <input value={inputTopic} onChange={(e) => setInputTopic(e.target.value)}
                  placeholder="Type any debate topic…"
                  className="input mb-3" disabled={isLoading} />
                <button onClick={() => inputTopic.trim() && start(inputTopic, "Custom")}
                  disabled={!inputTopic.trim() || isLoading} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} style={{ pointerEvents: "all" }} />} 
                  {isLoading ? "Starting Arena..." : "Start Debate"}
                </button>
              </div>
              <div className="card p-5">
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>How Scoring Works</p>
                {[["Claim Strength", "How clearly you state your position"],
                  ["Evidence Quality", "Do you use specific data or examples?"],
                  ["Rebuttal", "How well do you address the AI's counter?"],
                  ["Fallacy Detector", "Flags logical errors in real time"]].map(([k, v]) => (
                  <div key={k as string} className="flex gap-2 mb-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "var(--accent)" }} />
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{k}</p>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>{v}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Topic header */}
            <div className="card px-5 py-3 flex items-center justify-between">
              <div>
                <p className="label">Debating</p>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>"{topic}"</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Round {roundCount}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>You: FOR · AI: AGAINST</p>
              </div>
            </div>

            {/* Argument thread */}
            <div className="card p-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
              {args.map((arg, i) => (
                <div key={i} className={cn("flex gap-3", arg.side === "user" && "flex-row-reverse")}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: arg.side === "ai" ? "var(--bg)" : "var(--accent-dim)", color: arg.side === "ai" ? "var(--text-2)" : "var(--accent)" }}>
                    {arg.side === "ai" ? "AI" : "You"}
                  </div>
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                      style={{ background: arg.side === "ai" ? "var(--bg)" : "var(--accent-dim)", color: "var(--text)", border: arg.side === "ai" ? "1px solid var(--border)" : "none" }}>
                      {arg.text}
                    </div>
                    {arg.score && (
                      <div className="flex gap-2 mt-1.5 flex-row-reverse">
                        {[["Claim", arg.score.claim], ["Evidence", arg.score.evidence], ["Rebuttal", arg.score.rebuttal]].map(([l, v]) => (
                          <div key={l as string} className="text-center">
                            <p className="text-[10px] font-bold" style={{ color: (v as number) >= 70 ? "var(--green)" : (v as number) >= 50 ? "var(--amber)" : "var(--red)" }}>{v}</p>
                            <p className="text-[9px]" style={{ color: "var(--text-3)" }}>{l}</p>
                          </div>
                        ))}
                        <p className="text-[11px] font-bold mr-2 self-center" style={{ color: "var(--accent)" }}>Avg: {avgScore(arg)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input value={userInput} onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="State your argument — include evidence (data, examples, studies)…"
                className="input flex-1" />
              <button onClick={submit} disabled={!userInput.trim()} className="btn-primary px-4 py-2.5">
                <Send size={16} style={{ pointerEvents: "all" }} />
              </button>
            </div>
            <button onClick={resetDebate}
              className="text-xs text-center" style={{ color: "var(--text-3)" }}>
              ← Change topic
            </button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
