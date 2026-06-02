import React, { useRef, useEffect } from 'react';
import { Kingdom, RoundLog } from '@/types/battle';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface KingdomPanelProps {
  kingdom: Kingdom | null;
  side: 'left' | 'right';
  logs: RoundLog[];
}

export function KingdomPanel({ kingdom, side, logs }: KingdomPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll individual log panel to bottom locally without shifting browser scroll
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!kingdom) {
    return (
      <div className="bg-[#030712]/60 border border-white/5 p-6 rounded-none h-full flex items-center justify-center text-xs text-theme-text-muted italic select-none">
        No Agent assigned to this console.
      </div>
    );
  }

  const styles = getKingdomColorStyles(kingdom.name);
  const accentColor = side === 'left' ? '#3b82f6' : '#ef4444';
  const shadowGlow = 'shadow-none';

  // Format resources nicely
  const formatNum = (num: number) => num.toLocaleString('en-US');

  return (
    <div 
      className="bg-gray-950/70 border border-white/5 rounded-none p-3 flex flex-col h-full overflow-hidden select-none transition-all duration-300"
      style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
    >
      {/* Agent Crest Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5 text-left">
          <div 
            className="w-9 h-9 rounded-none flex items-center justify-center font-black text-white text-base"
            style={{ backgroundColor: accentColor }}
          >
            {side === 'left' ? '🛡️' : '⚔️'}
          </div>
          <div>
            <h2 className="font-display text-[13px] font-black uppercase tracking-wider text-white">
              {kingdom.name}
            </h2>
            <span className="text-[9px] text-theme-text-muted font-mono block tracking-tight uppercase">
              {kingdom.model}
            </span>
          </div>
        </div>

        {/* HP/Morale display */}
        <div className="text-right">
          <div className="text-xs font-mono font-black text-theme-text-primary">
            PTS: {formatNum(kingdom.score)}
          </div>
          <span className="text-[9px] text-theme-text-secondary">
            Morale: {kingdom.morale}%
          </span>
        </div>
      </div>

      {/* FORCES STATS */}
      <div className="mt-2 text-left">
        <h3 className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-1 flex items-center gap-1">
          <span>⚔️</span> FORCES
        </h3>

        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-[10.5px] font-mono">
          {/* Infantry */}
          <div className="flex items-center gap-1" title="Infantry">
            <span className="select-none">🪖</span>
            <span className="font-bold text-white">{formatNum(kingdom.infantry)}</span>
          </div>
          {/* Tanks */}
          <div className="flex items-center gap-1" title="Tanks">
            <span className="select-none">🚜</span>
            <span className="font-bold text-white">{formatNum(kingdom.tanks)}</span>
          </div>
          {/* Aircraft */}
          <div className="flex items-center gap-1" title="Aircraft">
            <span className="select-none">✈️</span>
            <span className="font-bold text-white">{formatNum(kingdom.aircraft)}</span>
          </div>
          {/* Artillery */}
          <div className="flex items-center gap-1" title="Artillery">
            <span className="select-none">🚀</span>
            <span className="font-bold text-white">{formatNum(kingdom.artillery)}</span>
          </div>
          {/* Navy */}
          <div className="flex items-center gap-1" title="Navy">
            <span className="select-none">🚢</span>
            <span className="font-bold text-white">{formatNum(kingdom.navy)}</span>
          </div>
          {/* Drones */}
          <div className="flex items-center gap-1" title="Drones">
            <span className="select-none">🚁</span>
            <span className="font-bold text-white">{formatNum(kingdom.drones)}</span>
          </div>
        </div>
      </div>

      {/* RESOURCES STATS */}
      <div className="mt-2 text-left">
        <h3 className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-1 flex items-center gap-1">
          <span>📦</span> RESOURCES
        </h3>

        <div className="flex items-center justify-between text-[10.5px] font-mono bg-white/[0.02] border border-white/5 rounded-none p-1.5">
          <div className="flex items-center gap-0.5" title="Gold">
            <span>🪙</span>
            <span className="font-bold text-yellow-500">{formatNum(kingdom.gold)}</span>
          </div>
          <div className="flex items-center gap-0.5" title="Oil">
            <span>🛢️</span>
            <span className="font-bold text-orange-500">{formatNum(kingdom.oil)}</span>
          </div>
          <div className="flex items-center gap-0.5" title="Supply">
            <span>🌾</span>
            <span className="font-bold text-green-500">{formatNum(kingdom.supplies)}</span>
          </div>
          <div className="flex items-center gap-0.5" title="Energy">
            <span>⚡</span>
            <span className="font-bold text-cyan-400">{formatNum(kingdom.energy)}</span>
          </div>
        </div>
      </div>

      {/* COMMAND LOG FEED */}
      <div className="mt-2 flex-1 flex flex-col overflow-hidden border border-white/5 rounded-none bg-black/60 text-left">
        <div className="bg-white/5 px-2 py-1 border-b border-white/5 flex items-center gap-1 text-[8.5px] font-bold text-theme-text-secondary uppercase select-none tracking-wider">
          <span className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
          LOG FEED
        </div>
        
        <div 
          ref={logContainerRef}
          className="h-[65px] p-2 overflow-y-auto font-mono text-[9px] leading-relaxed flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-white/5"
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 text-center italic py-2 select-none">
              Quét log...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={log.id || idx} className="flex gap-1 items-start hover:bg-white/[0.02] p-0.5 rounded-none transition-colors text-gray-300">
                <span className="text-theme-text-muted select-none shrink-0 font-bold">
                  [{log.createdAt || new Date().toLocaleTimeString()}]
                </span>
                <span className="break-words font-medium">
                  {log.message.slice(log.message.indexOf(']') + 1).trim()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
