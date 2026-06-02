import React, { useEffect, useState } from 'react';
import { BattleState } from '@/types/battle';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface BattleHeaderProps {
  state: BattleState | null;
  isConnected: boolean;
  isSimulating: boolean;
  onBackToLobby: () => void;
  showTimeline: boolean;
  onToggleTimeline: () => void;
}

export function BattleHeader({ state, isConnected, isSimulating, onBackToLobby, showTimeline, onToggleTimeline }: BattleHeaderProps) {
  const [seconds, setSeconds] = useState(0);

  // Simple clock timer for tactical immersion
  useEffect(() => {
    if (state?.status !== 'RUNNING') return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [state?.status]);

  if (!state) return null;

  // Format time (e.g. 00:04:12)
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <header className="w-full bg-[#030712]/80 border border-white/5 backdrop-blur-md rounded-none py-1.5 px-3 flex justify-between items-center select-none">
      {/* Left side: Hamburger button + Exit Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToLobby}
          className="px-3.5 py-1.5 border border-white/10 hover:border-primary/40 bg-gray-950 text-xs font-bold uppercase tracking-wider text-theme-text-primary rounded-none cursor-pointer hover:bg-primary/5 active:scale-[0.98] transition-all shrink-0"
        >
          ⬅️ Exit
        </button>

        <button
          onClick={onToggleTimeline}
          title={showTimeline ? "Hide Overview Panel" : "Show Overview Panel"}
          className={`px-3.5 py-1.5 border rounded-none cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center shrink-0 ${
            showTimeline 
              ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20' 
              : 'border-white/10 bg-gray-950 text-theme-text-primary hover:border-primary/40 hover:bg-primary/5'
          }`}
        >
          <span className="text-sm font-bold leading-none">☰ Menu</span>
        </button>
      </div>

      {/* Right side: Time and Round Display */}
      <div className="flex items-center gap-4 font-mono text-xs font-bold">
        <span className="bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-none text-[10px]">
          ROUND {state.round}
        </span>
        <span className="text-white flex items-center gap-1.5">
          ⏱️ {formatTime(seconds)}
        </span>
      </div>
    </header>
  );
}
