import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Kingdom, RoundLog } from '@/types/battle';
import { Button } from '@/components/common/Button';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface WinnerModalProps {
  isOpen: boolean;
  winner?: Kingdom;
  onClose: () => void;
  logs: RoundLog[];
  kingdoms: Kingdom[];
}

export function WinnerModal({ isOpen, winner, onClose, logs, kingdoms }: WinnerModalProps) {
  const [showHistory, setShowHistory] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setShowHistory(false);
    }
  }, [isOpen]);

  if (!winner) return null;

  const colorStyles = getKingdomColorStyles(winner.name);

  // Group logs by round number, excluding round 0 (initialization)
  const rounds: Record<number, RoundLog[]> = {};
  logs.forEach(log => {
    if (log.roundNumber > 0) {
      if (!rounds[log.roundNumber]) {
        rounds[log.roundNumber] = [];
      }
      rounds[log.roundNumber].push(log);
    }
  });

  const sortedRoundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl bg-theme-card border border-theme-border p-8 rounded-none overflow-hidden"
          >
            {showHistory ? (
              // --- VIEW 1: BATTLE HISTORY SUMMARY ---
              <div className="relative z-10">
                {/* Ambient Glow */}
                <div 
                  className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full filter blur-[100px] pointer-events-none opacity-20 bg-cyan-500"
                />

                <h2 className="font-display text-2xl font-extrabold tracking-tight mb-2 uppercase text-cyan-400 select-none text-center">
                  BẢNG TỔNG KẾT CHIẾN SỰ 📜
                </h2>
                <p className="text-xs text-theme-text-muted mb-4 select-none text-center">
                  Quá trình quyết định và bước đi của các quốc gia qua từng lượt
                </p>

                {/* Scrollable feed */}
                <div className="bg-gray-950/60 border border-white/5 p-4 mb-6 rounded-none h-[380px] overflow-y-auto text-left flex flex-col gap-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {sortedRoundNumbers.map((roundNum) => (
                    <div key={roundNum} className="flex flex-col gap-2">
                      {/* Round Header */}
                      <div className="flex items-center gap-2 border-b border-white/5 pb-1 select-none">
                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Lượt {roundNum}
                        </span>
                        <span className="h-[1px] flex-1 bg-white/5" />
                      </div>
                      
                      {/* Round Logs */}
                      <div className="flex flex-col gap-2 pl-1.5 border-l border-white/5">
                        {rounds[roundNum].map((log) => {
                          const kingdom = kingdoms.find((k) => k.id === log.kingdomId);
                          const color = kingdom ? getKingdomColorStyles(kingdom.name).main : '#9ca3af';

                          return (
                            <div key={log.id} className="text-xs flex gap-2 items-start leading-relaxed">
                              {/* Colored bullet point marker */}
                              <span 
                                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" 
                                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                              />
                              <span className="text-gray-300">
                                {log.message}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={() => setShowHistory(false)} variant="secondary" className="flex-1 font-bold">
                    ⬅️ Quay lại
                  </Button>
                  <Button onClick={onClose} variant="primary" className="flex-1 font-bold">
                    Thoát Phòng 🏠
                  </Button>
                </div>
              </div>
            ) : (
              // --- VIEW 2: ORIGINAL VICTORY DISPLAY ---
              <div className="relative z-10 text-center flex flex-col items-center">
                {/* Ambient Glow */}
                <div 
                  className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full filter blur-[100px] pointer-events-none opacity-40"
                  style={{ backgroundColor: colorStyles.main }}
                />

                {/* Crown/Trophy Icon Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-7xl mb-6 relative z-10 select-none inline-block filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                >
                  👑
                </motion.div>

                {/* Victory Title */}
                <h2 className="font-display text-3xl font-extrabold tracking-tight mb-2 uppercase text-yellow-500">
                  VICTORY!
                </h2>
                
                <p className="text-xs text-theme-text-secondary mb-6">
                  Trận chiến AI Kingdom Arena đã ngã ngũ
                </p>

                {/* Winner display card */}
                <div 
                  className="p-6 rounded-none border border-white/5 bg-gray-950/50 mb-6 flex flex-col items-center justify-center gap-3 w-full"
                  style={{ border: `1px solid ${colorStyles.main}` }}
                >
                  <div 
                    className="w-16 h-16 rounded-none flex items-center justify-center text-white font-extrabold text-2xl"
                    style={{ 
                      backgroundColor: colorStyles.main
                    }}
                  >
                    {winner.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h3 className="font-display text-xl font-bold text-theme-text-primary">
                      {winner.name}
                    </h3>
                    <p className="text-[10px] text-theme-text-muted mt-0.5 font-mono">
                      Powered by {winner.model}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <span className="text-[9px] text-theme-text-muted uppercase font-bold tracking-wider block">Điểm số</span>
                      <span className="text-lg font-black text-white">{winner.score}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-theme-text-muted uppercase font-bold tracking-wider block">Binh sĩ</span>
                      <span className="text-lg font-black text-white">{winner.soldiers}</span>
                    </div>
                  </div>
                </div>

                {/* Stats list */}
                <div className="grid grid-cols-3 gap-2 mb-8 text-xs text-left w-full">
                  <div className="bg-white/5 p-2.5 rounded-none border border-white/5">
                    <span className="text-theme-text-muted block text-[9px] mb-0.5">Dân số:</span>
                    <span className="font-bold text-theme-text-primary">{winner.population}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-none border border-white/5">
                    <span className="text-theme-text-muted block text-[9px] mb-0.5">Lương nhu:</span>
                    <span className="font-bold text-theme-text-primary">{winner.supplies}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-none border border-white/5">
                    <span className="text-theme-text-muted block text-[9px] mb-0.5">Vàng ròng:</span>
                    <span className="font-bold text-theme-text-primary">{winner.gold}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button onClick={() => setShowHistory(true)} variant="secondary" className="flex-1 font-bold text-xs py-2.5">
                    Xem lại diễn biến 📜
                  </Button>
                  <Button onClick={onClose} variant="primary" className="flex-1 font-bold text-xs py-2.5">
                    Quay lại Lobby 🏠
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
