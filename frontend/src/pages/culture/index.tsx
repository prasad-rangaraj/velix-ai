import { useState, useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { cn } from "@/lib/utils";
import { Globe, ChevronRight, Loader2 } from "lucide-react";
import { useCultureStore } from "@/store/culture";

const Gauge = ({ value, label }: { value: number; label: string }) => {
  const color = value > 66 ? "var(--red)" : value > 33 ? "var(--amber)" : "var(--green)";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="font-bold" style={{ color: "var(--text)" }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
};

export const CultureRoom = () => {
  const { cultures, selectedCulture, isLoadingList, isLoadingDetail, fetchCultures, selectCulture } = useCultureStore();
  const [tab, setTab] = useState<"norms" | "taboos" | "tips">("norms");
  const [activeCultureId, setActiveCultureId] = useState<string | null>(null);

  useEffect(() => {
    fetchCultures();
  }, [fetchCultures]);

  return (
    <SidebarLayout>
      <div className="p-7 max-w-6xl mx-auto">
        <PageHeader
          title="Culture Room"
          eyebrow="Cultural Intelligence (CQ)"
          subtitle="Learn how communication norms differ — adapt your style to any professional context worldwide"
        />

        <div className="grid grid-cols-6 gap-3 mb-6">
          {isLoadingList && cultures.length === 0 ? (
            <div className="col-span-6 flex justify-center py-6">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : (
            cultures.map((c) => (
              <button key={c.id} onClick={() => { setActiveCultureId(c.id); setTab("norms"); selectCulture(c.id); }}
                className={cn("card card-hover p-4 text-center flex flex-col items-center gap-2 transition-all",
                  activeCultureId === c.id && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]")}
                style={activeCultureId === c.id ? { background: "var(--accent-dim)" } : {}}>
                <span className="text-3xl">{c.flag}</span>
                <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{c.name}</p>
                {c.region && <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{c.region}</p>}
              </button>
            ))
          )}
        </div>

        {isLoadingDetail && activeCultureId ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent)" }} />
            <p className="font-semibold text-sm" style={{ color: "var(--text-2)" }}>Loading cultural metrics...</p>
          </div>
        ) : selectedCulture ? (
          <div className="grid grid-cols-3 gap-5">
            {/* Culture profile */}
            <Section title={`${selectedCulture.flag} ${selectedCulture.name} Profile`}>
              <div className="mb-4">
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-3)" }}>Phrase of the Day</p>
                <div className="rounded-xl px-3 py-2 text-sm italic border" 
                  style={{ background: "var(--accent-dim)", color: "var(--accent)", borderColor: "rgba(99,102,241,0.25)" }}>
                  "{selectedCulture.daily_phrase || selectedCulture.greeting}"
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-3)" }}>Standard Greeting</p>
                <div className="rounded-xl px-3 py-2 text-sm italic" style={{ background: "var(--bg)", color: "var(--text)" }}>
                  "{selectedCulture.greeting}"
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Gauge value={selectedCulture.directness} label="Directness" />
                <Gauge value={selectedCulture.hierarchy} label="Hierarchy" />
                <Gauge value={selectedCulture.formality} label="Formality" />
              </div>
              <div className="mt-4 pt-4 flex flex-col gap-1" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>Scale Guide</p>
                {[["Directness", "Indirect ↔ Very Direct"], ["Hierarchy", "Flat ↔ Top-Down"], ["Formality", "Casual ↔ Formal"]].map(([k, v]) => (
                  <p key={k} className="text-xs" style={{ color: "var(--text-3)" }}><strong style={{ color: "var(--text-2)" }}>{k}:</strong> {v}</p>
                ))}
              </div>
            </Section>

            {/* Meeting norms / taboos / tips */}
            <div className="col-span-2">
              <Section title="">
                {/* Tabs */}
                <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--bg)" }}>
                  {(["norms", "taboos", "tips"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all"
                      style={{ background: tab === t ? "var(--surface)" : "transparent", color: tab === t ? "var(--text)" : "var(--text-3)" }}>
                      {t === "norms" ? "Meeting Norms" : t === "taboos" ? "❌ Taboos" : "💡 Tips"}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5">
                  {tab === "norms" && selectedCulture.norms?.map((item, i) => (
                    <div key={i} className="flex gap-2.5 p-3 rounded-xl" style={{ background: "var(--bg)" }}>
                      <span className="text-xs font-bold mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{i + 1}</span>
                      <p className="text-sm" style={{ color: "var(--text)" }}>{item}</p>
                    </div>
                  ))}
                  {tab === "taboos" && selectedCulture.taboos?.map((item, i) => (
                    <div key={i} className="flex gap-2.5 p-3 rounded-xl border"
                      style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }}>
                      <span className="text-base shrink-0">⚠️</span>
                      <p className="text-sm" style={{ color: "var(--text)" }}>{item}</p>
                    </div>
                  ))}
                  {tab === "tips" && selectedCulture.tips?.map((item, i) => (
                    <div key={i} className="flex gap-2.5 p-3 rounded-xl border"
                      style={{ background: "rgba(5,150,105,0.05)", borderColor: "rgba(5,150,105,0.2)" }}>
                      <span className="text-base shrink-0">✅</span>
                      <p className="text-sm" style={{ color: "var(--text)" }}>{item}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        ) : (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <Globe size={32} style={{ pointerEvents: "all", color: "var(--text-3)" }} />
            <p className="font-semibold" style={{ color: "var(--text-2)" }}>Select a country above to view its professional communication profile</p>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Covering meeting norms, taboos, greetings, directness, hierarchy, and formality</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
