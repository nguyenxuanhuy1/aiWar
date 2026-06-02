import React, { useEffect, useRef } from 'react';
import { RoundLog, Kingdom } from '@/types/battle';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface BattleLogPanelProps {
  logs: RoundLog[];
  kingdoms: Kingdom[];
}

export function BattleLogPanel({ logs, kingdoms }: BattleLogPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs on updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogSenderColor = (kingdomId: string) => {
    if (kingdomId === 'system') return 'text-yellow-500 font-bold';
    
    // Find kingdom name
    const kingdom = kingdoms.find((k) => k.id === kingdomId);
    if (!kingdom) return 'text-gray-400';

    const styles = getKingdomColorStyles(kingdom.name);
    return styles.text;
  };

  return (
    <div className="bg-gray-950 border border-white/5 rounded-2xl flex flex-col h-full overflow-hidden hover:border-primary/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 bg-[#0a0e17] border-b border-white/5 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#ff5f56]" />
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#27c93f]" />
          <h2 className="font-mono text-xs font-bold text-gray-400 ml-2">
            Battle Activity Console
          </h2>
        </div>
        <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded">
          {logs.length} entries
        </span>
      </div>

      {/* Logs Scroll container */}
      <div 
        ref={containerRef}
        className="flex-1 p-5 font-mono text-[11px] overflow-y-auto leading-relaxed flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/5"
      >
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center mt-12 italic">
            Chưa có ghi chép hoạt động nào cho trận đấu này...
          </div>
        ) : (
          logs.map((log, idx) => {
            const isSystem = log.kingdomId === 'system';
            const timeStr = log.createdAt || new Date().toLocaleTimeString();
            
            return (
              <div 
                key={log.id || idx} 
                className="flex items-start gap-2 animate-[fadeIn_0.12s_ease-out] hover:bg-white/[0.02] p-1 rounded transition-colors"
              >
                {/* Time badge */}
                <span className="text-gray-600 shrink-0 select-none">
                  [{timeStr}]
                </span>

                {/* Round Badge */}
                {log.roundNumber > 0 && (
                  <span className="text-[10px] px-1 bg-white/5 rounded text-gray-400 select-none shrink-0 font-bold">
                    R{log.roundNumber}
                  </span>
                )}

                {/* Message Body */}
                <span className="break-words">
                  {isSystem ? (
                    <span className="text-yellow-400 font-bold">{log.message}</span>
                  ) : (
                    <>
                      <span className={`font-bold ${getLogSenderColor(log.kingdomId)}`}>
                        {log.message.slice(0, log.message.indexOf(']') + 1)}
                      </span>
                      <span className="text-gray-300">
                        {log.message.slice(log.message.indexOf(']') + 1)}
                      </span>
                    </>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
