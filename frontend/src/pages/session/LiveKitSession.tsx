import { useState, useEffect, useRef } from "react";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  VoiceAssistantControlBar, 
  BarVisualizer, 
  useVoiceAssistant 
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import { api } from "@/utils";

export const LiveKitSession = ({ 
  scenarioId, 
  onEnd,
  maxMinutes
}: { 
  scenarioId: string, 
  onEnd: () => void,
  maxMinutes?: number
}) => {
  const [token, setToken] = useState<string>("");
  const livekitUrl = (import.meta as any).env?.VITE_LIVEKIT_URL || "wss://human-ai-16pkp4sz.livekit.cloud";
  const uniqueIdRef = useRef(Date.now() + Math.floor(Math.random() * 10000));

  useEffect(() => {
    // Generate a unique room ID for this practice session
    const roomId = `${scenarioId}-${Date.now()}`;
    
    // Fetch secure JWT Auth Token from our FastAPI backend
    const fetchToken = async () => {
      try {
        const { data } = await api.GET<{ token: string }>(`/api/rtc/token?room_id=${roomId}`);
        setToken(data.token);
      } catch (err) {
        console.error("Failed to fetch WebRTC Token", err);
      }
    };
    
    fetchToken();
  }, [scenarioId]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
        <p>Connecting to secure low-latency audio server...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      className="flex flex-col h-full bg-[#111] rounded-2xl relative border border-white/10 overflow-hidden"
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-12 p-8">
         <AgentVisualizer scenarioId={scenarioId} onEnd={onEnd} maxMinutes={maxMinutes} />
      </div>
      
      {/* LiveKit's native, highly styled control bar (Mute/Unmute/Disconnect) */}
      <VoiceAssistantControlBar className="bg-transparent border-t border-white/10" />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

// Extracted Agent Visualizer that taps into LiveKit's participant streams
const AgentVisualizer = ({ scenarioId, onEnd, maxMinutes }: { scenarioId: string, onEnd: () => void, maxMinutes?: number }) => {
    const { state, audioTrack } = useVoiceAssistant();
    const [timeLeft, setTimeLeft] = useState(maxMinutes ? maxMinutes * 60 : 0);

    const prevIdle = useRef(false);

    useEffect(() => {
        // Enforce the timer constraint
        if (!maxMinutes) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    onEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [maxMinutes, onEnd]);

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <div className="px-6 py-2 flex items-center gap-3 rounded-full bg-white/5 border border-white/10">
              <p className="text-sm font-medium text-zinc-300">
                AI Coach • <span className="text-primary capitalize">{scenarioId.replace("-", " ")}</span>
              </p>
              {maxMinutes && (
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                   ⏱ {fmt(timeLeft)} left
                </span>
              )}
            </div>
            
            <div className="h-32 w-full max-w-sm flex items-center justify-center">
                <BarVisualizer 
                  state={state} 
                  trackRef={audioTrack} 
                  barCount={7} 
                  options={{ minHeight: 10 }}
                  className="text-primary/80 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                />
            </div>
            
            <div className="h-8">
              <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-semibold animate-pulse">
                {state === "listening" ? "Listening..." :
                 state === "speaking" ? "AI is speaking" : 
                 state === "thinking" ? "Processing..." : 
                 state === "disconnected" ? "Agent Offline" :
                 "Connecting"}
              </p>
            </div>
        </div>
    );
};
